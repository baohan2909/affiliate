// Kênh bán (gom từ mã kênh của đơn hàng Nhanh.vn) — màu nhận diện từng sàn, luôn kèm chữ
export const KENH = {
  shopee: { ten: 'Shopee', mau: '#EE4D2D' },
  tiktok: { ten: 'TikTok Shop', mau: '#161823' },
  lazada: { ten: 'Lazada', mau: '#1A2BB8' },
  web: { ten: 'Website', mau: '#D6006C' },
  facebook: { ten: 'Facebook', mau: '#1877F2' },
  zalo: { ten: 'Zalo', mau: '#00A3E0' },
  noi_bo: { ten: 'Đơn tạo tay', mau: '#C08A2E' },
  khac: { ten: 'Kênh khác', mau: '#A8A1AE' }
}
export const tenKenh = (k) => KENH[k]?.ten || k
export const mauKenh = (k) => KENH[k]?.mau || '#A8A1AE'

// Cộng nhiều bảng {kênh: số} thành 1
export function congKenh(ds) {
  const t = {}
  for (const x of ds || []) for (const [k, v] of Object.entries(x || {})) t[k] = (t[k] || 0) + (Number(v) || 0)
  return t
}
// [[kênh, số, %]] từ lớn đến nhỏ (bỏ kênh 0)
export function xepKenh(bk) {
  const ds = Object.entries(bk || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const tong = ds.reduce((t, [, v]) => t + v, 0)
  return ds.map(([k, v]) => [k, v, tong ? (v / tong) * 100 : 0])
}
export const phanTram = (p) => (p >= 10 || p === 0 ? Math.round(p) : Math.round(p * 10) / 10).toString().replace('.', ',') + '%'
