// Trung tâm sản phẩm Affiliate (thành viên): Top bán chạy theo danh mục · lấy link 1 chạm · nội dung đăng dọn sẵn
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BadgePercent, BookOpen, Check, ClipboardPaste, Copy, Crown, Download, ExternalLink, Flame, HardHat, Heart, Layers,
  Link2, ListChecks, Megaphone, Search, ShoppingBag, Sparkles, Trophy, WandSparkles, X
} from 'lucide-react'
import { Anh, Btn, Chon, Empty, IconBtn, KhungTai, LoiTai, Md, Modal, NonIcon, TrangDau, saoChep, useToast } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, linkTai } from '../lib/api'
import { fmtNgay, fmtPhanTram, fmtSo, fmtTien, khop } from '../lib/format'
import { NHAN_TOP, LOAI_TN } from '../lib/hang'
import { congKenh, mauKenh, phanTram, tenKenh, xepKenh } from '../lib/kenh'
import { ThanhKenh } from '../components/kenh'

export const SHOPEE_AFF = 'https://affiliate.shopee.vn/offer/custom_link'
const MBH = 'Mũ bảo hiểm'
const NV = 'Nón vải'
const PK = 'Phụ kiện'
const IC_DM = { [MBH]: HardHat, [NV]: NonIcon, [PK]: Sparkles }
const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

// Danh mục: lấy từ sheet; ô trống thì đoán theo tên sản phẩm
export function doanDanhMuc(s) {
  if (s.danh_muc) return s.danh_muc
  const t = boDau(s.ten)
  if (/phu kien|luoi non/.test(t)) return PK
  if (/bao hiem/.test(t)) return MBH
  return NV
}
const soBan = (n) => (n == null ? null : n >= 10000 ? Math.round(n / 1000) + 'K' : n >= 1000 ? (Math.round(n / 100) / 10).toString().replace('.', ',') + 'K' : fmtSo(n))
const soSanhTop = (a, b) => (b.luot_ban ?? -1) - (a.luot_ban ?? -1) || a.thu_tu - b.thu_tu

// Gộp các mẫu (màu/size) dùng chung 1 link Shopee thành 1 sản phẩm → 1 link affiliate. Xếp hạng theo số bán trong từng danh mục.
// kenh: chỉ tính số bán trên 1 kênh (shopee, tiktok…); bỏ trống = mọi kênh.
export function gomSanPham(ds, kenh) {
  const m = new Map()
  for (const s0 of ds || []) {
    const s = kenh ? { ...s0, luot_ban: s0.ban_kenh ? Number(s0.ban_kenh[kenh]) || 0 : s0.luot_ban != null ? 0 : null } : s0
    const k = s.link || s.id; if (!m.has(k)) m.set(k, []); m.get(k).push(s)
  }
  const out = []
  for (const [k, ms] of m) {
    const xep = [...ms].sort((a, b) => (b.luot_ban ?? -1) - (a.luot_ban ?? -1) || (a.thu_tu ?? 0) - (b.thu_tu ?? 0))
    const dd = xep[0]
    const gia = ms.map((x) => x.gia).filter((x) => x != null).map(Number)
    const hh = ms.map((x) => x.hoa_hong).filter((x) => x != null).map(Number)
    const cd = new Map(); ms.forEach((x) => (x.chien_dich || []).forEach((c) => cd.set(c.id, c)))
    out.push({
      key: k, id: dd.id, ids: ms.map((x) => x.id), ten: dd.ten, ma: dd.ma, sku: dd.sku, anh: (xep.find((x) => x.anh) || dd).anh,
      link: dd.link, link_toi: ms.find((x) => x.link_toi)?.link_toi || null,
      danh_muc: ms.find((x) => x.danh_muc)?.danh_muc || doanDanhMuc(dd),
      gia: gia.length ? Math.min(...gia) : null, gia_max: gia.length ? Math.max(...gia) : null, gia_goc: dd.gia_goc, chiet_khau: dd.chiet_khau,
      hoa_hong: hh.length ? Math.max(...hh) : null,
      luot_ban: ms.some((x) => x.luot_ban != null) ? ms.reduce((t, x) => t + (Number(x.luot_ban) || 0), 0) : null,
      ban_kenh: ms.some((x) => x.ban_kenh) ? congKenh(ms.map((x) => x.ban_kenh)) : null,
      so_mau: ms.length, mau: xep, thu_tu: Math.min(...ms.map((x) => x.thu_tu ?? 1e9)), tao_luc: ms.map((x) => x.tao_luc).sort().pop(),
      yeu_thich: ms.some((x) => x.yeu_thich), nhan: [...new Set(ms.flatMap((x) => x.nhan || []))], chien_dich: [...cd.values()]
    })
  }
  const theoDm = {}
  out.forEach((g) => { (theoDm[g.danh_muc] = theoDm[g.danh_muc] || []).push(g) })
  Object.values(theoDm).forEach((a) => { a.sort(soSanhTop); a.forEach((g, i) => { g.hang = g.luot_ban > 0 ? i + 1 : null }) })
  return out
}

// ---------- Nội dung đăng bài dọn sẵn (chỉ dùng thông tin thật của sản phẩm) ----------
export function taoNoiDung(g, diemNoiBat, link) {
  const ten = String(g.ten || '').replace(/^\s*(\[[^\]]*\]|ưu đãi)\s*[-–:]?\s*/i, '').trim()
  const diem = String(diemNoiBat || '').split('\n').map((x) => x.replace(/^[\s\-•*✔️✅]+/u, '').trim()).filter(Boolean).slice(0, 5)
  const tag = g.danh_muc === MBH ? '#MuBaoHiem #MuBaoHiemNonSon' : g.danh_muc === NV ? '#NonVai #MuThoiTrang' : '#PhuKienNonSon'
  return [`🔥 ${ten}`, ...diem.map((x) => `✔️ ${x}`), '✅ Hàng chính hãng Nón Sơn', `👉 Mua tại đây: ${link}`, '', `#NonSon #NonSonChinhHang ${tag}`].join('\n')
}

export function HuyHieuHang({ hang, dm, lon, kemDm }) {
  if (!hang || hang > 10) return null
  const lop = hang === 1 ? 'vang' : hang === 2 ? 'bac' : hang === 3 ? 'dong' : 'hong'
  const IcDm = kemDm && dm ? IC_DM[dm] : null
  return (
    <span className={'hang-sp ' + lop + (lon ? ' lon' : '')} title={dm ? `Top ${hang} ${dm} bán chạy` : undefined}>
      {hang <= 3 ? <Crown size={lon ? 14 : 12} strokeWidth={2.4} /> : <Flame size={12} strokeWidth={2.4} />}Top {hang}{lon && dm ? ' · ' + dm : ''}
      {IcDm && <i className="dm-ic"><IcDm size={11} strokeWidth={2.4} /></i>}
    </span>
  )
}

function suKien(loai, id) { rpc('fn_su_kien', { p_loai: loai, p_id: id }).catch(() => {}) }

// Bấm "Lấy link": đã lưu link của mình → chép ngay (1 chạm); chưa có → chép link gốc + mở hướng dẫn 3 bước
export function useLayLink() {
  const bao = useToast()
  const [mo, setMo] = useState(null)
  const lay = async (g, e) => {
    e?.stopPropagation()
    if (g.link_toi) {
      if (await saoChep(g.link_toi)) { bao('Đã chép link affiliate của bạn'); suKien('chep_link', g.id) }
      return
    }
    if (g.link && await saoChep(g.link)) suKien('chep_link', g.id)
    setMo(g)
  }
  return { mo, setMo, lay }
}

// ---------- Thẻ sản phẩm ----------
export function TheSanPham({ s, onClick, onTim, onLay, chonNhieu, daChon, onChon, kemDm, kenh }) {
  const nhan = !s.hang && (s.nhan_top || (s.nhan || [])[0])
  const coLinkToi = !!s.link_toi
  return (
    <article className={'the-sp' + (daChon ? ' chon' : '')} onClick={chonNhieu ? () => onChon?.(s) : onClick} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="anh">
        <Anh src={s.anh} alt={s.ten} />
        {s.hang ? <HuyHieuHang hang={s.hang} dm={s.danh_muc} kemDm={kemDm} /> : nhan && NHAN_TOP[nhan] && <span className="huy-hieu"><Flame size={12} />{NHAN_TOP[nhan].ngan}</span>}
        {chonNhieu
          ? <span className={'chon-sp' + (daChon ? ' on' : '')}>{daChon && <Check size={15} strokeWidth={3} />}</span>
          : onTim && (
            <button type="button" className={'tim-sp' + (s.yeu_thich ? ' on' : '')} aria-label={s.yeu_thich ? 'Bỏ lưu' : 'Lưu sản phẩm'}
              onClick={(e) => { e.stopPropagation(); onTim(s) }}><Heart size={16} fill={s.yeu_thich ? 'currentColor' : 'none'} /></button>
          )}
        {s.luot_ban > 0 && (kenh
          ? <span className="ban-noi kenh" style={{ '--k': mauKenh(kenh) }}><i />{tenKenh(kenh)} · {soBan(s.luot_ban)}</span>
          : <span className="ban-noi"><Flame size={12} strokeWidth={2.4} />Đã bán {soBan(s.luot_ban)}</span>)}
        {s.so_mau > 1 && <span className="mau-noi"><Layers size={12} />{s.so_mau} mẫu</span>}
      </div>
      <div className="than">
        <div className="ten">{s.ten}</div>
        <div className="gia-hh">
          {s.gia != null && <span className="gia">{s.gia_max > s.gia ? 'Từ ' : ''}{fmtTien(s.gia)}</span>}
          {s.hoa_hong != null && <span className="hh"><BadgePercent size={13} />HH {fmtPhanTram(s.hoa_hong)}</span>}
        </div>
        {onLay && !chonNhieu && (
          <div className="tac-sp">
            <button type="button" className={'nut-lay' + (coLinkToi ? ' da-co' : '')} onClick={(e) => onLay(s, e)}>
              {coLinkToi ? <><Check size={15} strokeWidth={3} />Chép link của tôi</> : <><Link2 size={15} strokeWidth={2.4} />Lấy link</>}
            </button>
            {s.link && <a className="nut-tron" href={s.link} target="_blank" rel="noreferrer" aria-label="Mở trên Shopee" title="Mở trên Shopee" onClick={(e) => { e.stopPropagation(); suKien('mo_shopee', s.id) }}><ShoppingBag size={16} /></a>}
          </div>
        )}
        {!onLay && <div className="phu">{[s.luot_ban > 0 && (kenh ? `${tenKenh(kenh)}: ${fmtSo(s.luot_ban)}` : `Đã bán ${fmtSo(s.luot_ban)}`), (s.chien_dich || []).length > 0 && `${s.chien_dich.length} chiến dịch`].filter(Boolean).join(' · ') || s.danh_muc || s.ma}</div>}
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

// ---------- Khối lấy link (dùng trong hộp thoại và trang chi tiết) ----------
export function KhoiLayLink({ g, diemNoiBat, onDoiLink, daChepGoc }) {
  const bao = useToast()
  const [v, setV] = useState(g.link_toi || '')
  const [sua, setSua] = useState(!g.link_toi)
  const [dang, setDang] = useState(false)
  const [tabND, setTabND] = useState(false)
  useEffect(() => { setV(g.link_toi || ''); setSua(!g.link_toi) }, [g.link_toi, g.key])
  const chep = async (chu, tb) => { if (await saoChep(chu)) { bao(tb); suKien('chep_link', g.id) } }
  const dan = async () => {
    try { const t = (await navigator.clipboard.readText()).trim(); if (t) setV(t); else bao('Bộ nhớ tạm đang trống', 'loi') } catch { bao('Trình duyệt chưa cho dán tự động. Bấm giữ vào ô để dán.', 'loi') }
  }
  const luu = async () => {
    const t = v.trim()
    if (!t) { bao('Dán link affiliate của bạn vào ô', 'loi'); return }
    if (t === g.link) { bao('Đây vẫn là link gốc. Đổi sang link affiliate của bạn ở bước 2 trước nhé.', 'loi'); return }
    setDang(true)
    try { const r = await rpc('fn_link_toi_luu', { p_link_goc: g.link, p_link: t }); onDoiLink?.(r.link); setSua(false); bao('Đã lưu. Lần sau bấm “Chép link của tôi” là có ngay.') } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoa = async () => {
    try { await rpc('fn_link_toi_luu', { p_link_goc: g.link, p_link: '' }); onDoiLink?.(null); setV(''); setSua(true) } catch (e) { bao(e.message, 'loi') }
  }
  const linkDung = g.link_toi || g.link
  const noiDung = taoNoiDung(g, diemNoiBat, linkDung)
  return (
    <div className="ll">
      {g.link_toi && !sua ? (
        <div className="ll-cua-toi">
          <span className="ll-nhan"><Check size={13} strokeWidth={3} />Link affiliate của bạn</span>
          <div className="ll-o"><Link2 size={17} /><span className="cat">{g.link_toi}</span></div>
          <div className="hang wrap" style={{ gap: 8 }}>
            <Btn kieu="den" icon={Copy} className="gian" onClick={() => chep(g.link_toi, 'Đã chép link affiliate của bạn')}>Chép link</Btn>
            <Btn kieu="vien" icon={WandSparkles} className="gian" onClick={() => chep(noiDung, 'Đã chép nội dung kèm link')}>Chép kèm nội dung</Btn>
          </div>
          <div className="hang" style={{ gap: 14, justifyContent: 'center' }}>
            <button type="button" className="lien-ket nho" onClick={() => setSua(true)}>Đổi link</button>
            <button type="button" className="lien-ket nho" style={{ color: 'var(--muted)' }} onClick={xoa}>Xóa link đã lưu</button>
          </div>
        </div>
      ) : (
        <ol className="ll-buoc">
          <li className={daChepGoc ? 'xong' : ''}>
            <span className="so">{daChepGoc ? <Check size={14} strokeWidth={3} /> : 1}</span>
            <div className="gian">
              <b>{daChepGoc ? 'Đã chép link sản phẩm' : 'Chép link sản phẩm'}</b>
              <span>Link gốc trên Shopee, chưa có mã của bạn.</span>
            </div>
            <Btn co="sm" kieu="mem" icon={Copy} onClick={() => chep(g.link, 'Đã chép link sản phẩm')}>{daChepGoc ? 'Chép lại' : 'Chép'}</Btn>
          </li>
          <li>
            <span className="so">2</span>
            <div className="gian">
              <b>Đổi thành link affiliate của bạn</b>
              <span><b>Điện thoại:</b> mở app Shopee → bấm nút <b>Chia sẻ</b> ở góc trên → <b>Sao chép liên kết</b>. <b>Máy tính:</b> dán link vào trang Custom Link → <b>Lấy link</b>.</span>
              <div className="hang wrap" style={{ gap: 8, marginTop: 10 }}>
                <a className="btn den sm" href={g.link} target="_blank" rel="noreferrer" onClick={() => suKien('mo_shopee', g.id)}><ShoppingBag size={15} />Mở app Shopee</a>
                <a className="btn vien sm" href={SHOPEE_AFF} target="_blank" rel="noreferrer"><ExternalLink size={15} />Custom Link (máy tính)</a>
              </div>
            </div>
          </li>
          <li>
            <span className="so">3</span>
            <div className="gian">
              <b>Dán link của bạn để lưu lại</b>
              <span>Lần sau chỉ cần 1 chạm “Chép link của tôi”.</span>
              <div className="ll-nhap">
                <input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://s.shopee.vn/…" inputMode="url" autoComplete="off" />
                <button type="button" className="ll-dan" onClick={dan}><ClipboardPaste size={15} />Dán</button>
              </div>
              <div className="hang" style={{ gap: 8, marginTop: 8 }}>
                <Btn kieu="den" co="sm" icon={Check} loading={dang} onClick={luu}>Lưu link của tôi</Btn>
                {g.link_toi && <Btn kieu="trong" co="sm" onClick={() => { setV(g.link_toi); setSua(false) }}>Hủy</Btn>}
              </div>
            </div>
          </li>
        </ol>
      )}
      <div className="ll-nd">
        <button type="button" className="ll-nd-dau" onClick={() => setTabND(!tabND)}>
          <span className="ic"><WandSparkles size={16} /></span>
          <span className="gian"><b>Nội dung đăng bài dọn sẵn</b><small>{g.link_toi ? 'Đã gắn link affiliate của bạn' : 'Đang dùng link gốc · lưu link của bạn để tự gắn'}</small></span>
          <span className="lien-ket nho">{tabND ? 'Thu gọn' : 'Xem'}</span>
        </button>
        {tabND && (
          <>
            <pre className="ll-cap">{noiDung}</pre>
            <Btn kieu="vien" co="sm" icon={Copy} className="rong" onClick={() => chep(noiDung, 'Đã chép nội dung')}>Chép nội dung</Btn>
          </>
        )}
      </div>
    </div>
  )
}

export function HopLayLink({ g, dong, onDoiLink }) {
  const { data: ct } = useAsync(() => (g ? rpc('fn_san_pham_ct', { p_id: g.id }) : Promise.resolve(null)), [g?.id])
  if (!g) return null
  return (
    <Modal mo={!!g} dong={dong} tieuDe="Lấy link affiliate" chan={<Btn kieu="trong" onClick={dong}>Xong</Btn>}>
      <div className="ll-sp">
        <span className="anh"><Anh src={g.anh} alt="" /></span>
        <div className="gian">
          <b>{g.ten}</b>
          <span>{[g.luot_ban > 0 && `Đã bán ${fmtSo(g.luot_ban)}`, g.hoa_hong != null && `Hoa hồng ${fmtPhanTram(g.hoa_hong)}`, g.so_mau > 1 && `${g.so_mau} mẫu`].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      <KhoiLayLink g={g} diemNoiBat={ct?.diem_noi_bat} daChepGoc onDoiLink={onDoiLink} />
    </Modal>
  )
}

// ---------- Bảng xếp hạng (nền tối sang) ----------
function BangXepHang({ ds, dm, setDm, coDm, duLieuDen, onMo, onLay, kenh, nguonNhanh }) {
  const top = ds.filter((g) => g.danh_muc === dm && g.hang).sort((a, b) => a.hang - b.hang).slice(0, 10)
  if (!top.length) return null
  const [a, ...con] = top
  const buc = [a, ...con.slice(0, 2)]
  return (
    <section className="bxh">
      <div className="bxh-dau">
        <div>
          <span className="eyebrow"><Trophy size={13} />BẢNG XẾP HẠNG</span>
          <h2>Top bán chạy <b>{dm}</b></h2>
          {kenh
            ? <p className="ghi"><span className="the-kenh" style={{ '--k': mauKenh(kenh) }}><i />Trên {tenKenh(kenh)}</span>30 ngày gần nhất{duLieuDen ? ' · cập nhật ' + fmtNgay(duLieuDen) : ''}</p>
            : duLieuDen && <p className="ghi">{nguonNhanh ? 'Số bán mọi kênh online · 30 ngày gần nhất' : 'Theo số bán Nón Sơn'} · cập nhật {fmtNgay(duLieuDen)}</p>}
        </div>
        {coDm.length > 1 && (
          <div className="bxh-tab" role="tablist">
            {coDm.map((x) => { const Ic = IC_DM[x] || Sparkles; return <button key={x} type="button" role="tab" aria-selected={x === dm} className={x === dm ? 'on' : ''} onClick={() => setDm(x)}><Ic size={15} />{x}</button> })}
          </div>
        )}
      </div>
      <div className="bxh-buc">
        {buc.map((g) => (
          <article key={g.key} className={'bxh-the so' + g.hang} onClick={() => onMo(g)}>
            <div className="anh"><Anh src={g.anh} alt={g.ten} /><HuyHieuHang hang={g.hang} lon={g.hang === 1} />{g.so_mau > 1 && <span className="mau-noi"><Layers size={12} />{g.so_mau} mẫu</span>}</div>
            <div className="ten">{g.ten}</div>
            <div className="so-lieu">
              <span className="chip-ban"><Flame size={13} strokeWidth={2.4} />Đã bán {fmtSo(g.luot_ban)}</span>
              {g.hoa_hong != null && <span className="chip-hh"><BadgePercent size={13} />HH {fmtPhanTram(g.hoa_hong)}</span>}
            </div>
            <div className="tac">
              <button type="button" className={'nut-lay' + (g.link_toi ? ' da-co sang' : '')} onClick={(e) => onLay(g, e)}>{g.link_toi ? <><Check size={15} strokeWidth={3} />Chép link của tôi</> : <><Link2 size={15} strokeWidth={2.4} />Lấy link</>}</button>
              <a className="nut-tron kinh" href={g.link} target="_blank" rel="noreferrer" aria-label="Mở trên Shopee" onClick={(e) => { e.stopPropagation(); suKien('mo_shopee', g.id) }}><ShoppingBag size={16} /></a>
            </div>
          </article>
        ))}
      </div>
      {con.length > 2 && (
        <div className="bxh-ds">
          {con.slice(2).map((g) => (
            <div key={g.key} className="bxh-dong" role="link" tabIndex={0} onClick={() => onMo(g)} onKeyDown={(e) => e.key === 'Enter' && onMo(g)}>
              <span className="so">{g.hang}</span>
              <span className="anh"><Anh src={g.anh} alt="" /></span>
              <div className="gian"><b className="cat">{g.ten}</b><small>Đã bán {fmtSo(g.luot_ban)}{g.hoa_hong != null ? ` · HH ${fmtPhanTram(g.hoa_hong)}` : ''}{g.so_mau > 1 ? ` · ${g.so_mau} mẫu` : ''}</small></div>
              <button type="button" className={'nut-chep' + (g.link_toi ? ' on' : '')} aria-label={g.link_toi ? 'Chép link của tôi' : 'Lấy link'} title={g.link_toi ? 'Chép link của tôi' : 'Lấy link'} onClick={(e) => onLay(g, e)}>{g.link_toi ? <Check size={16} strokeWidth={3} /> : <Link2 size={16} />}</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const SAP_XEP = [
  { v: 'ban_chay', t: 'Bán chạy nhất' }, { v: 'hoa_hong', t: 'Hoa hồng cao nhất' }, { v: 'mac_dinh', t: 'Nón Sơn đề xuất' },
  { v: 'gia_tang', t: 'Giá thấp → cao' }, { v: 'gia_giam', t: 'Giá cao → thấp' }, { v: 'moi', t: 'Mới nhất' }
]
const TOI_DA_CHON = 5

export function DsSanPham() {
  const nav = useNavigate()
  const bao = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ds'), [])
  const [q, setQ] = useState('')
  const [dm, setDm] = useState('')
  const [dmTop, setDmTop] = useState(null)
  const [cd, setCd] = useState('')
  const [chiLuu, setChiLuu] = useState(false)
  const [sx, setSx] = useState('ban_chay')
  const [kenh, setKenh] = useState('')
  const [soHien, setSoHien] = useState(48)
  const [chonNhieu, setChonNhieu] = useState(false)
  const [daChon, setDaChon] = useState([])
  const qd = useDebounced(q, 200)
  const tim = useYeuThich(setData)
  const ll = useLayLink()
  const kenhDu = !!data?.kenh_du
  const kenhLoc = kenhDu ? kenh : ''
  const nhom = useMemo(() => gomSanPham(data?.ds, kenhLoc), [data, kenhLoc])
  // Tỉ lệ số bán theo kênh trên toàn bộ sản phẩm đang hiện. Nút lọc chỉ cho kênh bán công khai chiếm từ 1% (đơn tạo tay / kênh khác vẫn tính trong “Mọi kênh”)
  const tongKenh = useMemo(() => (kenhDu ? xepKenh(congKenh((data?.ds || []).map((x) => x.ban_kenh))) : []), [data, kenhDu])
  const nutKenh = tongKenh.filter(([k, , p]) => p >= 1 && k !== 'noi_bo' && k !== 'khac')
  const demDm = useMemo(() => { const c = {}; nhom.forEach((g) => { c[g.danh_muc] = (c[g.danh_muc] || 0) + 1 }); return c }, [nhom])
  const dsDm = [MBH, NV, PK].filter((x) => demDm[x]).concat(Object.keys(demDm).filter((x) => ![MBH, NV, PK].includes(x)))
  const coTop = dsDm.filter((x) => nhom.some((g) => g.danh_muc === x && g.hang))
  const dmBxh = dm && coTop.includes(dm) ? dm : (dmTop && coTop.includes(dmTop) ? dmTop : coTop[0])
  const dsCd = useMemo(() => { const m = new Map(); nhom.forEach((g) => g.chien_dich.forEach((c) => m.set(c.id, c.ten))); return [...m].map(([v, t]) => ({ v, t })) }, [nhom])
  const loc = useMemo(() => {
    let r = nhom.filter((g) => (!dm || g.danh_muc === dm) && (!cd || g.chien_dich.some((c) => c.id === cd)) && (!chiLuu || g.yeu_thich)
      && (!qd || g.mau.some((s) => khop(s.ten + ' ' + s.ma + ' ' + (s.sku || ''), qd))))
    const so = (x) => (x == null ? -Infinity : Number(x))
    if (sx === 'ban_chay') r = [...r].sort(soSanhTop)
    if (sx === 'hoa_hong') r = [...r].sort((a, b) => so(b.hoa_hong) - so(a.hoa_hong) || soSanhTop(a, b))
    if (sx === 'mac_dinh') r = [...r].sort((a, b) => a.thu_tu - b.thu_tu)
    if (sx === 'gia_tang') r = [...r].sort((a, b) => (a.gia ?? Infinity) - (b.gia ?? Infinity))
    if (sx === 'gia_giam') r = [...r].sort((a, b) => so(b.gia) - so(a.gia))
    if (sx === 'moi') r = [...r].sort((a, b) => String(b.tao_luc).localeCompare(String(a.tao_luc)))
    return r
  }, [nhom, qd, dm, cd, chiLuu, sx])
  useEffect(() => { setSoHien(48) }, [qd, dm, cd, chiLuu, sx, kenhLoc])
  const doiLink = (g, link) => {
    setData((d) => (d ? { ...d, ds: d.ds.map((x) => (x.link === g.link ? { ...x, link_toi: link } : x)) } : d))
    ll.setMo((m) => (m && m.key === g.key ? { ...m, link_toi: link } : m))
  }
  const moCt = (g) => nav('/san-pham/' + g.id, { state: { hang: g.hang, danh_muc: g.danh_muc, kenh: kenhLoc || null } })
  const batChon = (g) => {
    if (daChon.includes(g.key)) setDaChon(daChon.filter((k) => k !== g.key))
    else if (daChon.length >= TOI_DA_CHON) bao(`Shopee nhận tối đa ${TOI_DA_CHON} link mỗi lần`, 'loi')
    else setDaChon([...daChon, g.key])
  }
  const chepNhieu = async () => {
    const ds = nhom.filter((g) => daChon.includes(g.key))
    if (await saoChep(ds.map((g) => g.link_toi || g.link).join('\n'))) { bao(`Đã chép ${ds.length} link. Dán vào Custom Link để lấy link hàng loạt.`); ds.forEach((g) => suKien('chep_link', g.id)) }
  }
  const coLoc = dm || cd || chiLuu || q
  const boLoc = () => { setQ(''); setDm(''); setCd(''); setChiLuu(false) }
  const soLinkToi = nhom.filter((g) => g.link_toi).length
  return (
    <>
      <TrangDau eyebrow="Trung tâm sản phẩm" tieuDe="Sản phẩm Affiliate" phu="Chọn sản phẩm bán chạy, lấy link trong 1 chạm và đăng ngay."
        phai={soLinkToi > 0 && <span className="du-lieu-den"><Link2 size={13} />{soLinkToi} link của bạn đã lưu</span>} />

      <div className="sp-dm" role="tablist">
        <button type="button" role="tab" aria-selected={!dm} className={!dm ? 'on' : ''} onClick={() => setDm('')}><span className="ic"><ShoppingBag size={15} /></span>Tất cả<small>{fmtSo(nhom.length)}</small></button>
        {dsDm.map((x) => { const Ic = IC_DM[x] || Sparkles; return (
          <button key={x} type="button" role="tab" aria-selected={dm === x} className={dm === x ? 'on' : ''} onClick={() => setDm(x)}><span className="ic"><Ic size={15} /></span>{x}<small>{fmtSo(demDm[x])}</small></button>
        ) })}
      </div>

      {nutKenh.length > 1 && (
        <div className="sp-kenh">
          <span className="nhan">Số bán theo kênh</span>
          <div className="kenh-chon" role="tablist" aria-label="Kênh bán">
            <button type="button" role="tab" aria-selected={!kenh} className={!kenh ? 'on' : ''} onClick={() => setKenh('')}>Mọi kênh</button>
            {nutKenh.map(([k, , p]) => (
              <button key={k} type="button" role="tab" aria-selected={kenh === k} className={kenh === k ? 'on' : ''} style={{ '--k': mauKenh(k) }} onClick={() => setKenh(kenh === k ? '' : k)}>
                <i />{tenKenh(k)}<small>{phanTram(p)}</small>
              </button>
            ))}
          </div>
          <div className="thanh" aria-hidden="true">{tongKenh.map(([k, , p]) => <span key={k} style={{ width: p + '%', background: mauKenh(k), opacity: !kenh || kenh === k ? 1 : 0.22 }} />)}</div>
        </div>
      )}

      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : (
        <>
          {!q && !cd && !chiLuu && dmBxh && <BangXepHang ds={nhom} dm={dmBxh} setDm={(x) => (dm ? setDm(x) : setDmTop(x))} coDm={dm ? [] : coTop} duLieuDen={data?.du_lieu_den} onMo={moCt} onLay={ll.lay} kenh={kenhLoc} nguonNhanh={data?.nguon_so_ban === 'nhanh'} />}

          <div className="toolbar">
            <label className="input-tron"><Search size={17} /><input placeholder="Tìm tên, mã hoặc SKU…" value={q} onChange={(e) => setQ(e.target.value)} />{q && <button type="button" className="xoa-tim" aria-label="Xóa" onClick={() => setQ('')}><X size={15} /></button>}</label>
            <Chon kieu="tron" ds={SAP_XEP} giaTri={sx} onChon={setSx} />
            {dsCd.length > 0 && <Chon kieu="tron" ds={[{ v: '', t: 'Mọi chương trình' }, ...dsCd]} giaTri={cd} onChon={setCd} />}
            <button type="button" className={'chip-loc' + (chiLuu ? ' on' : '')} onClick={() => setChiLuu(!chiLuu)}><Heart size={14} fill={chiLuu ? 'currentColor' : 'none'} />Đã lưu</button>
            <button type="button" className={'chip-loc' + (chonNhieu ? ' on' : '')} onClick={() => { setChonNhieu(!chonNhieu); setDaChon([]) }}><ListChecks size={15} />{chonNhieu ? 'Đang chọn nhiều' : 'Lấy nhiều link'}</button>
          </div>

          {loc.length === 0
            ? <Empty icon={ShoppingBag} tieuDe={nhom.length ? 'Không có sản phẩm phù hợp' : 'Danh mục đang được cập nhật'}
                hanhDong={coLoc && <Btn kieu="vien" co="sm" icon={X} onClick={boLoc}>Bỏ lọc</Btn>}>
                {nhom.length ? 'Thử bỏ bớt bộ lọc.' : 'Nón Sơn sẽ sớm đưa sản phẩm Affiliate lên đây.'}
              </Empty>
            : <>
                <div className="hang" style={{ justifyContent: 'space-between', gap: 10 }}>
                  <p className="nho muted">{fmtSo(loc.length)} sản phẩm{sx === 'ban_chay' ? ' · xếp theo số bán' + (kenhLoc ? ' trên ' + tenKenh(kenhLoc) : '') : ''}</p>
                  {chonNhieu && <p className="nho muted">Chọn tối đa {TOI_DA_CHON} sản phẩm để lấy link cùng lúc</p>}
                </div>
                <div className="luoi-sp">
                  {loc.slice(0, soHien).map((g) => (
                    <TheSanPham key={g.key} s={g} kemDm={!dm} kenh={kenhLoc} onTim={tim} onLay={ll.lay} onClick={() => moCt(g)} chonNhieu={chonNhieu} daChon={daChon.includes(g.key)} onChon={batChon} />
                  ))}
                </div>
                {loc.length > soHien && <div style={{ textAlign: 'center' }}><Btn kieu="vien" onClick={() => setSoHien(soHien + 48)}>Xem thêm {Math.min(48, loc.length - soHien)} sản phẩm · còn {fmtSo(loc.length - soHien)}</Btn></div>}
              </>}
          {chonNhieu && daChon.length > 0 && (
            <div className="thanh-chon thanh-lay">
              <b>Đã chọn {daChon.length}/{TOI_DA_CHON}</b>
              <span style={{ flex: 1 }} />
              <Btn kieu="den" icon={Copy} onClick={chepNhieu}>Chép {daChon.length} link</Btn>
              <a className="btn trang" href={SHOPEE_AFF} target="_blank" rel="noreferrer"><ExternalLink size={15} />Mở Custom Link</a>
              <IconBtn icon={X} nhan="Bỏ chọn" co="sm" kieu="kinh" onClick={() => setDaChon([])} />
            </div>
          )}
        </>
      )}
      <HopLayLink g={ll.mo} dong={() => ll.setMo(null)} onDoiLink={(link) => ll.mo && doiLink(ll.mo, link)} />
    </>
  )
}

export function CtSanPham() {
  const { id } = useParams()
  const nav = useNavigate()
  const loc = useLocation()
  const bao = useToast()
  const { data: s, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ct', { p_id: id }), [id])
  const [anhChon, setAnhChon] = useState(0)
  useEffect(() => setAnhChon(0), [id])
  if (loading && !s) return <KhungTai />
  if (error && !s) return <LoiTai loi={error} thuLai={reload} />
  const mau = s.cung_link || []
  const g = {
    ...s, key: s.link || s.id, danh_muc: s.danh_muc || doanDanhMuc(s), so_mau: Math.max(1, mau.length), hang: loc.state?.hang || null,
    luot_ban: mau.some((x) => x.luot_ban != null) ? mau.reduce((t, x) => t + (Number(x.luot_ban) || 0), 0) : s.luot_ban
  }
  const bk = mau.length ? congKenh(mau.map((x) => x.ban_kenh)) : s.ban_kenh
  const coKenh = s.kenh_du && xepKenh(bk).length > 0
  const kenhHang = loc.state?.kenh
  const anh = [s.anh, ...(s.anh_phu || [])].filter(Boolean)
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
  return (
    <>
      <div><button type="button" className="lien-ket" onClick={() => nav(-1)}><ArrowLeft size={16} />Quay lại</button></div>
      <div className="hai-cot ct-sp">
        <section className="lon">
          <div className="card p0 ct-anh">
            <div className="khung-anh">
              <Anh src={anh[anhChon]} alt={s.ten} />
              {g.hang && <HuyHieuHang hang={g.hang} dm={kenhHang ? `${g.danh_muc} trên ${tenKenh(kenhHang)}` : g.danh_muc} lon />}
            </div>
            {anh.length > 1 && (
              <div className="hang" style={{ gap: 8, padding: 12, overflowX: 'auto' }}>
                {anh.map((a, i) => (
                  <button key={i} type="button" className={'anh-nho-ct' + (i === anhChon ? ' on' : '')} onClick={() => setAnhChon(i)}><Anh src={a} alt="" /></button>
                ))}
              </div>
            )}
          </div>
          {mau.length > 1 && (
            <div className="card">
              <div className="dau-the"><h2>{mau.length} mẫu trong cùng link</h2><span className="nho muted">1 link affiliate dùng cho tất cả</span></div>
              <div className="luoi-bt">
                {mau.map((x) => (
                  <button key={x.id} type="button" className={'o-bt' + (x.id === s.id ? ' on' : '')} onClick={() => x.id !== s.id && nav('/san-pham/' + x.id, { replace: true, state: loc.state })}>
                    <span className="anh"><Anh src={x.anh} alt="" /></span>
                    <b className="cat">{x.ma}</b>
                    <small>{x.luot_ban > 0 ? `Đã bán ${fmtSo(x.luot_ban)}` : x.sku ? 'SKU ' + x.sku : '—'}</small>
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
          {s.mo_ta && <div className="card"><div className="dau-the"><h2>Thông tin sản phẩm</h2></div><Md chu={s.mo_ta} className="nho" /></div>}
        </section>
        <section className="nho-cot">
          <div className="card cot ct-chinh" style={{ gap: 12 }}>
            <div className="hang wrap" style={{ gap: 6 }}>
              <span className="tag" style={{ background: 'var(--soft)' }}>{g.danh_muc}</span>
              {(s.nhan || []).map((n) => <span key={n} className="tag" style={{ background: '#FDE6F1', color: '#A3004F' }}>{NHAN_TOP[n]?.ten}</span>)}
            </div>
            <h1>{s.ten}</h1>
            <p className="nho muted">Mã {s.ma}{s.sku ? ' · SKU ' + s.sku : ''}{s.shop ? ' · Shop ' + s.shop : ''}</p>
            <div className="ct-so">
              {g.luot_ban > 0 && <div><span>Đã bán</span><b>{fmtSo(g.luot_ban)}</b></div>}
              {s.hoa_hong != null && <div className="hong"><span>Hoa hồng</span><b>{fmtPhanTram(s.hoa_hong)}</b></div>}
              {s.gia != null && <div className="gia"><span>Giá bán</span><b>{fmtTien(s.gia)}</b></div>}
            </div>
            {coKenh && (
              <div className="ct-kenh">
                <div className="dau"><span>Đã bán theo kênh</span><small>30 ngày gần nhất</small></div>
                <ThanhKenh bk={bk} />
              </div>
            )}
            {s.hoa_hong_ghi_chu && <p className="nho muted-2">{s.hoa_hong_ghi_chu}</p>}
            {s.du_lieu_den && g.luot_ban > 0 && <p className="nho muted">Số bán theo dữ liệu Nón Sơn · cập nhật {fmtNgay(s.du_lieu_den)}</p>}
            <div className="hang" style={{ gap: 8 }}>
              {s.link && <a className="btn vien gian" href={s.link} target="_blank" rel="noreferrer" onClick={() => suKien('mo_shopee', s.id)}><ShoppingBag size={16} />Xem trên Shopee</a>}
              <Btn kieu={s.yeu_thich ? 'mem' : 'vien'} icon={Heart} onClick={tim} style={s.yeu_thich ? { color: '#D6006C' } : undefined}>{s.yeu_thich ? 'Đã lưu' : 'Lưu'}</Btn>
            </div>
            {s.link_web && <a className="btn trong rong" href={s.link_web} target="_blank" rel="noreferrer"><ExternalLink size={16} />Xem trên website Nón Sơn</a>}
            {s.ghi_chu && <div className="bao vang"><div><b>Lưu ý:</b> <span style={{ whiteSpace: 'pre-line' }}>{s.ghi_chu}</span></div></div>}
          </div>
          {s.link && (
            <div className="card ct-lay">
              <div className="dau-the"><h2><Link2 size={18} />Lấy link affiliate</h2></div>
              <KhoiLayLink g={g} diemNoiBat={s.diem_noi_bat} onDoiLink={(link) => setData({ ...s, link_toi: link })} />
            </div>
          )}
          {(s.chien_dich || []).length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Chiến dịch áp dụng</h2></div>
              <div className="cot" style={{ gap: 8 }}>
                {s.chien_dich.map((c) => (
                  <Link key={c.id} to={'/chien-dich/' + c.id} className="viec" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
                    <span className="ic" style={{ background: '#fff', color: 'var(--pink-deep)' }}><Megaphone size={18} /></span>
                    <div className="gian"><b className="cat">{c.ten}</b>{c.hoa_hong != null && <span>Hoa hồng chiến dịch {fmtPhanTram(c.hoa_hong)}</span>}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(s.tai_nguyen || []).length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Tài nguyên quảng bá</h2></div>
              <div className="cot" style={{ gap: 8 }}>
                {s.tai_nguyen.map((r) => (
                  <div key={r.id} className="viec" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
                    <span className="ic" style={{ background: '#fff', color: 'var(--ink-2)' }}><BookOpen size={18} /></span>
                    <div className="gian"><b className="cat">{r.tieu_de}</b><span>{LOAI_TN[r.loai]}</span></div>
                    {(r.duong_dan || r.link_ngoai) ? <Btn co="sm" kieu="trang" icon={r.link_ngoai ? ExternalLink : Download} onClick={() => taiTep(r)}>{r.link_ngoai ? 'Mở' : r.cho_tai ? 'Tải' : 'Xem'}</Btn>
                      : <Link to={'/tai-nguyen/' + r.id} className="btn trang sm">Xem</Link>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
