// Kiểu dữ liệu hợp đồng API công khai xTravelOS (/public/v1) và dữ liệu trình duyệt gửi lên.
// Bản đề xuất cho đặc tả G3: khi xTravelOS xuất /openapi.json chính thức, chạy `npm run gen:types`
// rồi đối chiếu lại file này. z.object bỏ qua trường lạ, đúng quy ước "web bỏ qua trường lạ".
import { z } from "zod";
import { PARTY_KEYS } from "./party";
import { PRODUCT_SORTS } from "./sorts";

const money = z.int().nonnegative();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const isoDate = z.iso.date();
const isoInstant = z.iso.datetime({ offset: true });

// ---------- Dữ liệu từ xTravelOS ----------

export const Media = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  alt: z.string(),
  width: z.int().positive(),
  height: z.int().positive(),
});
export type Media = z.infer<typeof Media>;

export const DestinationRef = z.object({ slug, name: z.string() });
export type DestinationRef = z.infer<typeof DestinationRef>;

export const ProductSummary = z.object({
  slug,
  code: z.string().max(32),
  name: z.string(),
  summary: z.string(),
  durationDays: z.int().positive(),
  durationNights: z.int().nonnegative(),
  destinations: z.array(DestinationRef),
  seasons: z.array(z.string()),
  fromPrice: money.nullable(),
  vatIncluded: z.boolean(),
  coverImage: Media.nullable(),
  tags: z.array(z.string()).default([]),
  departFrom: z.string(),
  // Nhóm sản phẩm do xTravelOS gắn: trong-nuoc, nuoc-ngoai, doanh-nghiep, hoc-sinh…
  categories: z.array(slug).default([]),
  // Vài ngày khởi hành gần nhất kèm chỗ còn, để thẻ tour cho khách thấy ngay (bản tạm tối đa 60 giây).
  nextDepartures: z.array(z.object({ date: isoDate, seatsAvailable: z.int().nonnegative() })).max(6).default([]),
  // Khuyến mãi do xTravelOS đặt; web chỉ hiển thị, không tự tính.
  promotion: z
    .object({ label: z.string().max(40), compareAtPrice: money, endsAt: isoInstant.nullable().default(null) })
    .nullable()
    .default(null),
});
export type ProductSummary = z.infer<typeof ProductSummary>;

export const ProductList = z.object({
  items: z.array(ProductSummary),
  // Bộ lọc có sẵn cho ô tìm kiếm: điểm đến, nơi khởi hành, mùa.
  facets: z
    .object({
      destinations: z.array(DestinationRef.extend({ cover: Media.nullable().default(null) })),
      departFrom: z.array(z.string()), seasons: z.array(z.string()) })
    .default({ destinations: [], departFrom: [], seasons: [] }),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
});
export type ProductList = z.infer<typeof ProductList>;

export const Deposit = z.object({
  kind: z.enum(["percent", "amount"]),
  value: z.int().positive(),
});

export const ProductDetail = ProductSummary.extend({
  itinerary: z.array(z.object({ day: z.int().positive(), title: z.string(), description: z.string() })),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  gallery: z.array(Media),
  cancellationPolicy: z.string(),
  requiresIdDocument: z.boolean(),
  deposit: Deposit,
  updatedAt: isoInstant,
});
export type ProductDetail = z.infer<typeof ProductDetail>;

export const Departure = z.object({
  id: z.string().min(1).max(64),
  date: isoDate,
  returnDate: isoDate,
  seatsAvailable: z.int().nonnegative(),
  status: z.enum(["open", "few", "full", "closed"]),
  price: z.object({ adult: money, child: money.nullable(), infant: money.nullable() }),
  vatIncluded: z.boolean(),
  // Chỉ có khi phiên là đại lý/CTV: phần hưởng theo cấp.
  agent: z.object({ tier: z.string(), commissionPerAdult: money }).optional(),
  // Chỉ có khi phiên là doanh nghiệp liên minh: giá cost tạm tính.
  alliance: z.object({ costPerAdult: money, costPerChild: money.nullable() }).optional(),
});
export type Departure = z.infer<typeof Departure>;

export const DepartureList = z.object({ items: z.array(Departure) });

export const Pax = z.object({
  adult: z.int().min(1).max(50),
  child: z.int().min(0).max(50),
  infant: z.int().min(0).max(20),
});
export type Pax = z.infer<typeof Pax>;

export const Hold = z.object({
  holdId: z.string().min(1).max(64),
  departureId: z.string(),
  pax: Pax,
  expiresAt: isoInstant,
  total: money,
  deposit: money,
});
export type Hold = z.infer<typeof Hold>;

export const BookingStatus = z.enum([
  "awaiting_payment",
  "deposit_paid",
  "paid",
  "pending_approval",
  "confirmed",
  "rejected",
  "cancelled",
  "expired",
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const PaymentInstruction = z.object({
  bankName: z.string(),
  accountNo: z.string(),
  accountName: z.string(),
  amount: money,
  transferContent: z.string(),
  // Ảnh VietQR do xTravelOS sinh, dạng data URL.
  qrImage: z.string().regex(/^data:image\/(png|svg\+xml);base64,[A-Za-z0-9+/=]+$/),
});
export type PaymentInstruction = z.infer<typeof PaymentInstruction>;

export const Booking = z.object({
  code: z.string().regex(/^[A-Z0-9-]{4,32}$/),
  status: BookingStatus,
  productName: z.string(),
  departureDate: isoDate,
  pax: Pax,
  total: money,
  deposit: money,
  paidAmount: money,
  rejectionReason: z.string().nullable().default(null),
  payment: PaymentInstruction.nullable(),
});
export type Booking = z.infer<typeof Booking>;

export const ArticleBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string() }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({ type: z.literal("list"), items: z.array(z.string()) }),
  z.object({ type: z.literal("image"), media: Media, caption: z.string().default("") }),
]);
export type ArticleBlock = z.infer<typeof ArticleBlock>;

export const ArticleSummary = z.object({
  slug,
  title: z.string(),
  excerpt: z.string(),
  cover: Media.nullable(),
  publishedAt: isoInstant,
  productSlug: slug.nullable(),
});
export type ArticleSummary = z.infer<typeof ArticleSummary>;

export const ArticleList = z.object({
  items: z.array(ArticleSummary),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
});

// Bài viết chỉ trả về dạng khối có cấu trúc, không HTML, để web không phải chèn HTML lạ vào trang.
export const ArticleDetail = ArticleSummary.extend({
  author: z.string(),
  updatedAt: isoInstant,
  blocks: z.array(ArticleBlock),
  product: ProductSummary.nullable(),
});
export type ArticleDetail = z.infer<typeof ArticleDetail>;

export const AgentProfile = z.object({
  name: z.string(),
  company: z.string(),
  flow: z.enum(["agent", "alliance"]),
  tier: z.string().nullable(),
});
export type AgentProfile = z.infer<typeof AgentProfile>;

export const AgentLoginResult = z.object({
  sessionToken: z.string().min(16).max(512),
  expiresAt: isoInstant,
  agent: AgentProfile,
});

/** Nhân viên xTravelOS đăng nhập để sửa web. role là tên vai trò đúng như trong xTravelOS ("Quản trị", "CEO", "Marketing"…). */
export const StaffLoginResult = z.object({
  sessionToken: z.string().min(16).max(512),
  expiresAt: isoInstant,
  staff: z.object({ name: z.string().max(100), role: z.string().trim().min(1).max(32) }),
});
export type StaffLoginResult = z.infer<typeof StaffLoginResult>;

export const AgentStatement = z.object({
  agent: AgentProfile,
  holds: z.array(
    z.object({ holdId: z.string(), productName: z.string(), departureDate: isoDate, pax: Pax, expiresAt: isoInstant }),
  ),
  bookings: z.array(
    z.object({
      code: z.string(),
      productName: z.string(),
      departureDate: isoDate,
      pax: Pax,
      status: BookingStatus,
      total: money,
      commission: money.nullable(),
      costTotal: money.nullable(),
      rejectionReason: z.string().nullable(),
    }),
  ),
  debt: money,
  commissionPending: money,
  commissionPaid: money,
  documents: z.array(z.object({ title: z.string(), mediaId: Media.shape.id })).default([]),
});
export type AgentStatement = z.infer<typeof AgentStatement>;

// ---------- Vé tham quan khu vui chơi ----------

export const TicketSummary = z.object({
  slug,
  name: z.string(),
  place: z.string(),
  destination: DestinationRef,
  summary: z.string(),
  price: z.object({ adult: money, child: money.nullable() }),
  vatIncluded: z.boolean(),
  image: Media.nullable(),
  validityNote: z.string().max(200),
});
export type TicketSummary = z.infer<typeof TicketSummary>;

export const TicketList = z.object({
  items: z.array(TicketSummary),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
});
export type TicketList = z.infer<typeof TicketList>;

export const TicketDetail = TicketSummary.extend({
  openHours: z.string().max(120),
  highlights: z.array(z.string()),
  terms: z.string(),
  // Ngày sớm nhất có thể dùng vé (vé điện tử thường cần đặt trước 1 ngày).
  earliestDate: isoDate,
  updatedAt: isoInstant,
});
export type TicketDetail = z.infer<typeof TicketDetail>;

export const ApiErrorBody = z.object({ detail: z.string().min(1).max(500) });

export const WebhookEvent = z.object({
  event: z.enum([
    "product.updated",
    "product.deleted",
    "departures.updated",
    "article.updated",
    "article.deleted",
    "ticket.updated",
    "ticket.deleted",
    "site-settings.updated",
  ]),
  // Sự kiện cấu hình web không gắn sản phẩm nào: slug để "web".
  slug,
});
export type WebhookEvent = z.infer<typeof WebhookEvent>;

// ---------- Dữ liệu trình duyệt gửi lên máy chủ web ----------

const vnPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại chưa đúng"));
const personName = z.string().trim().min(2, "Vui lòng nhập họ tên").max(100);

export const HoldInput = z.object({ departureId: z.string().min(1).max(64), pax: Pax });
export type HoldInput = z.infer<typeof HoldInput>;

export const PassengerInput = z.object({
  fullName: personName,
  type: z.enum(["adult", "child", "infant"]),
  birthDate: isoDate.optional(),
  gender: z.enum(["male", "female"]).optional(),
  // Chỉ gửi khi tour cần vé, visa; chuyển thẳng về xTravelOS, web không lưu.
  idNumber: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{6,20}$/i, "Số giấy tờ chưa đúng")
    .optional(),
});

export const BookingInput = z.object({
  holdId: z.string().min(1).max(64),
  contact: z.object({
    fullName: personName,
    phone: vnPhone,
    email: z.email("Email chưa đúng").optional(),
  }),
  passengers: z.array(PassengerInput).min(1).max(120),
  note: z.string().trim().max(1000).optional(),
  consentPurpose: z.literal(true, "Vui lòng đồng ý mục đích sử dụng thông tin"),
  marketingOptIn: z.boolean(),
});
export type BookingInput = z.infer<typeof BookingInput>;

export const LookupInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,32}$/, "Mã đặt chỗ chưa đúng"),
  phone: vnPhone,
});

export const LeadInput = z.object({
  fullName: personName,
  phone: vnPhone,
  email: z.email("Email chưa đúng").optional(),
  message: z.string().trim().max(2000).optional(),
  productSlug: slug.optional(),
  consentPurpose: z.literal(true, "Vui lòng đồng ý mục đích sử dụng thông tin"),
  marketingOptIn: z.boolean(),
});
export type LeadInput = z.infer<typeof LeadInput>;

export const TicketOrderInput = z.object({
  ticketSlug: slug,
  visitDate: isoDate,
  qty: z.object({ adult: z.int().min(1).max(50), child: z.int().min(0).max(50) }),
  contact: z.object({
    fullName: personName,
    phone: vnPhone,
    email: z.email("Email chưa đúng").optional(),
  }),
  consentPurpose: z.literal(true, "Vui lòng đồng ý mục đích sử dụng thông tin"),
  marketingOptIn: z.boolean(),
});
export type TicketOrderInput = z.infer<typeof TicketOrderInput>;

export const AgentLoginInput = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(128),
});

export const ProductFilter = z.object({
  q: z.string().trim().max(80).optional(),
  destination: slug.optional(),
  season: z.string().max(32).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  from: z.string().trim().max(40).optional(),
  category: slug.optional(),
  // Đi cùng ai: xTravelOS quyết cách lọc (gia đình → tour có giá trẻ em, công ty → tour đoàn).
  party: z.enum(PARTY_KEYS).optional(),
  // "1": chỉ lấy tour đang có ưu đãi.
  promo: z.enum(["1"]).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(PRODUCT_SORTS).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
});
export type ProductFilter = z.infer<typeof ProductFilter>;
