import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink, Heart, Search, ShoppingBag, Flame, TrendingUp, Sparkles, Download, BookOpen, Megaphone, X } from 'lucide-react'
import { Anh, Btn, Chips, Chon, Empty, KhungTai, LoiTai, Md, TrangDau, saoChep, useToast } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, linkTai } from '../lib/api'
import { fmtNgay, fmtPhanTram, fmtSo, fmtTien, khop } from '../lib/format'
import { NHAN_TOP, LOAI_TN } from '../lib/hang'

const IC_NHAN = { ban_chay: Flame, tang_truong: TrendingUp, de_xuat: Sparkles }
const MAU_NHAN = { ban_chay: '', tang_truong: 'xanh', de_xuat: 'vang' }

export function TheSanPham({ s, onClick, onTim }) {
  const nhan = s.nhan_top || (s.nhan || [])[0]
  const Ic = IC_NHAN[nhan]
  return (
    <article className="the-sp" onClick={onClick} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="anh">
        <Anh src={s.anh} alt={s.ten} />
        {nhan && <span className={'huy-hieu ' + (MAU_NHAN[nhan] || '')}><Ic size={12} />{NHAN_TOP[nhan].ngan}</span>}
        {onTim && (
          <button type="button" className={'tim-sp' + (s.yeu_thich ? ' on' : '')} aria-label={s.yeu_thich ? 'Bỏ lưu' : 'Lưu sản phẩm'}
            onClick={(e) => { e.stopPropagation(); onTim(s) }}><Heart size={16} fill={s.yeu_thich ? 'currentColor' : 'none'} /></button>
        )}
      </div>
      <div className="than">
        <div className="ten">{s.ten}</div>
        {s.gia != null && <div className="gia">{fmtTien(s.gia)}{s.gia_goc > s.gia && <s>{fmtTien(s.gia_goc)}</s>}</div>}
        {(s.hoa_hong_cd ?? s.hoa_hong) != null && <span className="hh">Hoa hồng {fmtPhanTram(s.hoa_hong_cd ?? s.hoa_hong)}</span>}
        <div className="phu">{[s.luot_ban != null && `Đã bán ${fmtSo(s.luot_ban)}`, (s.chien_dich || []).length > 0 && `${s.chien_dich.length} chiến dịch`].filter(Boolean).join(' · ') || s.danh_muc || s.ma}</div>
      </div>
    </article>
  )
}

export function useYeuThich(setData) {
  const bao = useToast()
  return async (s) => {
    const moi = !s.yeu_thich
    setData((d) => (d ? { ...d, ds: d.ds.map((x) => (x.id === s.id ? { ...x, yeu_thich: moi } : x)) } : d))
    try { await rpc('fn_yeu_thich', { p_id: s.id, p_bat: moi }); bao(moi ? 'Đã lưu sản phẩm' : 'Đã bỏ lưu') } catch (e) { bao(e.message, 'loi') }
  }
}

const SAP_XEP = [
  { v: 'mac_dinh', t: 'Nón Sơn đề xuất' }, { v: 'ban_chay', t: 'Bán chạy nhất' }, { v: 'hoa_hong', t: 'Hoa hồng cao nhất' },
  { v: 'gia_tang', t: 'Giá thấp → cao' }, { v: 'gia_giam', t: 'Giá cao → thấp' }, { v: 'moi', t: 'Mới nhất' }
]

export function DsSanPham() {
  const nav = useNavigate()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ds'), [])
  const [q, setQ] = useState('')
  const [dm, setDm] = useState('')
  const [nhan, setNhan] = useState('')
  const [cd, setCd] = useState('')
  const [shop, setShop] = useState('')
  const [chiLuu, setChiLuu] = useState(false)
  const [coHH, setCoHH] = useState(false)
  const [sx, setSx] = useState('mac_dinh')
  const qd = useDebounced(q, 200)
  const tim = useYeuThich(setData)
  const ds = data?.ds || []
  const dsDm = useMemo(() => [...new Set(ds.map((s) => s.danh_muc).filter(Boolean))], [ds])
  const dsShop = useMemo(() => [...new Set(ds.map((s) => s.shop).filter(Boolean))], [ds])
  const dsCd = useMemo(() => { const m = new Map(); ds.forEach((s) => (s.chien_dich || []).forEach((c) => m.set(c.id, c.ten))); return [...m].map(([v, t]) => ({ v, t })) }, [ds])
  const loc = useMemo(() => {
    let r = ds.filter((s) => khop(s.ten + ' ' + s.ma, qd) && (!dm || s.danh_muc === dm) && (!nhan || (s.nhan || []).includes(nhan))
      && (!cd || (s.chien_dich || []).some((c) => c.id === cd)) && (!shop || s.shop === shop) && (!chiLuu || s.yeu_thich) && (!coHH || s.hoa_hong != null))
    const so = (x) => (x == null ? -Infinity : Number(x))
    if (sx === 'ban_chay') r = [...r].sort((a, b) => so(b.luot_ban) - so(a.luot_ban))
    if (sx === 'hoa_hong') r = [...r].sort((a, b) => so(b.hoa_hong) - so(a.hoa_hong))
    if (sx === 'gia_tang') r = [...r].sort((a, b) => (a.gia ?? Infinity) - (b.gia ?? Infinity))
    if (sx === 'gia_giam') r = [...r].sort((a, b) => so(b.gia) - so(a.gia))
    if (sx === 'moi') r = [...r].sort((a, b) => String(b.tao_luc).localeCompare(String(a.tao_luc)))
    return r
  }, [ds, qd, dm, nhan, cd, shop, chiLuu, coHH, sx])
  const coLoc = dm || nhan || cd || shop || chiLuu || coHH || q
  return (
    <>
      <TrangDau eyebrow="Trung tâm sản phẩm" tieuDe="Sản phẩm Affiliate" phu="Sản phẩm Nón Sơn đang triển khai Affiliate trên Shopee."
        phai={data?.du_lieu_den && <span className="du-lieu-den">Dữ liệu cập nhật đến {fmtNgay(data.du_lieu_den)}{data.nguon_top ? ' · ' + data.nguon_top : ''}</span>} />
      <div className="toolbar">
        <label className="input-tron"><Search size={17} /><input placeholder="Tìm tên hoặc mã sản phẩm…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Chon kieu="tron" ds={SAP_XEP} giaTri={sx} onChon={setSx} />
        {dsShop.length > 1 && <Chon kieu="tron" ds={[{ v: '', t: 'Tất cả shop' }, ...dsShop.map((x) => ({ v: x, t: x }))]} giaTri={shop} onChon={setShop} />}
        {dsCd.length > 0 && <Chon kieu="tron" ds={[{ v: '', t: 'Mọi chương trình' }, ...dsCd]} giaTri={cd} onChon={setCd} />}
      </div>
      <div className="loc-cuon">
        <Chips co="sm" trang ds={[{ v: '', t: 'Tất cả' }, ...Object.entries(NHAN_TOP).map(([v, x]) => ({ v, t: x.ngan }))]} giaTri={nhan} onChon={setNhan} />
        {dsDm.length > 0 && <Chips co="sm" trang ds={[{ v: '', t: 'Mọi danh mục' }, ...dsDm.map((x) => ({ v: x, t: x }))]} giaTri={dm} onChon={setDm} />}
        <Chips co="sm" trang nhieu ds={[{ v: 'luu', t: 'Đã lưu' }, { v: 'hh', t: 'Có hoa hồng' }]} giaTri={[chiLuu && 'luu', coHH && 'hh'].filter(Boolean)} onChon={(v) => { setChiLuu(v.includes('luu')); setCoHH(v.includes('hh')) }} />
      </div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : loc.length === 0
          ? <Empty icon={ShoppingBag} tieuDe={ds.length ? 'Không có sản phẩm phù hợp' : 'Danh mục đang được cập nhật'}
              hanhDong={coLoc && <Btn kieu="vien" co="sm" icon={X} onClick={() => { setQ(''); setDm(''); setNhan(''); setCd(''); setShop(''); setChiLuu(false); setCoHH(false) }}>Bỏ lọc</Btn>}>
              {ds.length ? 'Thử bỏ bớt bộ lọc.' : 'Nón Sơn sẽ sớm đưa sản phẩm Affiliate lên đây.'}
            </Empty>
          : <><p className="nho muted">{loc.length} sản phẩm</p><div className="luoi-sp">{loc.map((s) => <TheSanPham key={s.id} s={s} onTim={tim} onClick={() => nav('/san-pham/' + s.id)} />)}</div></>}
    </>
  )
}

export function CtSanPham() {
  const { id } = useParams()
  const nav = useNavigate()
  const bao = useToast()
  const { data: s, loading, error, reload, setData } = useAsync(() => rpc('fn_san_pham_ct', { p_id: id }), [id])
  const [anhChon, setAnhChon] = useState(0)
  if (loading && !s) return <KhungTai />
  if (error && !s) return <LoiTai loi={error} thuLai={reload} />
  const anh = [s.anh, ...(s.anh_phu || [])].filter(Boolean)
  const suKien = (loai) => rpc('fn_su_kien', { p_loai: loai, p_id: s.id }).catch(() => {})
  const chep = async () => { if (await saoChep(s.link)) { bao('Đã sao chép link gốc. Dán vào công cụ tạo link Shopee Affiliate.'); suKien('chep_link') } }
  const tim = async () => {
    const moi = !s.yeu_thich
    setData({ ...s, yeu_thich: moi })
    try { await rpc('fn_yeu_thich', { p_id: s.id, p_bat: moi }); bao(moi ? 'Đã lưu sản phẩm' : 'Đã bỏ lưu') } catch (e) { bao(e.message, 'loi') }
  }
  const taiTep = async (r) => {
    try {
      if (r.link_ngoai) { window.open(r.link_ngoai, '_blank'); return }
      const u = await linkTai(r.duong_dan, r.cho_tai ? r.ten_tep || r.tieu_de : undefined)
      rpc('fn_su_kien', { p_loai: 'tai_tn', p_id: r.id }).catch(() => {})
      window.open(u, '_blank')
    } catch (e) { bao(e.message, 'loi') }
  }
  const diem = String(s.diem_noi_bat || '').split('\n').map((x) => x.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
  return (
    <>
      <div><button type="button" className="lien-ket" onClick={() => nav(-1)}><ArrowLeft size={16} />Quay lại</button></div>
      <div className="hai-cot">
        <section className="lon">
          <div className="card p0" style={{ overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1', background: 'var(--soft)', maxHeight: 560 }}><Anh src={anh[anhChon]} alt={s.ten} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="" /></div>
            {anh.length > 1 && (
              <div className="hang" style={{ gap: 8, padding: 12, overflowX: 'auto' }}>
                {anh.map((a, i) => (
                  <button key={i} type="button" onClick={() => setAnhChon(i)} style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', border: i === anhChon ? '2px solid var(--pink)' : '2px solid transparent', padding: 0, flex: 'none', background: 'var(--soft)' }}>
                    <Anh src={a} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {diem.length > 0 && (
            <div className="card">
              <div className="dau-the"><h2>Điểm nên nói khi quảng bá</h2></div>
              <ul className="md" style={{ paddingLeft: 20, margin: 0 }}>{diem.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {s.mo_ta && <div className="card"><div className="dau-the"><h2>Thông tin sản phẩm</h2></div><Md chu={s.mo_ta} className="nho" /></div>}
        </section>
        <section className="nho-cot">
          <div className="card cot" style={{ gap: 12 }}>
            <div className="hang wrap" style={{ gap: 6 }}>
              {(s.nhan || []).map((n) => <span key={n} className="tag" style={{ background: '#FDE6F1', color: '#A3004F' }}>{NHAN_TOP[n]?.ten}</span>)}
              {s.danh_muc && <span className="tag">{s.danh_muc}</span>}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{s.ten}</h1>
            <p className="nho muted">Mã {s.ma}{s.shop ? ' · Shop ' + s.shop : ''}</p>
            {s.gia != null && <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--pink-deep)' }}>{fmtTien(s.gia)}{s.gia_goc > s.gia && <s className="nho muted" style={{ marginLeft: 8, fontWeight: 600 }}>{fmtTien(s.gia_goc)}</s>}</div>}
            {s.hoa_hong != null && <div className="bao ok"><div><b>Hoa hồng {fmtPhanTram(s.hoa_hong)}</b> theo chương trình hiện tại{s.hoa_hong_ghi_chu ? ' · ' + s.hoa_hong_ghi_chu : ''}</div></div>}
            {(s.luot_ban != null || s.du_lieu_den) && (
              <p className="nho muted-2">{s.luot_ban != null && <>Đã bán <b>{fmtSo(s.luot_ban)}</b></>}{s.du_lieu_den && <> · dữ liệu đến {fmtNgay(s.du_lieu_den)}</>}</p>
            )}
            <div className="cot" style={{ gap: 8 }}>
              {s.link && <a className="btn den lg rong" href={s.link} target="_blank" rel="noreferrer" onClick={() => suKien('mo_shopee')}><ExternalLink size={17} />Mở trên Shopee</a>}
              <div className="hang" style={{ gap: 8 }}>
                {s.link && <Btn kieu="vien" className="gian" icon={Copy} onClick={chep}>Sao chép link gốc</Btn>}
                <Btn kieu={s.yeu_thich ? 'mem' : 'vien'} icon={Heart} onClick={tim} style={s.yeu_thich ? { color: '#D6006C' } : undefined}>{s.yeu_thich ? 'Đã lưu' : 'Lưu'}</Btn>
              </div>
            </div>
            <div className="bao xanh"><div><b>Tạo link Affiliate của bạn:</b><ol style={{ margin: '6px 0 0', paddingLeft: 18 }}><li>Bấm “Sao chép link gốc”.</li><li>Mở công cụ tạo link trong tài khoản Shopee Affiliate.</li><li>Dán link và dùng link rút gọn mang mã của bạn.</li></ol></div></div>
          </div>
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
