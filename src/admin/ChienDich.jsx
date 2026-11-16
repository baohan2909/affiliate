import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, Check, Copy, ExternalLink, Gift, Plus, Trash2, X, Pencil, Users, FileCheck2, Lock } from 'lucide-react'
import { Anh, Bao, Btn, Chips, Chon, DongSwitch, Empty, Field, KhungTai, LoiTai, Modal, Nhan, Segment, TextArea, TrangDau, useToast, useXacNhan } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc } from '../lib/api'
import { fmtNgay, fmtNgayGio, khop, fmtSo } from '../lib/format'
import { GIAI_DOAN, TT_CD, TT_DANG_KY, TT_BAI, LOAI_UU_DAI, NEN_TANG, KINH_NGHIEM } from '../lib/hang'
import { BangDL, ChonDoiTuong, DsDong, ONgayGio, ONhapAnh, OTim, lamMoiTuyChon, useCauHinh, useTuyChon } from './chung'
import { useQt } from './Cong'

const moTaDT = (ds) => (!ds?.length || ds.some((d) => d.kieu === 'tat_ca') ? 'Tất cả' : ds.length + ' điều kiện')

function BaoDoiTuong({ loai, id, ten }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [email, setEmail] = useState(false)
  const gui = async () => {
    if (!(await xn({ tieuDe: 'Gửi thông báo cho đối tượng?', moTa: `“${ten}” sẽ xuất hiện trong mục Thông báo của các thành viên thuộc đối tượng${email ? ' và gửi email' : ''}.`, nut: 'Gửi ngay' }))) return
    try { await rpc('fn_qt_bao_muc', { p_loai: loai, p_id: id, p_email: email }); bao('Đã gửi thông báo', 'hong') } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <div className="hang wrap" style={{ gap: 10, padding: 12, borderRadius: 18, background: 'var(--soft)' }}>
      <Bell size={17} className="muted" />
      <span className="gian nho" style={{ minWidth: 160 }}>Báo cho thành viên thuộc đối tượng</span>
      <label className="hang nho" style={{ gap: 6, fontWeight: 600 }}><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} style={{ accentColor: '#E0157E' }} />Kèm email</label>
      <Btn co="sm" kieu="den" onClick={gui}>Gửi thông báo</Btn>
    </div>
  )
}

// ---------- Duyệt bài nộp ----------
export function DuyetBai({ chienDich, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_bai_nop_ds', { p_chien_dich: chienDich || null }), [chienDich])
  const [tt, setTt] = useState('cho_duyet')
  const [q, setQ] = useState('')
  const ds = (data || []).filter((b) => (!tt || b.trang_thai === tt) && khop(`${b.ho_ten} ${b.ma_tv} ${b.chien_dich} ${b.nhiem_vu} ${b.link}`, q))
  const duyet = async (b, trangThai) => {
    let gopY = null
    if (trangThai !== 'dat') {
      const kq = await xn({ tieuDe: trangThai === 'can_sua' ? 'Yêu cầu chỉnh sửa' : 'Đánh giá chưa đạt', moTa: b.link, nut: 'Gửi', nhapLyDo: true, batBuocLyDo: trangThai === 'can_sua', nhanLyDo: 'Góp ý cho thành viên' })
      if (!kq) return
      gopY = kq.ly_do
    }
    try {
      await rpc('fn_qt_bai_nop_duyet', { p_id: b.id, p_trang_thai: trangThai, p_gop_y: gopY })
      setData((d) => d.map((x) => (x.id === b.id ? { ...x, trang_thai: trangThai, gop_y: gopY, duyet_luc: new Date().toISOString() } : x)))
      taiLai?.()
    } catch (e) { bao(e.message, 'loi') }
  }
  const dem = (k) => (data || []).filter((b) => b.trang_thai === k).length
  const cot = [
    { k: 'ho_ten', t: 'Thành viên', o: (b) => <div className="gian"><b>{b.ho_ten}</b><span className="nho muted" style={{ display: 'block' }}>{b.ma_tv}</span></div> },
    !chienDich && { k: 'chien_dich', t: 'Chiến dịch', o: (b) => <span className="cat" style={{ maxWidth: 200, display: 'inline-block' }}>{b.chien_dich}</span> },
    { k: 'nhiem_vu', t: 'Nhiệm vụ', o: (b) => <span className="cat" style={{ maxWidth: 180, display: 'inline-block' }}>{b.nhiem_vu}</span> },
    { k: 'link', t: 'Bài đăng', sx: false, o: (b) => <a href={b.link} target="_blank" rel="noreferrer" className="hang" style={{ gap: 4, maxWidth: 240 }}><ExternalLink size={13} /><span className="cat">{NEN_TANG[b.nen_tang] || 'Link'} · {b.link.replace(/^https?:\/\//, '')}</span></a> },
    { k: 'nop_luc', t: 'Nộp lúc', canh: 'giua', o: (b) => fmtNgayGio(b.nop_luc) },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (b) => <span title={b.gop_y || ''}><Nhan bang={TT_BAI} ma={b.trang_thai} /></span> },
    { k: 'tac', t: 'Duyệt', sx: false, canh: 'phai', o: (b) => (
      <span className="hang" style={{ gap: 4, justifyContent: 'flex-end' }}>
        <Btn co="sm" kieu={b.trang_thai === 'dat' ? 'den' : 'mem'} icon={Check} onClick={() => duyet(b, 'dat')}>Đạt</Btn>
        <Btn co="sm" kieu="mem" onClick={() => duyet(b, 'can_sua')}>Cần sửa</Btn>
        <Btn co="sm" kieu="trong" onClick={() => duyet(b, 'khong_dat')}>Không đạt</Btn>
      </span>) }
  ].filter(Boolean)
  return (
    <div className="cot" style={{ gap: 12 }}>
      <div className="toolbar">
        <OTim giaTri={q} onDoi={setQ} goiY="Thành viên, nhiệm vụ, link…" />
        <Chips co="sm" trang ds={[{ v: 'cho_duyet', t: 'Chờ duyệt', dem: dem('cho_duyet') }, { v: 'can_sua', t: 'Cần sửa', dem: dem('can_sua') }, { v: 'dat', t: 'Đạt', dem: dem('dat') }, { v: 'khong_dat', t: 'Không đạt', dem: dem('khong_dat') }, { v: '', t: 'Tất cả' }]} giaTri={tt} onChon={setTt} />
      </div>
      {loading && !data ? <KhungTai dong={2} /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : <BangDL cot={cot} ds={ds} macDinh="nop_luc" trong="Không có bài nộp ở mục này" />}
    </div>
  )
}

function DangKy({ c, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [chon, setChon] = useState(new Set())
  const [tt, setTt] = useState(c.dang_ky.some((d) => d.trang_thai === 'cho_duyet') ? 'cho_duyet' : '')
  const ds = c.dang_ky.filter((d) => !tt || d.trang_thai === tt)
  const duyet = async (ids, trangThai) => {
    let lyDo = null
    if (trangThai === 'tu_choi') {
      const kq = await xn({ tieuDe: `Từ chối ${ids.length} đăng ký?`, nut: 'Từ chối', nguyHiem: true, nhapLyDo: true, nhanLyDo: 'Lý do (thành viên nhìn thấy)' })
      if (!kq) return
      lyDo = kq.ly_do
    }
    try { const n = await rpc('fn_qt_dang_ky_duyet', { p_ids: ids, p_trang_thai: trangThai, p_ly_do: lyDo }); bao(`Đã cập nhật ${n} đăng ký`); setChon(new Set()); taiLai() } catch (e) { bao(e.message, 'loi') }
  }
  const dem = (k) => c.dang_ky.filter((d) => d.trang_thai === k).length
  const cot = [
    { k: 'ho_ten', t: 'Thành viên', o: (d) => <div><b>{d.ho_ten}</b><span className="nho muted" style={{ display: 'block' }}>{d.ma} · {d.dien_thoai}</span></div> },
    { k: 'kinh_nghiem', t: 'Kinh nghiệm', o: (d) => KINH_NGHIEM[d.kinh_nghiem] },
    { k: 'cap_do', t: 'Cấp độ' },
    { k: 'luc', t: 'Đăng ký', canh: 'giua', o: (d) => fmtNgayGio(d.luc) },
    { k: 'so_bai', t: 'Bài nộp', canh: 'giua' },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (d) => <span title={d.ly_do || d.xu_ly_boi || ''}><Nhan bang={TT_DANG_KY} ma={d.trang_thai} /></span> },
    { k: 'tac', t: '', sx: false, canh: 'phai', o: (d) => d.trang_thai === 'cho_duyet' && <span className="hang" style={{ gap: 4, justifyContent: 'flex-end' }}><Btn co="sm" kieu="den" onClick={(e) => { e.stopPropagation(); duyet([d.id], 'da_tham_gia') }}>Duyệt</Btn><Btn co="sm" kieu="trong" onClick={(e) => { e.stopPropagation(); duyet([d.id], 'tu_choi') }}>Từ chối</Btn></span> }
  ]
  return (
    <div className="cot" style={{ gap: 12 }}>
      <Chips co="sm" trang ds={[{ v: 'cho_duyet', t: 'Chờ duyệt', dem: dem('cho_duyet') }, { v: 'da_tham_gia', t: 'Đã tham gia', dem: dem('da_tham_gia') }, { v: 'tu_choi', t: 'Từ chối', dem: dem('tu_choi') }, { v: 'da_rut', t: 'Đã rút', dem: dem('da_rut') }, { v: '', t: 'Tất cả', dem: c.dang_ky.length }]} giaTri={tt} onChon={setTt} />
      <BangDL cot={cot} ds={ds} macDinh="luc" chon={chon} setChon={setChon} trong="Chưa có đăng ký" />
      {chon.size > 0 && <div className="thanh-chon"><b>Đã chọn {chon.size}</b><Btn kieu="trang" onClick={() => duyet([...chon], 'da_tham_gia')}>Duyệt tham gia</Btn><Btn kieu="vien-sang" onClick={() => duyet([...chon], 'tu_choi')}>Từ chối</Btn><Btn kieu="trong" style={{ color: '#fff' }} onClick={() => setChon(new Set())}>Bỏ chọn</Btn></div>}
    </div>
  )
}

const CD_MOI = { ten: '', loai: 'thuong_xuyen', nen_tang: 'shopee', anh_bia: '', tom_tat: '', noi_dung: '', quyen_loi: '', dieu_kien: '', huong_dan: '', bat_dau: '', ket_thuc: '', trang_thai: 'nhap', can_duyet: false, so_suat: '', noi_bat: false, san_pham: [], doi_tuong: [], nhiem_vu: [] }

function SuaCD({ id, dong, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const ch = useCauHinh()
  const tc = useTuyChon()
  const [cdId, setCdId] = useState(id)
  const { data, loading, error, reload, setData: setF } = useAsync(() => (cdId ? rpc('fn_qt_chien_dich_ct', { p_id: cdId }) : Promise.resolve({ ...CD_MOI, dang_ky: [] })), [cdId])
  const f = data
  const [tab, setTab] = useState('thiet_lap')
  const [dang, setDang] = useState(false)
  if (loading && !f) return <Modal mo dong={dong} rong={2} tieuDe="Chiến dịch"><KhungTai dong={3} /></Modal>
  if (error && !f) return <Modal mo dong={dong} tieuDe="Chiến dịch"><LoiTai loi={error} thuLai={reload} /></Modal>
  const doi = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const luu = async (trangThai) => {
    setDang(true)
    try {
      const v = await rpc('fn_qt_chien_dich_luu', { p: { ...f, trang_thai: trangThai || f.trang_thai, san_pham: f.san_pham.map((s) => ({ id: s.id, hoa_hong: s.hoa_hong })), nhiem_vu: f.nhiem_vu } })
      bao(trangThai === 'cong_bo' ? 'Đã công bố chiến dịch' : 'Đã lưu chiến dịch', trangThai === 'cong_bo' ? 'hong' : 'ok')
      lamMoiTuyChon(); taiLai()
      if (!cdId) setCdId(v); else reload(true)
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const nhanBan = async () => {
    try { const v = await rpc('fn_qt_chien_dich_nhan_ban', { p_id: f.id }); bao('Đã nhân bản thành bản nháp'); taiLai(); setCdId(v); setTab('thiet_lap') } catch (e) { bao(e.message, 'loi') }
  }
  const xoa = async () => {
    if (!(await xn({ tieuDe: 'Xóa chiến dịch?', moTa: f.dang_ky.length ? 'Chiến dịch đã có đăng ký nên sẽ được ẨN thay vì xóa.' : 'Chiến dịch sẽ bị xóa vĩnh viễn.', nut: f.dang_ky.length ? 'Ẩn chiến dịch' : 'Xóa', nguyHiem: true }))) return
    try { const kq = await rpc('fn_qt_chien_dich_xoa', { p_id: f.id }); bao(kq === 'an' ? 'Đã ẩn chiến dịch' : 'Đã xóa chiến dịch'); taiLai(); dong() } catch (e) { bao(e.message, 'loi') }
  }
  const dsLoai = ch?.loai_chien_dich || [{ v: 'thuong_xuyen', t: 'Affiliate thường xuyên' }]
  const choDuyet = f.dang_ky?.filter((d) => d.trang_thai === 'cho_duyet').length || 0
  return (
    <Modal mo dong={dong} rong={2} tieuDe={f.id ? f.ten || 'Chiến dịch' : 'Tạo chiến dịch'} moTa={f.id && `${f.ma} · ${TT_CD[f.trang_thai]?.ten} · ${GIAI_DOAN[f.giai_doan]?.ten || ''}`}
      chan={tab === 'thiet_lap' && <>
        {f.id && <Btn kieu="trong" icon={Trash2} style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={xoa}>Xóa</Btn>}
        {f.id && <Btn kieu="trong" icon={Copy} onClick={nhanBan}>Nhân bản</Btn>}
        <Btn kieu="vien" loading={dang} onClick={() => luu()}>Lưu{f.trang_thai === 'nhap' ? ' nháp' : ''}</Btn>
        {f.trang_thai !== 'cong_bo' && <Btn kieu="den" loading={dang} onClick={() => luu('cong_bo')}>Công bố</Btn>}
      </>}>
      <div className="cot" style={{ gap: 14 }}>
        {f.id && <Segment trang giaTri={tab} onChon={setTab} ds={[{ v: 'thiet_lap', t: 'Thiết lập', icon: Pencil }, { v: 'dang_ky', t: 'Đăng ký', icon: Users, dem: choDuyet || f.dang_ky.length }, { v: 'bai', t: 'Bài nộp', icon: FileCheck2 }]} />}
        {tab === 'thiet_lap' && (
          <>
            <div className="khoi-form">
              <h4>Thông tin chung</h4>
              <div className="luoi-form">
                <div className="toan"><Field nhan="Tên chiến dịch" batBuoc value={f.ten} onChange={doi('ten')} /></div>
                <Chon nhan="Loại chiến dịch" ds={dsLoai} giaTri={f.loai} onChon={doi('loai')} />
                <Chon nhan="Nền tảng" ds={[{ v: 'shopee', t: 'Shopee' }, { v: 'tiktok', t: 'TikTok Shop' }, { v: 'lazada', t: 'Lazada' }, { v: 'da_kenh', t: 'Đa kênh' }]} giaTri={f.nen_tang} onChon={doi('nen_tang')} />
                <ONgayGio nhan="Bắt đầu" giaTri={f.bat_dau} onDoi={doi('bat_dau')} goiY="Để trống = bắt đầu ngay" />
                <ONgayGio nhan="Kết thúc" giaTri={f.ket_thuc} onDoi={doi('ket_thuc')} goiY="Để trống = không giới hạn" />
                <Field nhan="Số suất tối đa" inputMode="numeric" value={f.so_suat ?? ''} onChange={(e) => setF({ ...f, so_suat: e.target.value.replace(/\D/g, '') })} goiY="Để trống = không giới hạn" />
                <div className="cot" style={{ gap: 8 }}>
                  <DongSwitch nhan="Cần duyệt đăng ký" moTa={f.can_duyet ? 'Đội Affiliate duyệt từng người' : 'Thành viên tham gia ngay'} on={f.can_duyet} onDoi={(v) => setF({ ...f, can_duyet: v })} />
                  <DongSwitch nhan="Nổi bật" moTa="Ưu tiên ở trang chủ thành viên" on={f.noi_bat} onDoi={(v) => setF({ ...f, noi_bat: v })} />
                </div>
                <div className="toan"><TextArea nhan="Tóm tắt (hiện trên thẻ)" rows={2} value={f.tom_tat || ''} onChange={doi('tom_tat')} /></div>
              </div>
              <ONhapAnh nhan="Ảnh bìa (tỉ lệ 2:1)" rong giaTri={f.anh_bia} onDoi={(v) => setF({ ...f, anh_bia: v })} />
            </div>
            <div className="khoi-form">
              <h4>Ai được xem & tham gia</h4>
              <ChonDoiTuong giaTri={f.doi_tuong} onDoi={(v) => setF({ ...f, doi_tuong: v })} />
            </div>
            <div className="khoi-form">
              <h4>Sản phẩm áp dụng ({f.san_pham.length})</h4>
              <div style={{ maxWidth: 520 }}><Chon kieu="tron" tim goiY="+ Thêm sản phẩm" giaTri="" ds={(tc?.san_pham || []).filter((s) => !f.san_pham.some((x) => x.id === s.id)).map((s) => ({ v: s.id, t: s.ten, phu: s.ma }))}
                onChon={(v) => { const s = tc.san_pham.find((x) => x.id === v); setF({ ...f, san_pham: [...f.san_pham, { id: s.id, ten: s.ten, ma: s.ma, anh: s.anh, hoa_hong: '' }] }) }} /></div>
              {f.san_pham.map((s, i) => (
                <div key={s.id} className="hang" style={{ gap: 10, padding: '8px 10px', borderRadius: 16, background: 'var(--soft)' }}>
                  <span className="anh-nho" style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flex: 'none', background: '#fff' }}><Anh src={s.anh} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>
                  <div className="gian" style={{ minWidth: 0 }}><b className="cat nho" style={{ display: 'block' }}>{s.ten}</b><span className="nho muted">{s.ma}</span></div>
                  <div style={{ width: 150 }}><Field kieu="gon" nhan="Hoa hồng CD (%)" inputMode="decimal" value={s.hoa_hong ?? ''} onChange={(e) => setF({ ...f, san_pham: f.san_pham.map((x, j) => (j === i ? { ...x, hoa_hong: e.target.value.replace(/[^0-9.]/g, '') } : x)) })} /></div>
                  <button type="button" className="icon-btn xs mem" aria-label="Bỏ" onClick={() => setF({ ...f, san_pham: f.san_pham.filter((_, j) => j !== i) })}><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="khoi-form">
              <h4>Nội dung</h4>
              <TextArea nhan="Giới thiệu chiến dịch" rows={5} value={f.noi_dung || ''} onChange={doi('noi_dung')} goiY="Hỗ trợ ## tiêu đề, - gạch đầu dòng, **đậm**, [chữ](link)." />
              <div className="luoi-form">
                <TextArea nhan="Quyền lợi" rows={4} value={f.quyen_loi || ''} onChange={doi('quyen_loi')} />
                <TextArea nhan="Điều kiện tham gia" rows={4} value={f.dieu_kien || ''} onChange={doi('dieu_kien')} />
              </div>
              <TextArea nhan="Hướng dẫn thực hiện" rows={4} value={f.huong_dan || ''} onChange={doi('huong_dan')} />
            </div>
            <div className="khoi-form">
              <h4>Nhiệm vụ ({f.nhiem_vu.length})</h4>
              <DsDong ds={f.nhiem_vu} onDoi={(v) => setF({ ...f, nhiem_vu: v })} nutThem="Thêm nhiệm vụ" moi={() => ({ ten: '', mo_ta: '', han_nop: '', so_bai: 1 })}
                dong={(n, sua) => (
                  <div className="luoi-form">
                    <Field kieu="gon" nhan="Tên nhiệm vụ" value={n.ten} onChange={(e) => sua({ ten: e.target.value })} placeholder="VD: Đăng 1 video TikTok review sản phẩm" />
                    <Field kieu="gon" nhan="Số bài cần nộp" inputMode="numeric" value={n.so_bai} onChange={(e) => sua({ so_bai: e.target.value.replace(/\D/g, '') })} />
                    <ONgayGio nhan="Hạn nộp" giaTri={n.han_nop} onDoi={(v) => sua({ han_nop: v })} />
                    <Field kieu="gon" nhan="Mô tả / yêu cầu" value={n.mo_ta || ''} onChange={(e) => sua({ mo_ta: e.target.value })} />
                    {n.so_nop > 0 && <span className="nho muted toan">{n.so_nop} bài đã nộp · nhiệm vụ có bài nộp không bị xóa</span>}
                  </div>
                )} />
            </div>
            {f.id && f.trang_thai === 'cong_bo' && <BaoDoiTuong loai="chien_dich" id={f.id} ten={f.ten} />}
          </>
        )}
        {tab === 'dang_ky' && <DangKy c={f} taiLai={() => { reload(true); taiLai() }} />}
        {tab === 'bai' && <DuyetBai chienDich={f.id} taiLai={taiLai} />}
      </div>
    </Modal>
  )
}

export function ChienDich() {
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'ds'
  const { taiCho } = useQt()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_chien_dich_ds'), [])
  const [q, setQ] = useState('')
  const [tt, setTt] = useState('')
  const [mo, setMo] = useState(undefined)
  const qd = useDebounced(q, 200)
  const ds = data || []
  const loc = ds.filter((c) => khop(`${c.ten} ${c.ma}`, qd) && (!tt || (tt === 'nhap' || tt === 'an' ? c.trang_thai === tt : c.trang_thai === 'cong_bo' && c.giai_doan === tt)))
  const dem = (f) => ds.filter(f).length
  const cot = [
    { k: 'ten', t: 'Chiến dịch', o: (c) => <div className="ten-o"><span className="anh-nho"><Anh src={c.anh_bia} alt="" /></span><div className="gian"><b>{c.ten}</b><span>{c.ma}{c.noi_bat ? ' · Nổi bật' : ''}</span></div></div> },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (c) => <Nhan bang={TT_CD} ma={c.trang_thai} /> },
    { k: 'giai_doan', t: 'Giai đoạn', canh: 'giua', o: (c) => <Nhan bang={GIAI_DOAN} ma={c.giai_doan} /> },
    { k: 'bat_dau', t: 'Bắt đầu', canh: 'giua', o: (c) => fmtNgay(c.bat_dau) || '—' },
    { k: 'ket_thuc', t: 'Kết thúc', canh: 'giua', o: (c) => fmtNgay(c.ket_thuc) || '—' },
    { k: 'doi_tuong', t: 'Đối tượng', sx: (c) => c.doi_tuong.length, o: (c) => <span className="hang" style={{ gap: 4 }}>{c.doi_tuong.length > 0 && !c.doi_tuong.some((d) => d.kieu === 'tat_ca') && <Lock size={12} />}{moTaDT(c.doi_tuong)}</span> },
    { k: 'so_san_pham', t: 'SP', canh: 'giua' },
    { k: 'tham_gia', t: 'Tham gia', canh: 'giua', o: (c) => <b>{c.tham_gia}{c.so_suat ? '/' + c.so_suat : ''}</b> },
    { k: 'cho_duyet', t: 'Chờ duyệt', canh: 'giua', o: (c) => (c.cho_duyet ? <span className="tag" style={{ background: '#FDF3E3', color: '#8A5410' }}>{c.cho_duyet}</span> : '0') },
    { k: 'bai_cho', t: 'Bài chờ', canh: 'giua', o: (c) => (c.bai_cho ? <span className="tag" style={{ background: '#FDF3E3', color: '#8A5410' }}>{c.bai_cho}</span> : '0') }
  ]
  return (
    <>
      <TrangDau eyebrow="Cộng đồng" tieuDe="Chiến dịch Affiliate" phu="Tạo chương trình, chọn đối tượng, sản phẩm, nhiệm vụ; duyệt đăng ký và bài nộp."
        phai={<Btn kieu="den" icon={Plus} onClick={() => setMo(null)}>Tạo chiến dịch</Btn>} />
      <div><Segment trang giaTri={tab} onChon={(v) => setSp({ tab: v }, { replace: true })} ds={[{ v: 'ds', t: 'Chiến dịch', dem: ds.length }, { v: 'bai', t: 'Duyệt bài nộp', dem: ds.reduce((s, c) => s + c.bai_cho, 0) }]} /></div>
      {tab === 'bai' ? <DuyetBai taiLai={() => { reload(true); taiCho() }} /> : (
        <>
          <div className="toolbar">
            <OTim giaTri={q} onDoi={setQ} goiY="Tên, mã chiến dịch…" />
            <Chips co="sm" trang ds={[{ v: '', t: 'Tất cả', dem: ds.length }, { v: 'dang_dien_ra', t: 'Đang diễn ra', dem: dem((c) => c.trang_thai === 'cong_bo' && c.giai_doan === 'dang_dien_ra') }, { v: 'sap_dien_ra', t: 'Sắp diễn ra', dem: dem((c) => c.trang_thai === 'cong_bo' && c.giai_doan === 'sap_dien_ra') }, { v: 'da_ket_thuc', t: 'Đã kết thúc' }, { v: 'nhap', t: 'Nháp', dem: dem((c) => c.trang_thai === 'nhap') }, { v: 'an', t: 'Đã ẩn' }]} giaTri={tt} onChon={setTt} />
          </div>
          {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
            : ds.length === 0 ? <Empty icon={Gift} tieuDe="Chưa có chiến dịch" hanhDong={<Btn kieu="den" icon={Plus} onClick={() => setMo(null)}>Tạo chiến dịch đầu tiên</Btn>} />
              : <BangDL cot={cot} ds={loc} macDinh="tao_luc" onBam={(c) => setMo(c.id)} />}
        </>
      )}
      {mo !== undefined && <SuaCD id={mo} dong={() => setMo(undefined)} taiLai={() => { reload(true); taiCho() }} />}
    </>
  )
}

// ================= ƯU ĐÃI =================
const UD_MOI = { ten: '', loai: 'khac', mo_ta: '', chi_tiet: '', anh: '', lien_ket: '', bat_dau: '', ket_thuc: '', hien: true, doi_tuong: [] }

function SuaUD({ ud, dong, xong }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [f, setF] = useState(() => ({ ...UD_MOI, ...ud }))
  const [dang, setDang] = useState(false)
  const doi = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const luu = async () => {
    setDang(true)
    try { const id = await rpc('fn_qt_uu_dai_luu', { p: f }); setF({ ...f, id }); bao('Đã lưu ưu đãi'); xong(false) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoa = async () => {
    if (!(await xn({ tieuDe: 'Xóa ưu đãi?', moTa: f.ten, nut: 'Xóa', nguyHiem: true }))) return
    try { await rpc('fn_qt_uu_dai_xoa', { p_id: f.id }); xong(true) } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <Modal mo dong={dong} rong={2} tieuDe={f.id ? 'Sửa ưu đãi' : 'Tạo ưu đãi'}
      chan={<>{f.id && <Btn kieu="trong" icon={Trash2} style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={xoa}>Xóa</Btn>}<Btn kieu="trong" onClick={dong}>Đóng</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu ưu đãi</Btn></>}>
      <div className="cot" style={{ gap: 14 }}>
        <div className="luoi-form">
          <div className="toan"><Field nhan="Tên ưu đãi" batBuoc value={f.ten} onChange={doi('ten')} /></div>
          <Chon nhan="Loại ưu đãi" ds={Object.entries(LOAI_UU_DAI).map(([v, t]) => ({ v, t }))} giaTri={f.loai} onChon={doi('loai')} />
          <Field nhan="Liên kết (không bắt buộc)" value={f.lien_ket || ''} onChange={doi('lien_ket')} placeholder="/chien-dich/… hoặc https://…" />
          <ONgayGio nhan="Hiệu lực từ" giaTri={f.bat_dau} onDoi={doi('bat_dau')} />
          <ONgayGio nhan="Hiệu lực đến" giaTri={f.ket_thuc} onDoi={doi('ket_thuc')} />
          <div className="toan"><Field nhan="Mô tả ngắn" value={f.mo_ta || ''} onChange={doi('mo_ta')} /></div>
        </div>
        {f.loai === 'uu_tien_lich' && <Bao kieu="ok">Thành viên có ưu đãi này được đặt lịch quay xa hơn và sát giờ hơn (theo “Lịch mặc định” ở Hệ thống → Cấu hình).</Bao>}
        <TextArea nhan="Chi tiết & cách sử dụng" rows={4} value={f.chi_tiet || ''} onChange={doi('chi_tiet')} />
        <ONhapAnh nhan="Ảnh (không bắt buộc)" giaTri={f.anh} onDoi={(v) => setF({ ...f, anh: v })} />
        <div className="khoi-form"><h4>Dành cho</h4><ChonDoiTuong giaTri={f.doi_tuong} onDoi={(v) => setF({ ...f, doi_tuong: v })} /></div>
        <DongSwitch nhan="Hiển thị" on={f.hien} onDoi={(v) => setF({ ...f, hien: v })} />
        {f.id && f.hien && <BaoDoiTuong loai="uu_dai" id={f.id} ten={f.ten} />}
      </div>
    </Modal>
  )
}

export function UuDai() {
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_uu_dai_ds'), [])
  const [mo, setMo] = useState(null)
  const [q, setQ] = useState('')
  const ds = (data || []).filter((u) => khop(u.ten + ' ' + (u.mo_ta || ''), q))
  const cot = [
    { k: 'ten', t: 'Ưu đãi', o: (u) => <div><b>{u.ten}</b><span className="nho muted cat" style={{ display: 'block', maxWidth: 320 }}>{u.mo_ta}</span></div> },
    { k: 'loai', t: 'Loại', o: (u) => LOAI_UU_DAI[u.loai] },
    { k: 'doi_tuong', t: 'Dành cho', sx: (u) => u.doi_tuong.length, o: (u) => moTaDT(u.doi_tuong) },
    { k: 'bat_dau', t: 'Từ', canh: 'giua', o: (u) => fmtNgay(u.bat_dau) || '—' },
    { k: 'ket_thuc', t: 'Đến', canh: 'giua', o: (u) => fmtNgay(u.ket_thuc) || '—' },
    { k: 'con_hieu_luc', t: 'Hiệu lực', canh: 'giua', o: (u) => (u.con_hieu_luc ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}>Đang hiệu lực</span> : <span className="tag">Ngoài thời gian</span>) },
    { k: 'hien', t: 'Hiện', canh: 'giua', o: (u) => (u.hien ? 'Có' : 'Ẩn') }
  ]
  return (
    <>
      <TrangDau eyebrow="Quyền lợi" tieuDe="Ưu đãi thành viên" phu="Ưu đãi theo cá nhân, nhóm, cấp độ hoặc toàn cộng đồng." phai={<Btn kieu="den" icon={Plus} onClick={() => setMo({ ...UD_MOI })}>Tạo ưu đãi</Btn>} />
      <div className="toolbar"><OTim giaTri={q} onDoi={setQ} goiY="Tìm ưu đãi…" /><span className="nho muted">{fmtSo(ds.length)} ưu đãi</span></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : <BangDL cot={cot} ds={ds} macDinh="tao_luc" onBam={(u) => setMo(u)} trong="Chưa có ưu đãi" />}
      {mo && <SuaUD ud={mo} dong={() => setMo(null)} xong={(dongLai) => { reload(true); if (dongLai) setMo(null) }} />}
    </>
  )
}
