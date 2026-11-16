import { useMemo, useState } from 'react'
import { BadgeCheck, Download, Lock, Mail, Plus, RefreshCw, Trash2, Unlock, Users, Pencil } from 'lucide-react'
import { Btn, Chips, Chon, DongSwitch, Empty, Field, KhungTai, LoiTai, Modal, Nhan, Segment, TextArea, TrangDau, useToast, useXacNhan } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc } from '../lib/api'
import { fmtNgay, fmtNgayGio, fmtNgayThu, khop, fmtSo } from '../lib/format'
import { KINH_NGHIEM, NEN_TANG, TT_BAI, TT_DANG_KY, TT_HO_TRO, TT_LICH } from '../lib/hang'
import { BangDL, OTim, lamMoiTuyChon, xuatExcel } from './chung'
import { useQt } from './Cong'
import { useCongKhai } from '../member/Cong'

export const MAU = ['#E0157E', '#A3004F', '#B88A2E', '#0E7F63', '#2E5BC9', '#B4461F', '#4A4452', '#8C8494']

const TT_TV = { hoat_dong: { ten: 'Hoạt động', bg: '#E3F5EE', fg: '#0E7F63' }, khoa: { ten: 'Đã khóa', bg: '#FDECEC', fg: '#B93838' } }

function TV360({ id, dong, nhomCap, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const ck = useCongKhai()
  const { data: t, loading, error, reload, setData } = useAsync(() => (id ? rpc('fn_qt_thanh_vien_ct', { p_id: id }) : Promise.resolve(null)), [id])
  const [tab, setTab] = useState('ho_so')
  const [dang, setDang] = useState(false)
  const doi = (k) => (e) => setData({ ...t, [k]: e.target ? e.target.value : e })
  const luu = async () => {
    setDang(true)
    try {
      await rpc('fn_qt_thanh_vien_luu', { p_id: t.id, p: {
        ho_ten: t.ho_ten, dien_thoai: t.dien_thoai, tinh_thanh: t.tinh_thanh, kinh_nghiem: t.kinh_nghiem, shopee_aff: t.shopee_aff,
        cap_do_id: t.cap_do_id, cap_do_tay: t.cap_do_tay, trang_thai: t.trang_thai, ly_do_khoa: t.ly_do_khoa, ghi_chu_noi_bo: t.ghi_chu_noi_bo, nhom: t.nhom } })
      bao('Đã lưu thành viên'); taiLai(); reload(true)
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xacThuc = async () => {
    if (!(await xn({ tieuDe: 'Xác thực email thủ công?', moTa: 'Dùng khi thành viên không nhận được thư. Thành viên sẽ dùng được đầy đủ tính năng.', nut: 'Xác thực' }))) return
    try { await rpc('fn_qt_xac_thuc_tay', { p_id: t.id }); bao('Đã xác thực'); reload(true); taiLai() } catch (e) { bao(e.message, 'loi') }
  }
  const guiLai = async () => { try { await rpc('fn_qt_gui_lai_xac_thuc', { p_id: t.id }); bao('Đã xếp thư xác nhận vào hàng gửi') } catch (e) { bao(e.message, 'loi') } }
  return (
    <Modal mo={!!id} dong={dong} rong={2} tieuDe={t ? t.ho_ten : 'Thành viên'} moTa={t && `${t.ma} · ${t.email} · tham gia ${fmtNgay(t.tao_luc)}`}
      chan={t && tab === 'ho_so' && <><Btn kieu="trong" onClick={dong}>Đóng</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu thay đổi</Btn></>}>
      {loading && !t ? <KhungTai dong={3} /> : error && !t ? <LoiTai loi={error} thuLai={reload} /> : t && (
        <div className="cot" style={{ gap: 14 }}>
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
            <div className="kpi"><span className="nhan">Chiến dịch</span><span className="so-lon" style={{ fontSize: 26 }}>{t.chi_so?.chien_dich || 0}</span></div>
            <div className="kpi xanh"><span className="nhan">Bài đạt</span><span className="so-lon" style={{ fontSize: 26 }}>{t.chi_so?.bai_dat || 0}</span></div>
            <div className="kpi vang"><span className="nhan">Buổi quay</span><span className="so-lon" style={{ fontSize: 26 }}>{t.chi_so?.buoi_quay || 0}</span></div>
            <div className="kpi"><span className="nhan">Xem / mở SP</span><span className="so-lon" style={{ fontSize: 26 }}>{t.hoat_dong?.xem_sp || 0}<small style={{ fontSize: 15, color: 'var(--muted)' }}> / {t.hoat_dong?.mo_shopee || 0}</small></span></div>
          </div>
          <div className="hang wrap" style={{ gap: 8 }}>
            {t.xac_thuc ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}><BadgeCheck size={12} />Email đã xác thực</span>
              : <><span className="tag" style={{ background: '#FDF3E3', color: '#8A5410' }}>Chưa xác thực email</span><Btn co="sm" kieu="mem" icon={Mail} onClick={guiLai}>Gửi lại thư</Btn><Btn co="sm" kieu="mem" icon={BadgeCheck} onClick={xacThuc}>Xác thực thủ công</Btn></>}
          </div>
          <Segment trang giaTri={tab} onChon={setTab} ds={[{ v: 'ho_so', t: 'Hồ sơ & phân loại' }, { v: 'hoat_dong', t: 'Hoạt động' }, { v: 'kenh', t: 'Kênh', dem: t.kenh.length }]} />
          {tab === 'ho_so' && (
            <div className="cot" style={{ gap: 12 }}>
              <div className="luoi-form">
                <Field nhan="Họ và tên" value={t.ho_ten || ''} onChange={doi('ho_ten')} />
                <Field nhan="Số điện thoại" value={t.dien_thoai || ''} onChange={doi('dien_thoai')} />
                <Chon nhan="Tỉnh / thành" ds={(ck?.tinh_thanh || []).map((x) => ({ v: x, t: x }))} giaTri={t.tinh_thanh} onChon={doi('tinh_thanh')} tim />
                <Field nhan="Shopee Affiliate" value={t.shopee_aff || ''} onChange={doi('shopee_aff')} />
                <Field nhan="Ngày sinh" value={fmtNgay(t.ngay_sinh)} disabled />
                <Chon nhan="Kinh nghiệm" ds={Object.entries(KINH_NGHIEM).map(([v, x]) => ({ v, t: x }))} giaTri={t.kinh_nghiem} onChon={doi('kinh_nghiem')} />
              </div>
              {t.gioi_thieu && <p className="nho muted-2" style={{ whiteSpace: 'pre-line' }}><b>Giới thiệu:</b> {t.gioi_thieu}</p>}
              <div className="khoi-form">
                <h4>Cấp độ</h4>
                <DongSwitch nhan="Đặt cấp độ thủ công" moTa={t.cap_do_tay ? 'Không tự lên/xuống cấp theo hoạt động' : 'Đang tự tính theo chiến dịch, bài đạt, buổi quay'} on={t.cap_do_tay} onDoi={(v) => setData({ ...t, cap_do_tay: v })} />
                {t.cap_do_tay && <Chon nhan="Cấp độ" ds={(nhomCap?.cap_do || []).map((c) => ({ v: c.id, t: c.ten }))} giaTri={t.cap_do_id} onChon={(v) => setData({ ...t, cap_do_id: v })} />}
                {!t.cap_do_tay && <p className="nho muted">Cấp hiện tại: <b>{t.cap_do?.ten || '—'}</b></p>}
                <h4>Nhóm</h4>
                <Chips co="sm" nhieu tick ds={(nhomCap?.nhom || []).map((g) => ({ v: g.id, t: g.ten }))} giaTri={t.nhom} onChon={(v) => setData({ ...t, nhom: v })} />
                {(nhomCap?.nhom || []).length === 0 && <p className="nho muted">Chưa có nhóm nào. Tạo ở mục Nhóm & cấp độ.</p>}
                <h4>Trạng thái</h4>
                <Chips co="sm" ds={[{ v: 'hoat_dong', t: 'Hoạt động' }, { v: 'khoa', t: 'Khóa tài khoản' }]} giaTri={t.trang_thai} onChon={(v) => setData({ ...t, trang_thai: v })} />
                {t.trang_thai === 'khoa' && <Field nhan="Lý do khóa (thành viên nhìn thấy)" value={t.ly_do_khoa || ''} onChange={doi('ly_do_khoa')} />}
                <TextArea nhan="Ghi chú nội bộ (chỉ đội Nón Sơn thấy)" rows={3} value={t.ghi_chu_noi_bo || ''} onChange={doi('ghi_chu_noi_bo')} />
              </div>
            </div>
          )}
          {tab === 'hoat_dong' && (
            <div className="cot" style={{ gap: 14 }}>
              <div className="khoi-form"><h4>Chiến dịch ({t.chien_dich.length})</h4>
                {t.chien_dich.length === 0 ? <p className="nho muted">Chưa tham gia.</p> : t.chien_dich.map((c) => <div key={c.id} className="dong-tt"><span>{fmtNgay(c.luc)}</span><span className="hang" style={{ justifyContent: 'space-between', gap: 8 }}><span className="cat">{c.ten}</span><Nhan bang={TT_DANG_KY} ma={c.trang_thai} /></span></div>)}</div>
              <div className="khoi-form"><h4>Lịch quay ({t.lich.length})</h4>
                {t.lich.length === 0 ? <p className="nho muted">Chưa đặt lịch.</p> : t.lich.map((l) => <div key={l.id} className="dong-tt"><span>{l.ma}</span><span className="hang" style={{ justifyContent: 'space-between', gap: 8 }}><span className="cat">{l.gio} {fmtNgayThu(l.ngay)} · {l.cua_hang}{l.khong_den ? ' · không đến' : ''}</span><Nhan bang={TT_LICH} ma={l.trang_thai} /></span></div>)}</div>
              <div className="khoi-form"><h4>Bài nộp ({t.bai_nop.length})</h4>
                {t.bai_nop.length === 0 ? <p className="nho muted">Chưa nộp bài.</p> : t.bai_nop.map((b) => <div key={b.id} className="dong-tt"><span>{fmtNgay(b.luc)}</span><span className="hang" style={{ justifyContent: 'space-between', gap: 8 }}><a href={b.link} target="_blank" rel="noreferrer" className="cat">{b.nhiem_vu} · {b.link}</a><Nhan bang={TT_BAI} ma={b.trang_thai} /></span></div>)}</div>
              <div className="khoi-form"><h4>Hỗ trợ ({t.ho_tro.length})</h4>
                {t.ho_tro.length === 0 ? <p className="nho muted">Không có.</p> : t.ho_tro.map((h) => <div key={h.id} className="dong-tt"><span>{h.ma}</span><span className="hang" style={{ justifyContent: 'space-between', gap: 8 }}><span className="cat">{h.tieu_de}</span><Nhan bang={TT_HO_TRO} ma={h.trang_thai} /></span></div>)}</div>
              <p className="nho muted">Đã lưu {t.yeu_thich} sản phẩm · xem {t.hoat_dong?.xem_tn || 0} tài nguyên · tải {t.hoat_dong?.tai_tn || 0} tệp · đăng nhập gần nhất {fmtNgayGio(t.dang_nhap_luc) || '—'}</p>
            </div>
          )}
          {tab === 'kenh' && (t.kenh.length === 0 ? <p className="nho muted">Thành viên chưa khai báo kênh.</p> : t.kenh.map((k) => (
            <div key={k.id} className="dong-tt"><span>{NEN_TANG[k.nen_tang] || k.nen_tang}</span><span>{k.ten_kenh || ''}{k.nguoi_theo_doi ? ` · ${fmtSo(k.nguoi_theo_doi)} theo dõi` : ''}{k.link && <> · <a href={k.link} target="_blank" rel="noreferrer">{k.link}</a></>}</span></div>
          )))}
        </div>
      )}
    </Modal>
  )
}

export function ThanhVien() {
  const bao = useToast()
  const xn = useXacNhan()
  const { ns } = useQt()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_qt_thanh_vien_ds'), [])
  const { data: nc } = useAsync(() => rpc('fn_qt_nhom_cap_do'), [])
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState({ cap: '', nhom: '', kn: '', xt: '', tt: '', tinh: '' })
  const [chon, setChon] = useState(new Set())
  const [mo, setMo] = useState(null)
  const qd = useDebounced(q, 200)
  const ds = data || []
  const dsTinh = useMemo(() => [...new Set(ds.map((t) => t.tinh_thanh).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [ds])
  const hien = useMemo(() => ds.filter((t) => khop(`${t.ho_ten} ${t.ma} ${t.email} ${t.dien_thoai} ${t.shopee_aff || ''}`, qd)
    && (!loc.cap || t.cap_do_id === loc.cap) && (!loc.nhom || t.nhom.some((g) => g.id === loc.nhom)) && (!loc.kn || t.kinh_nghiem === loc.kn)
    && (!loc.xt || (loc.xt === 'co') === t.xac_thuc) && (!loc.tt || t.trang_thai === loc.tt) && (!loc.tinh || t.tinh_thanh === loc.tinh)), [ds, qd, loc])
  const hangLoat = async (hd, gt) => {
    const ids = [...chon]
    if (hd === 'khoa') {
      const kq = await xn({ tieuDe: `Khóa ${ids.length} tài khoản?`, nut: 'Khóa', nguyHiem: true, nhapLyDo: true, nhanLyDo: 'Lý do (thành viên nhìn thấy)' })
      if (!kq) return
      gt = kq.ly_do
    }
    try { const n = await rpc('fn_qt_thanh_vien_hang_loat', { p_ids: ids, p_hanh_dong: hd, p_gia_tri: gt ?? null }); bao(`Đã cập nhật ${n} dòng`); setChon(new Set()); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  const xuat = () => xuatExcel('thanh-vien-affiliate-' + new Date().toISOString().slice(0, 10), hien.map((t, i) => ({
    STT: i + 1, 'Mã': t.ma, 'Họ tên': t.ho_ten, 'Email': t.email, 'Điện thoại': t.dien_thoai, 'Ngày sinh': fmtNgay(t.ngay_sinh), 'Tỉnh/thành': t.tinh_thanh || '',
    'Kinh nghiệm': KINH_NGHIEM[t.kinh_nghiem], 'Shopee Affiliate': t.shopee_aff || '', 'Cấp độ': t.cap_do || '', 'Nhóm': t.nhom.map((g) => g.ten).join(', '),
    'Kênh': t.kenh.map((k) => NEN_TANG[k] || k).join(', '), 'Chiến dịch': t.so_cd, 'Lịch quay': t.so_lich, 'Bài đạt': t.so_bai,
    'Xác thực': t.xac_thuc ? 'Có' : 'Chưa', 'Trạng thái': TT_TV[t.trang_thai]?.ten, 'Ngày tham gia': fmtNgay(t.tao_luc), 'Đăng nhập gần nhất': fmtNgay(t.dang_nhap_luc)
  })), 'Thành viên')
  const tuy = (k) => (v) => setLoc({ ...loc, [k]: v })
  const cot = [
    { k: 'ho_ten', t: 'Thành viên', o: (t) => <div className="ten-o"><span className="av sm" style={{ background: t.cap_do_mau || 'var(--soft)', color: t.cap_do_mau ? '#fff' : 'var(--ink)' }}>{t.ho_ten.split(' ').pop()[0]}</span><div className="gian"><b>{t.ho_ten}</b><span>{t.ma} · {t.email}</span></div></div> },
    { k: 'dien_thoai', t: 'Điện thoại' },
    { k: 'tinh_thanh', t: 'Tỉnh/thành' },
    { k: 'kinh_nghiem', t: 'Kinh nghiệm', o: (t) => (t.kinh_nghiem === 'moi' ? 'Người mới' : 'Có kinh nghiệm') },
    { k: 'cap_do', t: 'Cấp độ', o: (t) => t.cap_do && <span className="tag" style={{ background: (t.cap_do_mau || '#8C8494') + '1F', color: t.cap_do_mau }}>{t.cap_do}</span> },
    { k: 'nhom', t: 'Nhóm', sx: (t) => t.nhom.length, o: (t) => <span className="cat" style={{ maxWidth: 180, display: 'inline-block' }}>{t.nhom.map((g) => g.ten).join(', ')}</span> },
    { k: 'so_cd', t: 'CD', canh: 'giua' },
    { k: 'so_lich', t: 'Lịch', canh: 'giua' },
    { k: 'so_bai', t: 'Bài đạt', canh: 'giua' },
    { k: 'xac_thuc', t: 'Xác thực', canh: 'giua', o: (t) => (t.xac_thuc ? <BadgeCheck size={17} color="#0E7F63" /> : <span className="muted">—</span>) },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (t) => <Nhan bang={TT_TV} ma={t.trang_thai} /> },
    { k: 'tao_luc', t: 'Tham gia', canh: 'giua', o: (t) => fmtNgay(t.tao_luc) }
  ]
  const opt = (arr, all) => [{ v: '', t: all }, ...arr]
  return (
    <>
      <TrangDau eyebrow="Cộng đồng" tieuDe="Thành viên Affiliate" phu={`${fmtSo(ds.length)} thành viên · bấm một dòng để xem hồ sơ 360°`}
        phai={ns?.vai_tro === 'quan_tri' && <Btn kieu="vien" icon={Download} disabled={!hien.length} onClick={xuat}>Xuất Excel</Btn>} />
      <div className="toolbar">
        <OTim giaTri={q} onDoi={setQ} goiY="Tên, mã, email, SĐT…" />
        <Chon kieu="tron" ds={opt((nc?.cap_do || []).map((c) => ({ v: c.id, t: c.ten })), 'Mọi cấp độ')} giaTri={loc.cap} onChon={tuy('cap')} />
        <Chon kieu="tron" ds={opt((nc?.nhom || []).map((c) => ({ v: c.id, t: c.ten })), 'Mọi nhóm')} giaTri={loc.nhom} onChon={tuy('nhom')} />
        <Chon kieu="tron" ds={opt(Object.entries(KINH_NGHIEM).map(([v, t]) => ({ v, t })), 'Mọi kinh nghiệm')} giaTri={loc.kn} onChon={tuy('kn')} />
        <Chon kieu="tron" ds={opt(dsTinh.map((x) => ({ v: x, t: x })), 'Mọi tỉnh/thành')} giaTri={loc.tinh} onChon={tuy('tinh')} />
        <Chon kieu="tron" ds={[{ v: '', t: 'Xác thực: tất cả' }, { v: 'co', t: 'Đã xác thực' }, { v: 'chua', t: 'Chưa xác thực' }]} giaTri={loc.xt} onChon={tuy('xt')} />
        <Chon kieu="tron" ds={[{ v: '', t: 'Mọi trạng thái' }, { v: 'hoat_dong', t: 'Hoạt động' }, { v: 'khoa', t: 'Đã khóa' }]} giaTri={loc.tt} onChon={tuy('tt')} />
      </div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : <BangDL cot={cot} ds={hien} macDinh="tao_luc" onBam={(t) => setMo(t.id)} chon={chon} setChon={setChon} trong="Không có thành viên phù hợp" />}
      {chon.size > 0 && (
        <div className="thanh-chon">
          <b>Đã chọn {chon.size}</b>
          <div style={{ minWidth: 170 }}><Chon kieu="tron" ds={(nc?.nhom || []).map((g) => ({ v: g.id, t: g.ten }))} giaTri="" goiY="+ Thêm vào nhóm" onChon={(v) => hangLoat('them_nhom', v)} /></div>
          <div style={{ minWidth: 150 }}><Chon kieu="tron" ds={(nc?.nhom || []).map((g) => ({ v: g.id, t: g.ten }))} giaTri="" goiY="− Bỏ khỏi nhóm" onChon={(v) => hangLoat('bo_nhom', v)} /></div>
          <div style={{ minWidth: 150 }}><Chon kieu="tron" ds={(nc?.cap_do || []).map((g) => ({ v: g.id, t: g.ten }))} giaTri="" goiY="Đặt cấp độ" onChon={(v) => hangLoat('cap_do', v)} /></div>
          <Btn kieu="vien-sang" icon={Lock} onClick={() => hangLoat('khoa')}>Khóa</Btn>
          <Btn kieu="vien-sang" icon={Unlock} onClick={() => hangLoat('mo_khoa')}>Mở khóa</Btn>
          <Btn kieu="trong" style={{ color: '#fff' }} onClick={() => setChon(new Set())}>Bỏ chọn</Btn>
        </div>
      )}
      <TV360 id={mo} dong={() => setMo(null)} nhomCap={nc} taiLai={() => reload(true)} />
    </>
  )
}

// ================= NHÓM & CẤP ĐỘ =================
function ChonMau({ giaTri, onDoi }) {
  return <div className="hang wrap" style={{ gap: 8 }}>{MAU.map((m) => <button key={m} type="button" className={'o-mau' + (giaTri === m ? ' on' : '')} style={{ background: m }} aria-label={m} onClick={() => onDoi(m)} />)}</div>
}

export function NhomCapDo() {
  const bao = useToast()
  const xn = useXacNhan()
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_qt_nhom_cap_do'), [])
  const [nhom, setNhom] = useState(null)
  const [cap, setCap] = useState(null)
  const [dang, setDang] = useState(false)
  if (loading && !d) return <KhungTai />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const luuNhom = async () => {
    setDang(true)
    try { await rpc('fn_qt_nhom_luu', { p: nhom }); bao('Đã lưu nhóm'); setNhom(null); lamMoiTuyChon(); reload(true) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoaNhom = async (g) => {
    if (!(await xn({ tieuDe: `Xóa nhóm "${g.ten}"?`, moTa: `${g.so_tv} thành viên sẽ rời nhóm. Chiến dịch/ưu đãi nhắm tới nhóm này sẽ mất điều kiện nhóm.`, nut: 'Xóa', nguyHiem: true }))) return
    try { await rpc('fn_qt_nhom_xoa', { p_id: g.id }); lamMoiTuyChon(); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  const luuCap = async () => {
    setDang(true)
    try { await rpc('fn_qt_cap_do_luu', { p: cap }); bao('Đã lưu cấp độ'); setCap(null); lamMoiTuyChon(); reload(true) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoaCap = async (c) => {
    if (!(await xn({ tieuDe: `Xóa cấp "${c.ten}"?`, moTa: `${c.so_tv} thành viên đang ở cấp này sẽ được tính lại.`, nut: 'Xóa', nguyHiem: true }))) return
    try { await rpc('fn_qt_cap_do_xoa', { p_id: c.id }); await rpc('fn_qt_cap_do_tinh_lai'); lamMoiTuyChon(); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  const tinhLai = async () => {
    try { const n = await rpc('fn_qt_cap_do_tinh_lai'); bao(`Đã tính lại · ${n} thành viên đổi cấp`); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <>
      <TrangDau eyebrow="Phân loại" tieuDe="Nhóm & cấp độ" phu="Nhóm do đội Affiliate gán tay. Cấp độ tự tính theo hoạt động (trừ thành viên đặt thủ công)." />
      <div className="hai-cot">
        <section className="lon">
          <div className="muc-dau"><h2>Cấp độ thành viên</h2><div className="hang" style={{ gap: 8 }}><Btn co="sm" kieu="vien" icon={RefreshCw} onClick={tinhLai}>Tính lại tất cả</Btn><Btn co="sm" kieu="den" icon={Plus} onClick={() => setCap({ ten: '', mau: MAU[0], thu_tu: (d.cap_do.at(-1)?.thu_tu ?? 0) + 1, dk_chien_dich: 0, dk_bai_dat: 0, dk_buoi_quay: 0, mo_ta: '', quyen_loi: '' })}>Thêm cấp</Btn></div></div>
          <BangDL ds={d.cap_do} macDinh="thu_tu" chieu="tang" stt={false} demDong={false} onBam={(c) => setCap({ ...c })} trong="Chưa có cấp độ" cot={[
            { k: 'thu_tu', t: 'Thứ tự', canh: 'giua' },
            { k: 'ten', t: 'Cấp độ', chinh: true, o: (c) => <span className="hang" style={{ gap: 8 }}><i className="cham-mau" style={{ background: c.mau }} /><b>{c.ten}</b></span> },
            { k: 'dk_chien_dich', t: 'Chiến dịch', canh: 'giua', o: (c) => '≥ ' + c.dk_chien_dich },
            { k: 'dk_bai_dat', t: 'Bài đạt', canh: 'giua', o: (c) => '≥ ' + c.dk_bai_dat },
            { k: 'dk_buoi_quay', t: 'Buổi quay', canh: 'giua', o: (c) => '≥ ' + c.dk_buoi_quay },
            { k: 'so_tv', t: 'Thành viên', canh: 'giua', o: (c) => <b>{c.so_tv}</b> },
            { k: 'tac', t: '', sx: false, canh: 'phai', o: () => <Pencil size={15} className="muted" /> }
          ]} />
          <p className="nho muted">Thành viên đạt <b>đủ cả 3 điều kiện</b> của cấp cao nhất sẽ được xếp vào cấp đó. Điều kiện = 0 nghĩa là không yêu cầu.</p>
        </section>
        <section className="nho-cot">
          <div className="muc-dau"><h2>Nhóm</h2><Btn co="sm" kieu="den" icon={Plus} onClick={() => setNhom({ ten: '', mo_ta: '', mau: MAU[0] })}>Thêm nhóm</Btn></div>
          {d.nhom.length === 0 ? <Empty icon={Users} tieuDe="Chưa có nhóm">Tạo nhóm như “KOC tiềm năng” để nhắm chiến dịch, ưu đãi riêng.</Empty>
            : d.nhom.map((g) => (
              <div key={g.id} className="the-nhom">
                <i className="cham-mau" style={{ background: g.mau }} />
                <div className="gian" style={{ minWidth: 0 }}><b className="cat" style={{ display: 'block' }}>{g.ten}</b><span className="nho muted">{g.so_tv} thành viên{g.mo_ta ? ' · ' + g.mo_ta : ''}</span></div>
                <Btn co="sm" kieu="mem" icon={Pencil} onClick={() => setNhom({ ...g })}>Sửa</Btn>
                <Btn co="sm" kieu="trong" icon={Trash2} onClick={() => xoaNhom(g)} aria-label="Xóa nhóm" />
              </div>
            ))}
        </section>
      </div>
      <Modal mo={!!nhom} dong={() => setNhom(null)} tieuDe={nhom?.id ? 'Sửa nhóm' : 'Thêm nhóm'} chan={<><Btn kieu="trong" onClick={() => setNhom(null)}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luuNhom}>Lưu</Btn></>}>
        {nhom && <div className="cot" style={{ gap: 12 }}>
          <Field nhan="Tên nhóm" batBuoc value={nhom.ten} onChange={(e) => setNhom({ ...nhom, ten: e.target.value })} />
          <Field nhan="Mô tả" value={nhom.mo_ta || ''} onChange={(e) => setNhom({ ...nhom, mo_ta: e.target.value })} />
          <span className="nhan-nhom" style={{ margin: 0 }}>Màu nhận diện</span><ChonMau giaTri={nhom.mau} onDoi={(m) => setNhom({ ...nhom, mau: m })} />
        </div>}
      </Modal>
      <Modal mo={!!cap} dong={() => setCap(null)} tieuDe={cap?.id ? 'Sửa cấp độ' : 'Thêm cấp độ'} rong
        chan={<>{cap?.id && <Btn kieu="trong" icon={Trash2} style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={() => { const c = cap; setCap(null); xoaCap(c) }}>Xóa</Btn>}<Btn kieu="trong" onClick={() => setCap(null)}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luuCap}>Lưu</Btn></>}>
        {cap && <div className="cot" style={{ gap: 12 }}>
          <div className="luoi-form">
            <Field nhan="Tên cấp độ" batBuoc value={cap.ten} onChange={(e) => setCap({ ...cap, ten: e.target.value })} />
            <Field nhan="Thứ tự (cao hơn = cấp cao hơn)" inputMode="numeric" value={cap.thu_tu} onChange={(e) => setCap({ ...cap, thu_tu: e.target.value.replace(/\D/g, '') })} />
            <Field nhan="Số chiến dịch đã tham gia ≥" inputMode="numeric" value={cap.dk_chien_dich} onChange={(e) => setCap({ ...cap, dk_chien_dich: e.target.value.replace(/\D/g, '') })} />
            <Field nhan="Số bài đăng đạt ≥" inputMode="numeric" value={cap.dk_bai_dat} onChange={(e) => setCap({ ...cap, dk_bai_dat: e.target.value.replace(/\D/g, '') })} />
            <Field nhan="Số buổi quay hoàn thành ≥" inputMode="numeric" value={cap.dk_buoi_quay} onChange={(e) => setCap({ ...cap, dk_buoi_quay: e.target.value.replace(/\D/g, '') })} />
            <Field nhan="Mô tả ngắn" value={cap.mo_ta || ''} onChange={(e) => setCap({ ...cap, mo_ta: e.target.value })} />
          </div>
          <TextArea nhan="Quyền lợi của cấp (thành viên nhìn thấy)" rows={4} value={cap.quyen_loi || ''} onChange={(e) => setCap({ ...cap, quyen_loi: e.target.value })} />
          <span className="nhan-nhom" style={{ margin: 0 }}>Màu cấp</span><ChonMau giaTri={cap.mau} onDoi={(m) => setCap({ ...cap, mau: m })} />
        </div>}
      </Modal>
    </>
  )
}
