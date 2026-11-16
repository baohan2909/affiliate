// Hệ thống xếp hạng sản phẩm Affiliate
// Gộp các mẫu dùng chung 1 link Shopee thành 1 sản phẩm, xếp theo số bán 30 ngày gần nhất,
// trên toàn hệ thống và trong từng danh mục. Chỉ sản phẩm có bán mới được xếp hạng.
// Đổi ngưỡng ở đây là toàn app đổi theo: thẻ sản phẩm, trang Sản phẩm, trang chủ, chi tiết.
export const BAC = [
  { ma: 'top', ten: 'Top 10', tu: 1, den: 10, tieuDe: 'Top 10 bán chạy nhất' },
  { ma: 'sieu', ten: 'Bán siêu chạy', tu: 11, den: 30, tieuDe: 'Bán siêu chạy' },
  { ma: 'chay', ten: 'Bán chạy', tu: 31, den: 60, tieuDe: 'Bán chạy' },
  { ma: 'tot', ten: 'Bán tốt', tu: 61, den: 100, tieuDe: 'Bán tốt' }
]

export const bacCua = (hang) => (hang > 0 ? BAC.find((b) => hang >= b.tu && hang <= b.den) || null : null)

// Hoa hồng ước tính cho 1 sản phẩm bán qua link (giá niêm yết × % hoa hồng), làm tròn trăm đồng
export function uocHoaHong(gia, hoaHong) {
  const g = Number(gia)
  const h = Number(hoaHong)
  if (!(g > 0) || !(h > 0)) return null
  return Math.round((g * h) / 100 / 100) * 100
}
