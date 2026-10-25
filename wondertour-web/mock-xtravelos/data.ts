// Dữ liệu mẫu cho xTravelOS giả lập. Chỉ dùng để phát triển và kiểm thử, không phải dữ liệu thật.

export interface MockProduct {
  slug: string;
  code: string;
  name: string;
  summary: string;
  durationDays: number;
  durationNights: number;
  destinations: { slug: string; name: string }[];
  seasons: string[];
  departFrom: string;
  vatIncluded: boolean;
  requiresIdDocument: boolean;
  deposit: { kind: "percent" | "amount"; value: number };
  holdMinutes: number;
  price: { adult: number; child: number | null; infant: number | null };
  commissionPerAdult: number;
  costPerAdult: number;
  promotion: { label: string; compareAtPrice: number; endsInDays: number } | null;
  categories: string[];
  // Ngày khởi hành tính từ hôm nay (số ngày) và sức chứa.
  departures: { inDays: number; capacity: number }[];
  itinerary: { title: string; description: string }[];
  includes: string[];
  excludes: string[];
  tags: string[];
}

const commonIncludes = ["Xe du lịch đời mới đưa đón theo chương trình", "Hướng dẫn viên suốt tuyến", "Bảo hiểm du lịch mức 100.000.000 đ/vụ"];
const commonExcludes = ["Chi phí cá nhân, đồ uống ngoài chương trình", "Tiền tip hướng dẫn viên, lái xe"];

export const PRODUCTS: MockProduct[] = [
  {
    slug: "ha-giang-4n3d-mua-tam-giac-mach",
    code: "WT-HG04",
    name: "Hà Giang 4 ngày 3 đêm mùa tam giác mạch",
    summary: "Cung đường Mã Pí Lèng, sông Nho Quế, cột cờ Lũng Cú và những triền hoa tam giác mạch tháng 10, tháng 11. Đoàn nhỏ, xe giường nằm cabin, homestay sạch.",
    durationDays: 4,
    durationNights: 3,
    destinations: [{ slug: "ha-giang", name: "Hà Giang" }],
    seasons: ["thu"],
    departFrom: "Hà Nội",
    vatIncluded: true,
    requiresIdDocument: false,
    deposit: { kind: "percent", value: 30 },
    holdMinutes: 15,
    price: { adult: 3_890_000, child: 2_900_000, infant: 0 },
    commissionPerAdult: 250_000,
    costPerAdult: 3_350_000,
    promotion: { label: "Giảm 300.000 đ", compareAtPrice: 4_190_000, endsInDays: 5 },
    categories: ["trong-nuoc"],
    departures: [
      { inDays: 6, capacity: 3 },
      { inDays: 13, capacity: 20 },
      { inDays: 20, capacity: 20 },
      { inDays: 34, capacity: 20 },
    ],
    itinerary: [
      { title: "Hà Nội, Hà Giang", description: "Xe đón tại Hà Nội lúc 21:00, đi xe cabin lên Hà Giang, nghỉ đêm trên xe." },
      { title: "Quản Bạ, Yên Minh, Đồng Văn", description: "Cổng trời Quản Bạ, núi đôi Cô Tiên, rừng thông Yên Minh, phố cổ Đồng Văn." },
      { title: "Lũng Cú, Mã Pí Lèng", description: "Cột cờ Lũng Cú, đèo Mã Pí Lèng, đi thuyền sông Nho Quế." },
      { title: "Hà Giang, Hà Nội", description: "Ngắm đồng hoa tam giác mạch, ăn trưa rồi về Hà Nội, đến nơi khoảng 22:00." },
    ],
    includes: [...commonIncludes, "3 đêm homestay, khách sạn 2 sao", "Vé thuyền sông Nho Quế"],
    excludes: commonExcludes,
    tags: ["Đoàn nhỏ"],
  },
  {
    slug: "phu-quoc-3n2d-nghi-duong",
    code: "WT-PQ03",
    name: "Phú Quốc 3 ngày 2 đêm nghỉ dưỡng, cáp treo Hòn Thơm",
    summary: "Bay thẳng, resort 4 sao sát biển, cáp treo vượt biển Hòn Thơm và chợ đêm Dinh Cậu. Hợp gia đình và đoàn doanh nghiệp nhỏ.",
    durationDays: 3,
    durationNights: 2,
    destinations: [{ slug: "phu-quoc", name: "Phú Quốc" }],
    seasons: ["he", "dong"],
    departFrom: "TP.HCM",
    vatIncluded: false,
    requiresIdDocument: true,
    deposit: { kind: "amount", value: 2_000_000 },
    holdMinutes: 20,
    price: { adult: 6_490_000, child: 4_900_000, infant: 900_000 },
    commissionPerAdult: 400_000,
    costPerAdult: 5_700_000,
    promotion: { label: "Ưu đãi gia đình", compareAtPrice: 6_990_000, endsInDays: 9 },
    categories: ["trong-nuoc"],
    departures: [
      { inDays: 9, capacity: 24 },
      { inDays: 16, capacity: 24 },
      { inDays: 30, capacity: 24 },
    ],
    itinerary: [
      { title: "TP.HCM, Phú Quốc", description: "Bay sáng, nhận phòng resort, chiều tắm biển, tối chợ đêm Dinh Cậu." },
      { title: "Cáp treo Hòn Thơm", description: "Cáp treo vượt biển, công viên nước Aquatopia, ngắm hoàng hôn Sunset Town." },
      { title: "Phú Quốc, TP.HCM", description: "Tự do tắm biển, trả phòng, bay về TP.HCM." },
    ],
    includes: [...commonIncludes, "Vé máy bay khứ hồi kèm 20 kg hành lý", "2 đêm resort 4 sao", "Vé cáp treo Hòn Thơm"],
    excludes: [...commonExcludes, "Thuế GTGT 8%"],
    tags: ["Gia đình"],
  },
  {
    slug: "nhat-ban-6n5d-tokyo-phu-si-osaka",
    code: "WT-JP06",
    name: "Nhật Bản 6 ngày 5 đêm Tokyo, núi Phú Sĩ, Kyoto, Osaka",
    summary: "Cung đường vàng Nhật Bản: Tokyo, làng cổ Oshino Hakkai dưới chân núi Phú Sĩ, đền Fushimi Inari ở Kyoto và phố Dotonbori ở Osaka. Đã gồm visa.",
    durationDays: 6,
    durationNights: 5,
    destinations: [{ slug: "nhat-ban", name: "Nhật Bản" }],
    seasons: ["xuan", "thu"],
    departFrom: "Hà Nội",
    vatIncluded: true,
    requiresIdDocument: true,
    deposit: { kind: "amount", value: 10_000_000 },
    holdMinutes: 30,
    price: { adult: 29_990_000, child: 26_990_000, infant: 8_000_000 },
    commissionPerAdult: 1_500_000,
    costPerAdult: 26_800_000,
    promotion: null,
    categories: ["nuoc-ngoai"],
    departures: [
      { inDays: 25, capacity: 30 },
      { inDays: 55, capacity: 30 },
    ],
    itinerary: [
      { title: "Hà Nội, Tokyo", description: "Bay đêm sang sân bay Narita." },
      { title: "Tokyo", description: "Chùa Asakusa Kannon, tháp Tokyo Skytree, mua sắm Ginza." },
      { title: "Núi Phú Sĩ", description: "Làng cổ Oshino Hakkai, trạm 5 núi Phú Sĩ khi thời tiết cho phép, tắm onsen." },
      { title: "Nagoya, Kyoto", description: "Tàu cao tốc Shinkansen, đền Fushimi Inari, chùa Thanh Thủy." },
      { title: "Osaka", description: "Lâu đài Osaka, phố ẩm thực Dotonbori." },
      { title: "Osaka, Hà Nội", description: "Ra sân bay Kansai bay về Hà Nội." },
    ],
    includes: [...commonIncludes, "Vé máy bay khứ hồi", "Visa Nhật Bản", "Khách sạn 3 sao và 1 đêm onsen"],
    excludes: commonExcludes,
    tags: ["Visa trọn gói"],
  },
  {
    slug: "han-quoc-5n4d-seoul-nami",
    code: "WT-KR05",
    name: "Hàn Quốc 5 ngày 4 đêm Seoul, đảo Nami, Everland",
    summary: "Seoul, đảo Nami, công viên Everland và trải nghiệm mặc hanbok ở cung Gyeongbok. Lịch trình thong thả, khách sạn trung tâm.",
    durationDays: 5,
    durationNights: 4,
    destinations: [{ slug: "han-quoc", name: "Hàn Quốc" }],
    seasons: ["xuan", "thu"],
    departFrom: "Hà Nội",
    vatIncluded: true,
    requiresIdDocument: true,
    deposit: { kind: "percent", value: 40 },
    holdMinutes: 30,
    price: { adult: 15_990_000, child: 13_990_000, infant: 4_500_000 },
    commissionPerAdult: 900_000,
    costPerAdult: 14_200_000,
    promotion: { label: "Giờ vàng", compareAtPrice: 17_490_000, endsInDays: 2 },
    categories: ["nuoc-ngoai"],
    departures: [
      { inDays: 11, capacity: 25 },
      { inDays: 18, capacity: 4 },
      { inDays: 39, capacity: 25 },
    ],
    itinerary: [
      { title: "Hà Nội, Seoul", description: "Bay đêm sang Incheon." },
      { title: "Đảo Nami", description: "Đảo Nami, vườn Petite France." },
      { title: "Everland", description: "Công viên Everland cả ngày." },
      { title: "Seoul", description: "Cung Gyeongbok mặc hanbok, làng Bukchon, tháp Namsan." },
      { title: "Seoul, Hà Nội", description: "Mua sắm Myeongdong, bay về Hà Nội." },
    ],
    includes: [...commonIncludes, "Vé máy bay khứ hồi", "Khách sạn 3 sao trung tâm"],
    excludes: [...commonExcludes, "Phí visa Hàn Quốc"],
    tags: [],
  },
  {
    slug: "truong-gia-gioi-phuong-hoang-co-tran-5n4d",
    code: "WT-CN05",
    name: "Trương Gia Giới, Phượng Hoàng cổ trấn 5 ngày 4 đêm",
    summary: "Thiên Môn Sơn, cầu kính, Viên Gia Giới nơi quay phim Avatar và đêm ở Phượng Hoàng cổ trấn bên sông Đà Giang.",
    durationDays: 5,
    durationNights: 4,
    destinations: [{ slug: "trung-quoc", name: "Trung Quốc" }],
    seasons: ["he", "thu"],
    departFrom: "Hà Nội",
    vatIncluded: true,
    requiresIdDocument: true,
    deposit: { kind: "percent", value: 30 },
    holdMinutes: 30,
    price: { adult: 12_490_000, child: 10_490_000, infant: null },
    commissionPerAdult: 700_000,
    costPerAdult: 11_000_000,
    promotion: null,
    categories: ["nuoc-ngoai"],
    departures: [
      { inDays: 15, capacity: 30 },
      { inDays: 44, capacity: 30 },
    ],
    itinerary: [
      { title: "Hà Nội, Trương Gia Giới", description: "Bay thẳng Trương Gia Giới." },
      { title: "Thiên Môn Sơn", description: "Cáp treo Thiên Môn Sơn, cầu kính, cổng trời." },
      { title: "Viên Gia Giới", description: "Thang máy Bách Long, núi Hallelujah." },
      { title: "Phượng Hoàng cổ trấn", description: "Dạo phố cổ, ngắm đèn đêm bên sông Đà Giang." },
      { title: "Trương Gia Giới, Hà Nội", description: "Bay về Hà Nội." },
    ],
    includes: [...commonIncludes, "Vé máy bay khứ hồi", "Visa Trung Quốc", "Vé thắng cảnh theo chương trình"],
    excludes: commonExcludes,
    tags: [],
  },
  {
    slug: "cat-ba-2n1d-teambuilding",
    code: "WT-CB02",
    name: "Cát Bà 2 ngày 1 đêm teambuilding, gala dinner",
    summary: "Chương trình cho đoàn doanh nghiệp: teambuilding trên bãi biển, gala dinner có MC, âm thanh ánh sáng, du thuyền vịnh Lan Hạ.",
    durationDays: 2,
    durationNights: 1,
    destinations: [{ slug: "cat-ba", name: "Cát Bà" }],
    seasons: ["he"],
    departFrom: "Hà Nội",
    vatIncluded: false,
    requiresIdDocument: false,
    deposit: { kind: "percent", value: 50 },
    holdMinutes: 60,
    price: { adult: 2_490_000, child: 1_890_000, infant: 0 },
    commissionPerAdult: 150_000,
    costPerAdult: 2_100_000,
    promotion: null,
    categories: ["trong-nuoc", "doanh-nghiep"],
    departures: [{ inDays: 21, capacity: 120 }],
    itinerary: [
      { title: "Hà Nội, Cát Bà", description: "Cao tốc Hà Nội, Hải Phòng, phà Gót sang Cát Bà. Chiều teambuilding, tối gala dinner." },
      { title: "Vịnh Lan Hạ, Hà Nội", description: "Du thuyền vịnh Lan Hạ, chèo kayak, về Hà Nội." },
    ],
    includes: [...commonIncludes, "Khách sạn 3 sao", "Teambuilding, gala dinner có MC", "Du thuyền vịnh Lan Hạ"],
    excludes: [...commonExcludes, "Thuế GTGT 8%"],
    tags: ["Doanh nghiệp"],
  },
];

export const ARTICLES_SEED = [
  {
    slug: "kinh-nghiem-ha-giang-mua-tam-giac-mach",
    title: "Kinh nghiệm đi Hà Giang mùa tam giác mạch",
    excerpt: "Đi tháng nào, mặc gì, ở đâu, và vì sao nên đi xe cabin đêm thay vì tự lái từ Hà Nội.",
    author: "Phòng Marketing",
    daysAgo: 3,
    productSlug: "ha-giang-4n3d-mua-tam-giac-mach",
    blocks: [
      { type: "paragraph", text: "Tam giác mạch nở rộ từ giữa tháng 10 đến hết tháng 11. Đẹp nhất là tuần đầu tháng 11." },
      { type: "heading", text: "Mang theo gì" },
      { type: "list", items: ["Áo khoác gió, sáng sớm và tối khá lạnh", "Giày đế bám", "Tiền mặt, nhiều điểm không nhận chuyển khoản"] },
      { type: "heading", text: "Đi xe cabin hay tự lái" },
      { type: "paragraph", text: "Cung đường dài và nhiều đèo. Đi xe cabin đêm giúp bạn có trọn ngày đầu để đi chơi, thay vì mất sức lái xe." },
    ],
  },
  {
    slug: "chuan-bi-visa-nhat-ban",
    title: "Chuẩn bị hồ sơ visa Nhật Bản cho tour đoàn",
    excerpt: "Giấy tờ cần nộp, thời gian xét duyệt và những lỗi hay khiến hồ sơ bị trả lại.",
    author: "Phòng Visa",
    daysAgo: 10,
    productSlug: "nhat-ban-6n5d-tokyo-phu-si-osaka",
    blocks: [
      { type: "paragraph", text: "Hồ sơ visa đi theo đoàn thường gọn hơn đi lẻ, nhưng vẫn cần hộ chiếu còn hạn trên 6 tháng." },
      { type: "list", items: ["Hộ chiếu gốc", "Ảnh 4,5 x 4,5 cm nền trắng", "Giấy xác nhận công việc hoặc sổ tiết kiệm"] },
    ],
  },
  {
    slug: "to-chuc-hoi-nghi-khach-hang-500-khach",
    title: "Tổ chức hội nghị khách hàng 500 khách: những điều không có trên lịch trình",
    excerpt: "Từ đoàn 500 khách ở Cát Bà: chia xe, chia phòng, xử lý khi đổi giờ phà và giữ gala đúng giờ.",
    author: "Phòng Điều hành",
    daysAgo: 20,
    productSlug: "cat-ba-2n1d-teambuilding",
    blocks: [
      { type: "paragraph", text: "Một đoàn 500 khách không chỉ cần giá tốt. Đoàn cần một người chịu trách nhiệm cho từng xe, từng tầng khách sạn, từng bàn gala." },
      { type: "heading", text: "Chia nhóm từ trước ngày đi" },
      { type: "paragraph", text: "Danh sách khách chia theo xe ngay khi chốt, mỗi xe một trưởng nhóm có số điện thoại điều hành." },
    ],
  },
] as const;


// Nhân viên xTravelOS; vai trò đúng tên đang dùng trong xTravelOS. Chỉ để chạy thử.
export const STAFF = [
  { username: "toan", password: "matkhau123", name: "Dương Hữu Toản", role: "CEO" },
  { username: "marketing01", password: "matkhau123", name: "Nguyễn Minh Anh", role: "Marketing" },
  { username: "sale01", password: "matkhau123", name: "Trần Văn Sơn", role: "Sale" },
];

export const AGENTS = [
  { username: "daily01", password: "matkhau123", profile: { name: "Nguyễn Thu Hà", company: "Đại lý Thu Hà Travel", flow: "agent" as const, tier: "2" } },
  { username: "lienminh01", password: "matkhau123", profile: { name: "Trần Minh Quân", company: "Công ty Du lịch Sao Việt", flow: "alliance" as const, tier: null } },
];

export interface MockTicket {
  slug: string;
  name: string;
  place: string;
  destination: { slug: string; name: string };
  summary: string;
  price: { adult: number; child: number | null };
  vatIncluded: boolean;
  validityNote: string;
  openHours: string;
  highlights: string[];
  terms: string;
}

// Bài mẫu để chạy thử web. Bản thật do đội Marketing soạn và duyệt trong xTravelOS.
export const ARTICLE_DRAFTS = [
  {
    slug: "ba-na-hills-mot-ngay-khong-xep-hang",
    title: "Bà Nà Hills một ngày: lịch đi để ít đứng xếp hàng",
    excerpt: "Lên cáp treo sớm, ăn trưa muộn, và để Cầu Vàng cho lúc ánh sáng đẹp nhất. Lịch một ngày từ người đã đưa nhiều đoàn lên núi.",
    author: "Phòng Điều hành",
    daysAgo: 4,
    productSlug: null as string | null,
    blocks: [
      { type: "paragraph", text: "Bà Nà ngày cuối tuần đông hơn người ta tưởng. Phần lớn chuyện xếp hàng không đến từ khu vui chơi, mà từ việc cả đoàn cùng lên cáp treo một lúc." },
      { type: "heading", text: "Sáng: lên trước khi đoàn khác tới" },
      { type: "paragraph", text: "Khu vực mở cửa lúc 7 giờ 30. Nửa giờ đầu là lúc lên cáp ít người nhất. Với nhóm có trẻ nhỏ, đó cũng là lúc các bé còn đủ sức đi hết làng Pháp." },
      { type: "heading", text: "Trưa: ăn muộn, nhường giờ đông" },
      { type: "paragraph", text: "Nhà hàng đông nhất từ 11 giờ 30 đến 13 giờ. Ăn lúc 13 giờ 30 thì bàn trống, đồ ăn còn nóng, và sau đó là giờ vắng để chụp ảnh ở Cầu Vàng." },
      { type: "heading", text: "Chiều: đợi ánh sáng" },
      { type: "list", items: ["Cầu Vàng đẹp nhất trong nắng xế, khoảng 16 giờ đến 17 giờ 30", "Mang áo khoác mỏng: trên núi thường mát hơn dưới chân nhiều", "Đặt vé điện tử trước để quét mã ở cổng, khỏi đứng quầy"] },
      { type: "paragraph", text: "Đi cùng đoàn thì nhắn trước cho điều hành số người và giờ muốn lên cáp. Chúng tôi sắp đoàn vào các khung giờ vắng hơn." },
    ],
  },
  {
    slug: "lan-ha-du-thuyen-mot-ngay",
    title: "Vịnh Lan Hạ một ngày: đi thuyền gỗ, không đi đông",
    excerpt: "Vì sao chúng tôi chọn tàu nhỏ cho đoàn và cặp đôi, và vì sao một ngày trên vịnh thường được nhớ lâu hơn ta nghĩ.",
    author: "Phòng Sản phẩm",
    daysAgo: 9,
    productSlug: "cat-ba-2n1d-teambuilding",
    blocks: [
      { type: "paragraph", text: "Vịnh Lan Hạ được nhắc tới rất nhiều, nhưng không phải tàu nào cũng đưa khách đến những góc đẹp nhất. Tàu lớn đông người thường chỉ vòng quanh cảng." },
      { type: "heading", text: "Vì sao chọn tàu gỗ nhỏ" },
      { type: "paragraph", text: "Tàu ít khách đi chậm hơn và vào được những hang, đầm nhỏ mà tàu lớn không tới. Với cặp đôi, đó là khoảng yên tĩnh. Với đoàn công ty, đó là cách chia nhóm dễ hơn khi chèo kayak." },
      { type: "heading", text: "Một ngày trên vịnh" },
      { type: "list", items: ["Buổi sáng: lên tàu, ăn sáng nhẹ trên boong khi tàu rời cảng", "Buổi trưa: hải sản tươi, ăn xong nghỉ trong hang nếu thời tiết cho phép", "Buổi chiều: chèo kayak hoặc tắm biển, rồi về bến khi đèn vịnh bắt đầu sáng"] },
      { type: "paragraph", text: "Mang theo kem chống nắng và túi chống nước cho điện thoại. Thời tiết xấu thì tàu không ra khơi; chúng tôi báo trước để anh/chị đổi ngày, không để khách đứng bến chờ." },
    ],
  },
  {
    slug: "doan-120-nguoi-teambuilding-30-ngay",
    title: "Đưa đoàn 120 người đi teambuilding: chuẩn bị trước 30 ngày",
    excerpt: "Danh sách nhóm, xe, phòng và kịch bản gala được chốt từ sớm ra sao. Một đoàn lớn chạy được là nhờ việc làm từ tuần thứ tư trước ngày đi.",
    author: "Phòng Điều hành",
    daysAgo: 14,
    productSlug: "cat-ba-2n1d-teambuilding",
    blocks: [
      { type: "paragraph", text: "Teambuilding cho 120 người nghe thì đơn giản, làm thì nhiều việc. Điều quyết định một chuyến đi vui hay không thường nằm ở những việc làm từ một tháng trước." },
      { type: "heading", text: "30 ngày trước: chốt số người và trưởng nhóm" },
      { type: "paragraph", text: "Mỗi nhóm 8 đến 10 người cần một trưởng nhóm có số điện thoại. Trưởng nhóm nhận thông báo của điều hành, không phải người chịu việc phát sinh của cả đoàn." },
      { type: "heading", text: "21 ngày trước: xe và phòng" },
      { type: "paragraph", text: "Xe chia theo nhóm để lên xuống nhanh. Phòng sắp theo đúng danh sách nhóm, để buổi tối không ai phải tìm người quen trong sảnh." },
      { type: "heading", text: "7 ngày trước: kịch bản gala" },
      { type: "list", items: ["Chốt MC, khung giờ và thứ tự tiết mục", "Gửi danh sách món ăn và món kiêng về bếp", "Kiểm âm thanh, ánh sáng tại địa điểm ít nhất một lần"] },
      { type: "paragraph", text: "Chuyến đi đáng nhớ không phải vì mọi thứ hoàn hảo, mà vì khi có chuyện, đoàn biết ai xử lý và xử lý nhanh." },
    ],
  },
];

export const TICKETS: MockTicket[] = [
  {
    slug: "ve-sun-world-ba-na-hills",
    name: "Vé Sun World Ba Na Hills",
    place: "Đà Nẵng",
    destination: { slug: "da-nang", name: "Đà Nẵng" },
    summary: "Cáp treo lên Bà Nà, Cầu Vàng, làng Pháp, khu vui chơi Fantasy Park. Vé điện tử, quét mã tại cổng.",
    price: { adult: 950_000, child: 750_000 },
    vatIncluded: true,
    validityNote: "Dùng đúng ngày đã chọn, đặt trước ít nhất 1 ngày",
    openHours: "7:30 đến 21:30 hằng ngày",
    highlights: ["Cầu Vàng và vườn hoa Le Jardin", "Làng Pháp, hầm rượu Debay", "Fantasy Park không giới hạn trò chơi"],
    terms: "Trẻ em cao từ 1 m đến 1,4 m mua vé trẻ em; dưới 1 m miễn phí. Vé không hoàn, không đổi ngày.",
  },
  {
    slug: "ve-vinwonders-phu-quoc",
    name: "Vé VinWonders Phú Quốc",
    place: "Phú Quốc",
    destination: { slug: "phu-quoc", name: "Phú Quốc" },
    summary: "Công viên chủ đề lớn nhất Việt Nam: thủy cung, công viên nước, lâu đài, show Once.",
    price: { adult: 880_000, child: 660_000 },
    vatIncluded: true,
    validityNote: "Dùng trong ngày đã chọn",
    openHours: "9:00 đến 19:00",
    highlights: ["Thủy cung Sea Shell", "Công viên nước Aquatopia", "Show Once"],
    terms: "Trẻ em cao từ 1 m đến 1,4 m mua vé trẻ em. Vé không hoàn.",
  },
  {
    slug: "ve-du-thuyen-vinh-lan-ha-1-ngay",
    name: "Vé du thuyền vịnh Lan Hạ 1 ngày",
    place: "Cát Bà",
    destination: { slug: "cat-ba", name: "Cát Bà" },
    summary: "Du thuyền ngày, chèo kayak, tắm biển đảo Ba Trái Đào, bữa trưa hải sản trên tàu.",
    price: { adult: 1_250_000, child: 900_000 },
    vatIncluded: false,
    validityNote: "Theo chuyến 8:00 hằng ngày, đặt trước 1 ngày",
    openHours: "Đón 7:30 tại bến Bèo",
    highlights: ["Chèo kayak hang Sáng Tối", "Bữa trưa hải sản", "Tắm biển bãi Ba Trái Đào"],
    terms: "Hủy trước 48 giờ hoàn 100%. Thời tiết xấu cảng cấm biển thì đổi ngày hoặc hoàn tiền.",
  },
];

export const ARTICLES = [...ARTICLES_SEED, ...ARTICLE_DRAFTS] as const;
