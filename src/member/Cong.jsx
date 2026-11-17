import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, Download, Gift, Home, LifeBuoy, LogOut, Megaphone, ShoppingBag, UserRound, Shield, ShieldCheck, Store } from 'lucide-react'
import { CaiDatApp } from '../components/caidat'
import { useAuth } from '../components/auth'
import { Brand, Btn, IconBtn, Spinner } from '../components/ui'
import { chuCai } from '../lib/format'
import { rpc } from '../lib/api'
import { LandingPage, DangNhap, DangKy, QuenMatKhau, DatLaiMatKhau, XacThuc, VanBan, TaiApp } from './CongKhai'
import TrangChu from './TrangChu'
import { DsSanPham, CtSanPham } from './SanPham'
import { DsChienDich, CtChienDich } from './ChienDich'
import { LichCuaToi, DatLich } from './LichQuay'
import { UuDai, DsTaiNguyen, CtTaiNguyen, ThongBao, DsHoTro, CtHoTro, Toi } from './Khac'
import { CongQuyTac, QuyTacCongKhai, TrangQuyTac } from './QuyTac'

// Cấu hình công khai (Zalo, FAQ, điều khoản…) — tải 1 lần, dùng chung
let boNhoCK = null
export function useCongKhai() {
  const [ck, setCk] = useState(boNhoCK)
  useEffect(() => { if (!boNhoCK) rpc('fn_cong_khai').then((x) => { boNhoCK = x; setCk(x) }).catch(() => setCk({})) }, [])
  return ck
}

// Điều hướng: nhóm "Làm Affiliate" (việc chính) và "Của tôi"; trên điện thoại Sản phẩm nằm giữa thanh dưới (ô biểu tượng màu thương hiệu)
const MUC = [
  { to: '/', ten: 'Trang chủ', ic: Home, end: true, nhom: 'chinh' },
  { to: '/san-pham', ten: 'Sản phẩm', ic: ShoppingBag, nhom: 'chinh' },
  { to: '/chien-dich', ten: 'Chiến dịch', ic: Megaphone, nhom: 'chinh' },
  { to: '/lich-quay', ten: 'Lịch quay', ic: CalendarDays, nhom: 'chinh' },
  { to: '/uu-dai', ten: 'Ưu đãi của tôi', ic: Gift, nhom: 'toi' },
  { to: '/tai-nguyen', ten: 'Hướng dẫn & tài nguyên', ic: BookOpen, nhom: 'toi' },
  { to: '/thong-bao', ten: 'Thông báo', ic: Bell, chuaDoc: true, nhom: 'toi' },
  { to: '/ho-tro', ten: 'Hỗ trợ', ic: LifeBuoy, nhom: 'toi' },
  { to: '/quy-tac', ten: 'Quy tắc cộng đồng', ic: ShieldCheck, nhom: 'toi' },
  { to: '/toi', ten: 'Tài khoản', ic: UserRound, nhom: 'toi' }
]
const NAV_DUOI = [
  { to: '/', ten: 'Trang chủ', ic: Home, end: true },
  { to: '/chien-dich', ten: 'Chiến dịch', ic: Megaphone },
  { to: '/san-pham', ten: 'Sản phẩm', ic: ShoppingBag, giua: true },
  { to: '/lich-quay', ten: 'Lịch quay', ic: CalendarDays },
  { to: '/toi', ten: 'Tôi', ic: UserRound }
]

function KhungThanhVien({ children }) {
  const { tv, thoat, taiToi } = useAuth()
  const loc = useLocation()
  // Làm mới số thông báo chưa đọc khi đổi trang (nhẹ, tối đa 1 lần/30 giây)
  useEffect(() => {
    const t = Date.now()
    if (!window.__nsTaiToi || t - window.__nsTaiToi > 30000) { window.__nsTaiToi = t; taiToi() }
  }, [loc.pathname, taiToi])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const chuaDoc = tv?.chua_doc || 0
  const muc = (m) => (
    <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => 'muc' + (isActive ? ' on' : '')}>
      <m.ic size={19} strokeWidth={2} /><span className="gian">{m.ten}</span>{m.chuaDoc && chuaDoc > 0 && <span className="dem-nho">{chuaDoc > 99 ? '99+' : chuaDoc}</span>}
    </NavLink>
  )
  return (
    <div className="tv">
      <div className="tv-khung">
        <aside className="tv-sb" aria-label="Menu thành viên">
          <Link to="/" className="brand-sb" aria-label="Trang chủ"><Brand toi={false} /></Link>
          <div className="cuon">
            <div className="nhom-sb">Làm Affiliate</div>
            {MUC.filter((m) => m.nhom === 'chinh').map(muc)}
            <div className="nhom-sb">Của tôi</div>
            {MUC.filter((m) => m.nhom === 'toi').map(muc)}
            <CaiDatApp dienThoai render={(bam) => <button type="button" className="muc cai-app" onClick={bam}><Download size={19} strokeWidth={2} />Tải ứng dụng</button>} />
          </div>
          <div className="the-toi">
            <span className="av sm">{chuCai(tv?.ho_ten)}</span>
            <div className="gian"><b className="cat">{tv?.ho_ten}</b><span className="cat">{tv?.cap_do?.ten || 'Thành viên'} · {tv?.ma}</span></div>
            <IconBtn icon={LogOut} nhan="Đăng xuất" co="xs" kieu="mem" onClick={thoat} />
          </div>
        </aside>
        <main className="tv-main">{children}</main>
      </div>
      <nav className={'tv-nav' + (/^\/san-pham\/[^/]+/.test(loc.pathname) ? ' an' : '')} aria-label="Menu nhanh">
        {NAV_DUOI.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => [m.giua ? 'giua' : '', isActive ? 'on' : ''].filter(Boolean).join(' ')}>
            <span className="nv-ic"><m.ic size={m.giua ? 21 : 20} strokeWidth={m.giua ? 2.3 : 2} /></span>
            <span className="nv-ten">{m.ten}</span>
          </NavLink>
        ))}
      </nav>
      <CongQuyTac />
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
  const congKhai = ['/gioi-thieu', '/dang-ky', '/dang-nhap', '/quen-mat-khau', '/dat-lai-mat-khau', '/xac-thuc', '/dieu-khoan', '/chinh-sach', '/tai-app']
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
        <Route path="/tai-app" element={<TaiApp />} />
      </Routes>
    )
  }
  if (dangKiem) return <div className="tv" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={30} /></div>
  if (ns) return <LaNhanSu ns={ns} thoat={thoat} />
  if (!tv) return loc.pathname === '/' ? <LandingPage /> : loc.pathname === '/quy-tac' ? <QuyTacCongKhai /> : <CanDangNhap />
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
        <Route path="/quy-tac" element={<TrangQuyTac />} />
        <Route path="/ho-tro/:id" element={<CtHoTro />} />
        <Route path="/toi" element={<Toi />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </KhungThanhVien>
  )
}
