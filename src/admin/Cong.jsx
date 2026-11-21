import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Layers, ShoppingBag, Megaphone, Gift, CalendarDays, Store, BookOpen, Bell, LifeBuoy, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, Menu, KeyRound, Eye, EyeOff, ArrowRight, MonitorDown, Zap
} from 'lucide-react'
import { CaiDatApp, useManifest } from '../components/caidat'
import { useAuth } from '../components/auth'
import { Brand, Btn, Field, IconBtn, LogoO, Modal, Spinner, useToast } from '../components/ui'
import { useLS } from '../lib/hooks'
import { dangNhap, emailNhanSu, rpc } from '../lib/api'
import { chuCai } from '../lib/format'
import { VAI_TRO } from '../lib/hang'
import TongQuan from './TongQuan'
import { ThanhVien, NhomCapDo } from './ThanhVien'
import SanPham from './SanPham'
import { ChienDich, UuDai } from './ChienDich'
import { LichQuay, CuaHang } from './LichQuay'
import { TaiNguyen, ThongBao, HoTro } from './NoiDung'
import HeThong from './HeThong'
import Soc from './Soc'

// Số việc đang chờ (hiện huy hiệu trên menu) — dùng chung cho cả cổng quản trị
const QtCtx = createContext({ cho: {}, taiCho: () => {} })
export const useQt = () => useContext(QtCtx)

const MUC = [
  { to: '', ten: 'Tổng quan', ic: LayoutDashboard, end: true, nhom: 'Điều hành' },
  { to: 'lich-quay', ten: 'Lịch quay chụp', ic: CalendarDays, dem: (c) => c.lich },
  { to: 'chien-dich', ten: 'Chiến dịch', ic: Megaphone, dem: (c) => (c.dang_ky || 0) + (c.bai_nop || 0) },
  { to: 'ho-tro', ten: 'Hỗ trợ', ic: LifeBuoy, dem: (c) => c.ho_tro },
  { to: 'san-pham', ten: 'Sản phẩm', ic: ShoppingBag, nhom: 'Nội dung' },
  { to: 'tai-nguyen', ten: 'Tài nguyên', ic: BookOpen },
  { to: 'cua-hang', ten: 'Cửa hàng', ic: Store, dem: (c) => c.khach_khong_lich },
  { to: 'thanh-vien', ten: 'Thành viên', ic: Users, nhom: 'Cộng đồng' },
  { to: 'nhom-cap-do', ten: 'Nhóm & cấp độ', ic: Layers },
  { to: 'uu-dai', ten: 'Ưu đãi', ic: Gift },
  { to: 'thong-bao', ten: 'Thông báo', ic: Bell },
  { to: 'soc', ten: 'Sóc Tia Chớp', ic: Zap, nhom: 'Quản trị', chi: 'quan_tri' },
  { to: 'he-thong', ten: 'Hệ thống', ic: Settings, dem: (c, ns) => (ns.vai_tro === 'quan_tri' ? c.thu_loi : 0) }
]
const NAV_DUOI = ['', 'lich-quay', 'chien-dich', 'thanh-vien']

function DangNhapNS() {
  const bao = useToast()
  const { taiToi } = useAuth()
  const [ma, setMa] = useState('')
  const [mk, setMk] = useState('')
  const [hien, setHien] = useState(false)
  const [dang, setDang] = useState(false)
  const vao = async (e) => {
    e.preventDefault()
    if (!ma.trim() || !mk) return
    setDang(true)
    try { await dangNhap(emailNhanSu(ma), mk); await taiToi() } catch (e2) { bao(/đăng nhập chưa đúng/.test(e2.message) ? 'Mã nhân viên hoặc mật khẩu chưa đúng.' : e2.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="dang-nhap">
      <div className="glow hong" style={{ width: 420, height: 420, right: -140, top: -160, opacity: 0.55 }} />
      <div className="glow vang" style={{ width: 220, height: 220, left: -80, bottom: -90, opacity: 0.2 }} />
      <form className="hop-dn cot" style={{ gap: 18 }} onSubmit={vao}>
        <Brand phu="Quản trị" />
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1.15 }}>Đăng nhập <b style={{ fontWeight: 800 }}>quản trị</b></h1>
          <p style={{ color: 'rgba(255,255,255,.66)', marginTop: 8, fontSize: 14.5 }}>Dành cho đội Affiliate Nón Sơn. Dùng mã nhân viên của bạn.</p>
        </div>
        <div className="xt-tam cot" style={{ gap: 12, marginTop: 0 }}>
          <Field nhan="Mã nhân viên" autoFocus autoCapitalize="characters" autoComplete="username" placeholder="VD: NS00490" value={ma} onChange={(e) => setMa(e.target.value.toUpperCase())} />
          <div className="mat-khau">
            <Field nhan="Mật khẩu" type={hien ? 'text' : 'password'} autoComplete="current-password" value={mk} onChange={(e) => setMk(e.target.value)} />
            <IconBtn icon={hien ? EyeOff : Eye} nhan={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} co="sm" kieu="mem" className="hien-mk" onClick={() => setHien(!hien)} />
          </div>
          <Btn kieu="den" co="lg" className="rong" type="submit" loading={dang} orb>Đăng nhập</Btn>
          <p className="nho muted" style={{ textAlign: 'center' }}>Quên mật khẩu? Liên hệ quản trị cấp cao để được cấp lại.</p>
        </div>
        <p className="nho" style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)' }}>Cửa hàng? <Link to="/cuahang" style={{ color: '#FF8CC0', fontWeight: 700 }}>Vào cổng cửa hàng</Link></p>
      </form>
    </div>
  )
}

function DoiMatKhau({ mo, dong }) {
  const bao = useToast()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [dang, setDang] = useState(false)
  const luu = async () => {
    if (a.length < 8) { bao('Mật khẩu tối thiểu 8 ký tự', 'loi'); return }
    if (a !== b) { bao('Hai lần nhập chưa khớp', 'loi'); return }
    setDang(true)
    try { const { doiMatKhau } = await import('../lib/api'); await doiMatKhau(a); bao('Đã đổi mật khẩu'); setA(''); setB(''); dong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <Modal mo={mo} dong={dong} tieuDe="Đổi mật khẩu" chan={<><Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu</Btn></>}>
      <div className="cot" style={{ gap: 12 }}>
        <Field nhan="Mật khẩu mới" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} goiY="Tối thiểu 8 ký tự, nên có chữ hoa, chữ thường và số." />
        <Field nhan="Nhập lại" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />
      </div>
    </Modal>
  )
}

function Khung({ ns, children }) {
  const { thoat } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const [gon, setGon] = useLS('ns-aff-sb-gon', false)
  const [cho, setCho] = useState({})
  const [moMenu, setMoMenu] = useState(false)
  const [moMk, setMoMk] = useState(false)
  const taiCho = useCallback(() => { rpc('fn_qt_tong_quan').then((d) => setCho({ ...d.cho, _tq: d })).catch(() => {}) }, [])
  useEffect(() => {
    const t = Date.now()
    if (!window.__nsQtCho || t - window.__nsQtCho > 45000) { window.__nsQtCho = t; taiCho() }
  }, [loc.pathname, taiCho])
  useEffect(() => { setMoMenu(false) }, [loc.pathname])
  // Mục chỉ dành cho một vai trò; khi ẩn thì nhãn nhóm chuyển sang mục kế tiếp
  const muc = []
  let nhomCho = null
  for (const m of MUC) {
    if (m.chi && m.chi !== ns.vai_tro) { nhomCho = nhomCho || m.nhom; continue }
    muc.push(nhomCho && !m.nhom ? { ...m, nhom: nhomCho } : m)
    nhomCho = null
  }
  const den = (m) => '/quantri' + (m.to ? '/' + m.to : '')
  const soDem = (m) => (m.dem ? m.dem(cho, ns) || 0 : 0)
  const hienTai = MUC.find((m) => (m.to ? loc.pathname.startsWith('/quantri/' + m.to) : loc.pathname === '/quantri' || loc.pathname === '/quantri/'))
  return (
    <QtCtx.Provider value={{ cho, taiCho, ns }}>
      <div className="admin">
        <aside className={'sidebar' + (gon ? ' gon' : '')} aria-label="Menu quản trị">
          <div className="glow hong" style={{ width: 220, height: 220, left: -90, top: -90, opacity: 0.4 }} />
          <div className="sb-brand">
            <LogoO co={38} />
            <div className="an-gon"><b>NS Affiliate</b><span>Quản trị Nón Sơn</span></div>
            <button type="button" className="sb-gon" onClick={() => setGon(!gon)} aria-label={gon ? 'Mở rộng menu' : 'Thu gọn menu'}>{gon ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
          </div>
          <div className="sb-cuon">
            {muc.map((m) => (
              <div key={m.to} style={{ display: 'contents' }}>
                {m.nhom && <div className="nav-nhom an-gon">{m.nhom}</div>}
                <NavLink to={den(m)} end={m.end} title={m.ten} className={({ isActive }) => 'nav-item' + (isActive ? ' on' : '')}>
                  <m.ic size={19} strokeWidth={2} /><span className="an-gon">{m.ten}</span>
                  {soDem(m) > 0 && <span className="badge an-gon">{soDem(m) > 99 ? '99+' : soDem(m)}</span>}
                </NavLink>
              </div>
            ))}
            <CaiDatApp ten="NS Affiliate · Quản trị" render={(bam) => (
              <button type="button" className="nav-item cai-app" title="Cài ứng dụng quản trị" onClick={bam}><MonitorDown size={19} strokeWidth={2} /><span className="an-gon">Cài ứng dụng</span></button>
            )} />
          </div>
          <div className="sb-user">
            <span className="av">{chuCai(ns.ho_ten)}</span>
            <div className="gian an-gon" style={{ minWidth: 0 }}><b className="cat">{ns.ho_ten}</b><span>{ns.ma} · {VAI_TRO[ns.vai_tro]}</span></div>
            <IconBtn icon={KeyRound} nhan="Đổi mật khẩu" co="xs" kieu="toi" className="an-gon" onClick={() => setMoMk(true)} />
            <IconBtn icon={LogOut} nhan="Đăng xuất" co="xs" kieu="toi" onClick={thoat} />
          </div>
        </aside>

        <header className="topbar">
          <LogoO co={36} />
          <span className="ten cat">{hienTai?.ten || 'Quản trị'}</span>
          <IconBtn icon={Bell} nhan="Hỗ trợ đang chờ" co="sm" onClick={() => nav('/quantri/ho-tro')}>{cho.ho_tro > 0 && <span className="cham-do" />}</IconBtn>
          <IconBtn icon={Menu} nhan="Menu" co="sm" onClick={() => setMoMenu(true)} />
        </header>

        <main className="admin-main">{children}</main>

        <nav className="bottom-nav" aria-label="Menu nhanh">
          <div className="glow hong" style={{ width: 160, height: 160, left: -40, top: -60, opacity: 0.35, filter: 'blur(50px)' }} />
          {NAV_DUOI.map((to) => { const m = MUC.find((x) => x.to === to); return (
            <NavLink key={to} to={den(m)} end={m.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              <m.ic size={20} strokeWidth={2.1} /><span>{m.ten.split(' ')[0] === 'Lịch' ? 'Lịch' : m.ten.split(' ')[0]}</span>
              {soDem(m) > 0 && <span className="badge">{soDem(m) > 99 ? '99+' : soDem(m)}</span>}
            </NavLink>) })}
          <button type="button" onClick={() => setMoMenu(true)}><Menu size={20} /><span>Thêm</span></button>
        </nav>

        <Modal mo={moMenu} dong={() => setMoMenu(false)} tieuDe="Menu quản trị" moTa={`${ns.ho_ten} · ${VAI_TRO[ns.vai_tro]}`}>
          <div className="cot" style={{ gap: 6 }}>
            {muc.map((m) => (
              <Link key={m.to} to={den(m)} className="o-cho">
                <span className="so" style={{ color: 'var(--ink)' }}><m.ic size={18} /></span>
                <span className="gian">{m.ten}</span>
                {soDem(m) > 0 ? <span className="tag" style={{ background: '#FDE6F1', color: '#A3004F' }}>{soDem(m)}</span> : <ArrowRight size={16} className="muted" />}
              </Link>
            ))}
            <CaiDatApp ten="NS Affiliate · Quản trị" render={(bam) => <Btn kieu="den" icon={MonitorDown} className="rong" style={{ marginTop: 8 }} onClick={bam}>Cài ứng dụng quản trị</Btn>} />
            <div className="hang" style={{ gap: 8, marginTop: 8 }}>
              <Btn kieu="vien" className="gian" icon={KeyRound} onClick={() => { setMoMenu(false); setMoMk(true) }}>Đổi mật khẩu</Btn>
              <Btn kieu="trong" className="gian" icon={LogOut} onClick={thoat}>Đăng xuất</Btn>
            </div>
          </div>
        </Modal>
        <DoiMatKhau mo={moMk} dong={() => setMoMk(false)} />
      </div>
    </QtCtx.Provider>
  )
}

export default function CongQuanTri() {
  const { dangKiem, ns, tv, thoat } = useAuth()
  useManifest('manifest-quantri.webmanifest')
  useEffect(() => { document.title = 'Quản trị · NS Affiliate' }, [])
  if (dangKiem) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={30} /></div>
  if (!ns && !tv) return <DangNhapNS />
  if (tv || !ns.hoat_dong || ns.vai_tro === 'cua_hang') {
    return (
      <div className="dang-nhap">
        <div className="glow hong" style={{ width: 340, height: 340, right: -120, top: -120, opacity: 0.5 }} />
        <div className="hop-dn cot" style={{ gap: 14, textAlign: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 300 }}>Tài khoản này <b>không có quyền quản trị</b></h1>
          <p style={{ color: 'rgba(255,255,255,.7)' }}>{ns?.vai_tro === 'cua_hang' ? 'Tài khoản cửa hàng dùng cổng cửa hàng.' : ns && !ns.hoat_dong ? 'Tài khoản đã bị khóa.' : 'Bạn đang đăng nhập bằng tài khoản thành viên.'}</p>
          {ns?.vai_tro === 'cua_hang' ? <Link className="btn trang lg" to="/cuahang">Mở cổng cửa hàng</Link> : <Link className="btn trang lg" to="/">Về trang thành viên</Link>}
          <Btn kieu="vien-sang" icon={LogOut} onClick={thoat}>Đăng xuất</Btn>
        </div>
      </div>
    )
  }
  return (
    <Khung ns={ns}>
      <Routes>
        <Route index element={<TongQuan />} />
        <Route path="thanh-vien" element={<ThanhVien />} />
        <Route path="nhom-cap-do" element={<NhomCapDo />} />
        <Route path="san-pham" element={<SanPham />} />
        <Route path="chien-dich" element={<ChienDich />} />
        <Route path="uu-dai" element={<UuDai />} />
        <Route path="lich-quay" element={<LichQuay />} />
        <Route path="cua-hang" element={<CuaHang />} />
        <Route path="tai-nguyen" element={<TaiNguyen />} />
        <Route path="thong-bao" element={<ThongBao />} />
        <Route path="ho-tro" element={<HoTro />} />
        <Route path="he-thong" element={<HeThong />} />
        {ns.vai_tro === 'quan_tri' && <Route path="soc" element={<Soc />} />}
        <Route path="*" element={<Navigate to="/quantri" replace />} />
      </Routes>
    </Khung>
  )
}
