import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, KeyRound, Plus, RefreshCw, RotateCcw, Save, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { Bao, Btn, Chips, Chon, DongSwitch, Field, KhungTai, LoiTai, Modal, Nhan, Segment, TextArea, TrangDau, saoChep, useToast, useXacNhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc, taiKhoan } from '../lib/api'
import { fmtNgay, fmtNgayGio, homNay, congNgay, khop, tuongDoi } from '../lib/format'
import { TT_THU, VAI_TRO } from '../lib/hang'
import { BangDL, DsDong, ONhapAnh, OTim, lamMoiCauHinh } from './chung'
import { useQt } from './Cong'

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
        <Field nhan="Tiêu đề lớn" value={c.gioi_thieu.tieu_de} onChange={(e) => dat('gioi_thieu', { ...c.gioi_thieu, tieu_de: e.target.value })} />
        <TextArea nhan="Mô tả" rows={3} value={c.gioi_thieu.mo_ta} onChange={(e) => dat('gioi_thieu', { ...c.gioi_thieu, mo_ta: e.target.value })} />
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

