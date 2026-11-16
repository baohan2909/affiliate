import { useCallback, useEffect, useRef, useState } from 'react'

// Gọi dữ liệu bất đồng bộ: { data, loading, error, reload, setData }
export function useAsync(ham, phuThuoc = []) {
  const [st, setSt] = useState({ data: undefined, loading: true, error: null })
  const lan = useRef(0)
  const chay = useCallback((im) => {
    const id = ++lan.current
    if (!im) setSt((s) => ({ ...s, loading: true, error: null }))
    return Promise.resolve()
      .then(ham)
      .then((data) => { if (id === lan.current) setSt({ data, loading: false, error: null }) })
      .catch((error) => { if (id === lan.current) setSt((s) => ({ ...s, loading: false, error })) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, phuThuoc)
  useEffect(() => { chay() }, [chay])
  const setData = useCallback((f) => setSt((s) => ({ ...s, data: typeof f === 'function' ? f(s.data) : f })), [])
  return { ...st, reload: chay, setData }
}

export function useDebounced(giaTri, ms = 300) {
  const [v, setV] = useState(giaTri)
  useEffect(() => { const t = setTimeout(() => setV(giaTri), ms); return () => clearTimeout(t) }, [giaTri, ms])
  return v
}

export function useLS(khoa, macDinh) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(khoa); return s == null ? macDinh : JSON.parse(s) } catch { return macDinh }
  })
  useEffect(() => { try { localStorage.setItem(khoa, JSON.stringify(v)) } catch { /* bỏ qua */ } }, [khoa, v])
  return [v, setV]
}

export function useMedia(q) {
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setOk(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [q])
  return ok
}

// Sắp xếp bảng: bấm tiêu đề cột để đổi chiều
export function useSapXep(ds, macDinh, chieuMacDinh = 'giam') {
  const [cot, setCot] = useState(macDinh)
  const [chieu, setChieu] = useState(chieuMacDinh)
  const bam = (c) => { if (c === cot) setChieu(chieu === 'tang' ? 'giam' : 'tang'); else { setCot(c); setChieu('tang') } }
  const kq = [...(ds || [])].sort((a, b) => {
    const x = typeof cot === 'function' ? cot(a) : a?.[cot]
    const y = typeof cot === 'function' ? cot(b) : b?.[cot]
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi', { numeric: true })
    return chieu === 'tang' ? r : -r
  })
  return { ds: kq, cot, chieu, bam }
}
