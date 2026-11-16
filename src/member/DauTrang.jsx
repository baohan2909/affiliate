// Header thống nhất cho mọi trang thành viên:
// hàng trên = tiêu đề trang + thao tác (luôn có chuông thông báo), chân header = điều hướng riêng của trang (tab, danh mục…).
// Dính trên cùng khi cuộn, nền kính mờ, hiện viền mảnh khi đã cuộn.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronLeft } from 'lucide-react'
import { useAuth } from '../components/auth'

export function useDaCuon(nguong = 4) {
  const [c, setC] = useState(false)
  useEffect(() => {
    const f = () => setC(window.scrollY > nguong)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [nguong])
  return c
}

export function NutChuong() {
  const { tv } = useAuth()
  const nav = useNavigate()
  const n = tv?.chua_doc || 0
  return (
    <button type="button" className="dau-nut" aria-label={n ? `Thông báo, ${n} chưa đọc` : 'Thông báo'} onClick={() => nav('/thong-bao')}>
      <Bell size={20} strokeWidth={2} />
      {n > 0 && <span className="dau-dem">{n > 9 ? '9+' : n}</span>}
    </button>
  )
}

// lui: true (quay lại trang trước, không có thì về '/'), chuỗi đường dẫn dự phòng, hoặc hàm tự xử lý
// luiDt: nút quay lại chỉ hiện trên điện thoại (trang đã có trong menu bên trái ở máy tính)
export default function DauTrang({ tieu, phu, lui, luiDt, trai, phai, duoi, chuong = true, lop = '' }) {
  const nav = useNavigate()
  const loc = useLocation()
  const cuon = useDaCuon()
  const quayLai = () => {
    if (typeof lui === 'function') return lui()
    if (loc.key !== 'default') return nav(-1)
    nav(typeof lui === 'string' ? lui : '/')
  }
  return (
    <header className={['dau', cuon ? 'cuon' : '', duoi ? 'co-duoi' : '', lop].filter(Boolean).join(' ')}>
      <div className="dau-hang">
        {lui && <button type="button" className={'dau-nut lui' + (luiDt ? ' chi-dt' : '')} aria-label="Quay lại" onClick={quayLai}><ChevronLeft size={22} strokeWidth={2.2} /></button>}
        {trai}
        {tieu != null && (
          <div className="dau-tieu">
            <h1>{tieu}</h1>
            {phu && <span>{phu}</span>}
          </div>
        )}
        <div className="dau-phai">{phai}{chuong && <NutChuong />}</div>
      </div>
      {duoi && <div className="dau-duoi">{duoi}</div>}
    </header>
  )
}
