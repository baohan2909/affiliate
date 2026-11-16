// Thành phần dùng chung cho trang quản trị
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Users, X, Search } from 'lucide-react'
import { Btn, Chips, Chon, Field, IconBtn, ONhapGio, ONhapNgay, Spinner, useToast } from '../components/ui'
import { useDebounced } from '../lib/hooks'
import { rpc, taiAnhLen } from '../lib/api'
import { choInputGio, tuInputGio, khop, fmtSo } from '../lib/format'
import { KINH_NGHIEM, KIEU_DOI_TUONG } from '../lib/hang'

// ---------- Danh sách chọn nhanh (nhóm, cấp độ, thành viên, sản phẩm, cửa hàng, chiến dịch) ----------
let boNho = null
let dangTai = null
export function useTuyChon() {
  const [d, setD] = useState(boNho)
  useEffect(() => {
    if (boNho) return
    dangTai = dangTai || rpc('fn_qt_tuy_chon')
    dangTai.then((x) => { boNho = x; setD(x) }).catch(() => setD({ nhom: [], cap_do: [], thanh_vien: [], san_pham: [], cua_hang: [], chien_dich: [] }))
  }, [])
  return d
}
export function lamMoiTuyChon() { boNho = null; dangTai = null }

// ---------- Bảng dữ liệu: tiêu đề bấm để sắp xếp, cột số căn giữa, ô 1 dòng ----------
// cot: [{ k, t, canh: 'giua'|'phai', sx: false|key|fn, o: (row) => node, chinh: true (cột chính khi xem dạng thẻ), co: false (không cho thu) }]
// Tự vừa khung, KHÔNG kéo ngang, KHÔNG mất cột:
//  1) đủ chỗ → bảng thường;  2) thiếu chỗ → thu cột chữ (cắt "…", rê chuột xem đủ) + tiêu đề xuống dòng;
//  3) vẫn thiếu (máy nhỏ) → dạng thẻ, mỗi dòng 1 thẻ hiện đủ mọi cột.
const DEM = 24
const DEM_EP = 16
const NUT_SX = 16
let butDo = null
function tuDaiNhat(chu) { // bề rộng từ dài nhất của tiêu đề (in hoa · 11px · đậm 700 · giãn .06em)
  if (!chu || typeof chu !== 'string') return 0
  if (!butDo) { butDo = document.createElement('canvas').getContext('2d') }
  butDo.font = `700 11px ${getComputedStyle(document.body).fontFamily}`
  return Math.ceil(Math.max(...chu.toUpperCase().split(/\s+|(?<=\/)/).map((w) => butDo.measureText(w).width + w.length * 0.66))) + 2
}
const tong = (a) => a.reduce((s, x) => s + x, 0)

export function BangDL({ cot, ds, macDinh, chieu = 'giam', onBam, chon, setChon, khoa = 'id', trong = 'Không có dữ liệu', gioiHan = 200, stt = true, chan, phang, demDong = true }) {
  // Sắp xếp theo khóa cột (ổn định giữa các lần vẽ, kể cả cột sắp xếp bằng hàm)
  const [sxK, setSxK] = useState(() => (typeof macDinh === 'string' && cot.some((c) => c.k === macDinh) ? macDinh : null))
  const [sxC, setSxC] = useState(chieu)
  const hamSX = (k) => {
    if (k == null) return typeof macDinh === 'function' ? macDinh : (r) => r?.[macDinh]
    const c = cot.find((x) => x.k === k)
    return typeof c?.sx === 'function' ? c.sx : (r) => r?.[c?.sx || k]
  }
  const fSX = hamSX(sxK)
  const daXep = [...(ds || [])].sort((a, b) => {
    const x = fSX(a), y = fSX(b)
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi', { numeric: true })
    return sxC === 'tang' ? r : -r
  })
  const bamSX = (k) => { if (k === sxK) setSxC(sxC === 'tang' ? 'giam' : 'tang'); else { setSxK(k); setSxC('tang') } }

  const [n, setN] = useState(gioiHan)
  useEffect(() => setN(gioiHan), [ds, gioiHan])
  const hien = daXep.slice(0, n)
  const tatCa = chon && hien.length > 0 && hien.every((r) => chon.has(r[khoa]))
  const batChon = (r) => { const m = new Set(chon); m.has(r[khoa]) ? m.delete(r[khoa]) : m.add(r[khoa]); setChon(m) }
  const batTatCa = () => { const m = new Set(chon); if (tatCa) hien.forEach((r) => m.delete(r[khoa])); else hien.forEach((r) => m.add(r[khoa])); setChon(m) }
  const gt = (c, r) => (c.o ? c.o(r) : r[c.k] ?? '')
  const chinh = cot.find((c) => c.chinh) || cot.find((c) => !c.canh && c.t) || cot[0]

  // ---- Đo & chọn cách hiển thị ----
  const khung = useRef(null)
  const bang = useRef(null)
  const [W, setW] = useState(0)
  const [doDac, setDoDac] = useState(null) // { nd: [bề rộng nội dung lớn nhất mỗi cột], nhan: [bề rộng tiêu đề] }
  const khoaCot = cot.map((c) => c.k).join('|')
  useLayoutEffect(() => { setDoDac(null) }, [ds, n, khoaCot, !!chon, stt]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (doDac || !bang.current || !khung.current) return
    const t = bang.current
    const ths = [...t.tHead.rows[0].cells]
    const nhan = ths.map((th) => { const e = th.querySelector('.do-nhan'); return e ? Math.ceil(e.getBoundingClientRect().width) : 0 })
    const nd = ths.map(() => 0)
    for (const tr of t.tBodies[0].rows) {
      if (tr.cells.length !== ths.length) continue
      ;[...tr.cells].forEach((td, i) => { const e = td.firstElementChild; if (e) nd[i] = Math.max(nd[i], Math.ceil(e.getBoundingClientRect().width)) })
    }
    const cs = getComputedStyle(khung.current)
    setW(Math.floor(khung.current.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)))
    setDoDac({ nhan, nd })
  }, [doDac])
  useEffect(() => {
    const el = khung.current
    if (!el) return
    let truoc = el.getBoundingClientRect().width
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width)
      if (truoc < 1 && w > 0) setDoDac(null) // vừa hiện ra (trước đó bị ẩn) → đo lại
      truoc = w
      setW(w)
    })
    ro.observe(el)
    document.fonts?.ready?.then(() => setDoDac(null))
    return () => ro.disconnect()
  }, [])

  const cols = [...(chon ? [{ loai: 'chon', k: '_chon' }] : []), ...(stt ? [{ loai: 'stt', k: '_stt' }] : []), ...cot]
  const coSX = (c) => !c.loai && c.sx !== false && !!c.t
  const muiTen = (c) => (coSX(c) && sxK === c.k ? NUT_SX : 0) // chỗ cho mũi tên ở cột đang sắp xếp
  const thuDuoc = (c) => !c.loai && !c.canh && !!c.t && c.co !== false
  let che = 'do'
  let rong = null
  if (doDac && W > 0) {
    const noi = (c, i) => Math.max(doDac.nhan[i] + muiTen(c), doDac.nd[i])
    const tuNhien = cols.map((c, i) => noi(c, i) + DEM)
    if (tong(tuNhien) <= W) che = 'vua'
    else {
      const toiDa = cols.map((c, i) => noi(c, i) + DEM_EP)
      const toiThieu = cols.map((c, i) => {
        if (c.loai) return toiDa[i]
        const tieuDe = tuDaiNhat(c.t) + muiTen(c)
        // chữ ngắn (SĐT, mã, tỉnh…) giữ nguyên; chữ dài được thu, cột chính tối thiểu 180px
        const nd = doDac.nd[i]
        const noiDung = thuDuoc(c) && nd > 100 ? Math.min(nd, Math.max(c === chinh ? 180 : 100, Math.round(nd * 0.55))) : nd
        return Math.min(toiDa[i], Math.max(tieuDe, noiDung) + DEM_EP)
      })
      const A = tong(toiDa), B = tong(toiThieu)
      if (B > W) che = 'the'
      else {
        che = 'ep'
        rong = A <= W ? toiDa : toiDa.map((x, i) => Math.floor(x - ((x - toiThieu[i]) * (A - W)) / (A - B)))
      }
    }
  }
  // Ô bị cắt "…": rê chuột hiện đủ nội dung
  useLayoutEffect(() => {
    if (che !== 'ep' || !bang.current) return
    bang.current.querySelectorAll('td.co > .o').forEach((o) => { o.title = o.scrollWidth > o.clientWidth + 1 ? o.textContent.trim() : '' })
  })

  const oChon = (r) => <input type="checkbox" aria-label="Chọn" checked={chon.has(r[khoa])} onChange={() => batChon(r)} onClick={(e) => e.stopPropagation()} style={{ accentColor: '#E0157E', width: 16, height: 16 }} />
  const dsSX = cot.filter(coSX).map((c) => ({ v: c.k, t: c.t }))

  return (
    <div className={'bang-khung' + (phang ? ' phang' : '')} ref={khung}>
      {che === 'the' ? (
        <div className="bang-the">
          {(chon || dsSX.length > 0) && hien.length > 0 && (
            <div className="the-cong-cu">
              {chon && <label className="the-chon-het"><input type="checkbox" checked={tatCa} onChange={batTatCa} style={{ accentColor: '#E0157E', width: 16, height: 16 }} />Chọn tất cả</label>}
              {dsSX.length > 0 && (
                <div className="hang" style={{ gap: 6, marginLeft: 'auto' }}>
                  <span className="nho muted">Sắp xếp</span>
                  <Chon kieu="tron" giaTri={sxK ?? ''} onChon={(v) => { setSxK(v || null); }} ds={[{ v: '', t: 'Mặc định' }, ...dsSX]} />
                  <IconBtn icon={sxC === 'tang' ? ArrowUp : ArrowDown} nhan={sxC === 'tang' ? 'Tăng dần' : 'Giảm dần'} co="sm" kieu="mem" onClick={() => setSxC(sxC === 'tang' ? 'giam' : 'tang')} />
                </div>
              )}
            </div>
          )}
          {hien.length === 0 && <div className="the-trong">{trong}</div>}
          {hien.map((r, i) => {
            const tac = cot.filter((c) => !c.t && c !== chinh)
            const khac = cot.filter((c) => c !== chinh && c.t)
            return (
              <div key={r[khoa]} className={'the-dong' + (onBam ? ' bam' : '') + (chon?.has(r[khoa]) ? ' chon' : '')} onClick={onBam ? () => onBam(r) : undefined}>
                <div className="the-chinh">
                  {chon && oChon(r)}
                  <div className="gian" style={{ minWidth: 0 }}>{gt(chinh, r)}</div>
                  {stt && <span className="the-stt">#{i + 1}</span>}
                </div>
                {khac.length > 0 && (
                  <div className="the-luoi">
                    {khac.map((c) => <div key={c.k} className="the-o"><span className="the-nhan">{c.t}</span><div className="the-gt">{gt(c, r)}</div></div>)}
                  </div>
                )}
                {tac.some((c) => gt(c, r)) && <div className="the-tac" onClick={(e) => e.stopPropagation()}>{tac.map((c) => <span key={c.k}>{gt(c, r)}</span>)}</div>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bang-cuon">
          <table ref={bang} className={'bang' + (che === 'do' ? ' dang-do' : che === 'ep' ? ' ep' : '')}>
            {rong && <colgroup>{rong.map((w, i) => <col key={cols[i].k} style={{ width: w }} />)}</colgroup>}
            <thead>
              <tr>
                {chon && <th className="stt"><input type="checkbox" aria-label="Chọn tất cả" checked={tatCa} onChange={batTatCa} style={{ accentColor: '#E0157E', width: 16, height: 16 }} /></th>}
                {stt && <th className="stt"><span className="do-nhan">#</span></th>}
                {cot.map((c) => {
                  const lop = c.canh ? 'c-' + c.canh : ''
                  const nhanTD = typeof c.t === 'string' ? c.t.replace(/\//g, '/\u200B') : c.t
                  if (!coSX(c)) return <th key={c.k} className={lop}><span className="do-nhan">{nhanTD}</span></th>
                  const on = sxK === c.k
                  return (
                    <th key={c.k} className={lop} aria-sort={on ? (sxC === 'tang' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" className={'th-nut' + (on ? ' on' : '')} onClick={() => bamSX(c.k)}>
                        <span className="do-nhan">{nhanTD}</span>{on ? (sxC === 'tang' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {hien.length === 0 && <tr><td colSpan={cols.length} style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>{trong}</td></tr>}
              {hien.map((r, i) => (
                <tr key={r[khoa]} className={(onBam ? 'bam ' : '') + (chon?.has(r[khoa]) ? 'chon' : '')} onClick={onBam ? () => onBam(r) : undefined}>
                  {chon && <td className="stt" onClick={(e) => e.stopPropagation()}><span className="o">{oChon(r)}</span></td>}
                  {stt && <td className="stt"><span className="o">{i + 1}</span></td>}
                  {cot.map((c) => <td key={c.k} className={[c.canh ? 'c-' + c.canh : '', thuDuoc(c) ? 'co' : ''].join(' ').trim() || undefined}><div className="o">{gt(c, r)}</div></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(demDong || chan || hien.length < daXep.length) && <div className="chan-bang">
        <span>{demDong ? `${fmtSo(ds.length)} dòng${hien.length < daXep.length ? ` · đang hiện ${fmtSo(hien.length)}` : ''}` : ''}</span>
        <div className="hang" style={{ gap: 8 }}>
          {chan}
          {hien.length < daXep.length && <Btn co="sm" kieu="mem" onClick={() => setN(n + 300)}>Xem thêm</Btn>}
        </div>
      </div>}
    </div>
  )
}

// ---------- Ô tìm kiếm tròn ----------
export function OTim({ giaTri, onDoi, goiY = 'Tìm…' }) {
  return <label className="input-tron"><Search size={17} /><input placeholder={goiY} value={giaTri} onChange={(e) => onDoi(e.target.value)} /></label>
}

// ---------- Ô ngày giờ: dd/mm/yyyy + HH:MM (giờ máy người dùng) ↔ ISO ----------
export function ONgayGio({ nhan, giaTri, onDoi, goiY, gioMacDinh = '00:00' }) {
  const local = choInputGio(giaTri) // yyyy-mm-ddTHH:MM
  const [ngay, setNgay] = useState(local.slice(0, 10))
  const [gio, setGio] = useState(local.slice(11, 16))
  useEffect(() => { const l = choInputGio(giaTri); setNgay(l.slice(0, 10)); setGio(l.slice(11, 16)) }, [giaTri])
  const phat = (n, g) => onDoi(n ? tuInputGio(`${n}T${g || gioMacDinh}`) : '')
  return (
    <Field nhan={nhan} goiY={goiY}>
      <span className="hang" style={{ gap: 10 }}>
        <span style={{ flex: '1 1 0', minWidth: 0 }}><ONhapNgay value={ngay} onChange={(e) => { setNgay(e.target.value); phat(e.target.value, gio) }} /></span>
        <span className="muted nho" style={{ flex: 'none' }}>lúc</span>
        <span style={{ width: 64, flex: 'none' }}><ONhapGio value={gio} onChange={(e) => { setGio(e.target.value); phat(ngay, e.target.value) }} /></span>
      </span>
    </Field>
  )
}

// ---------- Tải ảnh công khai (hoặc dán link ảnh) ----------
export function ONhapAnh({ giaTri, onDoi, rong, nhan = 'Ảnh' }) {
  const bao = useToast()
  const [dang, setDang] = useState(false)
  const inp = useRef(null)
  const chon = async (f) => {
    if (!f) return
    if (!/^image\//.test(f.type)) { bao('Chọn tệp ảnh (JPG, PNG, WEBP)', 'loi'); return }
    if (f.size > 10 * 1024 * 1024) { bao('Ảnh tối đa 10MB', 'loi'); return }
    setDang(true)
    try { onDoi(await taiAnhLen(f)) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="cot" style={{ gap: 8 }}>
      <span className="nhan-nhom" style={{ margin: 0 }}>{nhan}</span>
      <div className="hang" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className={'o-anh' + (rong ? ' rong' : '')} role="button" tabIndex={0} onClick={() => inp.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chon(e.dataTransfer.files?.[0]) }}>
          {dang ? <Spinner /> : giaTri ? <img src={giaTri} alt="" /> : <div className="cot" style={{ alignItems: 'center', gap: 4 }}><ImagePlus size={22} /><span className="nho">Tải ảnh</span></div>}
          {giaTri && !dang && <IconBtn icon={X} nhan="Bỏ ảnh" co="xs" className="xoa-anh" onClick={(e) => { e.stopPropagation(); onDoi('') }} />}
        </div>
        {!rong && <div className="gian"><Field kieu="gon" nhan="Hoặc dán link ảnh" value={giaTri || ''} onChange={(e) => onDoi(e.target.value)} /></div>}
      </div>
      <input ref={inp} type="file" accept="image/*" hidden onChange={(e) => { chon(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}

// ---------- Bộ chọn đối tượng hiển thị (tất cả / nhóm / cấp độ / kinh nghiệm / thành viên) ----------
export function ChonDoiTuong({ giaTri, onDoi }) {
  const tc = useTuyChon()
  const ds = (giaTri || []).filter((d) => d.kieu !== 'tat_ca')
  const [che, setChe] = useState(ds.length ? 'chon' : 'tat')
  const [kieu, setKieu] = useState('nhom')
  const [dem, setDem] = useState(null)
  const dsDem = useDebounced(JSON.stringify(ds), 400)
  useEffect(() => {
    let huy = false
    setDem(null)
    rpc('fn_qt_dem_doi_tuong', { p_ds: JSON.parse(dsDem) }).then((n) => { if (!huy) setDem(n) }).catch(() => {})
    return () => { huy = true }
  }, [dsDem])
  const ten = (d) => {
    if (d.kieu === 'nhom') return 'Nhóm · ' + (tc?.nhom.find((x) => x.id === d.gia_tri)?.ten || '…')
    if (d.kieu === 'cap_do') return 'Cấp · ' + (tc?.cap_do.find((x) => x.id === d.gia_tri)?.ten || '…')
    if (d.kieu === 'kinh_nghiem') return KINH_NGHIEM[d.gia_tri]
    if (d.kieu === 'thanh_vien') { const t = tc?.thanh_vien.find((x) => x.id === d.gia_tri); return t ? t.ten + ' · ' + t.ma : '…' }
    return KIEU_DOI_TUONG[d.kieu]
  }
  const them = (v) => {
    if (!v || ds.some((d) => d.kieu === kieu && d.gia_tri === v)) return
    onDoi([...ds, { kieu, gia_tri: v }])
  }
  const luaChon = !tc ? [] : kieu === 'nhom' ? tc.nhom.map((x) => ({ v: x.id, t: x.ten }))
    : kieu === 'cap_do' ? tc.cap_do.map((x) => ({ v: x.id, t: x.ten }))
      : kieu === 'kinh_nghiem' ? Object.entries(KINH_NGHIEM).map(([v, t]) => ({ v, t }))
        : tc.thanh_vien.map((x) => ({ v: x.id, t: x.ten, phu: x.ma + (x.dien_thoai ? ' · ' + x.dien_thoai : '') }))
  return (
    <div className="doi-tuong">
      <div className="hang wrap" style={{ gap: 8, justifyContent: 'space-between' }}>
        <Chips co="sm" trang ds={[{ v: 'tat', t: 'Tất cả thành viên' }, { v: 'chon', t: 'Chọn đối tượng' }]} giaTri={che}
          onChon={(v) => { setChe(v); if (v === 'tat') onDoi([]) }} />
        <span className="nho" style={{ fontWeight: 700, color: 'var(--pink-deep)' }}><Users size={14} style={{ verticalAlign: -2 }} /> {dem == null ? '…' : fmtSo(dem)} thành viên khớp</span>
      </div>
      {che === 'chon' && (
        <>
          {ds.length > 0
            ? <div className="hang wrap" style={{ gap: 6 }}>{ds.map((d, i) => (
                <span key={i} className="the-chon">{ten(d)}<button type="button" aria-label="Bỏ" onClick={() => onDoi(ds.filter((_, j) => j !== i))}><X size={12} /></button></span>
              ))}</div>
            : <p className="nho muted">Chưa chọn điều kiện nào — hiện đang áp dụng cho tất cả thành viên.</p>}
          <div className="hang wrap" style={{ gap: 8 }}>
            <Chips co="sm" ds={[{ v: 'nhom', t: 'Nhóm' }, { v: 'cap_do', t: 'Cấp độ' }, { v: 'kinh_nghiem', t: 'Kinh nghiệm' }, { v: 'thanh_vien', t: 'Thành viên' }]} giaTri={kieu} onChon={setKieu} />
            <div style={{ minWidth: 220, flex: 1 }}><Chon kieu="tron" ds={luaChon} giaTri="" goiY={'+ Thêm ' + KIEU_DOI_TUONG[kieu].toLowerCase()} onChon={them} tim={kieu === 'thanh_vien' || luaChon.length > 8} /></div>
          </div>
          <p className="nho muted">Thành viên khớp <b>bất kỳ</b> điều kiện nào ở trên sẽ thấy mục này.</p>
        </>
      )}
    </div>
  )
}

// ---------- Excel ----------
export async function xuatExcel(tenTep, dong, tenSheet = 'Dữ liệu') {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(dong)
  const cot = Object.keys(dong[0] || {})
  ws['!cols'] = cot.map((k) => ({ wch: Math.min(48, Math.max(10, k.length + 2, ...dong.slice(0, 200).map((r) => String(r[k] ?? '').length + 1))) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, tenSheet.slice(0, 30))
  XLSX.writeFile(wb, tenTep.endsWith('.xlsx') ? tenTep : tenTep + '.xlsx')
}
export async function docExcel(file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
}
export function taiCSV(tenTep, dong) {
  const cot = Object.keys(dong[0] || {})
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const csv = '﻿' + [cot.join(','), ...dong.map((r) => cot.map((k) => esc(r[k])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = tenTep
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

// ---------- Danh sách động (thêm/xóa dòng) cho mục đơn giản ----------
export function DsDong({ ds, onDoi, moi, dong, nutThem = 'Thêm dòng' }) {
  return (
    <div className="cot" style={{ gap: 10 }}>
      {ds.map((x, i) => (
        <div key={i} className="khoi-form" style={{ padding: 12, borderRadius: 18, background: 'var(--soft)', position: 'relative' }}>
          {dong(x, (v) => onDoi(ds.map((y, j) => (j === i ? { ...y, ...v } : y))), i)}
          <button type="button" className="lien-ket nho" style={{ color: 'var(--err)', alignSelf: 'flex-start' }} onClick={() => onDoi(ds.filter((_, j) => j !== i))}><Trash2 size={13} />Xóa</button>
        </div>
      ))}
      <div><Btn co="sm" kieu="mem" icon={Plus} onClick={() => onDoi([...ds, moi()])}>{nutThem}</Btn></div>
    </div>
  )
}

// ---------- Lọc nhanh theo chuỗi ----------
export const locChu = (ds, q, f) => (q ? ds.filter((r) => khop(f(r), q)) : ds)
export { useMemo }

// ---------- Cấu hình (danh mục, loại chiến dịch…) ----------
let boNhoCH = null
export function useCauHinh() {
  const [d, setD] = useState(boNhoCH)
  useEffect(() => { if (!boNhoCH) rpc('fn_qt_cau_hinh_doc').then((x) => { boNhoCH = x; setD(x) }).catch(() => setD({})) }, [])
  return d
}
export function lamMoiCauHinh() { boNhoCH = null }
