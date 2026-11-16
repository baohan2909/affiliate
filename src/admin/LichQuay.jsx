import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Check, CheckCheck, Copy, Download, KeyRound, MapPin, Navigation, Phone, Store, UserX, X, Plus, Save } from 'lucide-react'
import { Bao, Btn, Chips, Chon, DongSwitch, Empty, Field, KhungTai, LoiTai, Modal, Nhan, Segment, Switch, TextArea, TrangDau, useToast, useXacNhan, saoChep } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, taiKhoan } from '../lib/api'
import { congNgay, fmtNgay, fmtNgayGio, fmtNgayThu, homNay, khop, linkBanDo, fmtSo } from '../lib/format'
import { NHU_CAU, TT_LICH, KINH_NGHIEM } from '../lib/hang'
import { BangDL, OTim, lamMoiCauHinh, lamMoiTuyChon, taiCSV, useCauHinh, useTuyChon } from './chung'
import { useQt } from './Cong'

// ================= LỊCH QUAY =================
function CtLich({ l, dong, capNhat }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [dx, setDx] = useState(null)
  const [ghiChu, setGhiChu] = useState(l.ghi_chu_noi_bo || '')
  const [dang, setDang] = useState('')
  const lam = async (hanhDong, them = {}) => {
    setDang(hanhDong)
    try { const moi = await rpc('fn_qt_lich_xu_ly', { p_id: l.id, p: { hanh_dong: hanhDong, ...them } }); capNhat({ ...l, ...moi, ghi_chu_noi_bo: them.ghi_chu_noi_bo ?? l.ghi_chu_noi_bo }); bao('Đã cập nhật lịch ' + l.ma); setDx(null) } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const huy = async () => {
    const kq = await xn({ tieuDe: 'Hủy lịch ' + l.ma + '?', moTa: 'Thành viên sẽ nhận thông báo và email.', nut: 'Hủy lịch', nguyHiem: true, nhapLyDo: true, batBuocLyDo: true, nhanLyDo: 'Lý do hủy (thành viên nhìn thấy)' })
    if (kq) lam('huy', { ly_do: kq.ly_do })
  }
  const khongDen = async () => {
    const kq = await xn({ tieuDe: 'Đánh dấu không đến?', nut: 'Xác nhận', nguyHiem: true, nhapLyDo: true, nhanLyDo: 'Ghi chú (không bắt buộc)' })
    if (kq) lam('khong_den', { ly_do: kq.ly_do })
  }
  const t = l.thanh_vien
  const c = l.cua_hang
  const mo = ['cho_xac_nhan', 'da_xac_nhan', 'de_xuat_doi'].includes(l.trang_thai)
  return (
    <Modal mo dong={dong} rong tieuDe={'Lịch ' + l.ma} moTa={`Tạo ${fmtNgayGio(l.tao_luc)}`}
      chan={mo && <>
        <Btn kieu="trong" icon={X} onClick={huy} loading={dang === 'huy'} style={{ marginRight: 'auto', color: 'var(--err)' }}>Hủy lịch</Btn>
        {l.trang_thai !== 'da_xac_nhan' ? <>
          <Btn kieu="vien" icon={CalendarClock} onClick={() => setDx({ ngay: l.de_xuat_ngay || l.ngay, gio: l.de_xuat_gio || l.gio, ly_do: '' })}>Đề xuất đổi</Btn>
          <Btn kieu="den" icon={Check} loading={dang === 'xac_nhan'} onClick={() => lam('xac_nhan')}>Xác nhận</Btn>
        </> : <>
          <Btn kieu="vien" icon={CalendarClock} onClick={() => setDx({ ngay: l.ngay, gio: l.gio, ly_do: '' })}>Đổi lịch</Btn>
          <Btn kieu="vien" icon={UserX} loading={dang === 'khong_den'} onClick={khongDen}>Không đến</Btn>
          <Btn kieu="den" icon={CheckCheck} loading={dang === 'hoan_thanh'} onClick={() => lam('hoan_thanh')}>Hoàn thành</Btn>
        </>}
      </>}>
      <div className="cot" style={{ gap: 14 }}>
        <div className="hang wrap" style={{ gap: 8 }}><Nhan bang={TT_LICH} ma={l.trang_thai} lg />{l.khong_den && <span className="tag" style={{ background: '#FDECEC', color: '#B93838' }}>Không đến</span>}{l.da_den_luc && <span className="tag">Đến lúc {fmtNgayGio(l.da_den_luc)}</span>}</div>
        <div>
          <div className="dong-tt"><span>Thời gian</span><b>{l.gio} – {l.gio_ket_thuc} · {fmtNgayThu(l.ngay)}</b></div>
          {l.trang_thai === 'de_xuat_doi' && <div className="dong-tt"><span>Đã đề xuất</span><b style={{ color: 'var(--info)' }}>{l.de_xuat_gio} · {fmtNgayThu(l.de_xuat_ngay)} (chờ thành viên trả lời)</b></div>}
          <div className="dong-tt"><span>Cửa hàng</span><span><b>{c.ten}</b> · {c.ma}<br /><span className="nho muted-2">{c.dia_chi}</span>{linkBanDo(c) && <> · <a href={linkBanDo(c)} target="_blank" rel="noreferrer"><Navigation size={12} /> Bản đồ</a></>}</span></div>
          <div className="dong-tt"><span>Thành viên</span><span><b>{t.ho_ten}</b> · {t.ma}{t.cap_do ? ' · ' + t.cap_do : ''} · {KINH_NGHIEM[t.kinh_nghiem]}<br /><a href={'tel:' + t.dien_thoai}><Phone size={12} /> {t.dien_thoai}</a> · {t.email}</span></div>
          <div className="dong-tt"><span>Nhu cầu</span><span>{NHU_CAU[l.nhu_cau]} · {l.so_nguoi} người</span></div>
          {l.san_pham_quan_tam && <div className="dong-tt"><span>Sản phẩm quan tâm</span><span>{l.san_pham_quan_tam}</span></div>}
          {l.ghi_chu && <div className="dong-tt"><span>Ghi chú thành viên</span><span>{l.ghi_chu}</span></div>}
          {l.ghi_chu_cua_hang && <div className="dong-tt"><span>Ghi chú cửa hàng</span><span>{l.ghi_chu_cua_hang}</span></div>}
          {l.ly_do && <div className="dong-tt"><span>Lý do</span><span>{l.ly_do}</span></div>}
          {l.danh_gia_sao && <div className="dong-tt"><span>Đánh giá</span><span>{'★'.repeat(l.danh_gia_sao)}{'☆'.repeat(5 - l.danh_gia_sao)} {l.danh_gia_nhan_xet || ''}</span></div>}
        </div>
        {dx && (
          <div className="khoi-form" style={{ padding: 14, borderRadius: 20, background: 'var(--soft)' }}>
            <h4 style={{ marginTop: 0 }}>Đề xuất lịch mới</h4>
            <div className="luoi-form">
              <Field nhan="Ngày" type="date" value={dx.ngay} onChange={(e) => setDx({ ...dx, ngay: e.target.value })} />
              <Field nhan="Giờ" type="time" value={dx.gio} onChange={(e) => setDx({ ...dx, gio: e.target.value })} />
            </div>
            <Field nhan="Lý do (thành viên nhìn thấy)" value={dx.ly_do} onChange={(e) => setDx({ ...dx, ly_do: e.target.value })} />
            <div className="hang" style={{ gap: 8 }}><Btn kieu="den" loading={dang === 'de_xuat_doi'} onClick={() => lam('de_xuat_doi', dx)}>Gửi đề xuất</Btn><Btn kieu="trong" onClick={() => setDx(null)}>Bỏ</Btn></div>
          </div>
        )}
        <div className="khoi-form">
          <h4>Ghi chú nội bộ</h4>
          <TextArea nhan="Chỉ đội Nón Sơn thấy" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          <div><Btn co="sm" kieu="mem" icon={Save} loading={dang === 'ghi_chu'} disabled={ghiChu === (l.ghi_chu_noi_bo || '')} onClick={() => lam('ghi_chu', { ghi_chu_noi_bo: ghiChu })}>Lưu ghi chú</Btn></div>
        </div>
        <div className="khoi-form">
          <h4>Lịch sử</h4>
          {l.lich_su.map((h, i) => <div key={i} className="nho muted-2">• {fmtNgayGio(h.luc)} — {TT_LICH[h.den]?.ten || h.den}{h.ghi_chu ? ': ' + h.ghi_chu : ''} <span className="muted">({h.boi})</span></div>)}
        </div>
      </div>
    </Modal>
  )
}

export function LichQuay() {
  const bao = useToast()
  const { taiCho } = useQt()
  const tc = useTuyChon()
  const [tu, setTu] = useState(congNgay(homNay(), -7))
  const [den, setDen] = useState(congNgay(homNay(), 30))
  const [ch, setCh] = useState('')
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_lich_ds', { p: { tu, den, cua_hang_id: ch || null } }), [tu, den, ch])
  const [tt, setTt] = useState('cho_xac_nhan')
  const [q, setQ] = useState('')
  const [mo, setMo] = useState(null)
  const qd = useDebounced(q, 200)
  const ds = data || []
  const loc = ds.filter((l) => (!tt || l.trang_thai === tt) && khop(`${l.ma} ${l.thanh_vien.ho_ten} ${l.thanh_vien.dien_thoai} ${l.cua_hang.ten} ${l.cua_hang.ma}`, qd))
  const dem = (k) => ds.filter((l) => l.trang_thai === k).length
  const capNhat = (moi) => { setData((d) => d.map((x) => (x.id === moi.id ? { ...x, ...moi } : x))); setMo((m) => (m && m.id === moi.id ? { ...m, ...moi } : m)); taiCho() }
  const xacNhanNhanh = async (l) => {
    try { const moi = await rpc('fn_qt_lich_xu_ly', { p_id: l.id, p: { hanh_dong: 'xac_nhan' } }); capNhat({ ...l, ...moi }); bao('Đã xác nhận ' + l.ma) } catch (e) { bao(e.message, 'loi') }
  }
  const cot = [
    { k: 'ma', t: 'Mã', o: (l) => <b>{l.ma}</b> },
    { k: 'ngay', t: 'Thời gian', sx: (l) => l.ngay + l.gio, o: (l) => <span><b>{l.gio}</b> · {fmtNgayThu(l.ngay)}</span> },
    { k: 'tv', t: 'Thành viên', sx: (l) => l.thanh_vien.ho_ten, o: (l) => <div><b>{l.thanh_vien.ho_ten}</b><span className="nho muted" style={{ display: 'block' }}>{l.thanh_vien.dien_thoai}{l.thanh_vien.cap_do ? ' · ' + l.thanh_vien.cap_do : ''}</span></div> },
    { k: 'ch', t: 'Cửa hàng', sx: (l) => l.cua_hang.ten, o: (l) => <div className="cat" style={{ maxWidth: 240 }}><b>{l.cua_hang.ten}</b><span className="nho muted" style={{ display: 'block' }}>{l.cua_hang.khu_vuc}</span></div> },
    { k: 'nhu_cau', t: 'Nhu cầu', o: (l) => NHU_CAU[l.nhu_cau] },
    { k: 'so_nguoi', t: 'Người', canh: 'giua' },
    { k: 'trang_thai', t: 'Trạng thái', canh: 'giua', o: (l) => <Nhan bang={TT_LICH} ma={l.trang_thai} /> },
    { k: 'tac', t: '', sx: false, canh: 'phai', o: (l) => l.trang_thai === 'cho_xac_nhan' && <Btn co="sm" kieu="den" icon={Check} onClick={(e) => { e.stopPropagation(); xacNhanNhanh(l) }}>Xác nhận</Btn> }
  ]
  return (
    <>
      <TrangDau eyebrow="Điều phối" tieuDe="Lịch quay chụp tại cửa hàng" phu="Xác nhận, đề xuất đổi giờ, hủy hoặc đánh dấu hoàn thành. Thành viên nhận thông báo + email tự động." />
      <div className="toolbar">
        <OTim giaTri={q} onDoi={setQ} goiY="Mã lịch, tên, SĐT, cửa hàng…" />
        <div style={{ width: 160 }}><Field kieu="gon" nhan="Từ ngày" type="date" value={tu} onChange={(e) => setTu(e.target.value)} /></div>
        <div style={{ width: 160 }}><Field kieu="gon" nhan="Đến ngày" type="date" value={den} onChange={(e) => setDen(e.target.value)} /></div>
        <div style={{ minWidth: 220 }}><Chon kieu="tron" tim ds={[{ v: '', t: 'Tất cả cửa hàng' }, ...(tc?.cua_hang || []).filter((c) => c.nhan_quay).map((c) => ({ v: c.id, t: c.ten, phu: c.ma }))]} giaTri={ch} onChon={setCh} /></div>
      </div>
      <Chips co="sm" trang ds={[{ v: 'cho_xac_nhan', t: 'Chờ xác nhận', dem: dem('cho_xac_nhan') }, { v: 'de_xuat_doi', t: 'Đề xuất đổi', dem: dem('de_xuat_doi') }, { v: 'da_xac_nhan', t: 'Đã xác nhận', dem: dem('da_xac_nhan') }, { v: 'hoan_thanh', t: 'Hoàn thành', dem: dem('hoan_thanh') }, { v: 'da_huy', t: 'Đã hủy', dem: dem('da_huy') }, { v: '', t: 'Tất cả', dem: ds.length }]} giaTri={tt} onChon={setTt} />
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : <BangDL cot={cot} ds={loc} macDinh={(l) => l.ngay + l.gio} chieu="tang" onBam={setMo} trong="Không có lịch trong khoảng này" />}
      {mo && <CtLich key={mo.id + mo.trang_thai} l={mo} dong={() => setMo(null)} capNhat={capNhat} />}
    </>
  )
}

// ================= CỬA HÀNG =================
const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function SuaCH({ c, macDinh, dong, xong, laQT }) {
  const bao = useToast()
  const ck = useCauHinh()
  const [f, setF] = useState(() => ({ nhan_quay: c.nhan_quay, tinh_thanh: c.tinh_thanh || '', dien_thoai: c.dien_thoai || '', ghi_chu: c.ghi_chu || '',
    gio_mo: c.gio_mo?.slice(0, 5) || '', gio_dong: c.gio_dong?.slice(0, 5) || '', do_dai_khung: c.do_dai_khung ?? '', suc_chua: c.suc_chua ?? '',
    ngay_nghi: c.ngay_nghi || [], ngay_nghi_rieng: c.ngay_nghi_rieng || [] }))
  const [ngayMoi, setNgayMoi] = useState('')
  const [dang, setDang] = useState(false)
  const [mk, setMk] = useState(null)
  const luu = async () => {
    setDang(true)
    try { await rpc('fn_qt_cua_hang_luu', { p_id: c.id, p: f }); bao('Đã lưu cửa hàng'); lamMoiTuyChon(); xong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const capLaiMk = async () => {
    try { const kq = c.tai_khoan ? await taiKhoan('dat_mat_khau_nhan_su', { ma: c.ma }) : (await taiKhoan('cap_tk_cua_hang', { cua_hang: [{ id: c.id, ma: c.ma, ten: c.ten }] })).ds[0]; if (kq.loi) throw new Error(kq.loi); setMk(kq.mat_khau); xong(true) } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <Modal mo dong={dong} rong tieuDe={c.ten} moTa={`${c.ma} · ${c.khu_vuc || ''}`}
      chan={<><Btn kieu="trong" onClick={dong}>Đóng</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu</Btn></>}>
      <div className="cot" style={{ gap: 14 }}>
        <p className="nho muted-2"><MapPin size={13} style={{ verticalAlign: -2 }} /> {c.dia_chi || 'Chưa có địa chỉ'}{c.lat ? ` · ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : ' · chưa có tọa độ'}</p>
        <DongSwitch nhan="Nhận lịch quay chụp" moTa="Thành viên chỉ đặt được ở cửa hàng đang bật" on={f.nhan_quay} onDoi={(v) => setF({ ...f, nhan_quay: v })} />
        <div className="luoi-form">
          <Chon nhan="Tỉnh / thành (để lọc)" tim ds={(ck?.tinh_thanh || []).map((x) => ({ v: x, t: x }))} giaTri={f.tinh_thanh} onChon={(v) => setF({ ...f, tinh_thanh: v })} />
          <Field nhan="Điện thoại cửa hàng" value={f.dien_thoai} onChange={(e) => setF({ ...f, dien_thoai: e.target.value })} />
        </div>
        <div className="khoi-form">
          <h4>Khung giờ riêng (để trống = theo mặc định)</h4>
          <div className="luoi-form">
            <Field nhan="Giờ mở nhận" type="time" value={f.gio_mo} onChange={(e) => setF({ ...f, gio_mo: e.target.value })} goiY={'Mặc định ' + (macDinh.gio_mo || '')} />
            <Field nhan="Giờ kết thúc nhận" type="time" value={f.gio_dong} onChange={(e) => setF({ ...f, gio_dong: e.target.value })} goiY={'Mặc định ' + (macDinh.gio_dong || '')} />
            <Field nhan="Độ dài 1 khung (phút)" inputMode="numeric" value={f.do_dai_khung} onChange={(e) => setF({ ...f, do_dai_khung: e.target.value.replace(/\D/g, '') })} goiY={'Mặc định ' + (macDinh.do_dai || '') + ' phút'} />
            <Field nhan="Sức chứa mỗi khung (người)" inputMode="numeric" value={f.suc_chua} onChange={(e) => setF({ ...f, suc_chua: e.target.value.replace(/\D/g, '') })} goiY={'Mặc định ' + (macDinh.suc_chua || '') + ' người'} />
          </div>
          <span className="nhan-nhom" style={{ margin: '6px 0 0' }}>Thứ nghỉ hằng tuần</span>
          <Chips co="sm" nhieu tick ds={THU.map((t, i) => ({ v: i, t }))} giaTri={f.ngay_nghi} onChon={(v) => setF({ ...f, ngay_nghi: v })} />
          <span className="nhan-nhom" style={{ margin: '6px 0 0' }}>Ngày nghỉ riêng</span>
          <div className="hang wrap" style={{ gap: 6 }}>
            {f.ngay_nghi_rieng.map((d) => <span key={d} className="tag">{fmtNgay(d)}<button type="button" aria-label="Bỏ" style={{ border: 'none', background: 'none', padding: 0, marginLeft: 4 }} onClick={() => setF({ ...f, ngay_nghi_rieng: f.ngay_nghi_rieng.filter((x) => x !== d) })}><X size={11} /></button></span>)}
          </div>
          <div className="hang" style={{ gap: 8 }}><div style={{ width: 180 }}><Field kieu="gon" nhan="Thêm ngày" type="date" value={ngayMoi} onChange={(e) => setNgayMoi(e.target.value)} /></div><Btn co="sm" kieu="mem" icon={Plus} disabled={!ngayMoi} onClick={() => { if (!f.ngay_nghi_rieng.includes(ngayMoi)) setF({ ...f, ngay_nghi_rieng: [...f.ngay_nghi_rieng, ngayMoi].sort() }); setNgayMoi('') }}>Thêm</Btn></div>
        </div>
        <TextArea nhan="Ghi chú nội bộ" rows={2} value={f.ghi_chu} onChange={(e) => setF({ ...f, ghi_chu: e.target.value })} />
        <div className="khoi-form">
          <h4>Tài khoản cổng cửa hàng</h4>
          <p className="nho muted-2">{c.tai_khoan ? `Đã cấp · đăng nhập gần nhất ${fmtNgayGio(c.tai_khoan.dang_nhap_luc) || 'chưa có'}` : 'Chưa cấp tài khoản.'} Đăng nhập tại <b>/cuahang</b> bằng mã <b>{c.ma}</b>.</p>
          {laQT && <div><Btn co="sm" kieu="vien" icon={KeyRound} onClick={capLaiMk}>{c.tai_khoan ? 'Cấp lại mật khẩu' : 'Cấp tài khoản'}</Btn></div>}
          {mk && <Bao kieu="ok">Mật khẩu mới của <b>{c.ma}</b>: <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15 }}>{mk}</b> <button type="button" className="lien-ket nho" onClick={() => saoChep(mk).then(() => bao('Đã chép'))}><Copy size={12} />Chép</button><br />Chỉ hiện 1 lần — gửi cho cửa hàng ngay.</Bao>}
        </div>
      </div>
    </Modal>
  )
}

function QuyTacLich({ ch, laQT }) {
  const bao = useToast()
  const [f, setF] = useState(() => ({ ...(ch.lich_mac_dinh || {}) }))
  const [luuY, setLuuY] = useState(ch.luu_y_den_cua_hang || '')
  const [dang, setDang] = useState(false)
  const so = (k) => (e) => setF({ ...f, [k]: e.target.value.replace(/\D/g, '') === '' ? '' : Number(e.target.value.replace(/\D/g, '')) })
  const luu = async () => {
    setDang(true)
    try {
      if (laQT) await rpc('fn_qt_cau_hinh_luu', { p_khoa: 'lich_mac_dinh', p_gia_tri: f })
      await rpc('fn_qt_cau_hinh_luu', { p_khoa: 'luu_y_den_cua_hang', p_gia_tri: luuY })
      lamMoiCauHinh(); bao('Đã lưu quy tắc đặt lịch')
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="card cot" style={{ gap: 14 }}>
      <div className="dau-the"><h2>Quy tắc đặt lịch mặc định</h2></div>
      {!laQT && <Bao kieu="vang">Chỉ quản trị cấp cao sửa được khung giờ mặc định. Bạn vẫn sửa được lưu ý cho thành viên.</Bao>}
      <div className="luoi-form">
        <Field nhan="Giờ mở nhận" type="time" disabled={!laQT} value={f.gio_mo || ''} onChange={(e) => setF({ ...f, gio_mo: e.target.value })} />
        <Field nhan="Giờ kết thúc nhận" type="time" disabled={!laQT} value={f.gio_dong || ''} onChange={(e) => setF({ ...f, gio_dong: e.target.value })} />
        <Field nhan="Độ dài khung (phút)" disabled={!laQT} inputMode="numeric" value={f.do_dai ?? ''} onChange={so('do_dai')} />
        <Field nhan="Sức chứa mỗi khung (người)" disabled={!laQT} inputMode="numeric" value={f.suc_chua ?? ''} onChange={so('suc_chua')} />
        <Field nhan="Phải đặt trước tối thiểu (giờ)" disabled={!laQT} inputMode="numeric" value={f.dat_truoc_gio ?? ''} onChange={so('dat_truoc_gio')} />
        <Field nhan="Đặt xa tối đa (ngày)" disabled={!laQT} inputMode="numeric" value={f.toi_da_ngay ?? ''} onChange={so('toi_da_ngay')} />
        <Field nhan="Ưu tiên: đặt trước tối thiểu (giờ)" disabled={!laQT} inputMode="numeric" value={f.uu_tien_dat_truoc_gio ?? ''} onChange={so('uu_tien_dat_truoc_gio')} />
        <Field nhan="Ưu tiên: đặt xa tối đa (ngày)" disabled={!laQT} inputMode="numeric" value={f.uu_tien_toi_da_ngay ?? ''} onChange={so('uu_tien_toi_da_ngay')} />
      </div>
      <TextArea nhan="Lưu ý khi đến cửa hàng (gửi cho thành viên, mỗi dòng 1 ý)" rows={6} value={luuY} onChange={(e) => setLuuY(e.target.value)} />
      <div><Btn kieu="den" icon={Save} loading={dang} onClick={luu}>Lưu quy tắc</Btn></div>
    </div>
  )
}

function KhachKhongLich() {
  const bao = useToast()
  const { taiCho } = useQt()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_khach_khong_lich'), [])
  const xuLy = async (k) => {
    try { await rpc('fn_qt_khach_khong_lich_xu_ly', { p_id: k.id }); setData((d) => d.map((x) => (x.id === k.id ? { ...x, da_xu_ly: true } : x))); taiCho() } catch (e) { bao(e.message, 'loi') }
  }
  if (loading && !data) return <KhungTai />
  if (error && !data) return <LoiTai loi={error} thuLai={reload} />
  const cot = [
    { k: 'luc', t: 'Thời điểm', canh: 'giua', o: (k) => fmtNgayGio(k.luc) },
    { k: 'cua_hang', t: 'Cửa hàng' },
    { k: 'ten', t: 'Khách' },
    { k: 'dien_thoai', t: 'Điện thoại' },
    { k: 'ghi_chu', t: 'Ghi chú', o: (k) => <span className="cat" style={{ maxWidth: 260, display: 'inline-block' }}>{k.ghi_chu}</span> },
    { k: 'bao_boi', t: 'Báo bởi' },
    { k: 'da_xu_ly', t: 'Xử lý', canh: 'giua', o: (k) => (k.da_xu_ly ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}>Đã xử lý</span> : <Btn co="sm" kieu="den" onClick={() => xuLy(k)}>Đánh dấu đã xử lý</Btn>) }
  ]
  return <BangDL cot={cot} ds={data} macDinh="luc" trong="Chưa có báo cáo khách đến không đặt lịch" />
}

export function CuaHang() {
  const bao = useToast()
  const xn = useXacNhan()
  const { ns } = useQt()
  const laQT = ns?.vai_tro === 'quan_tri'
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'ds'
  const ck = useCauHinh()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_cua_hang_ds'), [])
  const [q, setQ] = useState('')
  const [kv, setKv] = useState('')
  const [nq, setNq] = useState('')
  const [chon, setChon] = useState(new Set())
  const [mo, setMo] = useState(null)
  const [capKq, setCapKq] = useState(null)
  const [dangCap, setDangCap] = useState(false)
  const qd = useDebounced(q, 200)
  const ds = data?.ds || []
  const dsKv = useMemo(() => [...new Set(ds.map((c) => c.khu_vuc).filter(Boolean))].sort(), [ds])
  const loc = ds.filter((c) => khop(`${c.ma} ${c.ten} ${c.dia_chi || ''} ${c.tinh_thanh || ''}`, qd) && (!kv || c.khu_vuc === kv)
    && (!nq || (nq === 'bat' ? c.nhan_quay : nq === 'tat' ? !c.nhan_quay && c.hoat_dong : nq === 'tk' ? !!c.tai_khoan : nq === 'chua_tk' ? !c.tai_khoan : !c.hoat_dong)))
  const batNQ = async (ids, bat) => {
    try { const n = await rpc('fn_qt_cua_hang_nhan_quay', { p_ids: ids, p_bat: bat }); setData((d) => ({ ...d, ds: d.ds.map((x) => (ids.includes(x.id) ? { ...x, nhan_quay: bat } : x)) })); bao(`${bat ? 'Bật' : 'Tắt'} nhận lịch ${n} cửa hàng`); lamMoiTuyChon() } catch (e) { bao(e.message, 'loi') }
  }
  const capTK = async () => {
    const dsCh = ds.filter((c) => chon.has(c.id))
    const coSan = dsCh.filter((c) => c.tai_khoan).length
    if (!(await xn({ tieuDe: `Cấp tài khoản cho ${dsCh.length} cửa hàng?`, moTa: coSan ? `${coSan} cửa hàng đã có tài khoản sẽ được ĐẶT LẠI mật khẩu.` : 'Mỗi cửa hàng nhận 1 mật khẩu ngẫu nhiên, chỉ hiện 1 lần.', nut: 'Cấp tài khoản' }))) return
    setDangCap(true)
    try { const kq = await taiKhoan('cap_tk_cua_hang', { cua_hang: dsCh.map((c) => ({ id: c.id, ma: c.ma, ten: c.ten })) }); setCapKq(kq.ds); setChon(new Set()); reload(true) } catch (e) { bao(e.message, 'loi') } finally { setDangCap(false) }
  }
  const cot = [
    { k: 'ma', t: 'Mã', o: (c) => <b>{c.ma}</b> },
    { k: 'ten', t: 'Cửa hàng', o: (c) => <div className="cat" style={{ maxWidth: 300 }}><b>{c.ten}</b><span className="nho muted cat" style={{ display: 'block' }}>{c.dia_chi || '— chưa có địa chỉ —'}</span></div> },
    { k: 'khu_vuc', t: 'Khu vực' },
    { k: 'tinh_thanh', t: 'Tỉnh/thành' },
    { k: 'hoat_dong', t: 'Hoạt động', canh: 'giua', o: (c) => (c.hoat_dong ? 'Có' : <span className="muted">Ngừng</span>) },
    { k: 'nhan_quay', t: 'Nhận lịch', canh: 'giua', o: (c) => <span onClick={(e) => e.stopPropagation()}><Switch on={c.nhan_quay} nhan="Nhận lịch" onDoi={(v) => batNQ([c.id], v)} /></span> },
    { k: 'lich_sap_toi', t: 'Sắp tới', canh: 'giua' },
    { k: 'so_lich', t: 'Tổng lịch', canh: 'giua' },
    { k: 'tai_khoan', t: 'Tài khoản', canh: 'giua', sx: (c) => (c.tai_khoan ? 1 : 0), o: (c) => (c.tai_khoan ? <span className="tag" style={{ background: '#E3F5EE', color: '#0E7F63' }}>Đã cấp</span> : <span className="muted">—</span>) }
  ]
  return (
    <>
      <TrangDau eyebrow="Mạng lưới" tieuDe="Cửa hàng nhận quay chụp" phu={`${ds.length} cửa hàng · ${ds.filter((c) => c.nhan_quay).length} đang nhận lịch · đồng bộ ${fmtNgayGio(data?.dong_bo) || 'chưa có'}`} />
      <div><Segment trang giaTri={tab} onChon={(v) => setSp({ tab: v }, { replace: true })} ds={[{ v: 'ds', t: 'Cửa hàng' }, { v: 'khach', t: 'Khách không đặt lịch' }, { v: 'quy_tac', t: 'Quy tắc đặt lịch' }]} /></div>
      {tab === 'khach' && <KhachKhongLich />}
      {tab === 'quy_tac' && (ck ? <QuyTacLich ch={ck} laQT={laQT} /> : <KhungTai dong={2} />)}
      {tab === 'ds' && (loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : <>
        <div className="toolbar">
          <OTim giaTri={q} onDoi={setQ} goiY="Mã, tên, địa chỉ…" />
          <Chon kieu="tron" ds={[{ v: '', t: 'Mọi khu vực' }, ...dsKv.map((x) => ({ v: x, t: x }))]} giaTri={kv} onChon={setKv} />
          <Chips co="sm" trang ds={[{ v: '', t: 'Tất cả' }, { v: 'bat', t: 'Đang nhận lịch' }, { v: 'tat', t: 'Chưa nhận' }, { v: 'tk', t: 'Có tài khoản' }, { v: 'chua_tk', t: 'Chưa có TK' }, { v: 'ngung', t: 'Ngừng hoạt động' }]} giaTri={nq} onChon={setNq} />
        </div>
        <BangDL cot={cot} ds={loc} macDinh="khu_vuc" chieu="tang" onBam={setMo} chon={chon} setChon={setChon} gioiHan={300} />
        {chon.size > 0 && (
          <div className="thanh-chon">
            <b>Đã chọn {chon.size}</b>
            <Btn kieu="trang" onClick={() => batNQ([...chon], true)}>Bật nhận lịch</Btn>
            <Btn kieu="vien-sang" onClick={() => batNQ([...chon], false)}>Tắt nhận lịch</Btn>
            {laQT && <Btn kieu="vien-sang" icon={KeyRound} loading={dangCap} onClick={capTK}>Cấp tài khoản</Btn>}
            <Btn kieu="trong" style={{ color: '#fff' }} onClick={() => setChon(new Set())}>Bỏ chọn</Btn>
          </div>
        )}
      </>)}
      {mo && <SuaCH c={mo} macDinh={data?.mac_dinh || {}} laQT={laQT} dong={() => setMo(null)} xong={(giu) => { reload(true); if (!giu) setMo(null) }} />}
      <Modal mo={!!capKq} dong={() => setCapKq(null)} rong tieuDe="Tài khoản cửa hàng vừa cấp" moTa="Mật khẩu chỉ hiển thị lần này. Tải CSV và gửi cho từng cửa hàng."
        chan={<><Btn kieu="vien" icon={Download} onClick={() => taiCSV('tai-khoan-cua-hang-' + homNay() + '.csv', capKq.map((x) => ({ 'Mã cửa hàng': x.ma, 'Tên': x.ten, 'Mật khẩu': x.mat_khau || '', 'Lỗi': x.loi || '', 'Đăng nhập tại': location.origin + import.meta.env.BASE_URL + 'cuahang' })))}>Tải CSV</Btn><Btn kieu="den" onClick={() => setCapKq(null)}>Xong</Btn></>}>
        {capKq && <div className="bang-cuon"><table className="bang"><thead><tr><th>Mã</th><th>Cửa hàng</th><th>Mật khẩu</th></tr></thead><tbody>
          {capKq.map((x) => <tr key={x.ma}><td><b>{x.ma}</b></td><td className="cat" style={{ maxWidth: 260 }}>{x.ten}</td><td>{x.loi ? <span style={{ color: 'var(--err)' }}>{x.loi}</span> : <code style={{ fontSize: 14 }}>{x.mat_khau}</code>}</td></tr>)}
        </tbody></table></div>}
      </Modal>
    </>
  )
}
