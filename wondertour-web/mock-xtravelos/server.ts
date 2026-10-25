// xTravelOS giả lập: làm đúng hợp đồng /public/v1 trong tài liệu để web chạy thử và kiểm thử khi chưa có hệ thống thật.
// Có khóa chỗ (hai người giữ chỗ cuối thì một người nhận 409), chống gửi trùng bằng Idempotency-Key,
// mã VietQR, hàng chờ duyệt cho đại lý/liên minh, và đầu /__mock để giả lập ngân hàng báo tiền về.
import { randomBytes } from "node:crypto";
import express, { type Request, type Response } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { sign } from "../src/server/hmac";
import * as S from "../src/shared/schemas";
import { SiteSettings } from "../src/shared/settings";
import { AGENTS, ARTICLES, PRODUCTS, STAFF, TICKETS, type MockProduct, type MockTicket } from "./data";

interface HoldRec {
  holdId: string;
  departureId: string;
  product: MockProduct;
  date: string;
  pax: S.Pax;
  expiresAt: number;
  session: string | null;
  used: boolean;
  released: boolean;
}
interface BookingRec {
  code: string;
  product: MockProduct;
  departureId: string;
  date: string;
  pax: S.Pax;
  total: number;
  deposit: number;
  paidAmount: number;
  status: S.BookingStatus;
  phone: string;
  session: string | null;
  rejectionReason: string | null;
  payment: S.PaymentInstruction | null;
}

export interface MockOptions {
  apiKey: string;
  /** Ghi đè hạn giữ chỗ (giây), dùng cho kiểm thử. */
  holdSeconds?: number;
  webhook?: { url: string; secret: string };
}

function vnToday(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 3600_000 + offsetDays * 86400_000);
  return d.toISOString().slice(0, 10);
}
function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}
function normPhone(p: string): string {
  return p.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

// ---------- VietQR (chuẩn EMVCo, NAPAS) ----------
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}
function crc16(s: string): string {
  let crc = 0xffff;
  for (const ch of Buffer.from(s, "utf8")) {
    crc ^= ch << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
export function vietQrPayload(bin: string, account: string, amount: number, content: string): string {
  const merchant = tlv("00", "A000000727") + tlv("01", tlv("00", bin) + tlv("01", account)) + tlv("02", "QRIBFTTA");
  const body =
    tlv("00", "01") + tlv("01", "12") + tlv("38", merchant) + tlv("53", "704") + tlv("54", String(amount)) + tlv("58", "VN") + tlv("62", tlv("08", content)) + "6304";
  return body + crc16(body);
}

export function createMockXTravel(opts: MockOptions) {
  const holds = new Map<string, HoldRec>();
  const bookings = new Map<string, BookingRec>();
  const sessions = new Map<string, (typeof AGENTS)[number]>();
  const staffSessions = new Map<string, (typeof STAFF)[number]>();
  // Cấu hình web do nhân viên lưu; null nghĩa là chưa lưu gì (web dùng mặc định).
  let siteSettings: unknown = null;
  const SETTINGS_ROLES = new Set(["Quản trị", "Quản lý", "CEO", "Marketing"]);
  const idem = new Map<string, Promise<{ status: number; body: unknown }>>();
  let leads = 0;

  const holdMs = (p: MockProduct) => (opts.holdSeconds ?? p.holdMinutes * 60) * 1000;

  function departuresOf(p: MockProduct) {
    return p.departures.map((d) => {
      const date = vnToday(d.inDays);
      const id = `${p.code}-${date}`;
      const now = Date.now();
      const held = [...holds.values()]
        .filter((h) => h.departureId === id && !h.used && !h.released && h.expiresAt > now)
        .reduce((n, h) => n + h.pax.adult + h.pax.child, 0);
      const booked = [...bookings.values()]
        .filter((b) => b.departureId === id && !["cancelled", "rejected", "expired"].includes(b.status))
        .reduce((n, b) => n + b.pax.adult + b.pax.child, 0);
      const seats = Math.max(0, d.capacity - held - booked);
      return { id, date, returnDate: addDays(date, p.durationDays - 1), seats };
    });
  }

  const media = (id: string, alt: string): S.Media => ({ id, alt, width: 1600, height: 1000 });
  function summary(p: MockProduct): S.ProductSummary {
    return {
      slug: p.slug,
      code: p.code,
      name: p.name,
      summary: p.summary,
      durationDays: p.durationDays,
      durationNights: p.durationNights,
      destinations: p.destinations,
      seasons: p.seasons,
      fromPrice: p.price.adult,
      vatIncluded: p.vatIncluded,
      coverImage: media(`${p.slug}-cover`, `Ảnh tour ${p.name}`),
      tags: p.tags,
      departFrom: p.departFrom,
      nextDepartures: departuresOf(p).filter((d) => d.seats > 0).slice(0, 3).map((d) => ({ date: d.date, seatsAvailable: d.seats })),
      categories: p.categories,
      promotion: p.promotion
        ? { label: p.promotion.label, compareAtPrice: p.promotion.compareAtPrice, endsAt: new Date(Date.now() + p.promotion.endsInDays * 86400_000).toISOString() }
        : null,
    };
  }

  const app = express();
  app.use(express.json({ limit: "200kb" }));

  const err = (res: Response, status: number, detail: string) => res.status(status).json({ detail });

  // Đầu giả lập cho kiểm thử: không cần khóa dịch vụ.
  app.post("/__mock/payments/:code", (req, res) => {
    const b = bookings.get(req.params.code);
    if (!b) return err(res, 404, "Không có đơn.");
    const amount = z.int().positive().parse(req.body?.amount ?? b.total - b.paidAmount);
    b.paidAmount = Math.min(b.total, b.paidAmount + amount);
    b.status = b.paidAmount >= b.total ? "paid" : b.paidAmount >= b.deposit ? "deposit_paid" : b.status;
    res.json({ status: b.status, paidAmount: b.paidAmount });
  });
  app.post("/__mock/bookings/:code/:action", (req, res) => {
    const b = bookings.get(req.params.code);
    if (!b) return err(res, 404, "Không có đơn.");
    if (req.params.action === "approve") b.status = "confirmed";
    else if (req.params.action === "reject") {
      b.status = "rejected";
      b.rejectionReason = String(req.body?.reason ?? "Hết chỗ ở khách sạn đoàn");
    } else return err(res, 404, "Không có thao tác.");
    res.json({ status: b.status });
  });
  app.post("/__mock/notify", async (req, res) => {
    if (!opts.webhook) return err(res, 400, "Chưa cấu hình MOCK_WEBHOOK_URL.");
    const body = JSON.stringify(S.WebhookEvent.parse(req.body));
    const ts = String(Math.floor(Date.now() / 1000));
    const r = await fetch(opts.webhook.url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-xtravel-timestamp": ts, "x-xtravel-signature": sign(opts.webhook.secret, ts, body) },
      body,
    });
    res.json({ delivered: r.status });
  });

  app.get("/openapi.json", (_req, res) => res.json(openapi()));

  // Mọi đầu /public/v1 cần khóa dịch vụ của máy chủ web.
  app.use("/public/v1", (req, res, next) => {
    if (req.get("authorization") !== `Bearer ${opts.apiKey}`) return err(res, 401, "Thiếu hoặc sai khóa dịch vụ.");
    next();
  });

  const sessionOf = (req: Request) => {
    const t = req.get("x-session-token");
    return t ? (sessions.get(t) ? t : null) : null;
  };

  // Chống gửi trùng: cùng Idempotency-Key trả lại đúng kết quả lần đầu, kể cả khi hai yêu cầu đến cùng lúc
  // (lưu lời hứa ngay khi bắt đầu xử lý, không đợi xử lý xong mới lưu).
  function idempotent(handler: (req: Request) => { status: number; body: unknown } | Promise<{ status: number; body: unknown }>) {
    return async (req: Request, res: Response) => {
      const key = req.get("idempotency-key");
      if (!key) return err(res, 422, "Thiếu Idempotency-Key.");
      const k = `${req.path}:${key}`;
      let p = idem.get(k);
      if (!p) {
        p = Promise.resolve().then(() => handler(req));
        idem.set(k, p);
      }
      const out = await p;
      res.status(out.status).json(out.body);
    };
  }

  const v1 = express.Router();

  v1.get("/products", (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    let items = PRODUCTS.slice();
    if (q.q) {
      const needle = fold(q.q);
      items = items.filter((p) => fold(`${p.name} ${p.destinations.map((d) => d.name).join(" ")}`).includes(needle));
    }
    if (q.destination) items = items.filter((p) => p.destinations.some((d) => d.slug === q.destination));
    const { season, month, category, party } = q;
    if (season) items = items.filter((p) => p.seasons.includes(season));
    if (q.from) items = items.filter((p) => p.departFrom === q.from);
    if (category) items = items.filter((p) => p.categories.includes(category));
    if (q.promo === "1") items = items.filter((p) => p.promotion !== null);
    if (party === "family") items = items.filter((p) => p.price.child !== null);
    if (party === "company") items = items.filter((p) => p.categories.includes("doanh-nghiep"));
    if (month) items = items.filter((p) => departuresOf(p).some((d) => d.date.startsWith(month)));
    if (q.minPrice) items = items.filter((p) => p.price.adult >= Number(q.minPrice));
    if (q.maxPrice) items = items.filter((p) => p.price.adult <= Number(q.maxPrice));
    const firstDate = (p: MockProduct) => departuresOf(p).find((d) => d.seats > 0)?.date ?? "9999";
    if (q.sort === "price-asc") items.sort((a, b) => a.price.adult - b.price.adult);
    else if (q.sort === "price-desc") items.sort((a, b) => b.price.adult - a.price.adult);
    else if (q.sort === "departure") items.sort((a, b) => firstDate(a).localeCompare(firstDate(b)));
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 12));
    const destinations = [
      ...new Map(PRODUCTS.flatMap((p) => p.destinations.map((d) => [d.slug, { ...d, cover: media(`${p.slug}-g1`, `Ảnh điểm đến ${d.name}`) }] as const))).values(),
    ];
    res.json({
      items: items.slice((page - 1) * pageSize, page * pageSize).map(summary),
      page,
      pageSize,
      total: items.length,
      facets: {
        destinations,
        departFrom: [...new Set(PRODUCTS.map((p) => p.departFrom))],
        seasons: [...new Set(PRODUCTS.flatMap((p) => p.seasons))],
      },
    });
  });

  v1.get("/products/:slug", (req, res) => {
    const p = PRODUCTS.find((x) => x.slug === req.params.slug);
    if (!p) return err(res, 404, "Không tìm thấy tour.");
    res.json({
      ...summary(p),
      itinerary: p.itinerary.map((d, i) => ({ day: i + 1, ...d })),
      includes: p.includes,
      excludes: p.excludes,
      gallery: [media(`${p.slug}-g1`, `Khoảnh khắc trong tour ${p.name}`), media(`${p.slug}-g2`, `Đoàn khách tour ${p.name}`)],
      cancellationPolicy: cancelPolicy,
      requiresIdDocument: p.requiresIdDocument,
      deposit: p.deposit,
      updatedAt: new Date().toISOString(),
    } satisfies S.ProductDetail);
  });

  v1.get("/products/:slug/departures", (req, res) => {
    const p = PRODUCTS.find((x) => x.slug === req.params.slug);
    if (!p) return err(res, 404, "Không tìm thấy tour.");
    const t = sessionOf(req);
    const agent = t ? sessions.get(t) : undefined;
    res.json({
      items: departuresOf(p).map((d) => ({
        id: d.id,
        date: d.date,
        returnDate: d.returnDate,
        seatsAvailable: d.seats,
        status: d.seats === 0 ? "full" : d.seats <= 5 ? "few" : "open",
        price: p.price,
        vatIncluded: p.vatIncluded,
        ...(agent?.profile.flow === "agent" ? { agent: { tier: agent.profile.tier ?? "1", commissionPerAdult: p.commissionPerAdult } } : {}),
        ...(agent?.profile.flow === "alliance"
          ? { alliance: { costPerAdult: p.costPerAdult, costPerChild: p.price.child === null ? null : Math.round(p.costPerAdult * 0.8) } }
          : {}),
      })),
    });
  });

  v1.post(
    "/holds",
    idempotent((req) => {
      const input = S.HoldInput.safeParse(req.body);
      if (!input.success) return { status: 422, body: { detail: "Thông tin giữ chỗ chưa đúng." } };
      const p = PRODUCTS.find((x) => input.data.departureId.startsWith(`${x.code}-`));
      const dep = p ? departuresOf(p).find((d) => d.id === input.data.departureId) : undefined;
      if (!p || !dep) return { status: 404, body: { detail: "Không tìm thấy ngày khởi hành." } };
      const need = input.data.pax.adult + input.data.pax.child;
      if (need > dep.seats) {
        return { status: 409, body: { detail: dep.seats === 0 ? "Ngày này vừa hết chỗ." : `Ngày này chỉ còn ${dep.seats} chỗ.` } };
      }
      const holdId = `H${randomBytes(6).toString("hex")}`;
      const rec: HoldRec = {
        holdId,
        departureId: dep.id,
        product: p,
        date: dep.date,
        pax: input.data.pax,
        expiresAt: Date.now() + holdMs(p),
        session: sessionOf(req),
        used: false,
        released: false,
      };
      holds.set(holdId, rec);
      const total = priceOf(p, input.data.pax);
      return {
        status: 201,
        body: { holdId, departureId: dep.id, pax: rec.pax, expiresAt: new Date(rec.expiresAt).toISOString(), total, deposit: depositOf(p, total, rec.pax) },
      };
    }),
  );

  v1.post("/holds/:id/release", (req, res) => {
    const h = holds.get(req.params.id);
    if (!h) return err(res, 404, "Không tìm thấy giữ chỗ.");
    if (h.session !== sessionOf(req)) return err(res, 403, "Chỉ người giữ chỗ mới nhả được.");
    h.released = true;
    res.status(204).end();
  });

  v1.post(
    "/bookings",
    idempotent(async (req) => {
      const input = S.BookingInput.safeParse(req.body);
      if (!input.success) return { status: 422, body: { detail: "Thông tin đặt chỗ chưa đúng." } };
      const h = holds.get(input.data.holdId);
      if (!h || h.released) return { status: 404, body: { detail: "Không tìm thấy giữ chỗ." } };
      if (h.used) return { status: 409, body: { detail: "Giữ chỗ này đã được đặt." } };
      if (h.expiresAt <= Date.now()) return { status: 409, body: { detail: "Hết hạn giữ chỗ, vui lòng giữ chỗ lại." } };
      const count = h.pax.adult + h.pax.child + h.pax.infant;
      if (input.data.passengers.length !== count) return { status: 422, body: { detail: `Cần đủ thông tin ${count} khách.` } };
      if (h.product.requiresIdDocument && input.data.passengers.some((p) => !p.idNumber)) {
        return { status: 422, body: { detail: "Tour cần số hộ chiếu hoặc CCCD của từng khách." } };
      }
      h.used = true;
      const total = priceOf(h.product, h.pax);
      const deposit = depositOf(h.product, total, h.pax);
      const code = `WT${randomBytes(3).toString("hex").toUpperCase()}`;
      const agentFlow = h.session ? sessions.get(h.session)?.profile.flow : undefined;
      let payment: S.PaymentInstruction | null = null;
      if (!agentFlow) {
        const transferContent = `${code} ${h.product.code}`;
        const qr = await QRCode.toDataURL(vietQrPayload("970436", "0000000001", deposit, transferContent), { margin: 1, width: 480 });
        payment = { bankName: "Ngân hàng thử nghiệm (giả lập)", accountNo: "0000000001", accountName: "CONG TY WONDERTOUR (THU NGHIEM)", amount: deposit, transferContent, qrImage: qr };
      }
      const rec: BookingRec = {
        code,
        product: h.product,
        departureId: h.departureId,
        date: h.date,
        pax: h.pax,
        total,
        deposit,
        paidAmount: 0,
        status: agentFlow ? "pending_approval" : "awaiting_payment",
        phone: normPhone(input.data.contact.phone),
        session: h.session,
        rejectionReason: null,
        payment,
      };
      bookings.set(code, rec);
      return { status: 201, body: bookingView(rec) };
    }),
  );

  v1.get("/bookings/:code", (req, res) => {
    const b = bookings.get(req.params.code);
    const phone = req.get("x-lookup-phone");
    const t = sessionOf(req);
    const allowed = b && ((phone && normPhone(phone) === b.phone) || (t && b.session === t));
    if (!b || !allowed) return err(res, 404, "Không tìm thấy đơn.");
    res.json(bookingView(b));
  });

  const ticketSummary = (t: MockTicket): S.TicketSummary => ({
    slug: t.slug,
    name: t.name,
    place: t.place,
    destination: t.destination,
    summary: t.summary,
    price: t.price,
    vatIncluded: t.vatIncluded,
    image: media(`${t.slug}-cover`, `Ảnh ${t.name}`),
    validityNote: t.validityNote,
  });

  v1.get("/tickets", (req, res) => {
    const dest = typeof req.query.destination === "string" ? req.query.destination : "";
    const items = TICKETS.filter((t) => !dest || t.destination.slug === dest);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 24));
    res.json({ items: items.slice((page - 1) * pageSize, page * pageSize).map(ticketSummary), page, pageSize, total: items.length });
  });

  v1.get("/tickets/:slug", (req, res) => {
    const t = TICKETS.find((x) => x.slug === req.params.slug);
    if (!t) return err(res, 404, "Không tìm thấy vé.");
    res.json({
      ...ticketSummary(t),
      openHours: t.openHours,
      highlights: t.highlights,
      terms: t.terms,
      earliestDate: vnToday(1),
      updatedAt: new Date().toISOString(),
    } satisfies S.TicketDetail);
  });

  v1.post(
    "/ticket-orders",
    idempotent(async (req) => {
      const input = S.TicketOrderInput.safeParse(req.body);
      if (!input.success) return { status: 422, body: { detail: "Thông tin đặt vé chưa đúng." } };
      const t = TICKETS.find((x) => x.slug === input.data.ticketSlug);
      if (!t) return { status: 404, body: { detail: "Không tìm thấy vé." } };
      if (input.data.visitDate < vnToday(1)) return { status: 422, body: { detail: "Vé cần đặt trước ít nhất 1 ngày." } };
      const total = t.price.adult * input.data.qty.adult + (t.price.child ?? t.price.adult) * input.data.qty.child;
      const code = `VE${randomBytes(3).toString("hex").toUpperCase()}`;
      const transferContent = `${code} VE`;
      const qr = await QRCode.toDataURL(vietQrPayload("970436", "0000000001", total, transferContent), { margin: 1, width: 480 });
      const rec: BookingRec = {
        code,
        product: PRODUCTS[0]!,
        departureId: `ticket:${t.slug}`,
        date: input.data.visitDate,
        pax: { adult: input.data.qty.adult, child: input.data.qty.child, infant: 0 },
        total,
        deposit: total,
        paidAmount: 0,
        status: "awaiting_payment",
        phone: normPhone(input.data.contact.phone),
        session: null,
        rejectionReason: null,
        payment: { bankName: "Ngân hàng thử nghiệm (giả lập)", accountNo: "0000000001", accountName: "CONG TY WONDERTOUR (THU NGHIEM)", amount: total, transferContent, qrImage: qr },
      };
      bookings.set(code, rec);
      return { status: 201, body: { ...bookingView(rec), productName: t.name } };
    }),
  );

  v1.get("/articles", (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 12));
    res.json({ items: ARTICLES.slice((page - 1) * pageSize, page * pageSize).map(articleSummary), page, pageSize, total: ARTICLES.length });
  });

  v1.get("/articles/:slug", (req, res) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug);
    if (!a) return err(res, 404, "Không tìm thấy bài viết.");
    const product = PRODUCTS.find((p) => p.slug === a.productSlug);
    res.json({
      ...articleSummary(a),
      author: a.author,
      updatedAt: new Date(Date.now() - a.daysAgo * 86400_000).toISOString(),
      blocks: a.blocks,
      product: product ? summary(product) : null,
    });
  });

  v1.get("/media/:id", (req, res) => {
    const id = req.params.id;
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return err(res, 404, "Không có ảnh.");
    const hue = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
    const label = id.replace(/-(cover|g\d)$/, "").replace(/-/g, " ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 42%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 60% 70%)"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><path d="M0 760 L380 420 L640 640 L980 300 L1600 820 L1600 1000 L0 1000Z" fill="rgba(255,255,255,.18)"/><text x="80" y="920" font-family="sans-serif" font-size="56" fill="rgba(255,255,255,.85)">${label.replace(/[<&>]/g, "")}</text></svg>`;
    res.set("Content-Type", "image/svg+xml").send(svg);
  });

  v1.post(
    "/leads",
    idempotent((req) => {
      const input = S.LeadInput.safeParse(req.body);
      if (!input.success) return { status: 422, body: { detail: "Thông tin liên hệ chưa đúng." } };
      leads++;
      return { status: 201, body: { id: `L${leads}` } };
    }),
  );

  v1.post("/agents/login", (req, res) => {
    const input = S.AgentLoginInput.safeParse(req.body);
    const a = input.success ? AGENTS.find((x) => x.username === input.data.username && x.password === input.data.password) : undefined;
    if (!a) return err(res, 401, "Sai tên đăng nhập hoặc mật khẩu.");
    const token = randomBytes(24).toString("hex");
    sessions.set(token, a);
    res.json({ sessionToken: token, expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(), agent: a.profile });
  });

  v1.post("/staff/login", (req, res) => {
    const input = S.AgentLoginInput.safeParse(req.body);
    const st = input.success ? STAFF.find((x) => x.username === input.data.username && x.password === input.data.password) : undefined;
    if (!st) return err(res, 401, "Sai tên đăng nhập hoặc mật khẩu.");
    const token = randomBytes(24).toString("hex");
    staffSessions.set(token, st);
    res.json({ sessionToken: token, expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(), staff: { name: st.name, role: st.role } });
  });

  v1.get("/site-settings", (_req, res) => {
    if (siteSettings === null) return err(res, 404, "Chưa có cấu hình web.");
    res.json(siteSettings);
  });

  v1.put("/site-settings", (req, res) => {
    const t = req.get("x-session-token");
    const st = t ? staffSessions.get(t) : undefined;
    if (!st) return err(res, 401, "Phiên nhân viên đã hết.");
    if (!SETTINGS_ROLES.has(st.role)) return err(res, 403, "Vai trò này không được sửa cấu hình web.");
    const parsed = SiteSettings.safeParse(req.body);
    if (!parsed.success) return err(res, 422, "Cấu hình web không hợp lệ.");
    siteSettings = parsed.data;
    res.status(204).end();
  });

  v1.get("/agents/me/statement", (req, res) => {
    const t = sessionOf(req);
    const a = t ? sessions.get(t) : undefined;
    if (!t || !a) return err(res, 401, "Phiên đăng nhập đã hết.");
    const now = Date.now();
    const mine = [...bookings.values()].filter((b) => b.session === t);
    const alliance = a.profile.flow === "alliance";
    res.json({
      agent: a.profile,
      holds: [...holds.values()]
        .filter((h) => h.session === t && !h.used && !h.released && h.expiresAt > now)
        .map((h) => ({ holdId: h.holdId, productName: h.product.name, departureDate: h.date, pax: h.pax, expiresAt: new Date(h.expiresAt).toISOString() })),
      bookings: mine.map((b) => ({
        code: b.code,
        productName: b.product.name,
        departureDate: b.date,
        pax: b.pax,
        status: b.status,
        total: b.total,
        commission: alliance ? null : b.product.commissionPerAdult * b.pax.adult,
        costTotal: alliance ? b.product.costPerAdult * (b.pax.adult + b.pax.child) : null,
        rejectionReason: b.rejectionReason,
      })),
      debt: mine.filter((b) => b.status === "confirmed").reduce((n, b) => n + (alliance ? b.product.costPerAdult * (b.pax.adult + b.pax.child) : b.total), 0),
      commissionPending: alliance ? 0 : mine.filter((b) => b.status === "confirmed").reduce((n, b) => n + b.product.commissionPerAdult * b.pax.adult, 0),
      commissionPaid: 0,
      documents: alliance ? [{ title: "Bộ ảnh bán hàng Hà Giang", mediaId: "ha-giang-4n3d-mua-tam-giac-mach-g1" }] : [],
    });
  });

  app.use("/public/v1", v1);
  return { app, bookings, holds };
}

const cancelPolicy =
  "Hủy trước 15 ngày: mất 10% giá tour.\nHủy từ 7 đến 14 ngày: mất 50% giá tour.\nHủy trong vòng 7 ngày hoặc không đến: mất 100% giá tour.";

function priceOf(p: MockProduct, pax: S.Pax): number {
  return p.price.adult * pax.adult + (p.price.child ?? p.price.adult) * pax.child + (p.price.infant ?? 0) * pax.infant;
}
function depositOf(p: MockProduct, total: number, pax: S.Pax): number {
  return p.deposit.kind === "percent" ? Math.round((total * p.deposit.value) / 100 / 1000) * 1000 : p.deposit.value * (pax.adult + pax.child);
}
function bookingView(b: BookingRec): S.Booking {
  return {
    code: b.code,
    status: b.status,
    productName: b.departureId.startsWith("ticket:") ? (TICKETS.find((t) => `ticket:${t.slug}` === b.departureId)?.name ?? b.product.name) : b.product.name,
    departureDate: b.date,
    pax: b.pax,
    total: b.total,
    deposit: b.deposit,
    paidAmount: b.paidAmount,
    rejectionReason: b.rejectionReason,
    payment: b.payment,
  };
}
function articleSummary(a: (typeof ARTICLES)[number]): S.ArticleSummary {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    cover: { id: `${a.slug}-cover`, alt: a.title, width: 1600, height: 1000 },
    publishedAt: new Date(Date.now() - a.daysAgo * 86400_000).toISOString(),
    productSlug: a.productSlug,
  };
}

/** Bản đề xuất OpenAPI cho đặc tả G3, sinh từ chính schema zod mà web dùng để kiểm dữ liệu. */
function openapi() {
  const js = (s: z.ZodType) => z.toJSONSchema(s, { io: "output", unrepresentable: "any" });
  const ok = (s: z.ZodType, code = "200") => ({ [code]: { description: "OK", content: { "application/json": { schema: js(s) } } } });
  const errs = { default: { description: "Lỗi", content: { "application/json": { schema: js(S.ApiErrorBody) } } } };
  const body = (s: z.ZodType) => ({ required: true, content: { "application/json": { schema: js(s) } } });
  const idemHeader = { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } };
  return {
    openapi: "3.1.0",
    info: { title: "xTravelOS public API (đề xuất G3)", version: "1.0.0" },
    servers: [{ url: "/public/v1" }],
    components: { securitySchemes: { service: { type: "http", scheme: "bearer" }, session: { type: "apiKey", in: "header", name: "X-Session-Token" } } },
    security: [{ service: [] }],
    paths: {
      "/products": { get: { responses: { ...ok(S.ProductList), ...errs } } },
      "/products/{slug}": { get: { responses: { ...ok(S.ProductDetail), ...errs } } },
      "/products/{slug}/departures": { get: { responses: { ...ok(S.DepartureList), ...errs } } },
      "/holds": { post: { parameters: [idemHeader], requestBody: body(S.HoldInput), responses: { ...ok(S.Hold, "201"), ...errs } } },
      "/holds/{id}/release": { post: { parameters: [idemHeader], responses: { "204": { description: "Đã nhả" }, ...errs } } },
      "/bookings": { post: { parameters: [idemHeader], requestBody: body(S.BookingInput), responses: { ...ok(S.Booking, "201"), ...errs } } },
      "/bookings/{code}": {
        get: { parameters: [{ name: "X-Lookup-Phone", in: "header", required: false, schema: { type: "string" } }], responses: { ...ok(S.Booking), ...errs } },
      },
      "/articles": { get: { responses: { ...ok(S.ArticleList), ...errs } } },
      "/articles/{slug}": { get: { responses: { ...ok(S.ArticleDetail), ...errs } } },
      "/media/{id}": { get: { responses: { "200": { description: "Ảnh AVIF, WebP, JPEG, PNG hoặc SVG" }, ...errs } } },
      "/tickets": { get: { responses: { ...ok(S.TicketList), ...errs } } },
      "/tickets/{slug}": { get: { responses: { ...ok(S.TicketDetail), ...errs } } },
      "/ticket-orders": { post: { parameters: [idemHeader], requestBody: body(S.TicketOrderInput), responses: { ...ok(S.Booking, "201"), ...errs } } },
      "/staff/login": { post: { requestBody: body(S.AgentLoginInput), responses: { ...ok(S.StaffLoginResult), ...errs } } },
      "/site-settings": {
        get: { responses: { ...ok(SiteSettings), ...errs } },
        put: { security: [{ service: [], session: [] }], requestBody: body(SiteSettings), responses: { "204": { description: "Đã lưu" }, ...errs } },
      },
      "/leads": { post: { parameters: [idemHeader], requestBody: body(S.LeadInput), responses: { "201": { description: "Đã nhận" }, ...errs } } },
      "/agents/login": { post: { requestBody: body(S.AgentLoginInput), responses: { ...ok(S.AgentLoginResult), ...errs } } },
      "/agents/me/statement": { get: { security: [{ service: [], session: [] }], responses: { ...ok(S.AgentStatement), ...errs } } },
    },
  };
}
