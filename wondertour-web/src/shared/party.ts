// "Đi cùng ai" trong câu tìm tour. Tách riêng (không zod) để giao diện dùng mà không kéo zod vào gói trình duyệt.
export interface PartyPax {
  adult: number;
  child: number;
  infant: number;
}

export const PARTIES = {
  solo: { label: "một mình", hint: "1 người lớn", pax: { adult: 1, child: 0, infant: 0 } },
  couple: { label: "cặp đôi", hint: "2 người lớn", pax: { adult: 2, child: 0, infant: 0 } },
  family: { label: "gia đình có trẻ nhỏ", hint: "2 người lớn, 2 trẻ em; ưu tiên tour có giá trẻ em", pax: { adult: 2, child: 2, infant: 0 } },
  friends: { label: "nhóm bạn", hint: "4 người lớn", pax: { adult: 4, child: 0, infant: 0 } },
  company: { label: "công ty, đoàn", hint: "Tour đoàn doanh nghiệp, teambuilding; có báo giá riêng theo đoàn", pax: { adult: 10, child: 0, infant: 0 } },
} as const satisfies Record<string, { label: string; hint: string; pax: PartyPax }>;

export type PartyKey = keyof typeof PARTIES;
export const PARTY_KEYS = Object.keys(PARTIES) as PartyKey[];
