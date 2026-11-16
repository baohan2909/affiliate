// Thành phần dùng chung cho trang quản trị
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Plus, Trash2, Users, X, Search } from 'lucide-react'
import { Btn, Chips, Chon, CotSX, Field, IconBtn, ONhapGio, ONhapNgay, Spinner, useToast } from '../components/ui'
import { useSapXep, useDebounced } from '../lib/hooks'
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
// cot: [{ k, t, canh: 'giua'|'phai', sx: false|key|fn, o: (row) => node, w }]
export function BangDL({ cot, ds, macDinh, chieu = 'giam', onBam, chon, setChon, khoa = 'id', trong = 'Không có dữ liệu', gioiHan = 200, stt = true, chan }) {
  const sx = useSapXep(ds, macDinh, chieu)
  const [n, setN] = useState(gioiHan)
  useEffect(() => setN(gioiHan), [ds, gioiHan])
  const hien = sx.ds.slice(0, n)
  const tatCa = chon && hien.length > 0 && hien.every((r) => chon.has(r[khoa]))
  const batChon = (r) => { const m = new Set(chon); m.has(r[khoa]) ? m.delete(r[khoa]) : m.add(r[khoa]); setChon(m) }
  const batTatCa = () => { const m = new Set(chon); if (tatCa) hien.forEach((r) => m.delete(r[khoa])); else hien.forEach((r) => m.add(r[khoa])); setChon(m) }
  return (
    <div className="bang-khung">
      <div className="bang-cuon">
        <table className="bang">
          <thead>
            <tr>
              {chon && <th className="stt"><input type="checkbox" aria-label="Chọn tất cả" checked={tatCa} onChange={batTatCa} style={{ accentColor: '#E0157E', width: 16, height: 16 }} /></th>}
              {stt && <th className="stt">#</th>}
              {cot.map((c) => (c.sx === false
                ? <th key={c.k} className={c.canh ? 'c-' + c.canh : ''} style={c.w ? { width: c.w } : undefined}>{c.t}</th>
                : <CotSX key={c.k} ten={c.t} cot={c.sx || c.k} sx={sx} canh={c.canh} />))}
            </tr>
          </thead>
          <tbody>
            {hien.length === 0 && <tr><td colSpan={cot.length + (chon ? 1 : 0) + (stt ? 1 : 0)} style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>{trong}</td></tr>}
            {hien.map((r, i) => (
              <tr key={r[khoa]} className={(onBam ? 'bam ' : '') + (chon?.has(r[khoa]) ? 'chon' : '')} onClick={onBam ? () => onBam(r) : undefined}>
                {chon && <td className="stt" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Chọn" checked={chon.has(r[khoa])} onChange={() => batChon(r)} style={{ accentColor: '#E0157E', width: 16, height: 16 }} /></td>}
                {stt && <td className="stt">{i + 1}</td>}
                {cot.map((c) => <td key={c.k} className={c.canh ? 'c-' + c.canh : ''}>{c.o ? c.o(r) : r[c.k] ?? ''}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chan-bang">
        <span>{fmtSo(ds.length)} dòng{hien.length < sx.ds.length ? ` · đang hiện ${fmtSo(hien.length)}` : ''}</span>
        <div className="hang" style={{ gap: 8 }}>
          {chan}
          {hien.length < sx.ds.length && <Btn co="sm" kieu="mem" onClick={() => setN(n + 300)}>Xem thêm</Btn>}
        </div>
      </div>
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
