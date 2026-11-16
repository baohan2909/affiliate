import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Camera, CheckCheck, Clock, DoorOpen, Eye, EyeOff, KeyRound, LogOut, QrCode, Search, Store, UserPlus, UserX, X } from 'lucide-react'
import { useAuth } from '../components/auth'
import { Bao, Brand, Btn, Empty, Field, IconBtn, KhungTai, LoiTai, Md, Modal, Nhan, Segment, Spinner, TextArea, useToast, useXacNhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { dangNhap, doiMatKhau, emailCuaHang, rpc } from '../lib/api'
import { fmtNgayGio, fmtNgayThu, thuCua } from '../lib/format'
import { NHU_CAU, NEN_TANG, TT_LICH } from '../lib/hang'

function DangNhapCH() {
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
    try { await dangNhap(emailCuaHang(ma), mk); await taiToi() } catch (e2) { bao(/đăng nhập chưa đúng/.test(e2.message) ? 'Mã cửa hàng hoặc mật khẩu chưa đúng.' : e2.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="dang-nhap">
      <div className="glow hong" style={{ width: 380, height: 380, right: -130, top: -150, opacity: 0.5 }} />
      <form className="hop-dn cot" style={{ gap: 18 }} onSubmit={vao}>
        <Brand phu="CỔNG CỬA HÀNG" />
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1.15 }}>Đón thành viên <b style={{ fontWeight: 800 }}>đến quay chụp</b></h1>
          <p style={{ color: 'rgba(255,255,255,.66)', marginTop: 8, fontSize: 14.5 }}>Đăng nhập bằng mã cửa hàng và mật khẩu do bộ phận Affiliate cấp.</p>
        </div>
        <div className="xt-tam cot" style={{ gap: 12, marginTop: 0 }}>
          <Field nhan="Mã cửa hàng" autoFocus autoCapitalize="characters" autoComplete="username" placeholder="VD: CH05016" value={ma} onChange={(e) => setMa(e.target.value.toUpperCase())} />
          <div className="mat-khau">
            <Field nhan="Mật khẩu" type={hien ? 'text' : 'password'} autoComplete="current-password" value={mk} onChange={(e) => setMk(e.target.value)} />
            <IconBtn icon={hien ? EyeOff : Eye} nhan={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} co="sm" kieu="mem" className="hien-mk" onClick={() => setHien(!hien)} />
          </div>
          <Btn kieu="den" co="lg" className="rong" type="submit" loading={dang} orb>Đăng nhập</Btn>
          <p className="nho muted" style={{ textAlign: 'center' }}>Chưa có hoặc quên mật khẩu? Liên hệ bộ phận Affiliate Nón Sơn.</p>
        </div>
        <p className="nho" style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)' }}>Nhân viên văn phòng? <Link to="/quantri" style={{ color: '#FF8CC0', fontWeight: 700 }}>Trang quản trị</Link></p>
      </form>
    </div>
  )
}

// Quét QR bằng camera (tải thư viện khi cần)
function QuetQR({ mo, dong, thay }) {
  const vid = useRef(null)
  const [loi, setLoi] = useState('')
  useEffect(() => {
    if (!mo) return
    let sc = null
    let huy = false
    setLoi('')
    import('qr-scanner').then(({ default: QrScanner }) => {
      if (huy || !vid.current) return
      sc = new QrScanner(vid.current, (r) => { const v = (r?.data || r || '').trim(); if (v) { sc.stop(); thay(v) } }, { returnDetailedScanResult: true, highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' })
      sc.start().catch(() => setLoi('Không mở được camera. Cho phép quyền camera hoặc nhập mã bằng tay.'))
    })
    return () => { huy = true; if (sc) { sc.stop(); sc.destroy() } }
  }, [mo]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal mo={mo} dong={dong} tieuDe="Quét mã QR lịch" moTa="Đưa mã QR trong ứng dụng của thành viên vào khung.">
      <div className="quet"><video ref={vid} playsInline muted /></div>
      {loi && <Bao kieu="loi">{loi}</Bao>}
    </Modal>
  )
}

function TheLichCH({ l, capNhat }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [dang, setDang] = useState('')
  const lam = async (hd, ghiChu) => {
    setDang(hd)
    try { capNhat(await rpc('fn_ch_cap_nhat', { p_id: l.id, p_hanh_dong: hd, p_ghi_chu: ghiChu || null })); bao(hd === 'da_den' ? 'Đã ghi nhận khách đến' : hd === 'hoan_thanh' ? 'Đã hoàn thành buổi quay' : hd === 'khong_den' ? 'Đã báo khách không đến' : 'Đã lưu ghi chú') } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const hoanThanh = async () => {
    const kq = await xn({ tieuDe: 'Hoàn thành buổi quay ' + l.ma + '?', nut: 'Hoàn thành', nhapLyDo: true, nhanLyDo: 'Ghi chú cho bộ phận Affiliate (không bắt buộc)' })
    if (kq) lam('hoan_thanh', kq.ly_do)
  }
  const khongDen = async () => {
    const kq = await xn({ tieuDe: 'Báo khách không đến?', moTa: 'Lịch sẽ chuyển sang Đã hủy (không đến).', nut: 'Xác nhận', nguyHiem: true, nhapLyDo: true, nhanLyDo: 'Ghi chú (không bắt buộc)' })
    if (kq) lam('khong_den', kq.ly_do)
  }
  const ghiChu = async () => {
    const kq = await xn({ tieuDe: 'Ghi chú cửa hàng', nut: 'Lưu', nhapLyDo: true, nhanLyDo: 'Ghi chú', goiYLyDo: l.ghi_chu_cua_hang || '' })
    if (kq) lam('ghi_chu', kq.ly_do)
  }
  const [y, m, d] = l.ngay.split('-')
  return (
    <div className="the-lich">
      <div className="ngay"><small>{thuCua(l.ngay, true)}</small><b>{d}</b><span>Th{Number(m)}/{y.slice(2)}</span></div>
      <div className="gian cot" style={{ gap: 6, minWidth: 0 }}>
        <div className="hang wrap" style={{ gap: 8 }}>
          <h3 className="gian" style={{ minWidth: 150 }}>{l.gio} – {l.gio_ket_thuc} · {l.ho_ten}</h3>
          {l.da_den_luc && l.trang_thai === 'da_xac_nhan' ? <span className="tag" style={{ background: '#EAF0FD', color: '#2E5BC9' }}><i className="cham" style={{ background: '#2E5BC9' }} />Đang ở cửa hàng</span> : <Nhan bang={TT_LICH} ma={l.trang_thai} />}
        </div>
        <p><b>{l.ma}</b> · SĐT đuôi …{l.dien_thoai_cuoi} · {NHU_CAU[l.nhu_cau]} · {l.so_nguoi} người</p>
        {l.san_pham_quan_tam && <p>Sản phẩm quan tâm: <b style={{ color: 'var(--ink)' }}>{l.san_pham_quan_tam}</b></p>}
        {l.ghi_chu && <p>Ghi chú: {l.ghi_chu}</p>}
        {l.kenh?.length > 0 && <p>Kênh: {l.kenh.map((k) => (NEN_TANG[k.nen_tang] || k.nen_tang) + (k.ten_kenh ? ' @' + k.ten_kenh : '')).join(' · ')}</p>}
        {l.ghi_chu_cua_hang && <p style={{ color: 'var(--info)' }}>Cửa hàng ghi: {l.ghi_chu_cua_hang}</p>}
        {l.da_den_luc && <p className="muted">Đến lúc {fmtNgayGio(l.da_den_luc)}</p>}
        {l.trang_thai === 'da_xac_nhan' && (
          <div className="hang wrap" style={{ gap: 8, marginTop: 4 }}>
            {!l.da_den_luc && <Btn co="sm" kieu="den" icon={DoorOpen} loading={dang === 'da_den'} onClick={() => lam('da_den')}>Đã đến</Btn>}
            <Btn co="sm" kieu={l.da_den_luc ? 'den' : 'mem'} icon={CheckCheck} loading={dang === 'hoan_thanh'} onClick={hoanThanh}>Hoàn thành</Btn>
            {!l.da_den_luc && <Btn co="sm" kieu="trong" icon={UserX} onClick={khongDen}>Không đến</Btn>}
            <Btn co="sm" kieu="trong" onClick={ghiChu}>Ghi chú</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function DonKhach({ capNhat }) {
  const bao = useToast()
  const [ma, setMa] = useState('')
  const [l, setL] = useState(null)
  const [quet, setQuet] = useState(false)
  const [dang, setDang] = useState(false)
  const tim = async (v) => {
    const x = (v ?? ma).trim()
    if (!x) return
    setDang(true); setL(null)
    try { setL(await rpc('fn_ch_tim', { p_ma: x })); setMa(x.toUpperCase()) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="cot" style={{ gap: 12 }}>
      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2>Kiểm tra lịch của khách</h2></div>
        <form className="hang" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); tim() }}>
          <label className="input-tron gian"><Search size={17} /><input placeholder="Nhập mã lịch, VD: LQ-000123 hoặc 123" value={ma} onChange={(e) => setMa(e.target.value)} inputMode="text" autoCapitalize="characters" /></label>
          <Btn kieu="den" type="submit" loading={dang}>Tìm</Btn>
        </form>
        <Btn kieu="vien" icon={Camera} onClick={() => setQuet(true)}>Quét mã QR</Btn>
      </div>
      {l && (
        <>
          {l.trang_thai !== 'da_xac_nhan' && l.trang_thai !== 'hoan_thanh' && <Bao kieu="vang">Lịch này đang ở trạng thái <b>{TT_LICH[l.trang_thai]?.ten}</b> — chưa được xác nhận. Liên hệ bộ phận Affiliate trước khi tiếp khách.</Bao>}
          {l.ngay !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) && <Bao kieu="vang">Lịch hẹn vào <b>{fmtNgayThu(l.ngay)}</b>, không phải hôm nay.</Bao>}
          <TheLichCH l={l} capNhat={(moi) => { setL(moi); capNhat(moi) }} />
        </>
      )}
      <QuetQR mo={quet} dong={() => setQuet(false)} thay={(v) => { setQuet(false); const m2 = v.match(/LQ-?\d+/i); tim(m2 ? m2[0] : v) }} />
    </div>
  )
}

function KhachChuaDat() {
  const bao = useToast()
  const [f, setF] = useState({ ten: '', dien_thoai: '', ghi_chu: '' })
  const [dang, setDang] = useState(false)
  const gui = async () => {
    if (!f.ten.trim() && !f.dien_thoai.trim()) { bao('Nhập tên hoặc số điện thoại của khách', 'loi'); return }
    setDang(true)
    try { await rpc('fn_ch_khach_khong_lich', { p: f }); bao('Đã báo bộ phận Affiliate'); setF({ ten: '', dien_thoai: '', ghi_chu: '' }) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the"><h2>Báo khách đến quay chụp nhưng chưa đặt lịch</h2></div>
      <p className="nho muted-2">Bộ phận Affiliate sẽ liên hệ, hướng dẫn khách đặt lịch trên ứng dụng.</p>
      <Field nhan="Tên khách / tên kênh" value={f.ten} onChange={(e) => setF({ ...f, ten: e.target.value })} />
      <Field nhan="Số điện thoại" inputMode="tel" value={f.dien_thoai} onChange={(e) => setF({ ...f, dien_thoai: e.target.value })} />
      <TextArea nhan="Ghi chú" rows={3} value={f.ghi_chu} onChange={(e) => setF({ ...f, ghi_chu: e.target.value })} />
      <Btn kieu="den" icon={UserPlus} loading={dang} onClick={gui}>Gửi báo cáo</Btn>
    </div>
  )
}

function DoiMK({ mo, dong }) {
  const bao = useToast()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [dang, setDang] = useState(false)
  const luu = async () => {
    if (a.length < 8) { bao('Mật khẩu tối thiểu 8 ký tự', 'loi'); return }
    if (a !== b) { bao('Hai lần nhập chưa khớp', 'loi'); return }
    setDang(true)
    try { await doiMatKhau(a); bao('Đã đổi mật khẩu'); setA(''); setB(''); dong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <Modal mo={mo} dong={dong} tieuDe="Đổi mật khẩu cửa hàng" chan={<><Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu</Btn></>}>
      <div className="cot" style={{ gap: 12 }}>
        <Field nhan="Mật khẩu mới" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} />
        <Field nhan="Nhập lại" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />
      </div>
    </Modal>
  )
}

function CongCH() {
  const { thoat } = useAuth()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_ch_tong_quan'), [])
  const [tab, setTab] = useState('hom_nay')
  const [mk, setMk] = useState(false)
  useEffect(() => { const t = setInterval(() => reload(true), 120000); return () => clearInterval(t) }, [reload])
  if (loading && !data) return <div className="ch-app"><div className="ch-noi"><KhungTai /></div></div>
  if (error && !data) return <div className="ch-app"><div className="ch-noi"><LoiTai loi={error} thuLai={reload} /><Btn kieu="trong" icon={LogOut} onClick={thoat}>Đăng xuất</Btn></div></div>
  const capNhat = (moi) => setData((d) => ({ ...d, hom_nay: d.hom_nay.some((x) => x.id === moi.id) ? d.hom_nay.map((x) => (x.id === moi.id ? moi : x)) : d.hom_nay, sap_toi: d.sap_toi.map((x) => (x.id === moi.id ? moi : x)) }))
  const ch = data.cua_hang
  const conLai = data.hom_nay.filter((l) => l.trang_thai === 'da_xac_nhan').length
  return (
    <div className="ch-app">
      <header className="ch-dau">
        <div className="glow hong" style={{ width: 260, height: 260, right: -90, top: -120, opacity: 0.5 }} />
        <div className="hang" style={{ gap: 10 }}>
          <Brand phu="CỔNG CỬA HÀNG" />
          <span style={{ flex: 1 }} />
          <IconBtn icon={KeyRound} nhan="Đổi mật khẩu" co="sm" kieu="kinh" onClick={() => setMk(true)} />
          <IconBtn icon={LogOut} nhan="Đăng xuất" co="sm" kieu="kinh" onClick={thoat} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 300, marginTop: 18, lineHeight: 1.25 }}><b style={{ fontWeight: 800 }}>{ch.ten}</b></h1>
        <p style={{ color: 'rgba(255,255,255,.66)', fontSize: 13.5, marginTop: 4 }}>{ch.ma} · {ch.dia_chi}</p>
        <div className="hang-so" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div className="o-so" style={{ flex: 1, padding: '10px 14px', borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}><b style={{ display: 'block', fontSize: 22 }}>{data.hom_nay.length}</b><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', fontWeight: 600 }}>Lịch hôm nay · còn {conLai}</span></div>
          <div className="o-so" style={{ flex: 1, padding: '10px 14px', borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}><b style={{ display: 'block', fontSize: 22 }}>{data.sap_toi.length}</b><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', fontWeight: 600 }}>Lịch 14 ngày tới</span></div>
        </div>
      </header>
      <div className="ch-noi">
        {!ch.nhan_quay && <Bao kieu="vang">Cửa hàng đang <b>tạm ngừng nhận lịch mới</b>. Các lịch đã xác nhận vẫn hiển thị bên dưới.</Bao>}
        <div style={{ overflowX: 'auto' }}><Segment trang giaTri={tab} onChon={setTab} ds={[{ v: 'hom_nay', t: 'Hôm nay', icon: Clock, dem: conLai }, { v: 'sap_toi', t: '14 ngày tới', icon: CalendarDays }, { v: 'don', t: 'Đón khách', icon: QrCode }, { v: 'bao', t: 'Khách chưa đặt', icon: UserPlus }]} /></div>
        {tab === 'hom_nay' && (data.hom_nay.length === 0 ? <Empty icon={Store} tieuDe="Hôm nay chưa có lịch quay chụp">Lịch đã xác nhận sẽ hiện ở đây.</Empty>
          : <div className="cot" style={{ gap: 10 }}>{data.hom_nay.map((l) => <TheLichCH key={l.id} l={l} capNhat={capNhat} />)}</div>)}
        {tab === 'sap_toi' && (data.sap_toi.length === 0 ? <Empty icon={CalendarDays} tieuDe="Chưa có lịch trong 14 ngày tới" />
          : <div className="cot" style={{ gap: 10 }}>{data.sap_toi.map((l) => <TheLichCH key={l.id} l={l} capNhat={capNhat} />)}</div>)}
        {tab === 'don' && <DonKhach capNhat={capNhat} />}
        {tab === 'bao' && <KhachChuaDat />}
        {data.luu_y && <div className="card"><div className="dau-the"><h2>Lưu ý cho cửa hàng</h2></div><Md chu={data.luu_y.split('\n').map((x) => '- ' + x).join('\n')} className="nho" /></div>}
      </div>
      <DoiMK mo={mk} dong={() => setMk(false)} />
    </div>
  )
}

export default function CongCuaHang() {
  const { dangKiem, ns, tv, thoat } = useAuth()
  useEffect(() => { document.title = 'Cổng cửa hàng · Nón Sơn Affiliate Hub' }, [])
  if (dangKiem) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={30} /></div>
  if (!ns && !tv) return <DangNhapCH />
  if (tv || ns.vai_tro !== 'cua_hang' || !ns.hoat_dong) {
    return (
      <div className="dang-nhap">
        <div className="hop-dn cot" style={{ gap: 14, textAlign: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 300 }}>Tài khoản này <b>không phải tài khoản cửa hàng</b></h1>
          {ns && ns.vai_tro !== 'cua_hang' ? <Link className="btn trang lg" to="/quantri">Mở trang quản trị</Link> : <Link className="btn trang lg" to="/">Về trang thành viên</Link>}
          <Btn kieu="vien-sang" icon={LogOut} onClick={thoat}>Đăng xuất</Btn>
        </div>
      </div>
    )
  }
  return <CongCH />
}

