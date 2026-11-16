import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarRange, CheckCircle2, Link2, Lock, Megaphone, Send, Trash2, Users } from 'lucide-react'
import { Anh, Btn, Empty, Field, KhungTai, LoiTai, Md, Nhan, Segment, TrangDau, useToast, useXacNhan, Bao } from '../components/ui'
import { useAuth } from '../components/auth'
import { useAsync } from '../lib/hooks'
import { rpc } from '../lib/api'
import { conLai, fmtNgay, fmtNgayGio } from '../lib/format'
import { GIAI_DOAN, TT_DANG_KY, TT_BAI, NEN_TANG } from '../lib/hang'
import { TheSanPham } from './SanPham'

function khoangTG(c) {
  if (c.bat_dau && c.ket_thuc) return `${fmtNgay(c.bat_dau)} – ${fmtNgay(c.ket_thuc)}`
  if (c.ket_thuc) return 'Đến ' + fmtNgay(c.ket_thuc)
  if (c.bat_dau) return 'Từ ' + fmtNgay(c.bat_dau)
  return 'Thường xuyên'
}

export function TheChienDich({ c }) {
  return (
    <Link to={'/chien-dich/' + c.id} className="the-cd">
      <div className="bia">
        {c.anh_bia ? <Anh src={c.anh_bia} alt={c.ten} /> : <span className="chu-bia">{c.nen_tang === 'shopee' ? 'Shopee Affiliate' : c.nen_tang}</span>}
        <div className="tags">
          <Nhan bang={GIAI_DOAN} ma={c.giai_doan} />
          {c.rieng && <span className="tag rieng"><Lock size={11} />Dành riêng</span>}
          {c.cua_toi && <Nhan bang={TT_DANG_KY} ma={c.cua_toi} />}
        </div>
      </div>
      <div className="than">
        <h3>{c.ten}</h3>
        {c.tom_tat && <p className="tom">{c.tom_tat}</p>}
        <div className="chan">
          <span className="hang" style={{ gap: 5 }}><CalendarRange size={14} />{khoangTG(c)}</span>
          <span className="hang" style={{ gap: 5 }}><Users size={14} />{c.da_tham_gia}{c.so_suat ? '/' + c.so_suat : ''} tham gia</span>
        </div>
      </div>
    </Link>
  )
}

export function DsChienDich() {
  const { data, loading, error, reload } = useAsync(() => rpc('fn_chien_dich_ds'), [])
  const [tab, setTab] = useState('dang')
  const ds = data || []
  const loc = useMemo(() => ds.filter((c) =>
    tab === 'dang' ? c.giai_doan === 'dang_dien_ra' : tab === 'sap' ? c.giai_doan === 'sap_dien_ra' : tab === 'toi' ? ['da_tham_gia', 'cho_duyet'].includes(c.cua_toi) : c.giai_doan === 'da_ket_thuc'), [ds, tab])
  const dem = (f) => ds.filter(f).length
  return (
    <>
      <TrangDau eyebrow="Chiến dịch & chương trình" tieuDe="Chiến dịch Affiliate" phu="Đăng ký tham gia, nhận nhiệm vụ và quyền lợi của từng chương trình." />
      <div><Segment trang giaTri={tab} onChon={setTab} ds={[
        { v: 'dang', t: 'Đang diễn ra', dem: dem((c) => c.giai_doan === 'dang_dien_ra') },
        { v: 'sap', t: 'Sắp diễn ra', dem: dem((c) => c.giai_doan === 'sap_dien_ra') },
        { v: 'toi', t: 'Của tôi', dem: dem((c) => ['da_tham_gia', 'cho_duyet'].includes(c.cua_toi)) },
        { v: 'xong', t: 'Đã kết thúc' }]} /></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : loc.length === 0 ? <Empty icon={Megaphone} tieuDe="Chưa có chiến dịch ở mục này">Nón Sơn sẽ thông báo cho bạn khi có chương trình mới.</Empty>
          : <div className="luoi-cd">{loc.map((c) => <TheChienDich key={c.id} c={c} />)}</div>}
    </>
  )
}

function NhiemVu({ n, thamGia, ketThuc, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const [link, setLink] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [dang, setDang] = useState(false)
  const daNop = n.bai.filter((b) => ['cho_duyet', 'dat'].includes(b.trang_thai)).length
  const hetHan = n.han_nop && new Date(n.han_nop) < new Date()
  const nop = async () => {
    if (!/^https?:\/\/\S+\.\S+/.test(link.trim())) { bao('Dán link bài đăng hoặc video (bắt đầu bằng https://)', 'loi'); return }
    setDang(true)
    try { await rpc('fn_bai_nop', { p_nhiem_vu: n.id, p_link: link.trim(), p_ghi_chu: ghiChu }); setLink(''); setGhiChu(''); bao('Đã nộp bài, Nón Sơn sẽ kiểm tra sớm.'); taiLai() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoa = async (b) => {
    if (!(await xn({ tieuDe: 'Xóa bài nộp?', moTa: b.link, nut: 'Xóa', nguyHiem: true }))) return
    try { await rpc('fn_bai_nop_xoa', { p_id: b.id }); taiLai() } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <div className="card cot" style={{ gap: 10 }}>
      <div className="hang" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="logo-tron" style={{ background: daNop >= n.so_bai ? 'var(--ok)' : 'var(--nut-chinh)', width: 34, height: 34 }}>{daNop >= n.so_bai ? <CheckCircle2 size={17} /> : <Send size={15} />}</span>
        <div className="gian">
          <b style={{ fontSize: 15 }}>{n.ten}</b>
          <p className="nho muted-2" style={{ marginTop: 2 }}>Cần {n.so_bai} bài · đã nộp {daNop}{n.han_nop ? ` · hạn ${fmtNgayGio(n.han_nop)} (${conLai(n.han_nop)})` : ''}</p>
        </div>
      </div>
      {n.mo_ta && <Md chu={n.mo_ta} className="nho" />}
      {n.bai.map((b) => (
        <div key={b.id} className="dong-switch" style={{ alignItems: 'flex-start' }}>
          <div className="gian">
            <a href={b.link} target="_blank" rel="noreferrer" className="cat" style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{b.link}</a>
            <span>{NEN_TANG[b.nen_tang] || 'Liên kết'} · {fmtNgayGio(b.nop_luc)}</span>
            {b.gop_y && <span style={{ color: 'var(--info)', fontWeight: 600 }}>Góp ý: {b.gop_y}</span>}
          </div>
          <div className="cot" style={{ gap: 6, alignItems: 'flex-end' }}>
            <Nhan bang={TT_BAI} ma={b.trang_thai} />
            {['cho_duyet', 'can_sua'].includes(b.trang_thai) && <button type="button" className="lien-ket nho" onClick={() => xoa(b)}><Trash2 size={13} />Xóa</button>}
          </div>
        </div>
      ))}
      {thamGia && !ketThuc && !hetHan && (
        <div className="cot" style={{ gap: 8 }}>
          <Field kieu="gon" nhan="Link bài đăng / video" inputMode="url" placeholder="https://www.tiktok.com/@…" value={link} onChange={(e) => setLink(e.target.value)} />
          <Field kieu="gon" nhan="Ghi chú (không bắt buộc)" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          <Btn kieu="den" icon={Link2} loading={dang} onClick={nop}>Nộp bài</Btn>
        </div>
      )}
    </div>
  )
}

export function CtChienDich() {
  const { id } = useParams()
  const nav = useNavigate()
  const bao = useToast()
  const xn = useXacNhan()
  const { tv, taiToi } = useAuth()
  const { data: c, loading, error, reload } = useAsync(() => rpc('fn_chien_dich_ct', { p_id: id }), [id])
  const [dang, setDang] = useState(false)
  if (loading && !c) return <KhungTai />
  if (error && !c) return <LoiTai loi={error} thuLai={reload} />
  const ketThuc = c.giai_doan === 'da_ket_thuc'
  const thamGia = c.cua_toi === 'da_tham_gia'
  const dangKy = async () => {
    setDang(true)
    try {
      const tt = await rpc('fn_chien_dich_dang_ky', { p_id: c.id })
      bao(tt === 'da_tham_gia' ? 'Bạn đã tham gia chiến dịch!' : 'Đã gửi đăng ký, chờ Nón Sơn duyệt.', 'hong')
      reload(true); taiToi()
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const rut = async () => {
    if (!(await xn({ tieuDe: 'Rút khỏi chiến dịch?', moTa: 'Bạn có thể đăng ký lại khi chiến dịch còn mở.', nut: 'Rút', nguyHiem: true }))) return
    try { await rpc('fn_chien_dich_rut', { p_id: c.id }); reload(true) } catch (e) { bao(e.message, 'loi') }
  }
  const het = c.so_suat && c.da_tham_gia >= c.so_suat && !c.cua_toi
  return (
    <>
      <div><button type="button" className="lien-ket" onClick={() => nav(-1)}><ArrowLeft size={16} />Quay lại</button></div>
      <section className="hero-tv" style={{ padding: 0 }}>
        {c.anh_bia && <div style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: 0.35 }}><Anh src={c.anh_bia} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
        <div className="glow hong" style={{ width: 300, height: 300, right: -90, top: -130, opacity: 0.5 }} />
        <div style={{ padding: '24px 26px' }}>
          <div className="hang wrap" style={{ gap: 6 }}>
            <Nhan bang={GIAI_DOAN} ma={c.giai_doan} />
            {c.rieng && <span className="tag rieng"><Lock size={11} />Dành riêng cho bạn</span>}
            {c.cua_toi && <Nhan bang={TT_DANG_KY} ma={c.cua_toi} />}
          </div>
          <h1 style={{ marginTop: 12, fontWeight: 800 }}>{c.ten}</h1>
          {c.tom_tat && <p className="phu">{c.tom_tat}</p>}
          <div className="hang-so">
            <div className="o-so"><b style={{ fontSize: 16 }}>{khoangTG(c)}</b><span>Thời gian{!ketThuc && c.ket_thuc ? ' · ' + conLai(c.ket_thuc) : ''}</span></div>
            <div className="o-so"><b>{c.da_tham_gia}{c.so_suat ? <small style={{ fontSize: 14, opacity: .7 }}>/{c.so_suat}</small> : ''}</b><span>Thành viên tham gia</span></div>
            <div className="o-so"><b>{c.so_san_pham}</b><span>Sản phẩm áp dụng</span></div>
          </div>
          <div className="hang wrap" style={{ gap: 10, marginTop: 18 }}>
            {!c.cua_toi || c.cua_toi === 'da_rut'
              ? <Btn kieu="den" co="lg" loading={dang} disabled={ketThuc || het} onClick={dangKy}>{ketThuc ? 'Chiến dịch đã kết thúc' : het ? 'Đã đủ suất' : c.can_duyet ? 'Đăng ký tham gia' : 'Tham gia ngay'}</Btn>
              : c.cua_toi === 'tu_choi' ? <span className="nho" style={{ color: 'rgba(255,255,255,.8)' }}>Đăng ký chưa phù hợp{c.ly_do ? ': ' + c.ly_do : ''}</span>
                : <Btn kieu="vien-sang" onClick={rut}>Rút khỏi chiến dịch</Btn>}
            {!tv.email_xac_thuc && <span className="nho" style={{ color: '#FFD3E7' }}>Cần xác nhận email trước khi đăng ký.</span>}
          </div>
        </div>
      </section>
      {c.cua_toi === 'cho_duyet' && <Bao kieu="vang">Đăng ký của bạn đang chờ Nón Sơn duyệt. Bạn sẽ nhận thông báo khi có kết quả.</Bao>}
      <div className="hai-cot">
        <section className="lon">
          {c.noi_dung && <div className="card"><div className="dau-the"><h2>Nội dung chiến dịch</h2></div><Md chu={c.noi_dung} /></div>}
          {c.huong_dan && <div className="card"><div className="dau-the"><h2>Hướng dẫn thực hiện</h2></div><Md chu={c.huong_dan} /></div>}
          {(c.nhiem_vu || []).length > 0 && (
            <div className="cot" style={{ gap: 12 }}>
              <div className="muc-dau"><h2>Nhiệm vụ</h2>{!thamGia && <span className="phu">Tham gia chiến dịch để nộp bài</span>}</div>
              {c.nhiem_vu.map((n) => <NhiemVu key={n.id} n={n} thamGia={thamGia} ketThuc={ketThuc} taiLai={() => reload(true)} />)}
            </div>
          )}
          {(c.san_pham || []).length > 0 && (
            <div>
              <div className="muc-dau"><h2>Sản phẩm áp dụng</h2></div>
              <div className="luoi-sp">{c.san_pham.map((s) => <TheSanPham key={s.id} s={s} onClick={() => nav('/san-pham/' + s.id)} />)}</div>
            </div>
          )}
        </section>
        <section className="nho-cot">
          {c.quyen_loi && <div className="card"><div className="dau-the"><h2>Quyền lợi</h2></div><Md chu={c.quyen_loi} className="nho" /></div>}
          {c.dieu_kien && <div className="card"><div className="dau-the"><h2>Điều kiện tham gia</h2></div><Md chu={c.dieu_kien} className="nho" /></div>}
          {(c.tai_nguyen || []).length > 0 && (
            <div className="card"><div className="dau-the"><h2>Tài nguyên</h2></div>
              <div className="cot" style={{ gap: 6 }}>{c.tai_nguyen.map((r) => <Link key={r.id} to={'/tai-nguyen/' + r.id} className="lien-ket">{r.tieu_de}</Link>)}</div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
