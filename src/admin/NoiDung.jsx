import { useEffect, useRef, useState } from 'react'
import { Bell, Clock, Download, FileUp, Mail, Pin, Plus, Send, Trash2, Paperclip } from 'lucide-react'
import { Bao, Btn, Chips, Chon, DongSwitch, Field, KhungTai, LoiTai, Md, Modal, Nhan, Segment, TextArea, ThanhTienDo, TrangDau, useToast, useXacNhan } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, taiTepRieng, xoaTepRieng, linkTai } from '../lib/api'
import { fmtDungLuong, fmtNgay, fmtNgayGio, khop, fmtSo, tuongDoi } from '../lib/format'
import { LOAI_TN, LOAI_TB, LOAI_HO_TRO, TT_HO_TRO, TT_LICH } from '../lib/hang'
import { BangDL, ChonDoiTuong, ONgayGio, ONhapAnh, OTim, useTuyChon } from './chung'
import { useQt } from './Cong'

const moTaDT = (ds) => (!ds?.length || ds.some((d) => d.kieu === 'tat_ca') ? 'Tất cả' : ds.length + ' điều kiện')
const GIOI_HAN_TEP = 50 * 1024 * 1024

// ================= TÀI NGUYÊN =================
const TN_MOI = { tieu_de: '', loai: 'huong_dan', chuyen_muc: '', mo_ta: '', noi_dung: '', duong_dan: '', ten_tep: '', kich_thuoc: '', link_ngoai: '', anh_bia: '', san_pham_id: '', cho_tai: true, hien: true, ghim: false, thu_tu: 0, doi_tuong: [] }

function SuaTN({ tn, dong, xong }) {
  const bao = useToast()
  const xn = useXacNhan()
  const tc = useTuyChon()
  const [f, setF] = useState(() => ({ ...TN_MOI, ...tn, san_pham_id: tn.san_pham_id || '' }))
  const [tienDo, setTienDo] = useState(null)
  const [dang, setDang] = useState(false)
  const [xem, setXem] = useState(false)
  const inp = useRef(null)
  const doi = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const chonTep = async (file) => {
    if (!file) return
    if (file.size > GIOI_HAN_TEP) { bao('Tệp tối đa 50MB. Video dài nên để link ngoài (Drive/YouTube).', 'loi'); return }
    setTienDo(5)
    try {
      const cu = f.duong_dan
      const path = await taiTepRieng(file, setTienDo)
      setF((v) => ({ ...v, duong_dan: path, ten_tep: file.name, kich_thuoc: file.size, loai: v.loai === 'huong_dan' ? (/^image\//.test(file.type) ? 'anh' : /^video\//.test(file.type) ? 'video' : 'tai_lieu') : v.loai }))
      if (cu && cu !== tn.duong_dan) xoaTepRieng(cu).catch(() => {})
    } catch (e) { bao(e.message, 'loi') } finally { setTimeout(() => setTienDo(null), 600) }
  }
  const luu = async () => {
    setDang(true)
    try {
      await rpc('fn_qt_tai_nguyen_luu', { p: f })
      if (tn.duong_dan && tn.duong_dan !== f.duong_dan) xoaTepRieng(tn.duong_dan).catch(() => {})
      bao('Đã lưu tài nguyên'); xong()
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoa = async () => {
    if (!(await xn({ tieuDe: 'Xóa tài nguyên?', moTa: f.tieu_de + (f.duong_dan ? ' · tệp đính kèm cũng bị xóa' : ''), nut: 'Xóa', nguyHiem: true }))) return
    try { const p = await rpc('fn_qt_tai_nguyen_xoa', { p_id: f.id }); if (p) await xoaTepRieng(p).catch(() => {}); xong() } catch (e) { bao(e.message, 'loi') }
  }
  const moTep = async () => { try { window.open(await linkTai(f.duong_dan), '_blank') } catch (e) { bao(e.message, 'loi') } }
  return (
    <Modal mo dong={dong} rong={2} tieuDe={f.id ? 'Sửa tài nguyên' : 'Thêm tài nguyên'}
      chan={<>{f.id && <Btn kieu="trong" icon={Trash2} style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={xoa}>Xóa</Btn>}<Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" loading={dang} disabled={tienDo != null} onClick={luu}>Lưu</Btn></>}>
      <div className="cot" style={{ gap: 14 }}>
        <div className="luoi-form">
          <div className="toan"><Field nhan="Tiêu đề" batBuoc value={f.tieu_de} onChange={doi('tieu_de')} /></div>
          <Chon nhan="Loại" ds={Object.entries(LOAI_TN).map(([v, t]) => ({ v, t }))} giaTri={f.loai} onChon={doi('loai')} />
          <Field nhan="Chuyên mục" value={f.chuyen_muc || ''} onChange={doi('chuyen_muc')} placeholder="VD: Bắt đầu, Quay video, Chính sách" />
          <Chon nhan="Gắn với sản phẩm" tim ds={[{ v: '', t: '— Không gắn —' }, ...(tc?.san_pham || []).map((s) => ({ v: s.id, t: s.ten, phu: s.ma }))]} giaTri={f.san_pham_id} onChon={doi('san_pham_id')} />
          <Field nhan="Link ngoài (Drive, YouTube…)" inputMode="url" value={f.link_ngoai || ''} onChange={doi('link_ngoai')} />
          <div className="toan"><Field nhan="Mô tả ngắn" value={f.mo_ta || ''} onChange={doi('mo_ta')} /></div>
        </div>
        <div className="khoi-form">
          <h4>Tệp đính kèm (riêng tư, chỉ thành viên được xem tải)</h4>
          <div className="hang wrap" style={{ gap: 10 }}>
            <Btn kieu="vien" icon={FileUp} disabled={tienDo != null} onClick={() => inp.current?.click()}>{f.duong_dan ? 'Thay tệp' : 'Tải tệp lên'}</Btn>
            {f.duong_dan && <><span className="nho"><Paperclip size={13} style={{ verticalAlign: -2 }} /> {f.ten_tep} · {fmtDungLuong(f.kich_thuoc)}</span><Btn co="sm" kieu="mem" onClick={moTep}>Mở</Btn><Btn co="sm" kieu="trong" onClick={() => setF({ ...f, duong_dan: '', ten_tep: '', kich_thuoc: '' })}>Bỏ tệp</Btn></>}
            <input ref={inp} type="file" hidden onChange={(e) => { chonTep(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          {tienDo != null && <ThanhTienDo pct={tienDo} nhan="Đang tải lên" />}
          <p className="nho muted">Tối đa 50MB mỗi tệp.</p>
          {f.duong_dan && <DongSwitch nhan="Cho phép tải xuống" moTa={f.cho_tai ? 'Thành viên tải về máy' : 'Chỉ xem trực tuyến'} on={f.cho_tai} onDoi={(v) => setF({ ...f, cho_tai: v })} />}
        </div>
        <div className="khoi-form">
          <div className="hang" style={{ justifyContent: 'space-between' }}><h4>Nội dung bài viết</h4><button type="button" className="lien-ket nho" onClick={() => setXem(!xem)}>{xem ? 'Sửa' : 'Xem trước'}</button></div>
          {xem ? <div className="card gon" style={{ background: 'var(--soft)' }}><Md chu={f.noi_dung} /></div>
            : <TextArea nhan="Hỗ trợ ## tiêu đề, - gạch đầu dòng, 1. đánh số, **đậm**, [chữ](link)" rows={10} value={f.noi_dung || ''} onChange={doi('noi_dung')} />}
        </div>
        <ONhapAnh nhan="Ảnh bìa" giaTri={f.anh_bia} onDoi={(v) => setF({ ...f, anh_bia: v })} />
        <div className="khoi-form"><h4>Ai được xem</h4><ChonDoiTuong giaTri={f.doi_tuong} onDoi={(v) => setF({ ...f, doi_tuong: v })} /></div>
        <div className="luoi-form">
          <DongSwitch nhan="Hiển thị" on={f.hien} onDoi={(v) => setF({ ...f, hien: v })} />
          <DongSwitch nhan="Ghim lên đầu" on={f.ghim} onDoi={(v) => setF({ ...f, ghim: v })} />
        </div>
      </div>
    </Modal>
  )
}

export function TaiNguyen() {
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_tai_nguyen_ds'), [])
  const [q, setQ] = useState('')
  const [loai, setLoai] = useState('')
  const [mo, setMo] = useState(null)
  const qd = useDebounced(q, 200)
  const ds = (data || []).filter((r) => (!loai || r.loai === loai) && khop(`${r.tieu_de} ${r.chuyen_muc || ''} ${r.san_pham || ''}`, qd))
  const cot = [
    { k: 'tieu_de', t: 'Tài nguyên', o: (r) => <div className="cat" style={{ maxWidth: 340 }}><b>{r.ghim && <Pin size={12} style={{ color: 'var(--pink)', marginRight: 4 }} />}{r.tieu_de}</b><span className="nho muted" style={{ display: 'block' }}>{[r.chuyen_muc, r.ten_tep && r.ten_tep + ' · ' + fmtDungLuong(r.kich_thuoc), r.link_ngoai && 'Link ngoài'].filter(Boolean).join(' · ')}</span></div> },
    { k: 'loai', t: 'Loại', o: (r) => LOAI_TN[r.loai] },
    { k: 'san_pham', t: 'Sản phẩm', o: (r) => <span className="cat" style={{ maxWidth: 180, display: 'inline-block' }}>{r.san_pham}</span> },
    { k: 'doi_tuong', t: 'Đối tượng', sx: (r) => r.doi_tuong.length, o: (r) => moTaDT(r.doi_tuong) },
    { k: 'luot_xem', t: 'Xem', canh: 'giua' },
    { k: 'luot_tai', t: 'Tải', canh: 'giua' },
    { k: 'hien', t: 'Hiện', canh: 'giua', o: (r) => (r.hien ? 'Có' : 'Ẩn') },
    { k: 'tao_luc', t: 'Tạo', canh: 'giua', o: (r) => fmtNgay(r.tao_luc) }
  ]
  return (
    <>
      <TrangDau eyebrow="Nội dung" tieuDe="Thư viện tài nguyên" phu="Hướng dẫn, hình ảnh, video, tài liệu và quy định cho thành viên." phai={<Btn kieu="den" icon={Plus} onClick={() => setMo({ ...TN_MOI })}>Thêm tài nguyên</Btn>} />
      <div className="toolbar"><OTim giaTri={q} onDoi={setQ} goiY="Tìm tài nguyên…" /><Chips co="sm" trang ds={[{ v: '', t: 'Tất cả' }, ...Object.entries(LOAI_TN).map(([v, t]) => ({ v, t }))]} giaTri={loai} onChon={setLoai} /></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : <BangDL cot={cot} ds={ds} macDinh="tao_luc" onBam={setMo} trong="Chưa có tài nguyên" />}
      {mo && <SuaTN tn={mo} dong={() => setMo(null)} xong={() => { setMo(null); reload(true) }} />}
    </>
  )
}

// ================= THÔNG BÁO =================
function SoanTB({ dong, xong }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [f, setF] = useState({ tieu_de: '', noi_dung: '', loai: 'tin', lien_ket: '', gui_email: false, hen_gio: '', doi_tuong: [] })
  const [dang, setDang] = useState(false)
  const doi = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const gui = async () => {
    if (!f.tieu_de.trim()) { bao('Nhập tiêu đề', 'loi'); return }
    const hen = f.hen_gio && new Date(f.hen_gio) > new Date()
    if (!(await xn({ tieuDe: hen ? 'Hẹn giờ gửi thông báo?' : 'Gửi thông báo ngay?', moTa: `${hen ? 'Gửi lúc ' + fmtNgayGio(f.hen_gio) : 'Gửi ngay'} · ${moTaDT(f.doi_tuong) === 'Tất cả' ? 'tất cả thành viên' : 'theo đối tượng đã chọn'}${f.gui_email ? ' · kèm email' : ''}`, nut: hen ? 'Hẹn giờ' : 'Gửi' }))) return
    setDang(true)
    try { const kq = await rpc('fn_qt_thong_bao_gui', { p: f }); bao(kq.hen_gio && new Date(kq.hen_gio) > new Date() ? 'Đã hẹn giờ gửi' : `Đã gửi tới ${fmtSo(kq.so_nguoi)} thành viên`, 'hong'); xong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <Modal mo dong={dong} rong={2} tieuDe="Soạn thông báo" moTa="Hiện trong mục Thông báo của thành viên; tùy chọn gửi kèm email."
      chan={<><Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" icon={f.hen_gio ? Clock : Send} loading={dang} onClick={gui}>{f.hen_gio ? 'Hẹn giờ gửi' : 'Gửi ngay'}</Btn></>}>
      <div className="cot" style={{ gap: 14 }}>
        <Field nhan="Tiêu đề" batBuoc maxLength={140} value={f.tieu_de} onChange={doi('tieu_de')} />
        <TextArea nhan="Nội dung" rows={5} value={f.noi_dung} onChange={doi('noi_dung')} />
        <div className="luoi-form">
          <Chon nhan="Loại" ds={['tin', 'chien_dich', 'uu_dai', 'lich', 'he_thong'].map((v) => ({ v, t: LOAI_TB[v] }))} giaTri={f.loai} onChon={doi('loai')} />
          <Field nhan="Liên kết khi bấm (không bắt buộc)" value={f.lien_ket} onChange={doi('lien_ket')} placeholder="/chien-dich, /san-pham/…, https://…" />
          <ONgayGio nhan="Hẹn giờ gửi (không bắt buộc)" giaTri={f.hen_gio} onDoi={doi('hen_gio')} goiY="Hệ thống kiểm tra mỗi 5 phút" />
          <DongSwitch nhan="Gửi kèm email" moTa="Chỉ gửi tới email đã xác thực & đang bật nhận" on={f.gui_email} onDoi={(v) => setF({ ...f, gui_email: v })} />
        </div>
        <div className="khoi-form"><h4>Gửi tới</h4><ChonDoiTuong giaTri={f.doi_tuong} onDoi={(v) => setF({ ...f, doi_tuong: v })} /></div>
      </div>
    </Modal>
  )
}

export function ThongBao() {
  const bao = useToast()
  const xn = useXacNhan()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_thong_bao_ds'), [])
  const [soan, setSoan] = useState(false)
  const [q, setQ] = useState('')
  const ds = (data || []).filter((b) => khop(b.tieu_de + ' ' + (b.noi_dung || ''), q))
  const xoa = async (b) => {
    if (!(await xn({ tieuDe: 'Hủy thông báo hẹn giờ?', moTa: b.tieu_de, nut: 'Hủy gửi', nguyHiem: true }))) return
    try { await rpc('fn_qt_thong_bao_xoa', { p_id: b.id }); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  const cot = [
    { k: 'tieu_de', t: 'Thông báo', o: (b) => <div className="cat" style={{ maxWidth: 360 }}><b>{b.tieu_de}</b><span className="nho muted cat" style={{ display: 'block' }}>{b.noi_dung}</span></div> },
    { k: 'loai', t: 'Loại', o: (b) => LOAI_TB[b.loai] },
    { k: 'doi_tuong', t: 'Gửi tới', sx: (b) => b.doi_tuong.length, o: (b) => moTaDT(b.doi_tuong) },
    { k: 'gui', t: 'Gửi lúc', canh: 'giua', sx: (b) => b.da_gui_luc || b.hen_gio, o: (b) => (b.da_gui_luc ? fmtNgayGio(b.da_gui_luc) : <span className="tag" style={{ background: '#EAF0FD', color: '#2E5BC9' }}><Clock size={11} />Hẹn {fmtNgayGio(b.hen_gio)}</span>) },
    { k: 'so_nguoi_nhan', t: 'Người nhận', canh: 'giua' },
    { k: 'da_doc', t: 'Đã đọc', canh: 'giua', o: (b) => (b.so_nguoi_nhan ? `${b.da_doc} (${Math.round((b.da_doc / b.so_nguoi_nhan) * 100)}%)` : '—') },
    { k: 'gui_email', t: 'Email', canh: 'giua', o: (b) => (b.gui_email ? <Mail size={15} /> : '—') },
    { k: 'tao_boi', t: 'Người gửi' },
    { k: 'tac', t: '', sx: false, o: (b) => !b.da_gui_luc && <Btn co="sm" kieu="trong" icon={Trash2} onClick={() => xoa(b)}>Hủy</Btn> }
  ]
  return (
    <>
      <TrangDau eyebrow="Truyền thông" tieuDe="Thông báo cộng đồng" phu="Gửi tin tới toàn bộ, theo nhóm, cấp độ, kinh nghiệm hoặc từng thành viên." phai={<Btn kieu="den" icon={Bell} onClick={() => setSoan(true)}>Soạn thông báo</Btn>} />
      <div className="toolbar"><OTim giaTri={q} onDoi={setQ} goiY="Tìm thông báo…" /></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : <BangDL cot={cot} ds={ds} macDinh={(b) => b.da_gui_luc || b.hen_gio || b.tao_luc} trong="Chưa gửi thông báo nào" />}
      {soan && <SoanTB dong={() => setSoan(false)} xong={() => { setSoan(false); reload(true) }} />}
    </>
  )
}

// ================= HỖ TRỢ =================
function CtHT({ id, dong, taiLai }) {
  const bao = useToast()
  const { data: h, loading, error, reload } = useAsync(() => rpc('fn_qt_ho_tro_ct', { p_id: id }), [id])
  const [chu, setChu] = useState('')
  const [dang, setDang] = useState('')
  const cuoi = useRef(null)
  useEffect(() => { cuoi.current?.scrollIntoView({ block: 'end' }) }, [h?.tra_loi?.length])
  const gui = async (dongLuon) => {
    setDang(dongLuon ? 'dong' : 'gui')
    try { await rpc('fn_qt_ho_tro_tra_loi', { p_id: id, p_noi_dung: chu, p_dong: dongLuon }); setChu(''); reload(true); taiLai() } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const doiTT = async (v) => { try { await rpc('fn_qt_ho_tro_trang_thai', { p_id: id, p_trang_thai: v }); reload(true); taiLai() } catch (e) { bao(e.message, 'loi') } }
  return (
    <Modal mo dong={dong} rong tieuDe={h ? h.tieu_de : 'Yêu cầu hỗ trợ'} moTa={h && `${h.ma} · ${LOAI_HO_TRO[h.loai]} · ${fmtNgayGio(h.tao_luc)}`}
      chan={h && h.trang_thai !== 'da_dong' && <><Btn kieu="vien" loading={dang === 'dong'} onClick={() => gui(true)}>{chu.trim() ? 'Gửi & đóng' : 'Đóng yêu cầu'}</Btn><Btn kieu="den" icon={Send} loading={dang === 'gui'} disabled={!chu.trim()} onClick={() => gui(false)}>Gửi trả lời</Btn></>}>
      {loading && !h ? <KhungTai dong={2} /> : error && !h ? <LoiTai loi={error} thuLai={reload} /> : h && (
        <div className="cot" style={{ gap: 14 }}>
          <div className="dong-tt"><span>Thành viên</span><span><b>{h.thanh_vien.ho_ten}</b> · {h.thanh_vien.ma} · <a href={'tel:' + h.thanh_vien.dien_thoai}>{h.thanh_vien.dien_thoai}</a> · {h.thanh_vien.email}</span></div>
          {h.lich && <div className="dong-tt"><span>Lịch liên quan</span><span><b>{h.lich.ma}</b> · {h.lich.gio} {fmtNgay(h.lich.ngay)} · {h.lich.cua_hang.ten} · <Nhan bang={TT_LICH} ma={h.lich.trang_thai} /></span></div>}
          <div className="hang wrap" style={{ gap: 8 }}><span className="nho muted">Trạng thái:</span><Chips co="sm" ds={Object.entries(TT_HO_TRO).map(([v, x]) => ({ v, t: x.ten }))} giaTri={h.trang_thai} onChon={doiTT} /></div>
          <div className="chat" style={{ maxHeight: 420, overflowY: 'auto', padding: 4 }}>
            {h.noi_dung && <div className="bong ho">{h.noi_dung}<small>{h.thanh_vien.ho_ten} · {fmtNgayGio(h.tao_luc)}</small></div>}
            {h.tra_loi.map((r) => <div key={r.id} className={'bong ' + (r.tu_nhan_su ? 'toi' : 'ho')}>{r.noi_dung}<small>{r.nguoi_ten} · {fmtNgayGio(r.luc)}</small></div>)}
            <div ref={cuoi} />
          </div>
          {h.trang_thai !== 'da_dong' ? <TextArea nhan="Trả lời thành viên (gửi kèm thông báo + email)" rows={4} value={chu} onChange={(e) => setChu(e.target.value)} />
            : <Bao kieu="xanh">Yêu cầu đã đóng. Đổi trạng thái để mở lại.</Bao>}
        </div>
      )}
    </Modal>
  )
}

export function HoTro() {
  const { taiCho } = useQt()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_ho_tro_ds'), [])
  const [tt, setTt] = useState('mo')
  const [q, setQ] = useState('')
  const [mo, setMo] = useState(null)
  const all = data || []
  const ds = all.filter((h) => (tt === 'mo' ? ['moi', 'dang_xu_ly'].includes(h.trang_thai) : !tt || h.trang_thai === tt) && khop(`${h.ma} ${h.tieu_de} ${h.ho_ten} ${h.ma_tv}`, q))
  const dem = (f) => all.filter(f).length
  const cot = [
    { k: 'ma', t: 'Mã', o: (h) => <b>{h.ma}</b> },
    { k: 'tieu_de', t: 'Tiêu đề', o: (h) => <span className="cat" style={{ maxWidth: 320, display: 'inline-block' }}>{h.tieu_de}</span> },
    { k: 'loai', t: 'Loại', o: (h) => LOAI_HO_TRO[h.loai] },
    { k: 'ho_ten', t: 'Thành viên', o: (h) => <span>{h.ho_ten} <span className="muted nho">{h.ma_tv}</span></span> },
    { k: 'so_tra_loi', t: 'Phản hồi', canh: 'giua' },
    { k: 'phu_trach', t: 'Phụ trách' },
    { k: 'cap_nhat_luc', t: 'Cập nhật', canh: 'giua', o: (h) => tuongDoi(h.cap_nhat_luc) },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (h) => <Nhan bang={TT_HO_TRO} ma={h.trang_thai} /> }
  ]
  return (
    <>
      <TrangDau eyebrow="Chăm sóc" tieuDe="Hỗ trợ thành viên" phu="Trả lời trực tiếp; thành viên nhận thông báo và email." />
      <div className="toolbar">
        <OTim giaTri={q} onDoi={setQ} goiY="Mã, tiêu đề, thành viên…" />
        <Chips co="sm" trang ds={[{ v: 'mo', t: 'Đang mở', dem: dem((h) => ['moi', 'dang_xu_ly'].includes(h.trang_thai)) }, { v: 'da_tra_loi', t: 'Đã trả lời', dem: dem((h) => h.trang_thai === 'da_tra_loi') }, { v: 'da_dong', t: 'Đã đóng' }, { v: '', t: 'Tất cả', dem: all.length }]} giaTri={tt} onChon={setTt} />
      </div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : <BangDL cot={cot} ds={ds} macDinh="cap_nhat_luc" onBam={(h) => setMo(h.id)} trong="Không có yêu cầu ở mục này" />}
      {mo && <CtHT id={mo} dong={() => setMo(null)} taiLai={() => { reload(true); taiCho() }} />}
    </>
  )
}

