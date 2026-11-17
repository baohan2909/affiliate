import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bell, BookOpen, CalendarDays, CheckCheck, Download, ExternalLink, FileText, Film, Gift, Heart, Image as IcAnh, KeyRound, LifeBuoy, Link2, Lock, LogOut, Megaphone, Pin, Plus, ScrollText, Search, Send, ShieldCheck, ChevronRight, Star, Trash2, UserRound
} from 'lucide-react'
import { CaiDatApp, TheCaiApp } from '../components/caidat'
import { KetNoiShopee } from './SanPham'
import { Anh, Bao, Btn, Chips, Chon, DongSwitch, Empty, Field, KhungTai, LoiTai, Md, Modal, Nhan, Segment, TextArea, ThanhTienDo, useToast } from '../components/ui'
import DauTrang from './DauTrang'
import { useAuth } from '../components/auth'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, linkTai, doiMatKhau } from '../lib/api'
import { fmtDungLuong, fmtNgay, fmtNgayGio, fmtNgayThu, khop, tuongDoi, chuCai } from '../lib/format'
import { LOAI_UU_DAI, LOAI_TN, LOAI_HO_TRO, TT_HO_TRO, TT_LICH, TT_BAI, TT_DANG_KY, NEN_TANG, KINH_NGHIEM, LOAI_TB } from '../lib/hang'
import { useCongKhai } from './Cong'
import { ChuQuyTac } from './QuyTac'
import { canDongYQT } from '../lib/quytac'

const moLienKet = (nav, url) => {
  if (!url) return
  if (/^https?:\/\//.test(url)) window.open(url, '_blank', 'noopener')
  else nav(url)
}

// ================= ƯU ĐÃI =================
export function UuDai() {
  const nav = useNavigate()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_uu_dai_cua_toi'), [])
  const [tab, setTab] = useState('dang')
  const [mo, setMo] = useState(null)
  const ds = data || []
  const nhom = { dang: ds.filter((u) => u.con_hieu_luc), sap: ds.filter((u) => u.sap_toi), het: ds.filter((u) => !u.con_hieu_luc && !u.sap_toi) }
  const hien = nhom[tab]
  return (
    <>
      <DauTrang lui="/toi" luiDt tieu="Ưu đãi của tôi" phu="Theo cấp độ, nhóm hoặc riêng bạn"
        duoi={<Segment giaTri={tab} onChon={setTab} ds={[{ v: 'dang', t: 'Đang hiệu lực', dem: nhom.dang.length }, { v: 'sap', t: 'Sắp tới', dem: nhom.sap.length }, { v: 'het', t: 'Đã hết hạn' }]} />} />
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : hien.length === 0 ? <Empty icon={Gift} tieuDe="Chưa có ưu đãi ở mục này">Tích cực tham gia chiến dịch để lên cấp và nhận thêm quyền lợi.</Empty>
          : <div className="luoi-cd">{hien.map((u) => (
              <button key={u.id} type="button" className={'the-ud' + (u.rieng ? ' rieng' : '') + (tab === 'het' ? ' het' : '')} style={{ textAlign: 'left', border: 'none', width: '100%' }} onClick={() => setMo(u)}>
                <span className="ic">{u.rieng ? <Star size={22} /> : <Gift size={22} />}</span>
                <div className="gian">
                  <div className="hang wrap" style={{ gap: 6, marginBottom: 6 }}>
                    <span className="tag">{LOAI_UU_DAI[u.loai] || 'Ưu đãi'}</span>
                    {u.rieng && <span className="tag rieng"><Lock size={11} />Dành riêng</span>}
                  </div>
                  <h3>{u.ten}</h3>
                  {u.mo_ta && <p>{u.mo_ta}</p>}
                  <p style={{ fontWeight: 700, color: tab === 'het' ? 'var(--muted)' : 'var(--pink-deep)' }}>
                    {u.bat_dau && u.ket_thuc ? `${fmtNgay(u.bat_dau)} – ${fmtNgay(u.ket_thuc)}` : u.ket_thuc ? 'Đến ' + fmtNgay(u.ket_thuc) : u.bat_dau ? 'Từ ' + fmtNgay(u.bat_dau) : 'Không giới hạn thời gian'}
                  </p>
                </div>
              </button>
            ))}</div>}
      <Modal mo={!!mo} dong={() => setMo(null)} tieuDe={mo?.ten} moTa={mo && LOAI_UU_DAI[mo.loai]}
        chan={mo?.lien_ket && <Btn kieu="den" icon={ExternalLink} onClick={() => moLienKet(nav, mo.lien_ket)}>Mở ưu đãi</Btn>}>
        {mo && <div className="cot" style={{ gap: 12 }}>
          {mo.anh && <Anh src={mo.anh} alt="" style={{ width: '100%', borderRadius: 18, maxHeight: 260, objectFit: 'cover' }} />}
          {mo.mo_ta && <p>{mo.mo_ta}</p>}
          {mo.chi_tiet ? <Md chu={mo.chi_tiet} /> : !mo.mo_ta && <p className="muted">Nón Sơn sẽ liên hệ để hướng dẫn bạn sử dụng ưu đãi này.</p>}
          {mo.ket_thuc && <p className="nho muted-2">Hiệu lực đến {fmtNgayGio(mo.ket_thuc)}</p>}
        </div>}
      </Modal>
    </>
  )
}

// ================= TÀI NGUYÊN =================
const IC_TN = { huong_dan: BookOpen, anh: IcAnh, video: Film, tai_lieu: FileText, quy_dinh: ScrollText, lien_ket: Link2 }
const MAU_TN = { huong_dan: ['#FDE6F1', '#A3004F'], anh: ['#E3F5EE', '#0E7F63'], video: ['#EAF0FD', '#2E5BC9'], tai_lieu: ['#FDF3E3', '#8A5410'], quy_dinh: ['#EFECF2', '#4A4452'], lien_ket: ['#FBF3E2', '#8A5A12'] }

export function TheTaiNguyen({ r, gon }) {
  const Ic = IC_TN[r.loai] || FileText
  const m = MAU_TN[r.loai] || MAU_TN.tai_lieu
  return (
    <Link to={'/tai-nguyen/' + r.id} className="the-tn" style={gon ? { boxShadow: 'none', background: 'var(--soft)', padding: 10 } : undefined}>
      <span className="ic" style={{ background: m[0], color: m[1], width: gon ? 42 : 52, height: gon ? 42 : 52 }}>{r.anh_bia ? <Anh src={r.anh_bia} alt="" /> : <Ic size={gon ? 19 : 22} />}</span>
      <div className="gian" style={{ minWidth: 0 }}>
        <b className={gon ? 'cat' : ''}>{r.ghim && !gon && <Pin size={13} style={{ verticalAlign: -2, marginRight: 4, color: 'var(--pink)' }} />}{r.tieu_de}</b>
        <span className="cat">{[LOAI_TN[r.loai], r.chuyen_muc, r.kich_thuoc && fmtDungLuong(r.kich_thuoc), r.san_pham?.ten].filter(Boolean).join(' · ')}</span>
      </div>
      {r.rieng && !gon && <span className="tag rieng"><Lock size={11} />Riêng</span>}
    </Link>
  )
}

export function DsTaiNguyen() {
  const { data, loading, error, reload } = useAsync(() => rpc('fn_tai_nguyen_ds'), [])
  const [q, setQ] = useState('')
  const [loai, setLoai] = useState('')
  const [cm, setCm] = useState('')
  const qd = useDebounced(q, 200)
  const ds = data || []
  const dsLoai = Object.keys(LOAI_TN).filter((k) => ds.some((r) => r.loai === k))
  const dsCm = [...new Set(ds.map((r) => r.chuyen_muc).filter(Boolean))]
  const loc = ds.filter((r) => (!loai || r.loai === loai) && (!cm || r.chuyen_muc === cm) && khop(r.tieu_de + ' ' + (r.mo_ta || '') + ' ' + (r.san_pham?.ten || ''), qd))
  return (
    <>
      <DauTrang lui="/toi" luiDt tieu="Hướng dẫn & tài nguyên" phu={data ? ds.length + ' tài liệu, ảnh, video' : null} />
      <div className="toolbar">
        <label className="input-tron"><Search size={17} /><input placeholder="Tìm tài nguyên…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {dsCm.length > 1 && <Chon kieu="tron" ds={[{ v: '', t: 'Mọi chuyên mục' }, ...dsCm.map((x) => ({ v: x, t: x }))]} giaTri={cm} onChon={setCm} />}
      </div>
      {dsLoai.length > 1 && <div className="loc-cuon"><Chips co="sm" trang ds={[{ v: '', t: 'Tất cả', dem: ds.length }, ...dsLoai.map((k) => ({ v: k, t: LOAI_TN[k], dem: ds.filter((r) => r.loai === k).length }))]} giaTri={loai} onChon={setLoai} /></div>}
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : loc.length === 0 ? <Empty icon={BookOpen} tieuDe={ds.length ? 'Không có tài nguyên phù hợp' : 'Thư viện đang được cập nhật'} />
          : <div className="luoi-cd" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>{loc.map((r) => <TheTaiNguyen key={r.id} r={r} />)}</div>}
    </>
  )
}

export function CtTaiNguyen() {
  const { id } = useParams()
  const bao = useToast()
  const { data: r, loading, error, reload } = useAsync(() => rpc('fn_tai_nguyen_ct', { p_id: id }), [id])
  const [xem, setXem] = useState(null)
  const [dang, setDang] = useState(false)
  useEffect(() => {
    setXem(null)
    if (r?.duong_dan && ['anh', 'video'].includes(r.loai)) linkTai(r.duong_dan).then(setXem).catch(() => {})
  }, [r?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (loading && !r) return <><DauTrang lui="/tai-nguyen" tieu="Hướng dẫn & tài nguyên" /><KhungTai /></>
  if (error && !r) return <><DauTrang lui="/tai-nguyen" tieu="Hướng dẫn & tài nguyên" /><LoiTai loi={error} thuLai={reload} /></>
  const tai = async () => {
    setDang(true)
    try {
      const u = await linkTai(r.duong_dan, r.cho_tai ? (r.ten_tep || r.tieu_de) : undefined)
      rpc('fn_su_kien', { p_loai: 'tai_tn', p_id: r.id }).catch(() => {})
      window.open(u, '_blank')
    } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const Ic = IC_TN[r.loai] || FileText
  return (
    <>
      <DauTrang lui="/tai-nguyen" tieu="Hướng dẫn & tài nguyên" />
      <article className="card cot" style={{ gap: 14, maxWidth: 820 }}>
        <div className="hang wrap" style={{ gap: 6 }}>
          <span className="tag" style={{ background: MAU_TN[r.loai]?.[0], color: MAU_TN[r.loai]?.[1] }}><Ic size={12} />{LOAI_TN[r.loai]}</span>
          {r.chuyen_muc && <span className="tag">{r.chuyen_muc}</span>}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-.01em' }}>{r.tieu_de}</h1>
        {r.mo_ta && <p className="muted-2">{r.mo_ta}</p>}
        {r.loai === 'anh' && xem && <img src={xem} alt={r.tieu_de} style={{ width: '100%', borderRadius: 20, background: 'var(--soft)' }} />}
        {r.loai === 'video' && xem && <video src={xem} controls playsInline style={{ width: '100%', borderRadius: 20, background: '#000', maxHeight: 520 }} />}
        {!xem && r.anh_bia && <Anh src={r.anh_bia} alt="" style={{ width: '100%', borderRadius: 20, maxHeight: 360, objectFit: 'cover' }} />}
        {r.noi_dung && <Md chu={r.noi_dung} />}
        {(r.duong_dan || r.link_ngoai || r.san_pham) && (
          <div className="hang wrap" style={{ gap: 10, paddingTop: 6, borderTop: '1px solid var(--line)' }}>
            {r.duong_dan && <Btn kieu="den" icon={Download} loading={dang} onClick={tai}>{r.cho_tai ? 'Tải xuống' : 'Mở tệp'}{r.kich_thuoc ? ' · ' + fmtDungLuong(r.kich_thuoc) : ''}</Btn>}
            {r.link_ngoai && <a className="btn vien" href={r.link_ngoai} target="_blank" rel="noreferrer"><ExternalLink size={16} />Mở liên kết</a>}
            {r.san_pham && <Link className="btn mem" to={'/san-pham/' + r.san_pham.id}>Xem sản phẩm {r.san_pham.ten}</Link>}
          </div>
        )}
        <p className="nho muted">Cập nhật {fmtNgay(r.cap_nhat_luc || r.tao_luc)}</p>
      </article>
    </>
  )
}

// ================= THÔNG BÁO =================
export function ThongBao() {
  const nav = useNavigate()
  const bao = useToast()
  const { taiToi } = useAuth()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_thong_bao_ds'), [])
  const [loc, setLoc] = useState('')
  const ds = data || []
  const chua = ds.filter((b) => !b.doc).length
  const hien = loc === 'chua' ? ds.filter((b) => !b.doc) : ds
  const doc = async (b) => {
    if (!b.doc) {
      setData((d) => d.map((x) => (x.id === b.id ? { ...x, doc: true } : x)))
      rpc('fn_thong_bao_doc', { p_id: b.id }).then(() => taiToi()).catch(() => {})
    }
    if (b.lien_ket) moLienKet(nav, b.lien_ket)
  }
  const docHet = async () => {
    try { await rpc('fn_thong_bao_doc', { p_id: null }); setData((d) => d.map((x) => ({ ...x, doc: true }))); taiToi(); bao('Đã đánh dấu tất cả là đã đọc') } catch (e) { bao(e.message, 'loi') }
  }
  return (
    <>
      <DauTrang lui="/" luiDt tieu="Thông báo" chuong={false} phu={chua > 0 ? chua + ' chưa đọc' : 'Bạn đã đọc hết'}
        phai={chua > 0 && <button type="button" className="dau-nut dau-chu" onClick={docHet}><CheckCheck size={17} /><span>Đọc tất cả</span></button>}
        duoi={<Segment giaTri={loc} onChon={setLoc} ds={[{ v: '', t: 'Tất cả' }, { v: 'chua', t: 'Chưa đọc', dem: chua }]} />} />
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : hien.length === 0 ? <Empty icon={Bell} tieuDe={loc ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'} />
          : <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {hien.map((b) => (
                <button key={b.id} type="button" className={'tin' + (b.doc ? '' : ' moi')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => doc(b)}>
                  <span className="ic"><Bell size={17} /></span>
                  <div className="gian">
                    <b>{b.tieu_de}</b>
                    {b.noi_dung && <p style={{ whiteSpace: 'pre-line' }}>{b.noi_dung}</p>}
                    <small>{LOAI_TB[b.loai] || 'Thông báo'} · {tuongDoi(b.luc)}{b.lien_ket ? ' · Bấm để mở' : ''}</small>
                  </div>
                  {!b.doc && <span className="cham-moi" />}
                </button>
              ))}
            </div>}
    </>
  )
}

// ================= HỖ TRỢ =================
function TaoHoTro({ mo, dong, lichId, xong }) {
  const bao = useToast()
  const [f, setF] = useState({ loai: lichId ? 'cua_hang' : 'tai_khoan', tieu_de: '', noi_dung: '' })
  const [dang, setDang] = useState(false)
  useEffect(() => { if (mo) setF({ loai: lichId ? 'cua_hang' : 'tai_khoan', tieu_de: '', noi_dung: '' }) }, [mo, lichId])
  const gui = async () => {
    setDang(true)
    try { const kq = await rpc('fn_ho_tro_tao', { p: { ...f, lich_id: lichId || null } }); bao('Đã gửi yêu cầu ' + kq.ma, 'hong'); xong(kq) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <Modal mo={mo} dong={dong} tieuDe="Gửi yêu cầu hỗ trợ" moTa="Đội Affiliate Nón Sơn sẽ trả lời trong giờ làm việc."
      chan={<><Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" icon={Send} loading={dang} disabled={f.tieu_de.trim().length < 3} onClick={gui}>Gửi yêu cầu</Btn></>}>
      <div className="cot" style={{ gap: 12 }}>
        <span className="nhan-nhom" style={{ margin: 0 }}>Bạn cần hỗ trợ về</span>
        <Chips co="sm" ds={Object.entries(LOAI_HO_TRO).map(([v, t]) => ({ v, t }))} giaTri={f.loai} onChon={(v) => setF({ ...f, loai: v })} />
        <Field nhan="Tiêu đề" batBuoc value={f.tieu_de} maxLength={140} onChange={(e) => setF({ ...f, tieu_de: e.target.value })} />
        <TextArea nhan="Nội dung chi tiết" rows={5} value={f.noi_dung} onChange={(e) => setF({ ...f, noi_dung: e.target.value })} />
      </div>
    </Modal>
  )
}

export function DsHoTro() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const lichId = sp.get('lich')
  const ck = useCongKhai()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_ho_tro_ds'), [])
  const [tao, setTao] = useState(!!lichId)
  const [mFaq, setMFaq] = useState(-1)
  const ds = data || []
  return (
    <>
      <DauTrang lui="/toi" luiDt tieu="Hỗ trợ" phu="Hỏi đáp và yêu cầu của bạn"
        phai={<button type="button" className="dau-nut dau-chinh" onClick={() => setTao(true)}><Plus size={17} strokeWidth={2.4} /><span>Gửi yêu cầu</span></button>} />
      <div className="hai-cot">
        <section className="lon">
          <div className="card">
            <div className="dau-the"><h2>Yêu cầu của bạn</h2></div>
            {loading && !data ? <KhungTai dong={2} /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
              : ds.length === 0 ? <p className="nho muted">Bạn chưa gửi yêu cầu nào.</p>
                : ds.map((h) => (
                  <Link key={h.id} to={'/ho-tro/' + h.id} className={'tin' + (h.trang_thai === 'da_tra_loi' ? ' moi' : '')}>
                    <span className="ic"><LifeBuoy size={17} /></span>
                    <div className="gian"><b>{h.tieu_de}</b><small>{h.ma} · {LOAI_HO_TRO[h.loai]} · {h.so_tra_loi} phản hồi · {tuongDoi(h.cap_nhat_luc)}</small></div>
                    <Nhan bang={TT_HO_TRO} ma={h.trang_thai} />
                  </Link>
                ))}
          </div>
        </section>
        <section className="nho-cot">
          {(ck?.faq || []).length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Câu hỏi thường gặp</h2></div>
              <div className="lp-faq" style={{ gap: 0 }}>
                {ck.faq.map((x, i) => (
                  <div key={i} className={'muc' + (mFaq === i ? ' mo' : '')} style={{ borderBottom: '1px solid var(--line)' }}>
                    <button type="button" className="hoi" onClick={() => setMFaq(mFaq === i ? -1 : i)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '12px 0', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{x.h}</button>
                    {mFaq === i && <div className="nho muted-2" style={{ paddingBottom: 12, whiteSpace: 'pre-line' }}><ChuQuyTac chu={x.d} /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {ck?.lien_he && (ck.lien_he.hotline || ck.lien_he.email) && (
            <div className="card cot" style={{ gap: 6 }}>
              <div className="dau-the"><h2>Liên hệ trực tiếp</h2></div>
              {ck.lien_he.hotline && <a href={'tel:' + ck.lien_he.hotline} className="lien-ket">Hotline {ck.lien_he.hotline}</a>}
              {ck.lien_he.email && <a href={'mailto:' + ck.lien_he.email} className="lien-ket">{ck.lien_he.email}</a>}
              {ck.lien_he.gio && <span className="nho muted">{ck.lien_he.gio}</span>}
            </div>
          )}
        </section>
      </div>
      <TaoHoTro mo={tao} lichId={lichId} dong={() => { setTao(false); if (lichId) setSp({}) }} xong={(kq) => { setTao(false); nav('/ho-tro/' + kq.id) }} />
    </>
  )
}

export function CtHoTro() {
  const { id } = useParams()
  const bao = useToast()
  const { data: h, loading, error, reload } = useAsync(() => rpc('fn_ho_tro_ct', { p_id: id }), [id])
  const [chu, setChu] = useState('')
  const [dang, setDang] = useState(false)
  const cuoi = useRef(null)
  useEffect(() => { cuoi.current?.scrollIntoView({ block: 'end' }) }, [h?.tra_loi?.length])
  if (loading && !h) return <><DauTrang lui="/ho-tro" tieu="Yêu cầu hỗ trợ" /><KhungTai /></>
  if (error && !h) return <><DauTrang lui="/ho-tro" tieu="Yêu cầu hỗ trợ" /><LoiTai loi={error} thuLai={reload} /></>
  const gui = async () => {
    if (!chu.trim()) return
    setDang(true)
    try { await rpc('fn_ho_tro_tra_loi', { p_id: h.id, p_noi_dung: chu }); setChu(''); reload(true) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <>
      <DauTrang lui="/ho-tro" tieu="Yêu cầu hỗ trợ" phu={h.ma} />
      <div className="card cot" style={{ gap: 14, maxWidth: 820 }}>
        <div className="hang wrap" style={{ gap: 8 }}>
          <div className="gian" style={{ minWidth: 200 }}>
            <p className="nho muted">{h.ma} · {LOAI_HO_TRO[h.loai]}{h.lich_ma ? ' · Lịch ' + h.lich_ma : ''} · {fmtNgayGio(h.tao_luc)}</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{h.tieu_de}</h1>
          </div>
          <Nhan bang={TT_HO_TRO} ma={h.trang_thai} lg />
        </div>
        <div className="chat">
          {h.noi_dung && <div className="bong toi">{h.noi_dung}<small>{fmtNgayGio(h.tao_luc)}</small></div>}
          {h.tra_loi.map((r) => <div key={r.id} className={'bong ' + (r.tu_nhan_su ? 'ho' : 'toi')}>{r.tu_nhan_su && <b style={{ display: 'block', fontSize: 12, color: 'var(--pink-deep)', marginBottom: 2 }}>Nón Sơn</b>}{r.noi_dung}<small>{fmtNgayGio(r.luc)}</small></div>)}
          {h.tra_loi.length === 0 && <p className="nho muted" style={{ textAlign: 'center', padding: 10 }}>Yêu cầu đã được ghi nhận. Nón Sơn sẽ phản hồi sớm.</p>}
          <div ref={cuoi} />
        </div>
        {h.trang_thai === 'da_dong'
          ? <Bao kieu="xanh">Yêu cầu đã đóng. Nếu cần thêm hỗ trợ, hãy gửi yêu cầu mới.</Bao>
          : <div className="cot" style={{ gap: 8 }}>
              <TextArea nhan="Trả lời" rows={3} value={chu} onChange={(e) => setChu(e.target.value)} />
              <div><Btn kieu="den" icon={Send} loading={dang} disabled={!chu.trim()} onClick={gui}>Gửi</Btn></div>
            </div>}
      </div>
    </>
  )
}

// ================= TÔI =================
function TheCapDoToi({ tv }) {
  const ke = tv.cap_ke
  const cs = tv.chi_so || {}
  const muc = ke ? [['chien_dich', 'dk_chien_dich', 'Chiến dịch tham gia'], ['bai_dat', 'dk_bai_dat', 'Bài đăng đạt'], ['buoi_quay', 'dk_buoi_quay', 'Buổi quay hoàn thành']].filter(([, k]) => ke[k] > 0) : []
  return (
    <section className="hero-tv">
      <div className="glow hong" style={{ width: 260, height: 260, right: -80, top: -110, opacity: 0.5 }} />
      <div className="hang" style={{ gap: 14 }}>
        <span className="av lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.22)', width: 64, height: 64, fontSize: 22 }}>{chuCai(tv.ho_ten)}</span>
        <div className="gian" style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22 }}><b>{tv.ho_ten}</b></h1>
          <p className="phu" style={{ marginTop: 2 }}>{tv.ma} · {tv.email}</p>
        </div>
      </div>
      <div className="hang wrap" style={{ gap: 8, marginTop: 14 }}>
        <span className="chip-cap"><i style={{ background: tv.cap_do?.mau || 'var(--pink)' }}><Star size={12} fill="#fff" /></i>{tv.cap_do?.ten || 'Thành viên'}</span>
        {(tv.nhom || []).map((g) => <span key={g.id} className="chip-cap" style={{ paddingLeft: 14 }}>{g.ten}</span>)}
      </div>
      {tv.cap_do?.quyen_loi && <p className="phu" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{tv.cap_do.quyen_loi}</p>}
      {ke ? (
        <div className="cot" style={{ gap: 10, marginTop: 16 }}>
          <span className="nho" style={{ color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>Điều kiện lên cấp {ke.ten}</span>
          {muc.map(([a, k, t]) => <ThanhTienDo key={a} pct={((cs[a] || 0) / ke[k]) * 100} nhan={t} so={<b>{Math.min(cs[a] || 0, ke[k])}/{ke[k]}</b>} />)}
        </div>
      ) : <p className="phu" style={{ marginTop: 14 }}>Bạn đang ở cấp cao nhất. Cảm ơn bạn đã đồng hành cùng Nón Sơn!</p>}
    </section>
  )
}

function HoSo({ tv }) {
  const { setToi } = useAuth()
  const bao = useToast()
  const ck = useCongKhai()
  const goc = () => ({
    ho_ten: tv.ho_ten || '', dien_thoai: tv.dien_thoai || '', ngay_sinh: tv.ngay_sinh || '', tinh_thanh: tv.tinh_thanh || '',
    kinh_nghiem: tv.kinh_nghiem || 'moi', shopee_aff: tv.shopee_aff || '', gioi_thieu: tv.gioi_thieu || '',
    kenh: (tv.kenh || []).length ? tv.kenh.map((k) => ({ ...k, nguoi_theo_doi: k.nguoi_theo_doi ?? '' })) : [{ nen_tang: 'tiktok', link: '', ten_kenh: '', nguoi_theo_doi: '' }]
  })
  const [f, setF] = useState(goc)
  const [dang, setDang] = useState(false)
  const doi = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const doiKenh = (i, k, v) => setF({ ...f, kenh: f.kenh.map((x, j) => (j === i ? { ...x, [k]: v } : x)) })
  const luu = async () => {
    setDang(true)
    try { const toi = await rpc('fn_cap_nhat_ho_so', { p: f }); setToi(toi); bao('Đã lưu hồ sơ') } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const dsTinh = (ck?.tinh_thanh || []).map((t) => ({ v: t, t }))
  return (
    <div className="cot" style={{ gap: 16 }}>
      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2>Thông tin cá nhân</h2></div>
        <div className="luoi-form">
          <Field nhan="Họ và tên" batBuoc value={f.ho_ten} onChange={doi('ho_ten')} />
          <Field nhan="Số điện thoại" batBuoc inputMode="tel" value={f.dien_thoai} onChange={doi('dien_thoai')} />
          <Field nhan="Ngày sinh" type="date" value={f.ngay_sinh || ''} onChange={doi('ngay_sinh')} />
          <Chon nhan="Tỉnh / thành phố" ds={dsTinh} giaTri={f.tinh_thanh} onChon={(v) => setF({ ...f, tinh_thanh: v })} tim />
          <Field nhan="Email" value={tv.email} disabled goiY="Email đăng nhập, không thể thay đổi." />
          <Field nhan="Tên / ID Shopee Affiliate" value={f.shopee_aff} onChange={doi('shopee_aff')} />
        </div>
        <span className="nhan-nhom" style={{ marginTop: 4 }}>Kinh nghiệm Affiliate</span>
        <Chips ds={Object.entries(KINH_NGHIEM).map(([v, t]) => ({ v, t }))} giaTri={f.kinh_nghiem} onChon={(v) => setF({ ...f, kinh_nghiem: v })} tick />
        <TextArea nhan="Giới thiệu ngắn về bạn / phong cách nội dung" rows={3} value={f.gioi_thieu} onChange={doi('gioi_thieu')} />
      </div>
      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2>Kênh tiếp thị</h2><button type="button" className="lien-ket nho" onClick={() => setF({ ...f, kenh: [...f.kenh, { nen_tang: 'facebook', link: '', ten_kenh: '', nguoi_theo_doi: '' }] })}><Plus size={14} />Thêm kênh</button></div>
        {f.kenh.map((k, i) => (
          <div key={i} className="khoi-form" style={{ position: 'relative' }}>
            <div className="luoi-form">
              <Chon nhan="Nền tảng" ds={Object.entries(NEN_TANG).map(([v, t]) => ({ v, t }))} giaTri={k.nen_tang} onChon={(v) => doiKenh(i, 'nen_tang', v)} />
              <Field nhan="Tên kênh" value={k.ten_kenh || ''} onChange={(e) => doiKenh(i, 'ten_kenh', e.target.value)} />
              <Field nhan="Link kênh" inputMode="url" value={k.link || ''} onChange={(e) => doiKenh(i, 'link', e.target.value)} />
              <Field nhan="Người theo dõi" inputMode="numeric" value={k.nguoi_theo_doi ?? ''} onChange={(e) => doiKenh(i, 'nguoi_theo_doi', e.target.value.replace(/\D/g, ''))} />
            </div>
            {f.kenh.length > 1 && <button type="button" className="lien-ket nho" style={{ marginTop: 8, color: 'var(--err)' }} onClick={() => setF({ ...f, kenh: f.kenh.filter((_, j) => j !== i) })}><Trash2 size={13} />Xóa kênh</button>}
          </div>
        ))}
      </div>
      <div className="hang" style={{ gap: 10, justifyContent: 'flex-end' }}>
        <Btn kieu="trong" onClick={() => setF(goc())}>Hoàn tác</Btn>
        <Btn kieu="den" co="lg" loading={dang} onClick={luu}>Lưu hồ sơ</Btn>
      </div>
    </div>
  )
}

function HoatDong({ tabDau }) {
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_hoat_dong_cua_toi'), [])
  const [tab, setTab] = useState(tabDau || 'chien_dich')
  if (loading && !d) return <KhungTai dong={3} />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const ds = d[tab] || []
  return (
    <div className="cot" style={{ gap: 12 }}>
      <div><Segment trang giaTri={tab} onChon={setTab} ds={[
        { v: 'chien_dich', t: 'Chiến dịch', dem: d.chien_dich.length }, { v: 'bai_nop', t: 'Bài nộp', dem: d.bai_nop.length },
        { v: 'lich', t: 'Lịch quay', dem: d.lich.length }, { v: 'yeu_thich', t: 'Đã lưu', dem: d.yeu_thich.length }, { v: 'uu_dai', t: 'Ưu đãi riêng', dem: d.uu_dai.length }]} /></div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {ds.length === 0 ? <p className="nho muted" style={{ padding: '14px 0' }}>Chưa có dữ liệu.</p> : ds.map((x) => {
          if (tab === 'chien_dich') return <Link key={x.id} to={'/chien-dich/' + x.id} className="tin"><span className="ic"><Megaphone size={17} /></span><div className="gian"><b>{x.ten}</b><small>Đăng ký {fmtNgay(x.luc)}</small></div><Nhan bang={TT_DANG_KY} ma={x.trang_thai} /></Link>
          if (tab === 'bai_nop') return <div key={x.id} className="tin"><span className="ic"><Link2 size={17} /></span><div className="gian"><b className="cat">{x.nhiem_vu} · {x.chien_dich}</b><p className="cat"><a href={x.link} target="_blank" rel="noreferrer">{x.link}</a></p>{x.gop_y && <p style={{ color: 'var(--info)' }}>Góp ý: {x.gop_y}</p>}<small>{fmtNgayGio(x.luc)}</small></div><Nhan bang={TT_BAI} ma={x.trang_thai} /></div>
          if (tab === 'lich') return <Link key={x.id} to={'/lich-quay?ma=' + x.ma} className="tin"><span className="ic"><CalendarDays size={17} /></span><div className="gian"><b>{x.cua_hang}</b><small>{x.ma} · {x.gio} {fmtNgayThu(x.ngay)}</small></div><Nhan bang={TT_LICH} ma={x.trang_thai} /></Link>
          if (tab === 'yeu_thich') return <Link key={x.id} to={'/san-pham/' + x.id} className="tin"><span className="ic" style={{ overflow: 'hidden', padding: 0 }}>{x.anh ? <Anh src={x.anh} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Heart size={17} />}</span><div className="gian"><b>{x.ten}</b></div></Link>
          return <Link key={x.id} to="/uu-dai" className="tin"><span className="ic"><Gift size={17} /></span><div className="gian"><b>{x.ten}</b><small>{LOAI_UU_DAI[x.loai]}{x.ket_thuc ? ' · đến ' + fmtNgay(x.ket_thuc) : ''}</small></div></Link>
        })}
      </div>
    </div>
  )
}

function CaiDat({ tv }) {
  const { setToi, thoat } = useAuth()
  const bao = useToast()
  const [ne, setNe] = useState(tv.nhan_email || {})
  const [mk, setMk] = useState({ a: '', b: '' })
  const [moMk, setMoMk] = useState(false)
  const [dang, setDang] = useState(false)
  const doiNe = async (k, v) => {
    const moi = { ...ne, [k]: v }
    setNe(moi)
    try { setToi(await rpc('fn_cap_nhat_ho_so', { p: { nhan_email: { [k]: v } } })) } catch (e) { setNe(ne); bao(e.message, 'loi') }
  }
  const luuMk = async () => {
    if (mk.a.length < 8) { bao('Mật khẩu tối thiểu 8 ký tự', 'loi'); return }
    if (mk.a !== mk.b) { bao('Hai lần nhập mật khẩu chưa khớp', 'loi'); return }
    setDang(true)
    try { await doiMatKhau(mk.a); setMoMk(false); setMk({ a: '', b: '' }); bao('Đã đổi mật khẩu') } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="cot" style={{ gap: 16 }}>
      <TheCaiApp />
      <div className="card cot" style={{ gap: 10 }}>
        <div className="dau-the"><h2>Nhận email thông báo</h2></div>
        <p className="nho muted-2" style={{ marginTop: -6 }}>Thông báo trong ứng dụng vẫn luôn hiển thị. Email xác thực và bảo mật luôn được gửi.</p>
        <DongSwitch nhan="Lịch quay chụp" moTa="Xác nhận, đề xuất đổi lịch, nhắc lịch trước 1 ngày" on={ne.lich !== false} onDoi={(v) => doiNe('lich', v)} />
        <DongSwitch nhan="Chiến dịch & bài nộp" moTa="Kết quả duyệt đăng ký, bài nộp, chiến dịch mới" on={ne.chien_dich !== false} onDoi={(v) => doiNe('chien_dich', v)} />
        <DongSwitch nhan="Ưu đãi" moTa="Khi bạn nhận ưu đãi mới" on={ne.uu_dai !== false} onDoi={(v) => doiNe('uu_dai', v)} />
        <DongSwitch nhan="Tin cộng đồng" moTa="Bản tin, sự kiện, thông báo chung" on={ne.tin !== false} onDoi={(v) => doiNe('tin', v)} />
      </div>
      <div className="card cot" style={{ gap: 10 }}>
        <div className="dau-the"><h2>Bảo mật</h2></div>
        <div className="hang wrap" style={{ gap: 10 }}>
          <Btn kieu="vien" icon={KeyRound} onClick={() => setMoMk(true)}>Đổi mật khẩu</Btn>
          <Btn kieu="trong" icon={LogOut} onClick={thoat}>Đăng xuất</Btn>
        </div>
        <p className="nho muted">Thành viên từ {fmtNgay(tv.tao_luc)}</p>
      </div>
      <Modal mo={moMk} dong={() => setMoMk(false)} tieuDe="Đổi mật khẩu" chan={<><Btn kieu="trong" onClick={() => setMoMk(false)}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luuMk}>Lưu mật khẩu</Btn></>}>
        <div className="cot" style={{ gap: 12 }}>
          <Field nhan="Mật khẩu mới" type="password" autoComplete="new-password" value={mk.a} onChange={(e) => setMk({ ...mk, a: e.target.value })} goiY="Tối thiểu 8 ký tự, nên có chữ và số." />
          <Field nhan="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={mk.b} onChange={(e) => setMk({ ...mk, b: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}

// Lưới tiện ích trang Tài khoản (thay cho menu phụ trên điện thoại)
function MenuToi({ tv }) {
  const ck = useCongKhai()
  const [kn, setKn] = useState(false)
  const chuaDoc = tv.chua_doc || 0
  const o = [
    { to: '/uu-dai', ten: 'Ưu đãi của tôi', ic: Gift },
    { to: '/tai-nguyen', ten: 'Hướng dẫn', ic: BookOpen },
    { to: '/thong-bao', ten: 'Thông báo', ic: Bell, dem: chuaDoc },
    { to: '/ho-tro', ten: 'Hỗ trợ', ic: LifeBuoy }
  ]
  return (
    <>
      <nav className="menu-toi" aria-label="Tiện ích">
        {o.map((x) => <Link key={x.to} to={x.to}><span className="ic"><x.ic size={20} />{x.dem > 0 && <i className="dem-nho">{x.dem > 99 ? '99+' : x.dem}</i>}</span>{x.ten}</Link>)}
        <button type="button" onClick={() => setKn(true)}><span className={'ic' + (tv.shopee_aff_id ? ' ok' : '')}><Link2 size={20} /></span>{tv.shopee_aff_id ? 'Shopee đã kết nối' : 'Kết nối Shopee'}</button>
        <CaiDatApp dienThoai render={(bam) => <button type="button" onClick={bam}><span className="ic"><Download size={20} /></span>Tải ứng dụng</button>} />
      </nav>
      <Link to="/quy-tac" className="dong-lk dong-qt">
        <span className="ic"><ShieldCheck size={18} /></span>
        <div className="gian"><b>Quy tắc cộng đồng</b><span>{tv.dong_y_quy_tac_luc && !canDongYQT(tv, ck) ? 'Bạn đã đồng ý ngày ' + fmtNgay(tv.dong_y_quy_tac_luc) : 'Tự do sáng tạo – Minh bạch – Trách nhiệm – Cùng phát triển'}</span></div>
        <ChevronRight size={18} className="mui" />
      </Link>
      <KetNoiShopee mo={kn} dong={() => setKn(false)} onXong={() => setKn(false)} />
    </>
  )
}

export function Toi() {
  const { tv } = useAuth()
  const [sp, setSp] = useSearchParams()
  const t = sp.get('tab')
  const tab = ['ho_so', 'hoat_dong', 'cai_dat'].includes(t) ? t : t === 'bai_nop' ? 'hoat_dong' : 'hoat_dong'
  const datTab = (v) => setSp({ tab: v }, { replace: true })
  return (
    <>
      <DauTrang tieu="Tài khoản" />
      <TheCapDoToi tv={tv} />
      <MenuToi tv={tv} />
      {tv.trang_thai === 'khoa' && <Bao kieu="loi">Tài khoản đang tạm khóa{tv.ly_do_khoa ? ': ' + tv.ly_do_khoa : ''}. Liên hệ Hỗ trợ để được giải quyết.</Bao>}
      <div><Segment trang giaTri={tab} onChon={datTab} ds={[{ v: 'hoat_dong', t: 'Hoạt động', icon: Star }, { v: 'ho_so', t: 'Hồ sơ', icon: UserRound }, { v: 'cai_dat', t: 'Cài đặt', icon: Lock }]} /></div>
      {tab === 'ho_so' && <HoSo tv={tv} />}
      {tab === 'hoat_dong' && <HoatDong tabDau={t === 'bai_nop' ? 'bai_nop' : undefined} />}
      {tab === 'cai_dat' && <CaiDat tv={tv} />}
    </>
  )
}
