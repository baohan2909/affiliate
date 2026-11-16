// Sản phẩm Affiliate (thành viên): danh sách gọn · lấy link affiliate 1 chạm bằng ID Shopee Affiliate · nội dung đăng soạn sẵn
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BookOpen, Check, ClipboardPaste, Copy, Crown, Download, ExternalLink, Flame, Heart, HardHat, Link2, Megaphone, Search,
  Share2, ShoppingBag, Sparkles, ThumbsUp, TrendingUp, X
} from 'lucide-react'
import { Anh, Btn, Chon, Empty, IconBtn, KhungTai, LoiTai, Md, Modal, NonIcon, saoChep, useToast } from '../components/ui'
import { useAuth } from '../components/auth'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, linkTai, sb } from '../lib/api'
import { fmtNgay, fmtPhanTram, fmtTien, khop } from '../lib/format'
import { LOAI_TN } from '../lib/hang'
import { BAC, bacCua, uocHoaHong } from '../lib/xephang'
import DauTrang from './DauTrang'

export const SHOPEE_AFF = 'https://affiliate.shopee.vn/offer/custom_link'
export const SHOPEE_DANG_KY = 'https://affiliate.shopee.vn/'
const MBH = 'Mũ bảo hiểm'
const NV = 'Nón vải'
const PK = 'Phụ kiện'
export const IC_DM = { [MBH]: HardHat, [NV]: NonIcon, [PK]: Sparkles }
const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

// Danh mục: lấy từ sheet; ô trống thì đoán theo tên sản phẩm
export function doanDanhMuc(s) {
  if (s.danh_muc) return s.danh_muc
  const t = boDau(s.ten)
  if (/phu kien|luoi non/.test(t)) return PK
  if (/bao hiem/.test(t)) return MBH
  return NV
}
// Tên gọn: bỏ tiền tố quảng cáo "ƯU ĐÃI - ", "[DEAL FS] - "
export const tenGon = (t) => String(t || '').replace(/^\s*(\[[^\]]*\]|ưu đãi)\s*[-–:]?\s*/i, '').trim()
const soSanhTop = (a, b) => (b.luot_ban ?? -1) - (a.luot_ban ?? -1) || a.thu_tu - b.thu_tu

// Gộp các mẫu (màu/size) dùng chung 1 link Shopee thành 1 sản phẩm → 1 link affiliate.
// Không hiện số bán với thành viên: số bán chỉ dùng để xếp hạng (TOP 1–10 · Bán siêu chạy · Bán chạy · Bán tốt).
export function gomSanPham(ds) {
  const m = new Map()
  for (const s of ds || []) { const k = s.link || s.id; if (!m.has(k)) m.set(k, []); m.get(k).push(s) }
  const out = []
  for (const [k, ms] of m) {
    const xep = [...ms].sort((a, b) => (b.luot_ban ?? -1) - (a.luot_ban ?? -1) || (a.thu_tu ?? 0) - (b.thu_tu ?? 0))
    const dd = xep[0]
    const gia = ms.map((x) => x.gia).filter((x) => x != null).map(Number)
    const hh = ms.map((x) => x.hoa_hong).filter((x) => x != null).map(Number)
    const cd = new Map(); ms.forEach((x) => (x.chien_dich || []).forEach((c) => cd.set(c.id, c)))
    out.push({
      key: k, id: dd.id, ids: ms.map((x) => x.id), ten: dd.ten, ma: dd.ma, sku: dd.sku, anh: (xep.find((x) => x.anh) || dd).anh,
      link: dd.link, danh_muc: ms.find((x) => x.danh_muc)?.danh_muc || doanDanhMuc(dd),
      gia: gia.length ? Math.min(...gia) : null, gia_max: gia.length ? Math.max(...gia) : null,
      hoa_hong: hh.length ? Math.max(...hh) : null,
      luot_ban: ms.some((x) => x.luot_ban != null) ? ms.reduce((t, x) => t + (Number(x.luot_ban) || 0), 0) : null,
      so_mau: ms.length, mau: xep, thu_tu: Math.min(...ms.map((x) => x.thu_tu ?? 1e9)), tao_luc: ms.map((x) => x.tao_luc).sort().pop(),
      yeu_thich: ms.some((x) => x.yeu_thich), chien_dich: [...cd.values()]
    })
  }
  // Hạng trong danh mục (hang) và hạng toàn hệ thống (hang_all) — cùng cách xếp với máy chủ (fn_trang_chu, fn_san_pham_ct)
  const theoDm = {}
  out.forEach((g) => { (theoDm[g.danh_muc] = theoDm[g.danh_muc] || []).push(g) })
  Object.values(theoDm).forEach((a) => { a.sort(soSanhTop); a.forEach((g, i) => { g.hang = g.luot_ban > 0 ? i + 1 : null }) })
  ;[...out].sort(soSanhTop).forEach((g, i) => { g.hang_all = g.luot_ban > 0 ? i + 1 : null })
  return out
}

// ---------- Link affiliate ----------
// Link gốc sạch (bỏ tham số, dấu / cuối) → link chuyển hướng chính thức của Shopee kèm ID Affiliate của thành viên
export function linkGocSach(link) {
  try { const u = new URL(link); u.search = ''; u.hash = ''; return u.toString().replace(/\/+$/, '') } catch { return String(link || '').split(/[?#]/)[0].replace(/\/+$/, '') }
}
export const taoLinkAff = (link, id) => 'https://s.shopee.vn/an_redir?origin_link=' + encodeURIComponent(linkGocSach(link)) + '&affiliate_id=' + id + '&sub_id=nonson'

// Nội dung đăng bài dọn sẵn (chỉ dùng thông tin thật của sản phẩm)
export function taoNoiDung(g, diemNoiBat, link) {
  const ten = tenGon(g.ten)
  const diem = String(diemNoiBat || '').split('\n').map((x) => x.replace(/^[\s\-•*✔️✅]+/u, '').trim()).filter(Boolean).slice(0, 5)
  const tag = g.danh_muc === MBH ? '#MuBaoHiem #MuBaoHiemNonSon' : g.danh_muc === NV ? '#NonVai #MuThoiTrang' : '#PhuKienNonSon'
  return [`🔥 ${ten}`, ...diem.map((x) => `✔️ ${x}`), '✅ Hàng chính hãng Nón Sơn', `👉 Mua tại đây: ${link}`, '', `#NonSon #NonSonChinhHang ${tag}`].join('\n')
}

export function suKien(loai, id) { rpc('fn_su_kien', { p_loai: loai, p_id: id }).catch(() => {}) }

// Bấm "Lấy link": đã kết nối Shopee Affiliate → tạo link của bạn + chép ngay (1 chạm); chưa kết nối → mở bước kết nối (làm 1 lần)
export function useLayLink() {
  const { tv } = useAuth()
  const [mo, setMo] = useState(null)
  const [ketNoi, setKetNoi] = useState(null)
  const id = tv?.shopee_aff_id
  const taoVaChep = async (g, idDung) => {
    const linkAff = taoLinkAff(g.link, idDung)
    const daChep = await saoChep(linkAff)
    suKien('chep_link', g.id)
    setMo({ ...g, linkAff, daChep })
  }
  const lay = (g, e) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    if (!g?.link) return
    if (!id) { setKetNoi(g); return }
    taoVaChep(g, id)
  }
  const xongKetNoi = (idMoi) => { const g = ketNoi; setKetNoi(null); if (g && g !== true) taoVaChep(g, idMoi) }
  const giaoDien = (
    <>
      <HopLink g={mo} dong={() => setMo(null)} />
      <KetNoiShopee mo={!!ketNoi} dong={() => setKetNoi(null)} onXong={xongKetNoi} g={ketNoi && ketNoi !== true ? ketNoi : null} />
    </>
  )
  return { lay, giaoDien, moKetNoi: () => setKetNoi(true), daKetNoi: !!id }
}

// Kết nối ID Shopee Affiliate (dán 1 link affiliate bất kỳ hoặc nhập ID)
export function KetNoiShopee({ mo, dong, onXong, g }) {
  const bao = useToast()
  const { tv, taiToi } = useAuth()
  const [v, setV] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  useEffect(() => { if (mo) { setV(''); setLoi('') } }, [mo])
  const dan = async () => {
    try { const t = (await navigator.clipboard.readText()).trim(); if (t) setV(t); else bao('Bộ nhớ tạm đang trống', 'loi') } catch { bao('Bấm giữ vào ô rồi chọn Dán nhé', 'loi') }
  }
  const ketNoi = async () => {
    const t = v.trim()
    setLoi('')
    if (!t) { setLoi('Dán link affiliate của bạn hoặc nhập ID vào ô.'); return }
    setDang(true)
    try {
      let id = /^\d{6,15}$/.test(t.replace(/\s/g, '')) ? t.replace(/\s/g, '') : null
      if (!id) {
        const { data, error } = await sb.functions.invoke('shopee', { body: { hanh_dong: 'giai', link: t } })
        if (error) throw new Error('Chưa kiểm tra được link, thử lại sau')
        if (!data?.affiliate_id) throw new Error(data?.loi || 'Không tìm thấy ID trong link này')
        id = data.affiliate_id
      }
      await rpc('fn_tv_shopee_id', { p_id: id })
      await taiToi()
      bao('Đã kết nối Shopee Affiliate · ID ' + id)
      onXong?.(id)
    } catch (e) { setLoi(e.message) } finally { setDang(false) }
  }
  const chepGoc = async () => { if (g?.link && await saoChep(g.link)) { bao('Đã chép link gốc. Dán vào Custom Link của Shopee để đổi.'); suKien('chep_link', g.id) } }
  return (
    <Modal mo={mo} dong={dong} tieuDe="Kết nối Shopee Affiliate" moTa="Làm 1 lần duy nhất. Sau đó mỗi sản phẩm chỉ cần bấm Lấy link."
      chan={<><Btn kieu="trong" onClick={dong}>Để sau</Btn><Btn kieu="den" icon={Link2} loading={dang} onClick={ketNoi}>Kết nối</Btn></>}>
      <div className="kn">
        {tv?.shopee_aff_id && <p className="kn-hien">Đang kết nối ID <b>{tv.shopee_aff_id}</b>. Dán link khác để đổi.</p>}
        <ol className="kn-buoc">
          <li><span className="so">1</span><div>Mở app <b>Shopee</b>, vào 1 sản phẩm bất kỳ → bấm <b>Chia sẻ</b> → <b>Sao chép liên kết</b>.<small>Tài khoản Shopee của bạn cần đã tham gia Shopee Tiếp thị liên kết.</small></div></li>
          <li><span className="so">2</span><div>Dán link vào ô dưới rồi bấm <b>Kết nối</b>. App tự nhận ra ID Affiliate của bạn.</div></li>
        </ol>
        <div className="kn-nhap">
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Dán link s.shopee.vn/… hoặc nhập ID" inputMode="url" autoComplete="off" onKeyDown={(e) => e.key === 'Enter' && ketNoi()} />
          <button type="button" onClick={dan}><ClipboardPaste size={15} />Dán</button>
        </div>
        {loi && <p className="kn-loi">{loi}. Bạn cũng có thể nhập thẳng ID Affiliate (dãy số trong phần thông tin tài khoản trên affiliate.shopee.vn).</p>}
        <div className="kn-phu">
          <a href={SHOPEE_DANG_KY} target="_blank" rel="noreferrer">Chưa có tài khoản Shopee Affiliate? Đăng ký miễn phí <ExternalLink size={13} /></a>
          {g?.link && <button type="button" onClick={chepGoc}>Hoặc chép link gốc để tự đổi</button>}
        </div>
      </div>
    </Modal>
  )
}

// Kết quả sau khi bấm Lấy link: link đã chép + chép kèm nội dung / chia sẻ / mở thử
function HopLink({ g, dong }) {
  const bao = useToast()
  const { tv } = useAuth()
  const [xemND, setXemND] = useState(false)
  const { data: ct } = useAsync(() => (g ? rpc('fn_san_pham_ct', { p_id: g.id }) : Promise.resolve(null)), [g?.id])
  useEffect(() => setXemND(false), [g?.key, g?.id])
  if (!g) return null
  const noiDung = taoNoiDung(g, ct?.diem_noi_bat, g.linkAff)
  const chep = async (chu, tb) => { if (await saoChep(chu)) bao(tb) }
  const chiaSe = async () => { try { await navigator.share({ title: tenGon(g.ten), text: noiDung }) } catch { /* bỏ qua */ } }
  return (
    <Modal mo={!!g} dong={dong} tieuDe="Link affiliate của bạn" chan={<Btn kieu="dam" onClick={dong}>Xong</Btn>}>
      <div className="hl">
        <div className="hl-sp">
          <span className="anh"><Anh src={g.anh} alt="" /></span>
          <div className="gian"><b>{tenGon(g.ten)}</b>{g.hoa_hong != null && <span>Hoa hồng <strong>{fmtPhanTram(g.hoa_hong)}</strong></span>}</div>
        </div>
        <div className={'hl-trang' + (g.daChep ? ' ok' : '')}>
          {g.daChep ? <><Check size={16} strokeWidth={3} />Đã chép link. Dán vào bài đăng là xong.</> : 'Bấm Chép link để sao chép.'}
        </div>
        <div className="hl-link"><Link2 size={16} /><span className="cat">{g.linkAff}</span><button type="button" onClick={() => chep(g.linkAff, 'Đã chép link')}><Copy size={15} />Chép</button></div>
        <div className="hl-nut">
          <Btn kieu="vien" icon={Sparkles} onClick={() => chep(noiDung, 'Đã chép nội dung kèm link')}>Chép kèm nội dung</Btn>
          {typeof navigator !== 'undefined' && navigator.share
            ? <Btn kieu="vien" icon={Share2} onClick={chiaSe}>Chia sẻ</Btn>
            : <a className="btn vien" href={g.linkAff} target="_blank" rel="noreferrer"><ExternalLink size={16} />Mở thử link</a>}
        </div>
        <button type="button" className="hl-nd-dau" onClick={() => setXemND(!xemND)}>{xemND ? 'Ẩn nội dung đăng soạn sẵn' : 'Xem nội dung đăng soạn sẵn'}</button>
        {xemND && <pre className="hl-nd">{noiDung}</pre>}
        <p className="hl-ghi">Link gắn ID Shopee Affiliate <b>{tv?.shopee_aff_id}</b>. Người mua qua link này, hoa hồng về tài khoản của bạn.</p>
      </div>
    </Modal>
  )
}

// ---------- Nhãn xếp hạng: TOP 1–10 · Bán siêu chạy · Bán chạy · Bán tốt ----------
// goc: tab ôm sát góc trên-trái thẻ (bo theo góc thẻ, có 2 "tai" cong nối liền mép) · noi: nhãn đứng riêng (banner, chi tiết)
const IC_BAC = { sieu: Flame, chay: TrendingUp, tot: ThumbsUp }
export function NhanBac({ hang, noi, phu }) {
  const b = bacCua(hang)
  if (!b) return null
  const top = b.ma === 'top'
  const Ic = IC_BAC[b.ma]
  const lop = ['nb', noi ? 'noi' : 'goc', top ? 'nb-top ' + (hang <= 3 ? 'h' + hang : 'hn') : 'nb-' + b.ma].join(' ')
  return (
    <span className={lop} aria-label={top ? 'Top ' + hang : b.ten}>
      {top ? <>{hang <= 3 && <Crown size={13} strokeWidth={2.4} />}<small>TOP</small><b>{hang}</b></> : <><Ic size={12} strokeWidth={2.6} /><span>{b.ten}</span></>}
      {phu && <em>{phu}</em>}
    </span>
  )
}

// Giá niêm yết + hoa hồng (tỉ lệ và số tiền ước tính cho mỗi sản phẩm bán qua link)
export function GiaHoaHong({ s }) {
  const uoc = uocHoaHong(s.gia, s.hoa_hong)
  return (
    <>
      {s.gia != null && <p className="sp-gia">{s.gia_max > s.gia && <small>từ</small>}<b>{fmtTien(s.gia)}</b><span>giá niêm yết</span></p>}
      {s.hoa_hong != null && (
        <div className="sp-hh">
          <b>{fmtPhanTram(s.hoa_hong)}</b>
          <span><small>Hoa hồng</small>{uoc != null && <em>≈ {fmtTien(uoc)}</em>}</span>
        </div>
      )}
    </>
  )
}

// ---------- Thẻ sản phẩm: ảnh (nhãn hạng ôm góc) · tên · giá niêm yết · hoa hồng · Lấy link ----------
// hang: hạng dùng cho nhãn (trong danh mục hay toàn hệ thống tùy nơi hiển thị); không truyền thì dùng hạng toàn hệ thống
export function TheSanPham({ s, hang, onClick, onTim, onLay }) {
  const h = hang !== undefined ? hang : (s.hang_all ?? null)
  const b = bacCua(h)
  const lop = ['sp', b ? 'bac-' + b.ma : '', b?.ma === 'top' && h <= 3 ? 'top' + h : ''].filter(Boolean).join(' ')
  return (
    <article className={lop} onClick={onClick} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="sp-anh">
        <Anh src={s.anh} alt={s.ten} />
        <NhanBac hang={h} />
        {onTim && (
          <button type="button" className={'sp-tim' + (s.yeu_thich ? ' on' : '')} aria-label={s.yeu_thich ? 'Bỏ lưu' : 'Lưu sản phẩm'}
            onClick={(e) => { e.stopPropagation(); onTim(s) }}><Heart size={16} fill={s.yeu_thich ? 'currentColor' : 'none'} /></button>
        )}
      </div>
      <div className="sp-than">
        <h3 className="sp-ten">{tenGon(s.ten)}</h3>
        <GiaHoaHong s={s} />
        {onLay && s.link && <button type="button" className="nut-lay" onClick={(e) => onLay(s, e)}><Link2 size={15} strokeWidth={2.4} />Lấy link</button>}
      </div>
    </article>
  )
}

// Thêm/bỏ "Đã lưu" cho cả nhóm mẫu
export function useYeuThich(setData) {
  const bao = useToast()
  return async (g) => {
    const ids = g.ids || [g.id]
    const moi = !g.yeu_thich
    setData((d) => (d ? { ...d, ds: d.ds.map((x) => (ids.includes(x.id) ? { ...x, yeu_thich: moi && x.id === g.id } : x)) } : d))
    try {
      if (moi) await rpc('fn_yeu_thich', { p_id: g.id, p_bat: true })
      else await Promise.all((g.mau || [g]).filter((x) => x.yeu_thich).map((x) => rpc('fn_yeu_thich', { p_id: x.id, p_bat: false })))
      bao(moi ? 'Đã lưu sản phẩm' : 'Đã bỏ lưu')
    } catch (e) { bao(e.message, 'loi') }
  }
}

// Dải nhắc kết nối (hiện khi chưa có ID Shopee Affiliate)
export function NhacKetNoi({ onBam }) {
  return (
    <div className="nhac-kn">
      <span className="ic"><Link2 size={18} /></span>
      <div className="gian"><b>Lấy link affiliate chỉ với 1 chạm</b><span>Kết nối tài khoản Shopee Affiliate một lần để app tự tạo link của bạn.</span></div>
      <Btn kieu="dam" co="sm" onClick={onBam}>Kết nối</Btn>
    </div>
  )
}

const SAP_XEP = [
  { v: 'xep_hang', t: 'Xếp hạng bán chạy' }, { v: 'tien', t: 'Hoa hồng nhiều tiền nhất' }, { v: 'hoa_hong', t: 'Tỉ lệ hoa hồng cao' },
  { v: 'gia_tang', t: 'Giá thấp → cao' }, { v: 'gia_giam', t: 'Giá cao → thấp' }, { v: 'moi', t: 'Mới nhất' }
]
// Số sản phẩm hiện sẵn ở mỗi nhóm khi xem theo xếp hạng (bấm "Xem thêm" để mở tiếp)
const HIEN_DAU = { top: 10, sieu: 20, chay: 10, tot: 10, khac: 20 }
const IC_KHOI = { top: Crown, sieu: Flame, chay: TrendingUp, tot: ThumbsUp }

// Đầu mỗi nhóm xếp hạng: biểu tượng cùng màu nhãn trên thẻ · tên nhóm · khoảng hạng
function DauBac({ ma, tieuDe, phu, so }) {
  const Ic = IC_KHOI[ma] || ShoppingBag
  return (
    <div className={'bac-dau b-' + ma}>
      <span className="bac-ic"><Ic size={17} strokeWidth={2.4} /></span>
      <div className="gian"><h2>{tieuDe}</h2>{phu && <p>{phu}</p>}</div>
      {so != null && <span className="bac-so">{so}</span>}
    </div>
  )
}

export function DsSanPham() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ds'), [])
  const [q, setQ] = useState('')
  const [timMo, setTimMo] = useState(false)
  const oNhap = useRef(null)
  const [cd, setCd] = useState('')
  const [chiLuu, setChiLuu] = useState(false)
  const [sx, setSx] = useState('xep_hang')
  const [soHien, setSoHien] = useState(40)
  const [mo, setMo] = useState(HIEN_DAU)
  const dm = sp.get('dm') || ''
  const setDm = (v) => setSp(v ? { dm: v } : {}, { replace: true })
  const qd = useDebounced(q, 200)
  const tim = useYeuThich(setData)
  const ll = useLayLink()
  const nhom = useMemo(() => gomSanPham(data?.ds), [data])
  const demDm = useMemo(() => { const c = {}; nhom.forEach((g) => { c[g.danh_muc] = (c[g.danh_muc] || 0) + 1 }); return c }, [nhom])
  const dsDm = [MBH, NV, PK].filter((x) => demDm[x]).concat(Object.keys(demDm).filter((x) => ![MBH, NV, PK].includes(x)))
  const dsCd = useMemo(() => { const m = new Map(); nhom.forEach((g) => g.chien_dich.forEach((c) => m.set(c.id, c.ten))); return [...m].map(([v, t]) => ({ v, t })) }, [nhom])
  const hangCua = (g) => (dm ? g.hang : g.hang_all)
  const loc = useMemo(() => {
    let r = nhom.filter((g) => (!dm || g.danh_muc === dm) && (!cd || g.chien_dich.some((c) => c.id === cd)) && (!chiLuu || g.yeu_thich)
      && (!qd || g.mau.some((s) => khop(s.ten + ' ' + s.ma + ' ' + (s.sku || ''), qd))))
    const so = (x) => (x == null ? -Infinity : Number(x))
    r = [...r].sort(soSanhTop)
    if (sx === 'tien') r.sort((a, b) => so(uocHoaHong(b.gia, b.hoa_hong)) - so(uocHoaHong(a.gia, a.hoa_hong)) || soSanhTop(a, b))
    if (sx === 'hoa_hong') r.sort((a, b) => so(b.hoa_hong) - so(a.hoa_hong) || soSanhTop(a, b))
    if (sx === 'gia_tang') r.sort((a, b) => (a.gia ?? Infinity) - (b.gia ?? Infinity) || soSanhTop(a, b))
    if (sx === 'gia_giam') r.sort((a, b) => so(b.gia) - so(a.gia) || soSanhTop(a, b))
    if (sx === 'moi') r.sort((a, b) => String(b.tao_luc).localeCompare(String(a.tao_luc)))
    return r
  }, [nhom, qd, dm, cd, chiLuu, sx])
  useEffect(() => { setSoHien(40); setMo(HIEN_DAU) }, [qd, dm, cd, chiLuu, sx])
  // Xem theo xếp hạng (mặc định, không tìm/lọc): chia nhóm TOP 10 → Bán siêu chạy → Bán chạy → Bán tốt → các sản phẩm khác
  const theoBac = sx === 'xep_hang' && !qd && !cd && !chiLuu
  const khoi = useMemo(() => {
    if (!theoBac) return []
    const k = BAC.map((b) => ({ ...b, ds: loc.filter((g) => { const h = dm ? g.hang : g.hang_all; return h >= b.tu && h <= b.den }) }))
    const khac = loc.filter((g) => { const h = dm ? g.hang : g.hang_all; return !h || h > BAC[BAC.length - 1].den })
    return [...k, { ma: 'khac', tieuDe: 'Các sản phẩm khác', ds: khac }].filter((x) => x.ds.length)
  }, [theoBac, loc, dm])
  const coLoc = cd || chiLuu || q
  const boLoc = () => { setQ(''); setCd(''); setChiLuu(false); setTimMo(false) }
  const ngay = data?.du_lieu_den ? ' · cập nhật ' + fmtNgay(data.du_lieu_den).slice(0, 5) : ''
  const luoi = (ds) => (
    <div className="luoi-sp">
      {ds.map((g) => <TheSanPham key={g.key} s={g} hang={hangCua(g)} onTim={tim} onLay={ll.lay} onClick={() => nav('/san-pham/' + g.id)} />)}
    </div>
  )
  const oTim = (
    <label className="dau-tim">
      <Search size={18} />
      <input ref={oNhap} type="search" placeholder="Tìm tên hoặc mã sản phẩm" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      {q && <button type="button" aria-label="Xóa" onClick={() => setQ('')}><X size={15} /></button>}
    </label>
  )
  return (
    <>
      <DauTrang
        lop={'dau-sp' + (timMo ? ' tim-mo' : '')}
        tieu="Sản phẩm"
        phu={nhom.length ? (coLoc ? loc.length + ' kết quả' : nhom.length + ' sản phẩm') : null}
        trai={oTim}
        phai={<>
          <button type="button" className="dau-nut nut-tim" aria-label="Tìm sản phẩm" onClick={() => { oNhap.current?.focus({ preventScroll: true }); setTimMo(true) }}><Search size={20} /></button>
          <button type="button" className="dau-nut nut-huy" onClick={() => { setQ(''); setTimMo(false) }}>Hủy</button>
          <button type="button" className={'dau-nut' + (chiLuu ? ' on' : '')} aria-pressed={chiLuu} aria-label="Sản phẩm đã lưu" title="Sản phẩm đã lưu" onClick={() => setChiLuu(!chiLuu)}>
            <Heart size={19} fill={chiLuu ? 'currentColor' : 'none'} />
          </button>
        </>}
        duoi={dsDm.length > 0 && (
          <div className="sp-dm" role="tablist" aria-label="Danh mục" style={{ '--so': dsDm.length + 1 <= 5 ? dsDm.length + 1 : Math.ceil((dsDm.length + 1) / 2) }}>
            <button type="button" role="tab" aria-selected={!dm} className={!dm ? 'on' : ''} onClick={() => setDm('')}>Tất cả</button>
            {dsDm.map((x) => <button key={x} type="button" role="tab" aria-selected={dm === x} className={dm === x ? 'on' : ''} onClick={() => setDm(x)}>{x}</button>)}
          </div>
        )}
      />
      {!ll.daKetNoi && <NhacKetNoi onBam={ll.moKetNoi} />}

      <div className="sp-cong-cu">
        <Chon kieu="tron" ds={SAP_XEP} giaTri={sx} onChon={setSx} />
        {dsCd.length > 0 && <Chon kieu="tron" ds={[{ v: '', t: 'Mọi chương trình' }, ...dsCd]} giaTri={cd} onChon={setCd} />}
        {coLoc && <button type="button" className="chip-loc" onClick={boLoc}><X size={14} />Bỏ lọc</button>}
      </div>

      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : loc.length === 0
        ? <Empty icon={chiLuu ? Heart : ShoppingBag} tieuDe={chiLuu && !qd ? 'Chưa lưu sản phẩm nào' : nhom.length ? 'Không có sản phẩm phù hợp' : 'Danh mục đang được cập nhật'}
            hanhDong={coLoc && <Btn kieu="vien" co="sm" icon={X} onClick={boLoc}>Bỏ lọc</Btn>}>
            {chiLuu && !qd ? 'Bấm hình trái tim trên sản phẩm để lưu lại xem sau.' : nhom.length ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.' : 'Nón Sơn sẽ sớm đưa sản phẩm Affiliate lên đây.'}
          </Empty>
        : theoBac
          ? khoi.map((k) => {
              const hien = mo[k.ma] ?? 20
              const them = k.ma === 'khac' ? 40 : 20
              return (
                <section key={k.ma} className={'bac-khoi k-' + k.ma}>
                  <DauBac ma={k.ma} tieuDe={k.ma === 'top' ? 'Top 10 bán chạy nhất' : k.tieuDe}
                    phu={k.ma === 'top' ? 'Số bán 30 ngày gần nhất' + ngay : k.ma === 'khac' ? 'Sắp xếp theo số bán' : `Hạng ${k.tu}–${k.den}${dm ? ' · ' + dm : ''}`}
                    so={k.ma === 'top' ? null : k.ds.length} />
                  {luoi(k.ds.slice(0, hien))}
                  {k.ds.length > hien && (
                    <button type="button" className="xem-them" onClick={() => setMo({ ...mo, [k.ma]: hien + them })}>
                      Xem thêm {Math.min(them, k.ds.length - hien)} sản phẩm {k.ma === 'khac' ? '' : k.ten}<span>còn {k.ds.length - hien}</span>
                    </button>
                  )}
                </section>
              )
            })
          : <>
              {luoi(loc.slice(0, soHien))}
              {loc.length > soHien && <button type="button" className="xem-them" onClick={() => setSoHien(soHien + 40)}>Xem thêm sản phẩm<span>còn {loc.length - soHien}</span></button>}
            </>}
      {ll.giaoDien}
    </>
  )
}

export function CtSanPham() {
  const { id } = useParams()
  const nav = useNavigate()
  const bao = useToast()
  const { tv } = useAuth()
  const { data: s, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ct', { p_id: id }), [id])
  const [anhChon, setAnhChon] = useState(0)
  const ll = useLayLink()
  useEffect(() => setAnhChon(0), [id])
  if (loading && !s) return <><DauTrang lui="/san-pham" tieu="Chi tiết sản phẩm" /><KhungTai /></>
  if (error && !s) return <><DauTrang lui="/san-pham" tieu="Chi tiết sản phẩm" /><LoiTai loi={error} thuLai={reload} /></>
  const mau = s.cung_link || []
  const g = { ...s, key: s.link || s.id, danh_muc: s.danh_muc || doanDanhMuc(s), so_mau: Math.max(1, mau.length) }
  const anh = [s.anh, ...(s.anh_phu || [])].filter(Boolean)
  const xh = s.xep_hang
  const giaMau = mau.map((x) => x.gia).filter((x) => x != null).map(Number)
  const giaMin = giaMau.length ? Math.min(...giaMau) : Number(s.gia)
  const giaMax = giaMau.length ? Math.max(...giaMau) : Number(s.gia)
  const uoc = uocHoaHong(s.gia, s.hoa_hong)
  const tim = async () => {
    const moi = !s.yeu_thich
    setData({ ...s, yeu_thich: moi })
    try { await rpc('fn_yeu_thich', { p_id: s.id, p_bat: moi }); bao(moi ? 'Đã lưu sản phẩm' : 'Đã bỏ lưu') } catch (e) { bao(e.message, 'loi') }
  }
  const taiTep = async (r) => {
    try {
      if (r.link_ngoai) { window.open(r.link_ngoai, '_blank'); return }
      const u = await linkTai(r.duong_dan, r.cho_tai ? r.ten_tep || r.tieu_de : undefined)
      suKien('tai_tn', r.id)
      window.open(u, '_blank')
    } catch (e) { bao(e.message, 'loi') }
  }
  const diem = String(s.diem_noi_bat || '').split('\n').map((x) => x.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
  const noiDung = taoNoiDung(g, s.diem_noi_bat, tv?.shopee_aff_id && s.link ? taoLinkAff(s.link, tv.shopee_aff_id) : '[link của bạn]')
  const chepND = async () => {
    if (!tv?.shopee_aff_id) { ll.moKetNoi(); return }
    if (await saoChep(noiDung)) { bao('Đã chép nội dung kèm link của bạn'); suKien('chep_link', s.id) }
  }
  return (
    <div className="ct">
      <DauTrang lui="/san-pham" tieu="Chi tiết sản phẩm" />
      <div className="ct-luoi">
        <section className="ct-trai">
          <div className="ct-anh">
            <div className="khung"><Anh src={anh[anhChon]} alt={s.ten} /></div>
            {anh.length > 1 && (
              <div className="ct-nho">
                {anh.map((a, i) => <button key={i} type="button" className={i === anhChon ? 'on' : ''} onClick={() => setAnhChon(i)} aria-label={'Ảnh ' + (i + 1)}><Anh src={a} alt="" /></button>)}
              </div>
            )}
          </div>
        </section>
        <section className="ct-phai">
          <div className="card ct-tt">
            <div className="ct-nhan">
              {xh?.h_dm && bacCua(xh.h_dm) ? <NhanBac noi hang={xh.h_dm} phu={xh.dm || g.danh_muc} /> : <span className="ct-dm">{g.danh_muc}</span>}
              {xh?.h_all && bacCua(xh.h_all) && xh.h_all !== xh.h_dm && <NhanBac noi hang={xh.h_all} phu="Toàn hệ thống" />}
            </div>
            <h1>{tenGon(s.ten)}</h1>
            <p className="ct-ma">Mã {s.ma}{s.sku ? ' · SKU ' + s.sku : ''}</p>
            <div className="ct-so">
              {s.gia != null && <div><span>Giá niêm yết</span><b>{giaMin < giaMax ? fmtTien(giaMin) + ' – ' + fmtTien(giaMax) : fmtTien(s.gia)}</b></div>}
              {s.hoa_hong != null && <div className="hh"><span>Hoa hồng</span><b>{fmtPhanTram(s.hoa_hong)}</b></div>}
            </div>
            {uoc != null && <p className="ct-uoc"><b>≈ {fmtTien(uoc)}</b><span>hoa hồng bạn nhận cho mỗi sản phẩm bán qua link</span></p>}
            {s.hoa_hong_ghi_chu && <p className="nho muted-2">{s.hoa_hong_ghi_chu}</p>}
            <div className="ct-nut">
              {s.link && <button type="button" className="nut-lay lon" onClick={(e) => ll.lay(g, e)}><Link2 size={18} strokeWidth={2.4} />Lấy link affiliate</button>}
              <IconBtn icon={Heart} nhan={s.yeu_thich ? 'Bỏ lưu' : 'Lưu'} kieu="vien" className={'tim-chinh' + (s.yeu_thich ? ' tim-on' : '')} onClick={tim} />
              {s.link && <a className="btn vien ct-shopee" href={s.link} target="_blank" rel="noreferrer" title="Xem sản phẩm trên Shopee" onClick={() => suKien('mo_shopee', s.id)}><ShoppingBag size={17} />Xem trên Shopee</a>}
            </div>
            {s.ghi_chu && <div className="bao vang"><div><b>Lưu ý:</b> <span style={{ whiteSpace: 'pre-line' }}>{s.ghi_chu}</span></div></div>}
          </div>

          <div className="card ct-nd">
            <div className="dau-the"><h2>Nội dung đăng soạn sẵn</h2></div>
            <pre>{noiDung}</pre>
            <Btn kieu="vien" icon={Copy} className="rong" onClick={chepND}>{tv?.shopee_aff_id ? 'Chép nội dung kèm link của bạn' : 'Kết nối Shopee để chép kèm link'}</Btn>
          </div>

          {mau.length > 1 && (
            <div className="card">
              <div className="dau-the"><h2>{mau.length} mẫu dùng chung 1 link</h2></div>
              <div className="ct-mau">
                {mau.map((x) => (
                  <button key={x.id} type="button" className={x.id === s.id ? 'on' : ''} onClick={() => x.id !== s.id && nav('/san-pham/' + x.id, { replace: true })}>
                    <span className="anh"><Anh src={x.anh} alt="" /></span><small className="cat">{x.ma}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {diem.length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Điểm nên nói khi quảng bá</h2></div>
              <ul className="ds-diem">{diem.map((x, i) => <li key={i}><Check size={15} strokeWidth={3} />{x}</li>)}</ul>
            </div>
          )}
          {(s.chien_dich || []).length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Chiến dịch áp dụng</h2></div>
              <div className="cot" style={{ gap: 8 }}>
                {s.chien_dich.map((c) => (
                  <Link key={c.id} to={'/chien-dich/' + c.id} className="dong-lk">
                    <span className="ic"><Megaphone size={17} /></span>
                    <div className="gian"><b className="cat">{c.ten}</b>{c.hoa_hong != null && <span>Hoa hồng chiến dịch {fmtPhanTram(c.hoa_hong)}</span>}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(s.tai_nguyen || []).length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Ảnh, video quảng bá</h2></div>
              <div className="cot" style={{ gap: 8 }}>
                {s.tai_nguyen.map((r) => (
                  <div key={r.id} className="dong-lk">
                    <span className="ic"><BookOpen size={17} /></span>
                    <div className="gian"><b className="cat">{r.tieu_de}</b><span>{LOAI_TN[r.loai]}</span></div>
                    {(r.duong_dan || r.link_ngoai) ? <Btn co="sm" kieu="mem" icon={r.link_ngoai ? ExternalLink : Download} onClick={() => taiTep(r)}>{r.link_ngoai ? 'Mở' : r.cho_tai ? 'Tải' : 'Xem'}</Btn>
                      : <Link to={'/tai-nguyen/' + r.id} className="btn mem sm">Xem</Link>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.mo_ta && <div className="card"><div className="dau-the"><h2>Thông tin sản phẩm</h2></div><Md chu={s.mo_ta} className="nho" /></div>}
          {s.link_web && <a className="btn trong rong" href={s.link_web} target="_blank" rel="noreferrer"><ExternalLink size={16} />Xem trên website Nón Sơn</a>}
        </section>
      </div>
      {s.link && (
        <div className="ct-thanh">
          <IconBtn icon={Heart} nhan={s.yeu_thich ? 'Bỏ lưu' : 'Lưu'} kieu="vien" className={s.yeu_thich ? 'tim-on' : ''} onClick={tim} />
          <button type="button" className="nut-lay lon" onClick={(e) => ll.lay(g, e)}><Link2 size={18} strokeWidth={2.4} />Lấy link affiliate</button>
        </div>
      )}
      {ll.giaoDien}
    </div>
  )
}
