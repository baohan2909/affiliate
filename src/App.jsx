import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Spinner, ToastProvider, XacNhanProvider } from './components/ui'
import { AuthProvider } from './components/auth'
import CongThanhVien from './member/Cong'

const CongQuanTri = lazy(() => import('./admin/Cong'))
const CongCuaHang = lazy(() => import('./store/CuaHang'))

function LenDau() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export const TaiTrang = () => <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Spinner size={28} /></div>

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <LenDau />
      <ToastProvider>
        <XacNhanProvider>
          <AuthProvider>
            <Suspense fallback={<TaiTrang />}>
              <Routes>
                <Route path="/quantri/*" element={<CongQuanTri />} />
                <Route path="/cuahang/*" element={<CongCuaHang />} />
                <Route path="/quan-tri/*" element={<Navigate to="/quantri" replace />} />
                <Route path="/*" element={<CongThanhVien />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </XacNhanProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
