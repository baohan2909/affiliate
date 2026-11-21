import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, ExternalLink, GitBranch, History, KeyRound, Link2, PlugZap, RefreshCw, RotateCcw, Save, ShieldCheck, UserPlus } from 'lucide-react'
import { Bao, Btn, Chips, Chon, DongSwitch, Field, KhungTai, LoiTai, MaQR, Modal, Nhan, Segment, TextArea, ThanhTienDo, TrangDau, saoChep, useToast, useXacNhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc, sb, taiKhoan } from '../lib/api'
import { SUPABASE_URL, SUPABASE_KEY } from '../config'
import { fmtNgay, fmtNgayGio, homNay, congNgay, khop, tuongDoi } from '../lib/format'
import { QUY_TAC_GOC } from '../lib/quytac'
import { NOI_DUNG_HT, TIEU_DE_HT } from '../lib/baotri'
import { TT_THU, VAI_TRO } from '../lib/hang'
import { BangDL, DsDong, ONhapAnh, OTim, lamMoiCauHinh } from './chung'
import { useQt } from './Cong'
import { ThanhKenh } from '../components/kenh'
import { goiSoc } from './Soc'

// ================= NHÂN SỰ =================
function MatKhauMoi({ kq, dong }) {
  const bao = useToast()
  return (
    <Modal mo={!!kq} dong={dong} tieuDe="Mật khẩu đăng nhập" moTa="Chỉ hiển thị một lần. Gửi riêng cho người dùng và nhắc đổi sau khi đăng nhập."
      chan={<Btn kieu="den" onClick={dong}>Đã lưu lại</Btn>}>
      {kq && <div className="cot" style={{ gap: 10 }}>
        <div className="dong-tt"><span>Mã đăng nhập</span><b>{kq.ma}</b></div>
        <div className="dong-tt"><span>Mật khẩu</span><span className="hang" style={{ gap: 8 }}><code style={{ fontSize: 17, fontWeight: 800 }}>{kq.mat_khau}</code><button type="button" className="lien-ket nho" onClick={() => saoChep(`Mã: ${kq.ma}\nMật khẩu: ${kq.mat_khau}`).then(() => bao('Đã chép'))}><Copy size={13} />Chép</button></span></div>
        <div className="dong-tt"><span>Đăng nhập tại</span><span>{location.origin + import.meta.env.BASE_URL}quantri</span></div>
      </div>}
    </Modal>
  )
}

function NhanSu() {
  const bao = useToast()
  const xn = useXacNhan()
  const { ns } = useQt()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_nhan_su_ds'), [])
  const [sua, setSua] = useState(null)
  const [dang, setDang] = useState(false)
  const [kq, setKq] = useState(null)
  if (loading && !data) return <KhungTai />
  if (error && !data) return <LoiTai loi={error} thuLai={reload} />
  const luu = async () => {
    setDang(true)
    try {
      if (sua.id) { await rpc('fn_qt_nhan_su_luu', { p_id: sua.id, p: sua }); bao('Đã lưu') }
      else { const r = await taiKhoan('tao_nhan_su', { ma: sua.ma, ho_ten: sua.ho_ten, vai_tro: sua.vai_tro, dien_thoai: sua.dien_thoai, email: sua.email, mat_khau: sua.mat_khau || undefined }); setKq(r) }
      setSua(null); reload(true)
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const datLai = async (n) => {
    if (!(await xn({ tieuDe: 'Cấp lại mật khẩu cho ' + n.ma + '?', moTa: 'Mật khẩu cũ hết hiệu lực ngay.', nut: 'Cấp lại' }))) return
    try { setKq(await taiKhoan('dat_mat_khau_nhan_su', { ma: n.ma })) } catch (e) { bao(e.message, 'loi') }
  }
  const cot = [
    { k: 'ma', t: 'Mã NV', o: (n) => <b>{n.ma}</b> },
    { k: 'ho_ten', t: 'Họ tên' },
    { k: 'vai_tro', t: 'Vai trò', o: (n) => <span className="tag" style={n.vai_tro === 'quan_tri' ? { background: '#14070F', color: '#fff' } : { background: '#FDE6F1', color: '#A3004F' }}>{VAI_TRO[n.vai_tro]}</span> },
    { k: 'dien_thoai', t: 'Điện thoại' },
    { k: 'email', t: 'Email liên hệ' },
    { k: 'dang_nhap_luc', t: 'Đăng nhập', canh: 'giua', o: (n) => (n.dang_nhap_luc ? tuongDoi(n.dang_nhap_luc) : '—') },
    { k: 'hoat_dong', t: 'Trạng thái', canh: 'giua', o: (n) => (n.hoat_dong ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}>Hoạt động</span> : <span className="tag" style={{ background: '#FDECEC', color: '#B93838' }}>Đã khóa</span>) },
    { k: 'tac', t: '', sx: false, canh: 'phai', o: (n) => <Btn co="sm" kieu="mem" icon={KeyRound} onClick={(e) => { e.stopPropagation(); datLai(n) }}>Cấp lại MK</Btn> }
  ]
  return (
    <div className="cot" style={{ gap: 12 }}>
      <div className="toolbar"><Bao kieu="xanh"><b>Quản trị cấp cao</b>: toàn quyền, gồm nhân sự, nhật ký, email hệ thống. <b>Phụ trách Affiliate</b>: vận hành thành viên, chiến dịch, lịch, nội dung.</Bao><div className="day"><Btn kieu="den" icon={UserPlus} onClick={() => setSua({ ma: '', ho_ten: '', vai_tro: 'phu_trach', dien_thoai: '', email: '', mat_khau: '' })}>Thêm nhân sự</Btn></div></div>
      <BangDL cot={cot} ds={data} macDinh="ma" chieu="tang" onBam={(n) => setSua({ ...n })} />
      <Modal mo={!!sua} dong={() => setSua(null)} tieuDe={sua?.id ? 'Sửa nhân sự ' + sua.ma : 'Thêm nhân sự'} chan={<><Btn kieu="trong" onClick={() => setSua(null)}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luu}>{sua?.id ? 'Lưu' : 'Tạo tài khoản'}</Btn></>}>
        {sua && <div className="cot" style={{ gap: 12 }}>
          <div className="luoi-form">
            <Field nhan="Mã nhân viên" batBuoc disabled={!!sua.id} value={sua.ma} onChange={(e) => setSua({ ...sua, ma: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
            <Field nhan="Họ tên" batBuoc value={sua.ho_ten} onChange={(e) => setSua({ ...sua, ho_ten: e.target.value })} />
            <Field nhan="Điện thoại" value={sua.dien_thoai || ''} onChange={(e) => setSua({ ...sua, dien_thoai: e.target.value })} />
            <Field nhan="Email liên hệ" value={sua.email || ''} onChange={(e) => setSua({ ...sua, email: e.target.value })} />
          </div>
          <span className="nhan-nhom" style={{ margin: 0 }}>Vai trò</span>
          <Chips co="sm" ds={[{ v: 'phu_trach', t: VAI_TRO.phu_trach }, { v: 'quan_tri', t: VAI_TRO.quan_tri }]} giaTri={sua.vai_tro} onChon={(v) => setSua({ ...sua, vai_tro: v })} />
          {!sua.id && <Field nhan="Mật khẩu (để trống = tạo ngẫu nhiên)" value={sua.mat_khau} onChange={(e) => setSua({ ...sua, mat_khau: e.target.value })} />}
          {sua.id && sua.id !== ns.id && <DongSwitch nhan="Cho phép đăng nhập" on={sua.hoat_dong} onDoi={(v) => setSua({ ...sua, hoat_dong: v })} />}
        </div>}
      </Modal>
      <MatKhauMoi kq={kq} dong={() => setKq(null)} />
    </div>
  )
}

// ================= CẤU HÌNH =================
function TheCH({ tieuDe, moTa, children, onLuu, khoa }) {
  const [dang, setDang] = useState(false)
  const bao = useToast()
  const luu = async () => {
    setDang(true)
    try { await rpc('fn_qt_cau_hinh_luu', { p_khoa: khoa, p_gia_tri: onLuu() }); lamMoiCauHinh(); bao('Đã lưu ' + tieuDe.toLowerCase()) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the"><div><h2>{tieuDe}</h2>{moTa && <p className="nho muted" style={{ marginTop: 2 }}>{moTa}</p>}</div><Btn co="sm" kieu="den" icon={Save} loading={dang} onClick={luu}>Lưu</Btn></div>
      {children}
    </div>
  )
}

// Trang "đang hoàn thiện": bật thì khách vào trang giới thiệu/đăng ký thấy thông báo, máy chủ từ chối đăng ký mới
function TheBaoTri({ goc }) {
  const bao = useToast()
  const [bt, setBt] = useState({ bat: false, tieu_de: TIEU_DE_HT, noi_dung: NOI_DUNG_HT, ngay: '', ...(goc || {}) })
  const [dang, setDang] = useState(false)
  const dat = (k, x) => setBt({ ...bt, [k]: x })
  const luu = async () => {
    setDang(true)
    try {
      const ban = { bat: !!bt.bat, tieu_de: String(bt.tieu_de || '').trim() || TIEU_DE_HT, noi_dung: String(bt.noi_dung || '').trim() || NOI_DUNG_HT, ngay: bt.ngay || null }
      await rpc('fn_qt_cau_hinh_luu', { p_khoa: 'bao_tri', p_gia_tri: ban })
      setBt(ban); lamMoiCauHinh()
      bao(ban.bat ? 'Đã bật trang "đang hoàn thiện", tạm dừng đăng ký mới' : 'Đã mở lại đăng ký và trang giới thiệu')
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the">
        <div><h2>Trang đang hoàn thiện</h2><p className="nho muted" style={{ marginTop: 2 }}>Khi bật: trang giới thiệu, đăng ký, tải app hiện thông báo; không ai đăng ký mới được. Thành viên cũ vẫn đăng nhập bình thường.</p></div>
        <Btn co="sm" kieu="den" icon={Save} loading={dang} onClick={luu}>Lưu</Btn>
      </div>
      <DongSwitch nhan={bt.bat ? 'Đang tạm dừng đăng ký' : 'Đang mở đăng ký'} moTa={bt.bat ? 'Khách thấy trang "đang hoàn thiện". Tắt rồi bấm Lưu để mở lại.' : 'Bật rồi bấm Lưu để tạm dừng đăng ký.'} on={!!bt.bat} onDoi={(x) => dat('bat', x)} />
      <Field nhan="Tiêu đề" value={bt.tieu_de || ''} onChange={(e) => dat('tieu_de', e.target.value)} />
      <TextArea nhan="Lời nhắn" rows={3} value={bt.noi_dung || ''} onChange={(e) => dat('noi_dung', e.target.value)} />
      <Field nhan="Dự kiến mở đăng ký" type="date" value={bt.ngay || ''} onChange={(e) => dat('ngay', e.target.value)} goiY="Để trống nếu chưa có ngày" />
      <a className="lien-ket nho" href="/gioi-thieu" target="_blank" rel="noreferrer">Xem trang khách đang thấy</a>
    </div>
  )
}

// Quy tắc cộng đồng: sửa nội dung; "phát hành phiên bản mới" thì mọi thành viên phải đọc và đồng ý lại khi mở app
function TheQuyTac({ goc }) {
  const bao = useToast()
  const [qt, setQt] = useState(goc?.muc?.length ? goc : QUY_TAC_GOC)
  const [moi, setMoi] = useState(false)
  const [dang, setDang] = useState(false)
  const { data: tk, reload } = useAsync(() => rpc('fn_qt_quy_tac_thong_ke'), [])
  const dat = (k, x) => setQt({ ...qt, [k]: x })
  const luu = async () => {
    const pb = Number(qt.phien_ban) || 1
    const ban = { ...qt, muc: qt.muc.map((m) => ({ t: String(m.t || '').trim(), d: String(m.d || '').trim() })).filter((m) => m.t && m.d), phien_ban: moi ? pb + 1 : pb, ngay: moi ? homNay() : qt.ngay }
    if (!ban.muc.length) { bao('Cần ít nhất 1 quy tắc có tên và nội dung', 'loi'); return }
    setDang(true)
    try {
      await rpc('fn_qt_cau_hinh_luu', { p_khoa: 'quy_tac', p_gia_tri: ban })
      setQt(ban); setMoi(false); lamMoiCauHinh(); reload()
      bao(moi ? `Đã phát hành phiên bản ${ban.phien_ban}. Thành viên sẽ được yêu cầu đọc và đồng ý lại.` : 'Đã lưu Quy tắc cộng đồng')
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the">
        <div><h2>Quy tắc cộng đồng</h2><p className="nho muted" style={{ marginTop: 2 }}>Phiên bản {qt.phien_ban}{qt.ngay ? ' · áp dụng từ ' + fmtNgay(qt.ngay) : ''}. Thành viên đồng ý khi đăng ký; người cũ xác nhận 1 lần khi mở app.</p></div>
        <Btn co="sm" kieu="den" icon={Save} loading={dang} onClick={luu}>{moi ? 'Phát hành' : 'Lưu'}</Btn>
      </div>
      {tk && <ThanhTienDo pct={tk.tong ? (tk.da_dong_y / tk.tong) * 100 : 0} nhan={`Đã đồng ý phiên bản ${tk.phien_ban}`} so={<><b>{tk.da_dong_y}</b>/{tk.tong} thành viên</>} />}
      <div className="luoi-form">
        <Field nhan="Tiêu đề" value={qt.tieu_de} onChange={(e) => dat('tieu_de', e.target.value)} />
        <Field nhan="Khẩu hiệu" value={qt.khau_hieu} onChange={(e) => dat('khau_hieu', e.target.value)} goiY="Các giá trị cách nhau bằng dấu –" />
      </div>
      <DsDong ds={qt.muc} onDoi={(x) => dat('muc', x)} nutThem="Thêm quy tắc" moi={() => ({ t: '', d: '' })}
        dong={(m, sua, i) => <><Field kieu="gon" nhan={`Quy tắc ${i + 1}`} value={m.t} onChange={(e) => sua({ t: e.target.value })} /><TextArea nhan="Nội dung" rows={3} value={m.d} onChange={(e) => sua({ d: e.target.value })} /></>} />
      <TextArea nhan="Lời kết" rows={2} value={qt.ket || ''} onChange={(e) => dat('ket', e.target.value)} />
      <DongSwitch nhan="Phát hành phiên bản mới" moTa={`Lưu thành phiên bản ${(Number(qt.phien_ban) || 1) + 1}: mọi thành viên phải đọc và đồng ý lại. Chỉ bật khi nội dung quy tắc thay đổi.`} on={moi} onDoi={setMoi} />
    </div>
  )
}

// ---------- Phiên bản & quay về: một chạm đưa app về bản ổn định (trước khi có Sóc Tia Chớp) ----------
const BAN_ON_DINH = 'ban-on-dinh-21-11-2026'
const URL_ACTIONS = 'https://github.com/baohan2909/affiliate/actions/workflows/deploy.yml'
export function ThePhienBan() {
  const bao = useToast()
  const xacNhan = useXacNhan()
  const { data: d, reload } = useAsync(() => rpc('fn_qt_soc'), [])
  const [gh, setGh] = useState('')
  const [dang, setDang] = useState('')
  const coGh = !!d?.cai_dat?.co_gh
  const luuGh = async () => {
    setDang('gh')
    try { await rpc('fn_qt_soc_luu', { p: { gh_token: gh } }); setGh(''); reload(true); bao('Đã lưu mã GitHub') } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const quayVe = async () => {
    if (!(await xacNhan({ tieuDe: 'Quay về bản ổn định 21/11/2026?', nguyHiem: true, nut: 'Quay về',
      moTa: 'Sóc Tia Chớp dừng ngay, lịch chạy của Sóc được gỡ, các hàm máy chủ trở lại như ngày 21/11/2026 và giao diện được dựng lại từ bản đó (khoảng 2 phút). Dữ liệu thành viên, sản phẩm, bài Sóc đã viết giữ nguyên.' }))) return
    setDang('ve')
    try {
      const k = await rpc('fn_qt_quay_ve_ban', { p_ban: BAN_ON_DINH })
      let gd = false
      if (coGh) { try { gd = (await goiSoc('quay_ve')).github } catch (e) { bao('Máy chủ đã quay về; giao diện chưa dựng lại được: ' + e.message, 'loi') } }
      bao(`Đã quay về: ${k.ham_khoi_phuc} hàm khôi phục, ${k.lich_go} lịch gỡ.` + (gd ? ' Giao diện đang dựng lại, mở lại app sau khoảng 2 phút.' : ''))
      if (!coGh) window.open(URL_ACTIONS, '_blank', 'noopener')
    } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const veMoi = async () => {
    setDang('moi')
    try { await rpc('fn_qt_ve_ban_moi'); if (coGh) await goiSoc('ve_ban_moi'); bao(coGh ? 'Đang dựng lại bản mới nhất, mở lại app sau khoảng 2 phút' : 'Đã bật lại lịch của Sóc. Giao diện: chạy lại workflow trên GitHub, để trống ô Bản.'); if (!coGh) window.open(URL_ACTIONS, '_blank', 'noopener') } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the">
        <div><h2>Phiên bản &amp; quay về</h2><p className="nho muted" style={{ marginTop: 2 }}>Đã sao lưu toàn bộ hàm máy chủ, cấu hình, lịch chạy và mã giao diện lúc 21/11/2026, trước khi có Sóc Tia Chớp.</p></div>
      </div>
      <div className="pb-o">
        <span className="ic"><History size={19} /></span>
        <div className="gian"><b>Bản ổn định 21/11/2026</b><span>Nhánh {BAN_ON_DINH}</span></div>
        <Btn co="sm" kieu="do" icon={RotateCcw} loading={dang === 've'} onClick={quayVe}>Quay về</Btn>
      </div>
      <div className="pb-o">
        <span className="ic"><GitBranch size={19} /></span>
        <div className="gian"><b>Bản mới nhất</b><span>Có Sóc Tia Chớp · nhánh main</span></div>
        <Btn co="sm" kieu="vien" icon={RefreshCw} loading={dang === 'moi'} onClick={veMoi}>Dùng lại</Btn>
      </div>
      <Field nhan={'Mã GitHub để dựng lại giao diện bằng 1 chạm' + (coGh ? ' · đã lưu' : '')} type="password" autoComplete="off" value={gh} onChange={(e) => setGh(e.target.value.trim())}
        placeholder={coGh ? 'Đã lưu · nhập để thay' : 'github_pat_…'}
        goiY="github.com → Settings → Developer settings → Fine-grained tokens → chỉ repo affiliate, quyền Actions: Read and write. Chưa có mã: bấm Quay về sẽ mở trang GitHub Actions, bấm Run workflow và nhập tên bản ở trên." />
      {gh && <div><Btn co="sm" kieu="den" icon={Save} loading={dang === 'gh'} onClick={luuGh}>Lưu mã GitHub</Btn></div>}
    </div>
  )
}

function CauHinh() {
  const { ns } = useQt()
  const laQT = ns?.vai_tro === 'quan_tri'
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_qt_cau_hinh_doc'), [])
  const [v, setV] = useState(null)
  if (loading && !d) return <KhungTai />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const c = v || {
    zalo: { ten_nhom: '', link: '', qr: '', ...(d.zalo || {}) }, lien_he: { email: '', hotline: '', website: '', gio: '', ...(d.lien_he || {}) },
    gioi_thieu: { tieu_de: '', mo_ta: '', quyen_loi: [], ...(d.gioi_thieu || {}) }, faq: d.faq || [], dieu_khoan: d.dieu_khoan || '', chinh_sach: d.chinh_sach || '',
    nguon_top: d.nguon_top || '', app_url: d.app_url || '', danh_muc: (d.danh_muc || []).join('\n'), tinh_thanh: (d.tinh_thanh || []).join('\n'),
    loai_chien_dich: d.loai_chien_dich || [], ngay_nghi_chung: (d.ngay_nghi_chung || []).join('\n')
  }
  const dat = (k, x) => setV({ ...c, [k]: x })
  const ds = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)
  return (
    <div className="cot" style={{ gap: 16 }}>
      {laQT && <KetNoiNhanh />}
      <LinkTaiApp />
      <TheCH tieuDe="Nhóm Zalo cộng đồng" moTa="Hiện ở trang chủ thành viên, trang giới thiệu và sau khi đăng ký." khoa="zalo" onLuu={() => c.zalo}>
        <div className="luoi-form">
          <Field nhan="Tên nhóm" value={c.zalo.ten_nhom} onChange={(e) => dat('zalo', { ...c.zalo, ten_nhom: e.target.value })} />
          <Field nhan="Link tham gia nhóm" inputMode="url" value={c.zalo.link} onChange={(e) => dat('zalo', { ...c.zalo, link: e.target.value })} placeholder="https://zalo.me/g/…" />
        </div>
        <ONhapAnh nhan="Ảnh mã QR nhóm" giaTri={c.zalo.qr} onDoi={(x) => dat('zalo', { ...c.zalo, qr: x })} />
      </TheCH>
      <TheCH tieuDe="Thông tin liên hệ" khoa="lien_he" onLuu={() => c.lien_he}>
        <div className="luoi-form">
          <Field nhan="Hotline" value={c.lien_he.hotline} onChange={(e) => dat('lien_he', { ...c.lien_he, hotline: e.target.value })} />
          <Field nhan="Email hỗ trợ" value={c.lien_he.email} onChange={(e) => dat('lien_he', { ...c.lien_he, email: e.target.value })} />
          <Field nhan="Website" value={c.lien_he.website} onChange={(e) => dat('lien_he', { ...c.lien_he, website: e.target.value })} />
          <Field nhan="Giờ hỗ trợ" value={c.lien_he.gio || ''} onChange={(e) => dat('lien_he', { ...c.lien_he, gio: e.target.value })} placeholder="8:00 – 17:30, Thứ 2 – Thứ 7" />
        </div>
      </TheCH>
      <TheCH tieuDe="Trang giới thiệu" moTa="Nội dung trang công khai trước khi đăng nhập." khoa="gioi_thieu" onLuu={() => c.gioi_thieu}>
        <Field nhan="Tiêu đề lớn" value={c.gioi_thieu.tieu_de} onChange={(e) => dat('gioi_thieu', { ...c.gioi_thieu, tieu_de: e.target.value })} goiY="Dùng dấu | để xuống dòng. Dòng đầu chữ mảnh, các dòng sau chữ đậm. VD: Cùng Nón Sơn|Phát triển thu nhập|Từ tiếp thị liên kết" />
        <DsDong ds={c.gioi_thieu.quyen_loi} onDoi={(x) => dat('gioi_thieu', { ...c.gioi_thieu, quyen_loi: x })} nutThem="Thêm quyền lợi" moi={() => ({ tieu_de: '', mo_ta: '' })}
          dong={(q, sua) => <div className="luoi-form"><Field kieu="gon" nhan="Quyền lợi" value={q.tieu_de} onChange={(e) => sua({ tieu_de: e.target.value })} /><Field kieu="gon" nhan="Mô tả" value={q.mo_ta} onChange={(e) => sua({ mo_ta: e.target.value })} /></div>} />
      </TheCH>
      <TheCH tieuDe="Câu hỏi thường gặp" khoa="faq" onLuu={() => c.faq.filter((x) => x.h?.trim())}>
        <DsDong ds={c.faq} onDoi={(x) => dat('faq', x)} nutThem="Thêm câu hỏi" moi={() => ({ h: '', d: '' })}
          dong={(q, sua) => <><Field kieu="gon" nhan="Câu hỏi" value={q.h} onChange={(e) => sua({ h: e.target.value })} /><TextArea nhan="Trả lời" rows={2} value={q.d} onChange={(e) => sua({ d: e.target.value })} /></>} />
      </TheCH>
      <TheCH tieuDe="Nguồn dữ liệu Top sản phẩm" moTa="Hiện cạnh danh sách Top khi chưa ghi nguồn riêng." khoa="nguon_top" onLuu={() => c.nguon_top}>
        <Field nhan="Nguồn" value={c.nguon_top} onChange={(e) => dat('nguon_top', e.target.value)} />
      </TheCH>
      <div className="luoi-form" style={{ gap: 16, alignItems: 'start' }}>
        <TheCH tieuDe="Danh mục sản phẩm" moTa="Mỗi dòng một danh mục." khoa="danh_muc" onLuu={() => ds(c.danh_muc)}>
          <TextArea nhan="Danh mục" rows={6} value={c.danh_muc} onChange={(e) => dat('danh_muc', e.target.value)} />
        </TheCH>
        <TheCH tieuDe="Ngày nghỉ chung" moTa="Mỗi dòng 1 ngày (yyyy-mm-dd). Toàn hệ thống không nhận lịch quay." khoa="ngay_nghi_chung" onLuu={() => ds(c.ngay_nghi_chung).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))}>
          <TextArea nhan="Ngày nghỉ" rows={6} value={c.ngay_nghi_chung} onChange={(e) => dat('ngay_nghi_chung', e.target.value)} placeholder={homNay()} />
        </TheCH>
      </div>
      <TheCH tieuDe="Loại chiến dịch" khoa="loai_chien_dich" onLuu={() => c.loai_chien_dich.filter((x) => x.v && x.t)}>
        <DsDong ds={c.loai_chien_dich} onDoi={(x) => dat('loai_chien_dich', x)} nutThem="Thêm loại" moi={() => ({ v: '', t: '' })}
          dong={(q, sua) => <div className="luoi-form"><Field kieu="gon" nhan="Tên hiển thị" value={q.t} onChange={(e) => sua({ t: e.target.value, v: q.v || e.target.value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') })} /><Field kieu="gon" nhan="Mã" value={q.v} onChange={(e) => sua({ v: e.target.value })} /></div>} />
      </TheCH>
      <TheCH tieuDe="Tỉnh / thành phố" moTa="Danh sách chọn ở form đăng ký. Mỗi dòng một tỉnh." khoa="tinh_thanh" onLuu={() => ds(c.tinh_thanh)}>
        <TextArea nhan="Tỉnh / thành" rows={8} value={c.tinh_thanh} onChange={(e) => dat('tinh_thanh', e.target.value)} />
      </TheCH>
      {laQT && <XacThucEmail batSan={d.bat_buoc_xac_thuc === true} />}
      {laQT && <ThePhienBan />}
      {laQT && <TheBaoTri goc={d.bao_tri} />}
      {laQT && <TheQuyTac goc={d.quy_tac} />}
      {laQT && <>
        <TheCH tieuDe="Điều khoản tham gia" moTa="Bản nháp — cần pháp chế duyệt trước khi chạy chính thức." khoa="dieu_khoan" onLuu={() => c.dieu_khoan}>
          <TextArea nhan="Nội dung (hỗ trợ ## tiêu đề, - gạch đầu dòng)" rows={10} value={c.dieu_khoan} onChange={(e) => dat('dieu_khoan', e.target.value)} />
        </TheCH>
        <TheCH tieuDe="Chính sách dữ liệu cá nhân" khoa="chinh_sach" onLuu={() => c.chinh_sach}>
          <TextArea nhan="Nội dung" rows={10} value={c.chinh_sach} onChange={(e) => dat('chinh_sach', e.target.value)} />
        </TheCH>
        <TheCH tieuDe="Địa chỉ ứng dụng" moTa="Dùng cho liên kết trong email. Đổi khi chuyển sang tên miền riêng." khoa="app_url" onLuu={() => c.app_url.replace(/\/$/, '')}>
          <Field nhan="URL" value={c.app_url} onChange={(e) => dat('app_url', e.target.value)} />
        </TheCH>
      </>}
    </div>
  )
}

// ---------- Kết nối Nhanh.vn: số bán 30 ngày lấy thẳng từ phiếu xuất kho (mọi kênh) ----------
const URL_NHANH = SUPABASE_URL + '/functions/v1/nhanh'
async function goiHamNhanh(hanhDong) {
  const { data: { session } } = await sb.auth.getSession()
  const r = await fetch(URL_NHANH, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (session?.access_token || '') }, body: JSON.stringify({ hanh_dong: hanhDong }) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.loi || 'Không gọi được máy chủ')
  return j
}
// Link + mã QR trang Tải ứng dụng để gửi cho thành viên (nhóm Zalo, bài đăng…)
function LinkTaiApp() {
  const bao = useToast()
  const link = window.location.origin + '/tai-app'
  const chep = async () => { if (await saoChep(link)) bao('Đã chép link tải ứng dụng') }
  return (
    <div className="card">
      <div className="dau-the"><div><h2>Link tải ứng dụng</h2><p className="nho muted" style={{ marginTop: 2 }}>Gửi vào nhóm Zalo hoặc bài đăng. Thành viên mở link sẽ thấy hướng dẫn cài đúng theo máy (iPhone, Android, máy tính).</p></div></div>
      <div className="link-tai">
        <MaQR giaTri={link} size={112} />
        <div className="gian">
          <span className="cat duong">{link.replace(/^https?:\/\//, '')}</span>
          <div className="hang wrap" style={{ gap: 8 }}>
            <Btn kieu="den" co="sm" icon={Copy} onClick={chep}>Chép link</Btn>
            <a className="btn vien sm" href={link} target="_blank" rel="noreferrer"><ExternalLink size={15} />Mở trang</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function KetNoiNhanh() {
  const bao = useToast()
  const [sp, setSp] = useSearchParams()
  const { data: t, loading, reload } = useAsync(() => rpc('fn_qt_nhanh_trang_thai'), [])
  const [dang, setDang] = useState('')
  useEffect(() => {
    const kq = sp.get('nhanh')
    if (!kq) return
    if (kq === 'ok') bao('Đã kết nối Nhanh.vn. Đang lấy số bán 30 ngày, vài phút sau là đủ.')
    else bao(sp.get('ly_do') || 'Kết nối Nhanh.vn chưa thành công', 'loi')
    const m = new URLSearchParams(sp); m.delete('nhanh'); m.delete('ly_do'); setSp(m, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!t?.ket_noi || (t.so_ngay_xong >= 30 && t.so_ngay_kenh >= 30)) return; const h = setInterval(() => reload(true), 15000); return () => clearInterval(h) }, [t?.ket_noi, t?.so_ngay_xong, t?.so_ngay_kenh]) // eslint-disable-line react-hooks/exhaustive-deps
  const ketNoi = async () => {
    setDang('kn')
    try {
      const r = await rpc('fn_qt_nhanh_bat_dau')
      window.location.href = 'https://nhanh.vn/oauth?' + new URLSearchParams({ appId: r.app_id || t.app_id, service: 'pos', verifyCode: r.verify_code, returnLink: URL_NHANH }).toString()
    } catch (e) { bao(e.message, 'loi'); setDang('') }
  }
  const dongBo = async () => {
    setDang('db')
    try { await goiHamNhanh('dong_bo'); bao('Đang đồng bộ ở nền, số liệu cập nhật trong vài phút'); setTimeout(() => reload(true), 8000) } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const doiNguon = async (v) => {
    try { await rpc('fn_qt_nhanh_nguon', { p_nguon: v }); reload(true); bao(v === 'nhanh' ? 'App dùng số bán từ Nhanh.vn' : 'App dùng cột SL BÁN ở Google Sheet') } catch (e) { bao(e.message, 'loi') }
  }
  if (loading && !t) return <div className="card"><KhungTai /></div>
  if (!t) return null
  const phanTram = Math.min(100, Math.round(((t.so_ngay_xong || 0) / 30) * 100))
  return (
    <div className="card cot" style={{ gap: 12 }}>
      <div className="dau-the">
        <div><h2>Kết nối Nhanh.vn</h2><p className="nho muted" style={{ marginTop: 2 }}>Số “Đã bán” = tổng phiếu xuất kho 30 ngày gần nhất ở mọi kênh online, chia theo kênh bán của đơn (Shopee, TikTok Shop, Lazada…). Tự cập nhật mỗi 30 phút.</p></div>
        {t.ket_noi
          ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}>Đã kết nối</span>
          : <span className="tag" style={{ background: '#FDF3E3', color: '#8A5410' }}>Chưa kết nối</span>}
      </div>
      {!t.app_id && <Bao kieu="loi">Chưa có App ID / Secret Key của app trên open.nhanh.vn.</Bao>}
      {t.ket_noi && (
        <div className="cot" style={{ gap: 8 }}>
          <div className="dong-tt"><span>Doanh nghiệp (Business ID)</span><b>{t.business_id}</b></div>
          <div className="dong-tt"><span>Kết nối bởi</span><span>{t.ket_noi_boi || '—'}{t.ket_noi_luc ? ' · ' + fmtNgayGio(t.ket_noi_luc) : ''}</span></div>
          <div className="dong-tt"><span>Quyền hết hạn</span><span>{t.het_han ? fmtNgayGio(t.het_han) : '—'}</span></div>
          <div className="dong-tt"><span>Dữ liệu 30 ngày</span><span><b>{t.so_ngay_xong}/30 ngày</b> · {Number(t.tong_30_ngay || 0).toLocaleString('vi-VN')} sản phẩm bán · {t.so_ma_khop} mã khớp với app</span></div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--soft)', overflow: 'hidden' }}><div style={{ width: phanTram + '%', height: '100%', background: 'var(--nut-chinh)', transition: 'width .4s' }} /></div>
          {t.so_ngay_kenh < 30 && <div className="dong-tt"><span>Chia theo kênh</span><span><b>{t.so_ngay_kenh || 0}/30 ngày</b> · đang tra kênh bán của từng đơn</span></div>}
          {Object.keys(t.theo_kenh || {}).length > 0 && (
            <div className="cot" style={{ gap: 8, marginTop: 4 }}>
              <span className="nho muted-2">Số bán theo kênh{t.so_ngay_kenh < 30 ? ` (${t.so_ngay_kenh} ngày đã tách)` : ' · 30 ngày'}</span>
              <ThanhKenh bk={t.theo_kenh} gon />
            </div>
          )}
          <div className="dong-tt"><span>Lần đồng bộ cuối</span><span>{t.lan_dong_bo ? tuongDoi(t.lan_dong_bo) : 'chưa chạy'}</span></div>
          {t.loi_cuoi && <Bao kieu="loi">Lỗi lần cuối: {t.loi_cuoi}</Bao>}
          <div className="hang wrap" style={{ gap: 10, alignItems: 'center' }}>
            <span className="nho muted-2">Số “Đã bán” trên app lấy từ</span>
            <Chips co="sm" trang ds={[{ v: 'nhanh', t: 'Nhanh.vn' }, { v: 'sheet', t: 'Cột SL BÁN (sheet)' }]} giaTri={t.nguon_so_ban} onChon={doiNguon} />
          </div>
          {t.nguon_so_ban === 'sheet' && t.so_ngay_xong < 29 && <p className="nho muted">Khi đủ 30 ngày dữ liệu, app tự chuyển sang số từ Nhanh.vn.</p>}
        </div>
      )}
      <div className="hang wrap" style={{ gap: 8 }}>
        {t.app_id && <Btn kieu={t.ket_noi ? 'vien' : 'den'} icon={PlugZap} loading={dang === 'kn'} onClick={ketNoi}>{t.ket_noi ? 'Kết nối lại' : 'Kết nối Nhanh.vn'}</Btn>}
        {t.ket_noi && <Btn kieu="den" icon={RefreshCw} loading={dang === 'db'} onClick={dongBo}>Đồng bộ ngay</Btn>}
      </div>
      {!t.ket_noi && t.app_id && <p className="nho muted"><Link2 size={13} style={{ verticalAlign: -2 }} /> Bấm “Kết nối Nhanh.vn” → đăng nhập Nhanh (tài khoản Giám đốc) → chọn doanh nghiệp, cho phép quyền xem đơn hàng / xuất nhập kho / sản phẩm → Đồng ý. Trang tự quay về đây.</p>}
    </div>
  )
}

function XacThucEmail({ batSan }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [bat, setBat] = useState(batSan)
  const doi = async (v) => {
    if (!(await xn({ tieuDe: v ? 'Bật bắt buộc xác thực email?' : 'Tắt bắt buộc xác thực email?',
      moTa: v ? 'Thành viên chưa xác nhận email sẽ không đặt lịch, đăng ký chiến dịch, nộp bài được cho tới khi bấm link trong thư. Cần máy gửi thư đang chạy.' : 'Thành viên đăng ký xong dùng được ngay, không cần bấm link xác nhận.', nut: v ? 'Bật' : 'Tắt' }))) return
    try { await rpc('fn_qt_cau_hinh_luu', { p_khoa: 'bat_buoc_xac_thuc', p_gia_tri: v }); setBat(v); lamMoiCauHinh(); bao(v ? 'Đã bật bắt buộc xác thực email' : 'Đã tắt bắt buộc xác thực email') } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <div className="card cot" style={{ gap: 10 }}>
      <div className="dau-the"><h2>Xác thực email khi đăng ký</h2></div>
      <DongSwitch nhan="Bắt buộc xác thực email" moTa={bat ? 'Đang BẬT: thành viên phải bấm link trong email trước khi dùng các tính năng chính' : 'Đang TẮT: đăng ký xong dùng được ngay (giai đoạn đầu)'} on={bat} onDoi={doi} />
    </div>
  )
}

// ================= NHẬT KÝ =================
const BANG = ['thanh_vien', 'nhom', 'cap_do', 'san_pham', 'top_san_pham', 'chien_dich', 'chien_dich_dang_ky', 'bai_nop', 'uu_dai', 'lich_quay', 'cua_hang', 'tai_nguyen', 'thong_bao', 'ho_tro', 'nhan_su', 'cau_hinh']
function NhatKy() {
  const [loc, setLoc] = useState({ bang: '', nguoi: '', tu: congNgay(homNay(), -7), den: homNay() })
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_nhat_ky', { p: { ...loc, gioi_han: 500 } }), [loc.bang, loc.nguoi, loc.tu, loc.den])
  const [mo, setMo] = useState(null)
  const [q, setQ] = useState('')
  const ds = (data || []).filter((k) => khop(`${k.nguoi_ten} ${k.nguoi_ma} ${k.bang} ${k.ban_ghi} ${k.hanh_dong}`, q))
  const khac = (k) => {
    if (!k.truoc || !k.sau) return JSON.stringify(k.sau || k.truoc, null, 2)
    return Object.keys(k.sau).filter((x) => JSON.stringify(k.truoc[x]) !== JSON.stringify(k.sau[x]) && !['cap_nhat_luc'].includes(x))
      .map((x) => `${x}: ${JSON.stringify(k.truoc[x])} → ${JSON.stringify(k.sau[x])}`).join('\n') || '(không đổi dữ liệu)'
  }
  const HD = { insert: 'Thêm', update: 'Sửa', delete: 'Xóa' }
  return (
    <div className="cot" style={{ gap: 12 }}>
      <div className="toolbar">
        <OTim giaTri={q} onDoi={setQ} goiY="Người, bảng, bản ghi…" />
        <Chon kieu="tron" ds={[{ v: '', t: 'Mọi bảng' }, ...BANG.map((b) => ({ v: b, t: b }))]} giaTri={loc.bang} onChon={(v) => setLoc({ ...loc, bang: v })} />
        <div style={{ width: 160 }}><Field kieu="gon" nhan="Từ" type="date" value={loc.tu} onChange={(e) => setLoc({ ...loc, tu: e.target.value })} /></div>
        <div style={{ width: 160 }}><Field kieu="gon" nhan="Đến" type="date" value={loc.den} onChange={(e) => setLoc({ ...loc, den: e.target.value })} /></div>
      </div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : (
        <div className="card">
          {ds.length === 0 ? <p className="nho muted">Không có thao tác trong khoảng này.</p> : ds.map((k) => (
            <div key={k.id} className="nk-dong" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => setMo(mo === k.id ? null : k.id)}>
              <div className="hang wrap" style={{ gap: 8, justifyContent: 'space-between' }}>
                <span><b>{k.nguoi_ten || 'Hệ thống'}</b> <span className="muted nho">{k.nguoi_ma}</span> · <span className="tag">{HD[k.hanh_dong] || k.hanh_dong}</span> <b>{k.bang}</b> <span className="muted nho">{k.ban_ghi}</span></span>
                <span className="nho muted">{fmtNgayGio(k.luc)}</span>
              </div>
              {mo === k.id && <div className="chi-tiet">{khac(k)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ================= EMAIL HỆ THỐNG =================
function Thu() {
  const bao = useToast()
  const xn = useXacNhan()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_thu_ds'), [])
  const { data: ch, reload: taiCH } = useAsync(() => rpc('fn_qt_cau_hinh_doc'), [])
  const [tt, setTt] = useState('')
  const [hienKhoa, setHienKhoa] = useState(false)
  if (loading && !data) return <KhungTai />
  if (error && !data) return <LoiTai loi={error} thuLai={reload} />
  const guiLai = async (t) => {
    try { await rpc('fn_qt_thu_gui_lai', { p_id: t.id }); setData((d) => ({ ...d, ds: d.ds.map((x) => (x.id === t.id ? { ...x, trang_thai: 'cho', loi: null } : x)) })); bao('Đã xếp lại vào hàng gửi') } catch (e) { bao(e.message, 'loi') }
  }
  const doiKhoa = async () => {
    if (!(await xn({ tieuDe: 'Đổi khóa máy gửi thư?', moTa: 'Máy gửi (Apps Script) đang dùng khóa cũ sẽ ngừng gửi cho tới khi cập nhật khóa mới vào Script Properties.', nut: 'Đổi khóa', nguyHiem: true }))) return
    try { await rpc('fn_qt_doi_khoa_may_gui'); taiCH(); setHienKhoa(true); bao('Đã tạo khóa mới') } catch (e) { bao(e.message, 'loi') }
  }
  const mayLuc = data.may_gui_luc
  const songMay = mayLuc && Date.now() - new Date(mayLuc).getTime() < 10 * 60 * 1000
  const ds = data.ds.filter((t) => !tt || t.trang_thai === tt)
  const cot = [
    { k: 'tao_luc', t: 'Tạo lúc', canh: 'giua', o: (t) => fmtNgayGio(t.tao_luc) },
    { k: 'den', t: 'Người nhận' },
    { k: 'tieu_de', t: 'Tiêu đề', o: (t) => <span className="cat" style={{ maxWidth: 320, display: 'inline-block' }}>{t.tieu_de}</span> },
    { k: 'loai', t: 'Loại' },
    { k: 'so_lan', t: 'Lần thử', canh: 'giua' },
    { k: 'gui_luc', t: 'Gửi lúc', canh: 'giua', o: (t) => fmtNgayGio(t.gui_luc) },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (t) => <span title={t.loi || ''}><Nhan bang={TT_THU} ma={t.trang_thai} /></span> },
    { k: 'tac', t: '', sx: false, o: (t) => ['loi', 'huy'].includes(t.trang_thai) && <Btn co="sm" kieu="mem" icon={RotateCcw} onClick={() => guiLai(t)}>Gửi lại</Btn> }
  ]
  return (
    <div className="cot" style={{ gap: 14 }}>
      <div className="card cot" style={{ gap: 10 }}>
        <div className="dau-the"><h2>Máy gửi thư (Google Apps Script)</h2><span className="tag" style={songMay ? { background: '#E3F5EE', color: '#0E7F63' } : { background: '#FDECEC', color: '#B93838' }}><i className="cham" style={{ background: songMay ? '#0E7F63' : '#B93838' }} />{songMay ? 'Đang chạy' : 'Chưa thấy hoạt động'}</span></div>
        <p className="nho muted-2">Lần lấy thư gần nhất: <b>{mayLuc ? fmtNgayGio(mayLuc) + ' (' + tuongDoi(mayLuc) + ')' : 'chưa có'}</b>. Máy gửi chạy mỗi phút, lấy thư trong hàng đợi và gửi bằng Gmail của tài khoản cài script.</p>
        <div className="hang wrap" style={{ gap: 8 }}>
          <Btn co="sm" kieu="vien" icon={ShieldCheck} onClick={() => setHienKhoa(!hienKhoa)}>{hienKhoa ? 'Ẩn khóa' : 'Xem khóa máy gửi'}</Btn>
          <Btn co="sm" kieu="trong" icon={RefreshCw} onClick={doiKhoa}>Đổi khóa</Btn>
        </div>
        {hienKhoa && ch?.khoa_may_gui && <div className="hang" style={{ gap: 8 }}><code style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--soft)', fontSize: 13, wordBreak: 'break-all' }}>{ch.khoa_may_gui}</code><Btn co="sm" kieu="mem" icon={Copy} onClick={() => saoChep(ch.khoa_may_gui).then(() => bao('Đã chép khóa'))}>Chép</Btn></div>}
      </div>
      <Chips co="sm" trang ds={[{ v: '', t: 'Tất cả' }, ...Object.entries(TT_THU).map(([v, x]) => ({ v, t: x.ten, dem: data.dem?.[v] || 0 }))]} giaTri={tt} onChon={setTt} />
      <BangDL cot={cot} ds={ds} macDinh="tao_luc" trong="Chưa có thư" />
    </div>
  )
}

export default function HeThong() {
  const { ns } = useQt()
  const laQT = ns?.vai_tro === 'quan_tri'
  const [sp, setSp] = useSearchParams()
  const tabs = laQT ? [{ v: 'nhan_su', t: 'Nhân sự' }, { v: 'cau_hinh', t: 'Cấu hình' }, { v: 'thu', t: 'Email hệ thống' }, { v: 'nhat_ky', t: 'Nhật ký thao tác' }] : [{ v: 'cau_hinh', t: 'Cấu hình' }]
  const tab = tabs.some((x) => x.v === sp.get('tab')) ? sp.get('tab') : tabs[0].v
  return (
    <>
      <TrangDau eyebrow="Quản trị" tieuDe="Hệ thống" phu={laQT ? 'Tài khoản nhân sự, cấu hình nội dung, email và nhật ký thao tác.' : 'Cấu hình nội dung cộng đồng.'} />
      {tabs.length > 1 && <div><Segment trang giaTri={tab} onChon={(v) => setSp({ tab: v }, { replace: true })} ds={tabs} /></div>}
      {tab === 'nhan_su' && <NhanSu />}
      {tab === 'cau_hinh' && <CauHinh />}
      {tab === 'thu' && <Thu />}
      {tab === 'nhat_ky' && <NhatKy />}
    </>
  )
}

