import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { sb, rpc, dangXuat } from '../lib/api'

// Phiên đăng nhập + hồ sơ (thành viên hoặc nhân sự) dùng chung cho 3 cổng
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [phien, setPhien] = useState(undefined) // undefined = đang kiểm
  const [toi, setToi] = useState(undefined)

  const taiToi = useCallback(async () => {
    try { setToi(await rpc('fn_toi')) } catch { setToi({ loai: null }) }
  }, [])

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setPhien(data.session || null))
    const { data } = sb.auth.onAuthStateChange((su, s) => {
      setPhien(s || null)
      if (su === 'SIGNED_OUT') setToi({ loai: null })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (phien === undefined) return
    if (!phien) { setToi({ loai: null }); return }
    setToi(undefined)
    taiToi()
  }, [phien?.user?.id, taiToi]) // eslint-disable-line react-hooks/exhaustive-deps

  const thoat = useCallback(async () => { await dangXuat(); setToi({ loai: null }) }, [])
  const tv = toi?.loai === 'thanh_vien' ? toi.thanh_vien : null
  const ns = toi?.loai === 'nhan_su' ? toi.nhan_su : null
  const dangKiem = phien === undefined || (phien && toi === undefined)

  return <Ctx.Provider value={{ phien, toi, tv, ns, dangKiem, taiToi, thoat, setToi }}>{children}</Ctx.Provider>
}
