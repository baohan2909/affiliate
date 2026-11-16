import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CalendarDays, ChevronDown, Eye, EyeOff, Megaphone, Plus, ShoppingBag, Sparkles, Trash2, Users, MailCheck, KeyRound, CircleAlert, Percent } from 'lucide-react'
import { Brand, Btn, Chon, Field, IconBtn, Bao, Spinner, ThanhTienDo, Chips, MaQR, useToast } from '../components/ui'
import { useAuth } from '../components/auth'
import { dangNhap, rpc, taiKhoan } from '../lib/api'
import { NEN_TANG } from '../lib/hang'
import { useCongKhai } from './Cong'

const IC_QL = [ShoppingBag, CalendarDays, Megaphone, Users]

function NutZalo({ zalo, sang }) {
  if (!zalo?.link) return <span className={sang ? 'nho' : 'nho muted'} style={sang ? { color: 'rgba(255,255,255,.75)' } : undefined}>Link nhóm Zalo sẽ được cập nhật sớm.</span>
  return <a className="btn trang" href={zalo.link} target="_blank" rel="noreferrer">Vào nhóm Zalo</a>
}

export function LandingPage() {
  const ck = useCongKhai()
  const gt = ck?.gioi_thieu || {}
  // Tiêu đề: dùng | để xuống dòng — dòng đầu chữ mảnh, các dòng sau chữ đậm ánh hồng–champagne
  const dong = String(gt.tieu_de || 'Cùng Nón Sơn|Phát triển thu nhập|Từ tiếp thị liên kết').split('|').map((x) => x.trim()).filter(Boolean)
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="nen-loang" aria-hidden="true" />
        <div className="lp-wrap">
          <div className="bong-cum" aria-hidden="true"><span className="bong-tron b1" /><span className="bong-tron b2" /></div>
          <nav className="lp-nav">
            <Brand />
            <span className="gian" />
            <Link to="/dang-nhap" className="btn vien-sang sm">Đăng nhập</Link>
          </nav>
          <div className="lp-hero-noi">
            <div>
              <p className="eyebrow sang">Cộng đồng Affiliate chính thức</p>
              <h1 className="hero-chu" aria-label={dong.join(' ')}>
                {dong.length > 2 && <span className="d1">{dong[0]}</span>}
                {dong.length > 1 && <span className="d2">{dong[dong.length - 2]}</span>}
                <span className="d3">{dong[dong.length - 1]}</span>
              </h1>
              <div className="nut">
                <Link to="/dang-ky" className="btn den lg co-orb">Đăng ký thành viên<span className="orb"><ArrowRight size={17} strokeWidth={2.6} /></span></Link>
                <Link to="/dang-nhap" className="btn vien-sang lg">Tôi đã có tài khoản</Link>
              </div>
              <p className="nho" style={{ color: 'rgba(255,255,255,.55)', marginTop: 14 }}>Miễn phí · Dành cho cả người mới bắt đầu</p>
            </div>
            <div className="lp-the-noi troi">
              {[
                ['Sản phẩm chính thức', 'Top bán chạy, link sản phẩm, ảnh & video', ShoppingBag],
                ['Hoa hồng hấp dẫn đến 10%', 'Theo từng sản phẩm và chương trình', Percent],
                ['Chiến dịch & ưu đãi riêng', 'Theo nhóm và cấp độ thành viên', Sparkles]
              ].map(([t, m, Ic]) => (
                <div key={t} className="dong"><span className="ic"><Ic size={18} /></span><div><b>{t}</b><span>{m}</span></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="lp-wrap">
        <section className="lp-muc">
          <p className="eyebrow">Quyền lợi thành viên</p>
          <h2 style={{ marginTop: 8 }}>Nón Sơn <b>đồng hành</b> cùng bạn</h2>
          <div className="lp-luoi">
            {(gt.quyen_loi || []).map((q, i) => {
              const Ic = IC_QL[i % IC_QL.length]
              return <div key={i} className="lp-ql"><span className="ic"><Ic size={21} /></span><h3>{q.tieu_de}</h3><p>{q.mo_ta}</p></div>
            })}
          </div>
        </section>

        <section className="lp-muc">
          <p className="eyebrow">Bắt đầu trong 3 bước</p>
          <h2 style={{ marginTop: 8 }}>Từ <b>đăng ký</b> đến <b>video đầu tiên</b></h2>
          <div className="lp-buoc">
            <div className="b"><div className="so">01</div><h3>Đăng ký thành viên</h3><p>Tạo tài khoản miễn phí trong 2 bước, chọn kinh nghiệm của bạn.</p></div>
            <div className="b"><div className="so">02</div><h3>Chọn sản phẩm</h3><p>Xem Top sản phẩm, lấy link gốc và tài nguyên hình ảnh chính thức.</p></div>
            <div className="b"><div className="so">03</div><h3>Làm nội dung</h3><p>Quay video, đặt lịch đến cửa hàng nếu cần và gắn link tiếp thị của bạn.</p></div>
          </div>
        </section>

        <section className="lp-muc">
          <div className="the-zalo">
            <span className="ic">Zalo</span>
            <div className="gian"><b>{ck?.zalo?.ten_nhom || 'Cộng đồng Affiliate Nón Sơn'}</b><span>Trao đổi kinh nghiệm, cập nhật chương trình mới mỗi ngày.</span>{ck?.zalo?.qr && <span className="goi-y-qr">Quét mã QR bằng Zalo hoặc bấm nút để vào nhóm.</span>}</div>
            <NutZalo zalo={ck?.zalo} sang />
            {ck?.zalo?.qr && <img className="qr-zalo" src={ck.zalo.qr} alt="Mã QR nhóm Zalo" loading="lazy" />}
          </div>
        </section>

        {(ck?.faq || []).length > 0 && (
          <section className="lp-muc lp-faq">
            <p className="eyebrow">Câu hỏi thường gặp</p>
            <h2 style={{ marginTop: 8, marginBottom: 10 }}>Bạn <b>thắc mắc</b>?</h2>
            {ck.faq.map((f, i) => <details key={i}><summary>{f.h}<ChevronDown size={18} /></summary><p>{f.d}</p></details>)}
          </section>
        )}
        <footer className="lp-chan">
          © Nón Sơn · <Link to="/dieu-khoan">Điều khoản</Link> · <Link to="/chinh-sach">Chính sách dữ liệu</Link> · <a href="https://nonson.vn" target="_blank" rel="noreferrer">nonson.vn</a>
        </footer>
      </div>
    </div>
  )
}

// ---------- Khung trang tài khoản ----------
function KhungXT({ tieuDe, phu, children, phai, chan }) {
  return (
    <div className="xt">
      <div className="nen-loang" aria-hidden="true"><span className="bong-tron b1" /><span className="bong-tron b2" /></div>
      <div className="xt-dau"><Link to="/" aria-label="Trang chủ"><Brand /></Link>{phai}</div>
      <div className="xt-hop">
        <h1>{tieuDe}</h1>
        {phu && <p className="phu">{phu}</p>}
        <div className="xt-tam">{children}</div>
        {chan && <div className="xt-chan">{chan}</div>}
      </div>
    </div>
  )
}

function OMatKhau({ nhan = 'Mật khẩu', value, onChange, autoComplete = 'current-password', goiY }) {
  const [hien, setHien] = useState(false)
  return (
    <div className="mat-khau">
      <Field nhan={nhan} batBuoc type={hien ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} goiY={goiY} />
      <IconBtn className="hien-mk" icon={hien ? EyeOff : Eye} nhan={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} kieu="mem" co="sm" onClick={() => setHien(!hien)} />
    </div>
  )
}

export function DangNhap() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { tv, ns, dangKiem } = useAuth()
  const [email, setEmail] = useState('')
  const [mk, setMk] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const tiep = sp.get('tiep') || '/'
  useEffect(() => { if (!dangKiem && (tv || ns)) nav(tiep, { replace: true }) }, [tv, ns, dangKiem, nav, tiep])
  const gui = async (e) => {
    e.preventDefault(); setLoi('')
    if (!email.trim() || !mk) { setLoi('Nhập email và mật khẩu.'); return }
    setDang(true)
    try { await dangNhap(email, mk) } catch (er) { setLoi(er.message === 'Thông tin đăng nhập chưa đúng.' ? 'Email hoặc mật khẩu chưa đúng.' : er.message); setDang(false) }
  }
  return (
    <KhungXT tieuDe={<>Chào mừng <b>trở lại</b></>} phu="Đăng nhập để xem sản phẩm, chiến dịch và lịch quay chụp của bạn."
      phai={<Link to="/dang-ky" className="btn vien-sang sm">Đăng ký</Link>}
      chan={<>Chưa có tài khoản? <Link to="/dang-ky">Đăng ký miễn phí</Link></>}>
      <form className="cot" onSubmit={gui}>
        <Field nhan="Email" batBuoc type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <OMatKhau value={mk} onChange={(e) => setMk(e.target.value)} />
        {loi && <Bao kieu="loi">{loi}</Bao>}
        <Btn kieu="den" co="lg" className="rong" type="submit" loading={dang}>Đăng nhập</Btn>
        <Link to="/quen-mat-khau" className="nho" style={{ textAlign: 'center', fontWeight: 700 }}>Quên mật khẩu?</Link>
      </form>
    </KhungXT>
  )
}

const KENH_MOI = { nen_tang: 'tiktok', link: '', nguoi_theo_doi: '' }

export function DangKy() {
  const ck = useCongKhai()
  const nav = useNavigate()
  const bao = useToast()
  const { taiToi } = useAuth()
  const [buoc, setBuoc] = useState(0)
  const [f, setF] = useState({ email: '', mat_khau: '', mat_khau2: '', ho_ten: '', dien_thoai: '', ngay_sinh: '', tinh_thanh: '', kinh_nghiem: 'moi', shopee_aff: '', kenh: [{ ...KENH_MOI }], dong_y: false, web: '' })
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const dat = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const datKenh = (i, k, v) => setF((x) => ({ ...x, kenh: x.kenh.map((y, j) => (j === i ? { ...y, [k]: v } : y)) }))

  const kiem = () => {
    if (buoc === 0) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Email không hợp lệ.'
      if (f.mat_khau.length < 8) return 'Mật khẩu tối thiểu 8 ký tự.'
      if (f.mat_khau !== f.mat_khau2) return 'Mật khẩu nhập lại chưa khớp.'
    }
    if (buoc === 1) {
      if (f.ho_ten.trim().length < 2) return 'Vui lòng nhập họ và tên.'
      if (!/^0\d{9}$/.test(f.dien_thoai.replace(/\D/g, ''))) return 'Số điện thoại cần 10 số, bắt đầu bằng 0.'
      if (!f.tinh_thanh) return 'Chọn tỉnh/thành bạn đang sống.'
      if (!f.dong_y) return 'Bạn cần đồng ý Điều khoản và Chính sách dữ liệu.'
    }
    return ''
  }
  const tiep = async () => {
    const l = kiem(); setLoi(l)
    if (l) return
    if (buoc < 1) { setBuoc(1); return }
    setDang(true)
    try {
      const kq = await taiKhoan('dang_ky', {
        email: f.email.trim(), mat_khau: f.mat_khau, ho_ten: f.ho_ten, dien_thoai: f.dien_thoai.replace(/\D/g, ''), ngay_sinh: f.ngay_sinh || null,
        tinh_thanh: f.tinh_thanh, kinh_nghiem: f.kinh_nghiem, shopee_aff: f.kinh_nghiem === 'co_kinh_nghiem' ? f.shopee_aff : '',
        kenh: f.kenh.filter((k) => k.link.trim()), dong_y: f.dong_y, web: f.web
      })
      await dangNhap(f.email.trim(), f.mat_khau)
      await taiToi()
      bao(`Chào mừng ${f.ho_ten.trim().split(' ').pop()}! Mã thành viên của bạn: ${kq.ma}.${ck?.bat_buoc_xac_thuc ? ' Kiểm tra email để xác nhận tài khoản.' : ''}`, 'hong', { ms: 6000 })
      nav('/', { replace: true })
    } catch (e) { setLoi(e.message); setDang(false) }
  }
  const tinh = (ck?.tinh_thanh || []).map((t) => ({ v: t, t }))
  return (
    <KhungXT tieuDe={<>Tham gia <b>Affiliate Hub</b></>} phu="Miễn phí, chỉ mất 2 phút. Người mới bắt đầu cũng được hướng dẫn từng bước."
      phai={<Link to="/dang-nhap" className="btn vien-sang sm">Đăng nhập</Link>}
      chan={<>Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></>}>
      <div className="cot" style={{ gap: 14 }}>
        <ThanhTienDo pct={((buoc + 1) / 2) * 100} nhan={['Tài khoản đăng nhập', 'Thông tin của bạn'][buoc]} so={<b>{buoc + 1}/2</b>} />
        <input className="bay" tabIndex={-1} autoComplete="off" value={f.web} onChange={(e) => dat('web', e.target.value)} aria-hidden="true" />
        {buoc === 0 && <>
          <Field nhan="Email" batBuoc type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => dat('email', e.target.value)} goiY="Dùng để đăng nhập và nhận thông báo chính thức" />
          <OMatKhau nhan="Mật khẩu" value={f.mat_khau} onChange={(e) => dat('mat_khau', e.target.value)} autoComplete="new-password" goiY="Tối thiểu 8 ký tự" />
          <OMatKhau nhan="Nhập lại mật khẩu" value={f.mat_khau2} onChange={(e) => dat('mat_khau2', e.target.value)} autoComplete="new-password" />
        </>}
        {buoc === 1 && <>
          <Field nhan="Họ và tên" batBuoc autoComplete="name" value={f.ho_ten} onChange={(e) => dat('ho_ten', e.target.value)} />
          <Field nhan="Số điện thoại" batBuoc type="tel" inputMode="tel" autoComplete="tel" value={f.dien_thoai} onChange={(e) => dat('dien_thoai', e.target.value)} />
          <Field nhan="Ngày sinh" type="date" value={f.ngay_sinh} onChange={(e) => dat('ngay_sinh', e.target.value)} />
          <Chon nhan="Tỉnh / thành đang sống" batBuoc ds={tinh} giaTri={f.tinh_thanh} onChon={(v) => dat('tinh_thanh', v)} tim />
          <span className="nhan-nhom" style={{ marginTop: 6 }}>Kinh nghiệm làm Affiliate</span>
          <Chips ds={[{ v: 'moi', t: 'Người mới bắt đầu' }, { v: 'co_kinh_nghiem', t: 'Đã có kinh nghiệm' }]} giaTri={f.kinh_nghiem} onChon={(v) => dat('kinh_nghiem', v)} tick />
          {f.kinh_nghiem === 'moi' && <Bao kieu="ok">Không sao cả! Trang chủ của bạn sẽ có lộ trình 5 bước và bài hướng dẫn từ cơ bản.</Bao>}
          {f.kinh_nghiem === 'co_kinh_nghiem' && <>
            <Field nhan="Tài khoản Shopee Affiliate (tên hoặc ID)" value={f.shopee_aff} onChange={(e) => dat('shopee_aff', e.target.value)} />
            <span className="nhan-nhom" style={{ marginTop: 4 }}>Kênh tiếp thị của bạn</span>
            {f.kenh.map((k, i) => (
              <div key={i} className="cot" style={{ gap: 8, padding: 12, borderRadius: 22, background: 'var(--soft)' }}>
                <div className="hang" style={{ gap: 8 }}>
                  <div className="gian"><Chon kieu="tron" ds={Object.entries(NEN_TANG).filter(([v]) => v !== 'shopee').map(([v, t]) => ({ v, t }))} giaTri={k.nen_tang} onChon={(v) => datKenh(i, 'nen_tang', v)} /></div>
                  {f.kenh.length > 1 && <IconBtn icon={Trash2} nhan="Bỏ kênh" co="sm" onClick={() => dat('kenh', f.kenh.filter((_, j) => j !== i))} />}
                </div>
                <Field kieu="gon" nhan="Link kênh" inputMode="url" placeholder="https://" value={k.link} onChange={(e) => datKenh(i, 'link', e.target.value)} />
                <Field kieu="gon" nhan="Số người theo dõi (ước lượng)" inputMode="numeric" value={k.nguoi_theo_doi} onChange={(e) => datKenh(i, 'nguoi_theo_doi', e.target.value)} />
              </div>
            ))}
            {f.kenh.length < 5 && <Btn kieu="vien" co="sm" icon={Plus} onClick={() => dat('kenh', [...f.kenh, { ...KENH_MOI }])}>Thêm kênh</Btn>}
          </>}
          <label className="o-dong-y" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={f.dong_y} onChange={(e) => dat('dong_y', e.target.checked)} />
            <span>Tôi đồng ý <Link to="/dieu-khoan" target="_blank">Điều khoản tham gia</Link> và <Link to="/chinh-sach" target="_blank">Chính sách dữ liệu cá nhân</Link> của Nón Sơn.</span>
          </label>
        </>}
        {loi && <Bao kieu="loi">{loi}</Bao>}
        <div className="hang" style={{ gap: 10 }}>
          {buoc > 0 && <Btn kieu="mem" co="lg" onClick={() => { setLoi(''); setBuoc(buoc - 1) }} disabled={dang}>Quay lại</Btn>}
          <Btn kieu="den" co="lg" className="gian" loading={dang} onClick={tiep}>{buoc < 1 ? 'Tiếp tục' : 'Hoàn tất đăng ký'}</Btn>
        </div>
      </div>
    </KhungXT>
  )
}

export function QuenMatKhau() {
  const [email, setEmail] = useState('')
  const [xong, setXong] = useState(false)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const gui = async (e) => {
    e.preventDefault(); setLoi('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setLoi('Email không hợp lệ.'); return }
    setDang(true)
    try { await rpc('fn_quen_mat_khau', { p_email: email.trim() }); setXong(true) } catch (er) { setLoi(er.message) } finally { setDang(false) }
  }
  return (
    <KhungXT tieuDe={<>Quên <b>mật khẩu</b></>} phu="Nhập email đã đăng ký, chúng tôi gửi liên kết tạo mật khẩu mới."
      chan={<Link to="/dang-nhap">Quay lại đăng nhập</Link>}>
      {xong
        ? <div className="cot" style={{ alignItems: 'center', textAlign: 'center', gap: 12, padding: '10px 0' }}>
            <span className="logo-tron" style={{ width: 56, height: 56, background: 'var(--orb)' }}><MailCheck size={24} /></span>
            <b style={{ fontSize: 17 }}>Đã gửi hướng dẫn</b>
            <p className="muted-2 nho">Nếu email <b>{email}</b> đã đăng ký, bạn sẽ nhận thư trong vài phút. Kiểm tra cả mục Spam/Quảng cáo. Liên kết có hiệu lực 2 giờ.</p>
          </div>
        : <form className="cot" onSubmit={gui}>
            <Field nhan="Email" batBuoc type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {loi && <Bao kieu="loi">{loi}</Bao>}
            <Btn kieu="den" co="lg" className="rong" type="submit" loading={dang}>Gửi liên kết</Btn>
          </form>}
    </KhungXT>
  )
}

export function DatLaiMatKhau() {
  const [sp] = useSearchParams()
  const ma = sp.get('ma') || ''
  const [mk, setMk] = useState('')
  const [mk2, setMk2] = useState('')
  const [xong, setXong] = useState(false)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const gui = async (e) => {
    e.preventDefault(); setLoi('')
    if (mk.length < 8) { setLoi('Mật khẩu tối thiểu 8 ký tự.'); return }
    if (mk !== mk2) { setLoi('Mật khẩu nhập lại chưa khớp.'); return }
    setDang(true)
    try { await taiKhoan('dat_lai_mat_khau', { ma, mat_khau: mk }); setXong(true) } catch (er) { setLoi(er.message) } finally { setDang(false) }
  }
  return (
    <KhungXT tieuDe={<>Tạo <b>mật khẩu mới</b></>}>
      {!ma ? <Bao kieu="loi">Liên kết không hợp lệ. Hãy yêu cầu lại tại trang <Link to="/quen-mat-khau">Quên mật khẩu</Link>.</Bao>
        : xong
          ? <div className="cot" style={{ alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <span className="logo-tron" style={{ width: 56, height: 56, background: 'var(--orb)' }}><KeyRound size={24} /></span>
              <b style={{ fontSize: 17 }}>Đã đổi mật khẩu</b>
              <Link to="/dang-nhap" className="btn den lg rong">Đăng nhập</Link>
            </div>
          : <form className="cot" onSubmit={gui}>
              <OMatKhau nhan="Mật khẩu mới" value={mk} onChange={(e) => setMk(e.target.value)} autoComplete="new-password" goiY="Tối thiểu 8 ký tự" />
              <OMatKhau nhan="Nhập lại mật khẩu mới" value={mk2} onChange={(e) => setMk2(e.target.value)} autoComplete="new-password" />
              {loi && <Bao kieu="loi">{loi}</Bao>}
              <Btn kieu="den" co="lg" className="rong" type="submit" loading={dang}>Lưu mật khẩu</Btn>
            </form>}
    </KhungXT>
  )
}

export function XacThuc() {
  const [sp] = useSearchParams()
  const { taiToi, tv } = useAuth()
  const [kq, setKq] = useState(null)
  useEffect(() => {
    const ma = sp.get('ma')
    if (!ma) { setKq({ loi: 'Liên kết xác nhận không hợp lệ.' }); return }
    rpc('fn_xac_thuc_email', { p_ma: ma }).then((x) => { setKq(x); taiToi() }).catch((e) => setKq({ loi: e.message }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <KhungXT tieuDe={<>Xác nhận <b>email</b></>}>
      {!kq ? <div className="hang" style={{ justifyContent: 'center', padding: 20 }}><Spinner /></div>
        : kq.loi
          ? <div className="cot" style={{ alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <span className="logo-tron" style={{ width: 56, height: 56, background: 'var(--err)' }}><CircleAlert size={24} /></span>
              <p>{kq.loi}</p>
              <Link to={tv ? '/' : '/dang-nhap'} className="btn den lg rong">{tv ? 'Về trang chủ' : 'Đăng nhập'}</Link>
            </div>
          : <div className="cot" style={{ alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <span className="logo-tron" style={{ width: 56, height: 56, background: 'var(--orb)' }}><BadgeCheck size={26} /></span>
              <b style={{ fontSize: 18 }}>Cảm ơn {kq.ho_ten}!</b>
              <p className="muted-2">Email đã được xác nhận. Bạn có thể đăng ký chiến dịch và đặt lịch quay chụp ngay.</p>
              <Link to={tv ? '/' : '/dang-nhap'} className="btn den lg rong">{tv ? 'Vào Affiliate Hub' : 'Đăng nhập'}</Link>
            </div>}
    </KhungXT>
  )
}

export function VanBan({ khoa, tieuDe }) {
  const ck = useCongKhai()
  return (
    <KhungXT tieuDe={<b>{tieuDe}</b>} chan={<Link to="/">Về trang Affiliate Hub</Link>}>
      {!ck ? <Spinner /> : <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)' }}>{ck[khoa] || 'Nội dung đang được cập nhật.'}</div>}
    </KhungXT>
  )
}

export { NutZalo, MaQR }
