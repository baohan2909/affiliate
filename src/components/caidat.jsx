// Cài ứng dụng (PWA) lên điện thoại / máy tính — dùng chung cho 3 cổng
import { useEffect, useState } from 'react'
import { Download, MonitorDown, MoreVertical, PlusSquare, Share, X } from 'lucide-react'
import { Btn, IconBtn, Modal, NonIcon } from './ui'
import { useLS } from '../lib/hooks'

let suKien = null
const nghe = new Set()
const baoDoi = () => nghe.forEach((f) => f())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); suKien = e; baoDoi() })
  window.addEventListener('appinstalled', () => { suKien = null; baoDoi() })
}
const daCaiApp = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
const laIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const trongApp = () => /zalo|fban|fbav|instagram|line\//i.test(navigator.userAgent)

export function useCaiDat() {
  const [, setN] = useState(0)
  useEffect(() => { const f = () => setN((x) => x + 1); nghe.add(f); return () => { nghe.delete(f) } }, [])
  return { daCai: daCaiApp(), coNhac: !!suKien }
}

// Mỗi cổng một manifest → cài từ cổng nào, mở ra đúng cổng đó
export function useManifest(tep) {
  useEffect(() => {
    const l = document.querySelector('link[rel="manifest"]')
    if (!l) return
    const cu = l.getAttribute('href')
    l.setAttribute('href', import.meta.env.BASE_URL + tep)
    return () => l.setAttribute('href', cu)
  }, [tep])
}

function Buoc({ so, children }) {
  return <li><span className="so">{so}</span><div>{children}</div></li>
}

export function HuongDanCai({ mo, dong, ten = 'Nón Sơn Affiliate Hub' }) {
  const ios = laIOS()
  return (
    <Modal mo={mo} dong={dong} tieuDe="Cài ứng dụng" moTa={`Đưa ${ten} ra màn hình chính, mở nhanh như app thật.`} chan={<Btn kieu="den" onClick={dong}>Đã hiểu</Btn>}>
      {trongApp() && <p className="bao xanh" style={{ marginBottom: 12 }}><span>Bạn đang mở trong Zalo/Facebook. Bấm <b>⋯</b> góc trên → <b>Mở bằng trình duyệt</b> rồi làm theo hướng dẫn.</span></p>}
      {ios ? (
        <ol className="buoc-cai">
          <Buoc so={1}>Mở trang này bằng <b>Safari</b>, bấm nút <b>Chia sẻ</b> <Share size={15} /> ở thanh dưới.</Buoc>
          <Buoc so={2}>Kéo xuống, chọn <b>Thêm vào MH chính</b> <PlusSquare size={15} />.</Buoc>
          <Buoc so={3}>Bấm <b>Thêm</b>. Biểu tượng Nón Sơn xuất hiện trên màn hình chính.</Buoc>
        </ol>
      ) : (
        <ol className="buoc-cai">
          <Buoc so={1}><b>Máy tính (Chrome, Edge):</b> bấm biểu tượng cài đặt <MonitorDown size={15} /> ở cuối thanh địa chỉ → <b>Cài đặt</b>.</Buoc>
          <Buoc so={2}><b>Android (Chrome):</b> bấm menu <MoreVertical size={15} /> → <b>Thêm vào màn hình chính</b> → <b>Cài đặt</b>.</Buoc>
          <Buoc so={3}>Không thấy mục cài đặt? Mở menu <MoreVertical size={15} /> → <b>Truyền, lưu và chia sẻ</b> → <b>Cài đặt trang dưới dạng ứng dụng</b>.</Buoc>
        </ol>
      )}
    </Modal>
  )
}

// render(bam) vẽ nút; ẩn hẳn khi đã chạy dạng ứng dụng
export function CaiDatApp({ render, ten }) {
  const { daCai } = useCaiDat()
  const [mo, setMo] = useState(false)
  if (daCai) return null
  const bam = async () => {
    if (suKien) {
      const e = suKien
      e.prompt()
      try { await e.userChoice } catch { /* bỏ qua */ }
      suKien = null
      baoDoi()
      return
    }
    setMo(true)
  }
  return <>{render(bam)}<HuongDanCai mo={mo} dong={() => setMo(false)} ten={ten} /></>
}

// Thẻ mời cài app (trang chủ thành viên: ẩn được; mục Cài đặt: luôn hiện khi chưa cài)
export function TheCaiApp({ anDuoc }) {
  const [an, setAn] = useLS('ns-aff-an-cai-app', false)
  if (anDuoc && an) return null
  return (
    <CaiDatApp render={(bam) => (
      <div className="the-cai-app">
        <span className="logo-tron"><NonIcon size={18} /></span>
        <div className="gian"><b>Cài Affiliate Hub lên điện thoại</b><span>Mở nhanh từ màn hình chính như một ứng dụng.</span></div>
        <Btn kieu="trang" co="sm" icon={Download} onClick={bam}>Cài đặt</Btn>
        {anDuoc && <IconBtn icon={X} nhan="Ẩn" co="xs" kieu="kinh" onClick={() => setAn(true)} />}
      </div>
    )} />
  )
}
