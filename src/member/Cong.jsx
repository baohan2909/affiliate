import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, Gift, Home, LifeBuoy, LogOut, Megaphone, ShoppingBag, UserRound, Shield, Store } from 'lucide-react'
import { useAuth } from '../components/auth'
import { Brand, Btn, IconBtn, Spinner } from '../components/ui'
import { chuCai } from '../lib/format'
import { rpc } from '../lib/api'
import { LandingPage, DangNhap, DangKy, QuenMatKhau, DatLaiMatKhau, XacThuc, VanBan } from './CongKhai'
import TrangChu from './TrangChu'
import { DsSanPham, CtSanPham } from './SanPham'
import { DsChienDich, CtChienDich } from './ChienDich'
import { LichCuaToi, DatLich } from './LichQuay'
import { UuDai, DsTaiNguyen, CtTaiNguyen, ThongBao, DsHoTro, CtHoTro, Toi } from './Khac'

// Cấu hình công khai (Zalo, FAQ, điều khoản…) — tải 1 lần, dùng chung
let boNhoCK = null
export function useCongKhai() {
  const [ck, setCk] = useState(boNhoCK)
  useEffect(() => { if (!boNhoCK) rpc('fn_cong_khai').then((x) => { boNhoCK = x; setCk(x) }).catch(() => setCk({})) }, [])
  return ck
}

const MUC = [
  { to: '/', ten: 'Trang chủ', ic: Home, end: true, nav: true },
  { to: '/san-pham', ten: 'Sản phẩm', ic: ShoppingBag, nav: true },
  { to: '/chien-dich', ten: 'Chiến dịch', ic: Megaphone, nav: true },
  { to: '/lich-quay', ten: 'Lịch quay', ic: CalendarDays, nav: true },
  { to: '/uu-dai', ten: 'Ưu đãi của tôi', ic: Gift },
  { to: '/tai-nguyen', ten: 'Tài nguyên', ic: BookOpen },
  { to: '/thong-bao', ten: 'Thông báo', ic: Bell, chuaDoc: true },
  { to: '/ho-tro', ten: 'Hỗ trợ', ic: LifeBuoy },
  { to: '/toi', ten: 'Tôi', ic: UserRound, nav: true }
]

function KhungThanhVien({ children }) {
  const { tv, thoat, taiToi } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  // Làm mới số thông báo chưa đọc khi đổi trang (nhẹ, tối đa 1 lần/30 giây)
  useEffect(() => {
    const t = Date.now()
    if (!window.__nsTaiToi || t - window.__nsTaiToi > 30000) { window.__nsTaiToi = t; taiToi() }
  }, [loc.pathname, taiToi])
  const chuaDoc = tv?.chua_doc || 0
  return (
    <div className="tv">
      <header className="tv-top">
        <Link to="/" className="hang" style={{ gap: 9, flex: 1, minWidth: 0 }}><Brand toi={false} /></Link>
        <IconBtn icon={Bell} nhan="Thông báo" co="sm" onClick={() => nav('/thong-bao')}>{chuaDoc > 0 && <span className="cham-do" />}</IconBtn>
        <IconBtn icon={LifeBuoy} nhan="Hỗ trợ" co="sm" onClick={() => nav('/ho-tro')} />
      </header>
      <div className="tv-khung">
        <aside className="tv-sb" aria-label="Menu thành viên">
          <Link to="/" className="brand-sb"><Brand toi={false} /></Link>
          <div className="cuon">
            {MUC.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => 'muc' + (isActive ? ' on' : '')}>
                <m.ic size={19} strokeWidth={2} />{m.ten}{m.chuaDoc && chuaDoc > 0 && <span className="dem-nho">{chuaDoc > 99 ? '99+' : chuaDoc}</span>}
              </NavLink>
            ))}
          </div>
          <div className="the-toi">
            <span className="av sm" style={{ background: 'var(--ink)', color: '#fff' }}>{chuCai(tv?.ho_ten)}</span>
            <div className="gian"><b className="cat">{tv?.ho_ten}</b><span>{tv?.cap_do?.ten || 'Thành viên'} · {tv?.ma}</span></div>
            <IconBtn icon={LogOut} nhan="Đăng xuất" co="xs" kieu="mem" onClick={thoat} />
          </div>
        </aside>
        <main className="tv-main">{children}</main>
      </div>
      <nav className="tv-nav" aria-label="Menu nhanh">
        <div className="glow hong" style={{ width: 160, height: 160, left: -40, top: -60, opacity: 0.35, filter: 'blur(50px)' }} />
        {MUC.filter((m) => m.nav).map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <m.ic size={20} strokeWidth={2.1} /><span>{m.ten}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function CanDangNhap() {
  const loc = useLocation()
  return <Navigate to={'/dang-nhap?tiep=' + encodeURIComponent(loc.pathname + loc.search)} replace />
}

function LaNhanSu({ ns, thoat }) {
  const laCH = ns.vai_tro === 'cua_hang'
  return (
    <div className="dang-nhap">
      <div className="glow hong" style={{ width: 340, height: 340, right: -120, top: -120, opacity: 0.5 }} />
      <div className="hop-dn cot" style={{ gap: 16, textAlign: 'center', alignItems: 'center' }}>
        <span className="logo-tron" style={{ width: 56, height: 56, background: 'var(--orb)' }}>{laCH ? <Store size={24} /> : <Shield size={24} />}</span>
        <h1 style={{ fontSize: 26, fontWeight: 300 }}>Bạn đang đăng nhập bằng <b>tài khoản {laCH ? 'cửa hàng' : 'nhân sự'}</b></h1>
        <p style={{ color: 'rgba(255,255,255,.7)' }}>{ns.ho_ten} · {ns.ma}. Trang thành viên chỉ dành cho người làm Affiliate.</p>
        <Link className="btn trang lg" to={laCH ? '/cuahang' : '/quantri'}>{laCH ? 'Mở cổng cửa hàng' : 'Mở trang quản trị'}</Link>
        <Btn kieu="vien-sang" icon={LogOut} onClick={thoat}>Đăng xuất</Btn>
      </div>
    </div>
  )
}

export default function CongThanhVien() {
  const { dangKiem, tv, ns, thoat } = useAuth()
  const loc = useLocation()
  const congKhai = ['/gioi-thieu', '/dang-ky', '/dang-nhap', '/quen-mat-khau', '/dat-lai-mat-khau', '/xac-thuc', '/dieu-khoan', '/chinh-sach']
  if (congKhai.some((p) => loc.pathname === p)) {
    return (
      <Routes>
        <Route path="/gioi-thieu" element={<LandingPage />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
        <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />
        <Route path="/xac-thuc" element={<XacThuc />} />
        <Route path="/dieu-khoan" element={<VanBan khoa="dieu_khoan" tieuDe="Điều khoản tham gia" />} />
        <Route path="/chinh-sach" element={<VanBan khoa="chinh_sach" tieuDe="Chính sách dữ liệu cá nhân" />} />
      </Routes>
    )
  }
  if (dangKiem) return <div className="tv" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={30} /></div>
  if (ns) return <LaNhanSu ns={ns} thoat={thoat} />
  if (!tv) return loc.pathname === '/' ? <LandingPage /> : <CanDangNhap />
  return (
    <KhungThanhVien>
      <Routes>
        <Route path="/" element={<TrangChu />} />
        <Route path="/san-pham" element={<DsSanPham />} />
        <Route path="/san-pham/:id" element={<CtSanPham />} />
        <Route path="/chien-dich" element={<DsChienDich />} />
        <Route path="/chien-dich/:id" element={<CtChienDich />} />
        <Route path="/lich-quay" element={<LichCuaToi />} />
        <Route path="/lich-quay/dat" element={<DatLich />} />
        <Route path="/uu-dai" element={<UuDai />} />
        <Route path="/tai-nguyen" element={<DsTaiNguyen />} />
        <Route path="/tai-nguyen/:id" element={<CtTaiNguyen />} />
        <Route path="/thong-bao" element={<ThongBao />} />
        <Route path="/ho-tro" element={<DsHoTro />} />
        <Route path="/ho-tro/:id" element={<CtHoTro />} />
        <Route path="/toi" element={<Toi />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </KhungThanhVien>
  )
}
