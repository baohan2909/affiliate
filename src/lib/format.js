// Định dạng hiển thị (giờ Việt Nam, dd/mm/yyyy)
const TZ = 'Asia/Ho_Chi_Minh'

export const fmtNgay = (d) => {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { const [y, m, n] = d.split('-'); return `${n}/${m}/${y}` }
  return new Date(d).toLocaleDateString('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
}
export const fmtGio = (d) => (d ? new Date(d).toLocaleTimeString('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '')
export const fmtNgayGio = (d) => (d ? `${fmtGio(d)} ${fmtNgay(d)}` : '')

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const thuCua = (iso, ngan) => { const d = new Date(iso + 'T00:00:00'); return (ngan ? THU_NGAN : THU)[d.getDay()] }
export const fmtNgayThu = (iso) => (iso ? `${thuCua(iso)}, ${fmtNgay(iso)}` : '')

export const homNay = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })
export const congNgay = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

export function tuongDoi(d) {
  if (!d) return ''
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'vừa xong'
  if (s < 3600) return Math.floor(s / 60) + ' phút trước'
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước'
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' ngày trước'
  return fmtNgay(d)
}
export function conLai(d) {
  if (!d) return ''
  const s = (new Date(d).getTime() - Date.now()) / 1000
  if (s <= 0) return 'đã kết thúc'
  if (s < 3600) return 'còn ' + Math.ceil(s / 60) + ' phút'
  if (s < 86400) return 'còn ' + Math.ceil(s / 3600) + ' giờ'
  return 'còn ' + Math.ceil(s / 86400) + ' ngày'
}

export const fmtTien = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('vi-VN') + 'đ')
export const fmtSo = (n) => (n == null ? '0' : Number(n).toLocaleString('vi-VN'))
export const fmtPhanTram = (n) => (n == null || n === '' ? '' : (Math.round(Number(n) * 10) / 10).toLocaleString('vi-VN') + '%')
export const fmtDungLuong = (b) => (!b ? '' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB')

export const chuCai = (ten) => String(ten || '?').trim().split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase()
const MAU_AV = [['#FDE6F1', '#A3004F'], ['#FBF3E2', '#8A5A12'], ['#E3F5EE', '#0E7F63'], ['#EAF0FD', '#2E5BC9'], ['#F6F3F7', '#4A4452'], ['#FFE9E2', '#B4461F']]
export const mauAv = (ten) => { let h = 0; for (const c of String(ten || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return MAU_AV[h % MAU_AV.length] }

export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
export const khop = (chuoi, tim) => !tim || boDau(chuoi).includes(boDau(tim).trim())

// Khoảng cách (km) giữa 2 toạ độ
export function khoangCach(a, b) {
  const R = 6371, r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
export const linkBanDo = (c) => (c?.lat ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : c?.dia_chi ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.dia_chi)}` : null)

// datetime-local <-> ISO (giờ máy người dùng)
export const choInputGio = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }
export const tuInputGio = (v) => (v ? new Date(v).toISOString() : '')
