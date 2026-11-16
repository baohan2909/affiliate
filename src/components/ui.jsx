import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, ChevronDown, Info, X, AlertCircle, Sparkles, Inbox, Search, ArrowUp, ArrowDown } from 'lucide-react'
import QRCode from 'qrcode'
import { khop } from '../lib/format'

// ---------- Thương hiệu ----------
export function NonIcon({ size = 18, stroke = 1.9 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 15V10.5C7.5 7.5 9.5 6 12 6s4.5 1.5 4.5 4.5V15" /><path d="M7.5 12.8h9" /><path d="M2.5 15.2c1.6 1.8 5.3 2.8 9.5 2.8s7.9-1 9.5-2.8" />
    </svg>
  )
}
export function Brand({ toi = true, phu = 'AFFILIATE HUB' }) {
  return (
    <div className="hang" style={{ gap: 10 }}>
      <span className="logo-tron" style={{ background: toi ? 'rgba(255,255,255,.12)' : 'var(--ink)', border: toi ? '1px solid rgba(255,255,255,.22)' : 'none' }}><NonIcon /></span>
      <span style={{ lineHeight: 1.05 }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: 12, letterSpacing: '.2em', color: toi ? '#fff' : 'var(--ink)' }}>NÓN SƠN</span>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 9.5, letterSpacing: '.24em', color: toi ? 'var(--pink-2)' : 'var(--pink)', marginTop: 3 }}>{phu}</span>
      </span>
    </div>
  )
}

export function Spinner({ size = 22 }) { return <span className="spin" style={{ width: size, height: size }} aria-label="Đang tải" /> }

export function Btn({ kieu, co, orb, loading, icon: Icon, children, className = '', ...p }) {
  const cls = ['btn', kieu, co, orb ? 'co-orb' : '', className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} disabled={loading || p.disabled} {...p}>
      {loading ? <Spinner size={16} /> : Icon && !orb ? <Icon size={17} strokeWidth={2.2} /> : null}
      {children}
      {orb && <span className={'orb' + (co === 'lg' ? '' : ' sm')}>{Icon ? <Icon size={16} strokeWidth={2.6} /> : <ArrowRight size={17} strokeWidth={2.6} />}</span>}
    </button>
  )
}

export function IconBtn({ icon: Icon, nhan, kieu = '', co = '', size = 18, className = '', children, ...p }) {
  return (
    <button type="button" className={['icon-btn', kieu, co, className].join(' ')} aria-label={nhan} title={nhan} {...p}>
      <Icon size={size} strokeWidth={2} />
      {children}
    </button>
  )
}

// ---------- Ô ngày dd/mm/yyyy và giờ HH:MM (24h) — không phụ thuộc ngôn ngữ trình duyệt ----------
const isoSangNgay = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : '' }
export function ngaySangIso(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '')
  if (!m) return null
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]))
  if (d.getUTCFullYear() !== +m[3] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[1] || +m[3] < 1900) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}
const motNgay = (raw) => { const d = raw.replace(/\D/g, '').slice(0, 8); return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }
const motGio = (raw) => { const d = raw.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d }
const gioHopLe = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '')

function ONhapNgay({ value, onChange, disabled, className, id, name, autoFocus, required }) {
  const [chu, setChu] = useState(isoSangNgay(value))
  const lich = useRef(null)
  useEffect(() => { if ((ngaySangIso(chu) || '') !== (value || '').slice(0, 10)) setChu(isoSangNgay(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const phat = (v) => onChange && onChange({ target: { value: v } })
  const doi = (e) => {
    const t = motNgay(e.target.value)
    setChu(t)
    if (!t) phat('')
    else { const iso = ngaySangIso(t); if (iso) phat(iso); else if (t.length < 10) phat('') }
  }
  const sai = chu.length === 10 && !ngaySangIso(chu)
  return (
    <span className="nhap-ngay">
      <input type="text" inputMode="numeric" autoComplete="off" placeholder="dd/mm/yyyy" maxLength={10} value={chu} onChange={doi}
        disabled={disabled} className={[className, sai ? 'sai' : ''].filter(Boolean).join(' ') || undefined} id={id} name={name} autoFocus={autoFocus} required={required} aria-invalid={sai || undefined} />
      {!disabled && (
        <button type="button" className="lich-btn" aria-label="Chọn trên lịch" tabIndex={-1}
          onClick={(e) => { e.preventDefault(); const el = lich.current; if (!el) return; try { el.showPicker() } catch { el.focus(); el.click() } }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
        </button>
      )}
      <input ref={lich} type="date" tabIndex={-1} aria-hidden="true" className="an-lich" value={(value || '').slice(0, 10)}
        onChange={(e) => { setChu(isoSangNgay(e.target.value)); phat(e.target.value) }} />
      {sai && <span className="sai-chu">Ngày không hợp lệ</span>}
    </span>
  )
}

function ONhapGio({ value, onChange, disabled, className, id, name }) {
  const [chu, setChu] = useState((value || '').slice(0, 5))
  useEffect(() => { if ((value || '').slice(0, 5) !== (gioHopLe(chu) ? chu : '')) setChu((value || '').slice(0, 5)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const doi = (e) => {
    const t = motGio(e.target.value)
    setChu(t)
    if (!t) onChange && onChange({ target: { value: '' } })
    else if (gioHopLe(t)) onChange && onChange({ target: { value: t } })
  }
  const sai = chu.length === 5 && !gioHopLe(chu)
  return <input type="text" inputMode="numeric" autoComplete="off" placeholder="HH:MM" maxLength={5} value={chu} onChange={doi} disabled={disabled}
    className={[className, sai ? 'sai' : ''].filter(Boolean).join(' ') || undefined} id={id} name={name} aria-invalid={sai || undefined} />
}

export function Field({ nhan, batBuoc, loi, goiY, kieu, className = '', children, ...p }) {
  const o = children || (p.type === 'date' ? <ONhapNgay {...p} /> : p.type === 'time' ? <ONhapGio {...p} /> : <input {...p} />)
  return (
    <div>
      <label className={['field', kieu, loi ? 'loi' : '', className].join(' ')}>
        <span className="nhan">{nhan}{batBuoc && <i>*</i>}</span>
        {o}
        {goiY && <div className="goi-y">{goiY}</div>}
      </label>
      {loi && typeof loi === 'string' && <div className="loi-chu">{loi}</div>}
    </div>
  )
}
export { ONhapNgay, ONhapGio }

export function TextArea({ nhan, batBuoc, goiY, ...p }) {
  return <Field nhan={nhan} batBuoc={batBuoc} goiY={goiY}><textarea {...p} /></Field>
}

// Ô chọn có tìm kiếm (không dùng <select> thô). ds: [{v,t,phu?}]
export function Chon({ nhan, giaTri, onChon, ds, goiY = 'Chọn…', batBuoc, gon, rong, tim, kieu = 'field', disabled }) {
  const [mo, setMo] = useState(false)
  const [q, setQ] = useState('')
  const [vt, setVt] = useState(null)
  const goc = useRef(null)
  const hop = useRef(null)
  const chon = ds.find((x) => String(x.v) === String(giaTri))
  const coTim = tim ?? ds.length > 8
  const loc = useMemo(() => ds.filter((x) => khop(x.t + ' ' + (x.phu || ''), q)), [ds, q])
  useLayoutEffect(() => {
    if (!mo || !goc.current) return
    const r = goc.current.getBoundingClientRect()
    const w = Math.max(r.width, 240)
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8))
    const duoi = window.innerHeight - r.bottom
    const cao = Math.min(360, Math.max(duoi, r.top) - 16)
    setVt(duoi >= 260 || duoi >= r.top ? { left, top: r.bottom + 6, width: w, maxHeight: cao } : { left, bottom: window.innerHeight - r.top + 6, width: w, maxHeight: cao })
  }, [mo])
  useEffect(() => {
    if (!mo) return
    const f = (e) => { if (!hop.current?.contains(e.target) && !goc.current?.contains(e.target)) setMo(false) }
    const k = (e) => { if (e.key === 'Escape') setMo(false) }
    const cuon = (e) => { if (!hop.current?.contains(e.target)) setMo(false) }
    document.addEventListener('mousedown', f); document.addEventListener('touchstart', f); window.addEventListener('keydown', k); window.addEventListener('scroll', cuon, true)
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('touchstart', f); window.removeEventListener('keydown', k); window.removeEventListener('scroll', cuon, true) }
  }, [mo])
  useEffect(() => { if (!mo) setQ('') }, [mo])
  const nut = (
    <button type="button" ref={goc} disabled={disabled} className={kieu === 'field' ? 'chon-nut' : 'input-tron chon-tron'} onClick={() => setMo((x) => !x)} aria-haspopup="listbox" aria-expanded={mo}>
      <span className={'cat gian' + (chon ? '' : ' chon-goi')}>{chon ? chon.t : goiY}</span>
      <ChevronDown size={16} />
    </button>
  )
  return (
    <div style={rong ? { width: '100%' } : undefined}>
      {kieu === 'field'
        ? <div className={'field chon' + (gon ? ' gon' : '') + (mo ? ' dang-mo' : '')}><span className="nhan">{nhan}{batBuoc && <i>*</i>}</span>{nut}</div>
        : nut}
      {mo && vt && createPortal(
        <div ref={hop} className="menu chon-menu" style={{ position: 'fixed', ...vt }} role="listbox">
          {coTim && <div className="chon-tim"><Search size={15} /><input autoFocus placeholder="Tìm…" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
          <div className="chon-ds cuon-mong">
            {loc.length === 0 && <div className="tieu">Không có kết quả</div>}
            {loc.map((x) => (
              <button type="button" key={x.v} role="option" aria-selected={String(x.v) === String(giaTri)} className={String(x.v) === String(giaTri) ? 'on' : ''}
                onClick={() => { onChon(x.v); setMo(false) }}>
                <span className="gian cat">{x.t}{x.phu && <small className="muted"> · {x.phu}</small>}</span>
                {String(x.v) === String(giaTri) && <Check size={15} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>, document.body)}
    </div>
  )
}

export function Chips({ ds, giaTri, onChon, nhieu, tick, co = '', trang }) {
  const on = (v) => (nhieu ? (giaTri || []).includes(v) : giaTri === v)
  return (
    <div className="chips" role={nhieu ? 'group' : 'radiogroup'}>
      {ds.map((x) => {
        const v = typeof x === 'string' ? x : x.v
        const t = typeof x === 'string' ? x : x.t
        return (
          <button key={v} type="button" role={nhieu ? 'checkbox' : 'radio'} aria-checked={on(v)}
            className={['chip', co, tick ? 'tick' : '', trang ? 'trang' : '', on(v) ? 'on' : ''].join(' ')}
            onClick={() => onChon(nhieu ? (on(v) ? giaTri.filter((y) => y !== v) : [...(giaTri || []), v]) : v)}>
            {t}{x.dem != null && <span className="dem">{x.dem}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Segment({ ds, giaTri, onChon, trang }) {
  return (
    <div className={'phan-doan' + (trang ? ' trang' : '')} role="tablist">
      {ds.map((x) => (
        <button key={x.v} type="button" role="tab" aria-selected={giaTri === x.v} className={giaTri === x.v ? 'on' : ''} onClick={() => onChon(x.v)}>
          {x.icon && <x.icon size={15} strokeWidth={2.2} />}{x.t}{x.dem > 0 && <span className="dem-nho">{x.dem}</span>}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onDoi, nhan, disabled }) {
  return <button type="button" role="switch" aria-checked={!!on} aria-label={nhan} disabled={disabled} className={'cong-tac' + (on ? ' on' : '')} onClick={() => onDoi(!on)} />
}

export function DongSwitch({ nhan, moTa, on, onDoi }) {
  return (
    <div className="dong-switch">
      <div className="gian"><b>{nhan}</b>{moTa && <span>{moTa}</span>}</div>
      <Switch on={on} onDoi={onDoi} nhan={nhan} />
    </div>
  )
}

// Nhãn trạng thái theo bảng màu (lib/hang.js)
export function Nhan({ bang, ma, lg }) {
  const g = bang?.[ma]
  if (!g) return null
  return <span className={'tag' + (lg ? ' lg' : '')} style={{ background: g.bg, color: g.fg }}><i className="cham" style={{ background: g.fg }} />{g.ten}</span>
}

export function Empty({ icon: Icon = Inbox, tieuDe, children, hanhDong }) {
  return (
    <div className="rong-trong">
      <span className="ic"><Icon size={28} /></span>
      {tieuDe && <b>{tieuDe}</b>}
      {children && <div className="nho" style={{ maxWidth: 420 }}>{children}</div>}
      {hanhDong}
    </div>
  )
}

export function Bao({ kieu = 'xanh', children }) {
  const Ic = kieu === 'loi' ? AlertCircle : kieu === 'ok' ? Check : Info
  return <div className={'bao ' + kieu}><Ic size={17} /><div>{children}</div></div>
}

export function Skeleton({ h = 16, w = '100%', tron, style }) {
  return <div className={'khung' + (tron ? ' tron' : '')} style={{ height: h, width: w, ...style }} />
}
export function KhungTai({ dong = 4 }) {
  return <div className="cot" style={{ gap: 12 }}>{Array.from({ length: dong }, (_, i) => <Skeleton key={i} h={i === 0 ? 120 : 64} style={{ borderRadius: 22 }} />)}</div>
}
export function LoiTai({ loi, thuLai }) {
  return <Empty icon={AlertCircle} tieuDe="Chưa tải được dữ liệu" hanhDong={thuLai && <Btn kieu="vien" co="sm" onClick={() => thuLai()}>Thử lại</Btn>}>{loi?.message || String(loi || '')}</Empty>
}

// ---------- Hộp thoại ----------
export function Modal({ mo, dong, tieuDe, moTa, rong, children, chan }) {
  useEffect(() => {
    if (!mo) return
    const f = (e) => { if (e.key === 'Escape') dong() }
    window.addEventListener('keydown', f)
    const cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', f); document.body.style.overflow = cu }
  }, [mo, dong])
  if (!mo) return null
  return createPortal(
    <div className="man-che" onMouseDown={(e) => { if (e.target === e.currentTarget) dong() }}>
      <div className={'hop' + (rong === 2 ? ' rat-rong' : rong ? ' rong' : '')} role="dialog" aria-modal="true" aria-label={tieuDe}>
        <div className="hop-dau">
          <div className="gian"><h2>{tieuDe}</h2>{moTa && <p>{moTa}</p>}</div>
          <IconBtn icon={X} nhan="Đóng" kieu="mem" co="sm" onClick={dong} />
        </div>
        {children}
        {chan && <div className="hop-chan">{chan}</div>}
      </div>
    </div>,
    document.body
  )
}

// ---------- Thông báo nhanh ----------
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [ds, setDs] = useState([])
  const bao = useCallback((noiDung, kieu = 'ok', opt = {}) => {
    const id = Math.random().toString(36).slice(2)
    setDs((x) => [...x.slice(-2), { id, noiDung: typeof noiDung === 'object' && noiDung?.message ? noiDung.message : noiDung, kieu, ...opt }])
    setTimeout(() => setDs((x) => x.filter((t) => t.id !== id)), opt.ms || (kieu === 'loi' ? 5200 : 3200))
  }, [])
  return (
    <ToastCtx.Provider value={bao}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="polite">
          {ds.map((t) => (
            <div key={t.id} className={'toast ' + t.kieu}>
              <span className="ic">{t.kieu === 'loi' ? <AlertCircle size={16} /> : t.kieu === 'hong' ? <Sparkles size={15} /> : <Check size={16} strokeWidth={3} />}</span>
              <span>{t.noiDung}</span>
            </div>
          ))}
        </div>, document.body)}
    </ToastCtx.Provider>
  )
}

// ---------- Xác nhận ----------
const XacNhanCtx = createContext(null)
export const useXacNhan = () => useContext(XacNhanCtx)
export function XacNhanProvider({ children }) {
  const [hoi, setHoi] = useState(null)
  const [nhap, setNhap] = useState('')
  const xacNhan = useCallback((o) => new Promise((ok) => { setNhap(''); setHoi({ ...o, ok }) }), [])
  const xong = (v) => { hoi?.ok(v && hoi.nhapLyDo ? { ly_do: nhap } : v); setHoi(null) }
  return (
    <XacNhanCtx.Provider value={xacNhan}>
      {children}
      <Modal mo={!!hoi} dong={() => xong(false)} tieuDe={hoi?.tieuDe} moTa={hoi?.moTa}
        chan={<>
          <Btn kieu="trong" onClick={() => xong(false)}>Hủy</Btn>
          <Btn kieu={hoi?.nguyHiem ? 'do' : 'den'} disabled={hoi?.batBuocLyDo && !nhap.trim()} onClick={() => xong(true)}>{hoi?.nut || 'Đồng ý'}</Btn>
        </>}>
        {hoi?.noiDung}
        {hoi?.nhapLyDo && <TextArea nhan={hoi.nhanLyDo || 'Lý do'} batBuoc={hoi.batBuocLyDo} value={nhap} onChange={(e) => setNhap(e.target.value)} placeholder={hoi.goiYLyDo || ''} />}
      </Modal>
    </XacNhanCtx.Provider>
  )
}

// ---------- Nội dung dạng markdown gọn (## tiêu đề, - gạch đầu dòng, 1. đánh số, **đậm**, [chữ](link)) ----------
function dongChu(s, k) {
  const out = []
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g
  let i = 0, m
  while ((m = re.exec(s))) {
    if (m.index > i) out.push(s.slice(i, m.index))
    const t = m[0]
    if (t.startsWith('**')) out.push(<b key={k + '-' + m.index}>{t.slice(2, -2)}</b>)
    else if (t.startsWith('[')) { const [, a, h] = t.match(/\[([^\]]+)\]\(([^)]+)\)/); out.push(<a key={k + '-' + m.index} href={h} target="_blank" rel="noreferrer">{a}</a>) }
    else out.push(<a key={k + '-' + m.index} href={t} target="_blank" rel="noreferrer">{t}</a>)
    i = m.index + t.length
  }
  if (i < s.length) out.push(s.slice(i))
  return out
}
export function Md({ chu, className = '' }) {
  const khoi = []
  let ds = null
  const dong = String(chu || '').split('\n')
  const dongDs = () => { if (ds) { khoi.push(ds); ds = null } }
  dong.forEach((d, i) => {
    const t = d.trimEnd()
    if (/^##\s+/.test(t)) { dongDs(); khoi.push(<h3 key={i}>{dongChu(t.replace(/^##\s+/, ''), i)}</h3>) }
    else if (/^[-•]\s+/.test(t)) { if (!ds || ds.type !== 'ul') { dongDs(); ds = { type: 'ul', items: [] } } ds.items.push(dongChu(t.replace(/^[-•]\s+/, ''), i)) }
    else if (/^\d+\.\s+/.test(t)) { if (!ds || ds.type !== 'ol') { dongDs(); ds = { type: 'ol', items: [] } } ds.items.push(dongChu(t.replace(/^\d+\.\s+/, ''), i)) }
    else if (!t.trim()) dongDs()
    else { dongDs(); khoi.push(<p key={i}>{dongChu(t, i)}</p>) }
  })
  dongDs()
  return (
    <div className={'md ' + className}>
      {khoi.map((k, i) => (k.type === 'ul' || k.type === 'ol')
        ? (k.type === 'ul' ? <ul key={'l' + i}>{k.items.map((x, j) => <li key={j}>{x}</li>)}</ul> : <ol key={'l' + i}>{k.items.map((x, j) => <li key={j}>{x}</li>)}</ol>)
        : k)}
    </div>
  )
}

// ---------- Mã QR ----------
export function MaQR({ giaTri, size = 180 }) {
  const [src, setSrc] = useState(null)
  useEffect(() => { QRCode.toDataURL(String(giaTri || ''), { width: size * 2, margin: 1, color: { dark: '#14070F', light: '#FFFFFF' } }).then(setSrc).catch(() => setSrc(null)) }, [giaTri, size])
  return src ? <img src={src} alt={'Mã QR ' + giaTri} width={size} height={size} style={{ borderRadius: 16 }} /> : <Skeleton h={size} w={size} />
}

// Ảnh có ảnh dự phòng khi lỗi
export function Anh({ src, alt = '', className = '', ...p }) {
  const [loi, setLoi] = useState(false)
  useEffect(() => setLoi(false), [src])
  if (!src || loi) return <div className={'anh-trong ' + className} {...p}><NonIcon size={28} stroke={1.5} /></div>
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setLoi(true)} {...p} />
}

// Tiêu đề trang
export function TrangDau({ eyebrow, tieuDe, phu, phai }) {
  return (
    <div className="trang-dau">
      <div className="tieu">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{tieuDe}</h1>
        {phu && <p className="phu">{phu}</p>}
      </div>
      {phai && <div className="hang wrap" style={{ gap: 8 }}>{phai}</div>}
    </div>
  )
}

// Thanh tiến độ gradient có dải sáng chạy
export function ThanhTienDo({ pct, nhan, so }) {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)))
  return (
    <div className="ttd">
      {(nhan || so) && <div className="ttd-info"><span className="ttd-nhan">{nhan}</span><span className="ttd-so">{so ?? <b>{p}%</b>}</span></div>}
      <div className="ttd-thanh"><div className="ttd-fill" style={{ width: p + '%' }}><i className="ttd-song" /></div></div>
    </div>
  )
}

// Ô tiêu đề cột bảng có sắp xếp
export function CotSX({ ten, cot, sx, canh }) {
  const on = sx.cot === cot
  return (
    <th className={canh ? 'c-' + canh : ''} aria-sort={on ? (sx.chieu === 'tang' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={'th-nut' + (on ? ' on' : '')} onClick={() => sx.bam(cot)}>
        {ten}{on ? (sx.chieu === 'tang' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
      </button>
    </th>
  )
}

// Sao đánh giá
export function Sao({ giaTri = 0, onChon, size = 22 }) {
  return (
    <div className="sao" role={onChon ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChon} className={n <= giaTri ? 'on' : ''} onClick={() => onChon && onChon(n)} aria-label={n + ' sao'}>
          <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4L2.8 9.5l6.4-.8z" /></svg>
        </button>
      ))}
    </div>
  )
}

// Sao chép vào bộ nhớ tạm
export async function saoChep(chu) {
  try { await navigator.clipboard.writeText(chu); return true } catch {
    const t = document.createElement('textarea'); t.value = chu; document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy'); t.remove(); return ok
  }
}
