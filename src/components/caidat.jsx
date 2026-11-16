// Cài ứng dụng (PWA) lên điện thoại / máy tính — dùng chung cho 3 cổng
import { useEffect, useState } from 'react'
import { Download, Globe, MonitorDown, MoreVertical, PlusSquare, Share, X } from 'lucide-react'
import { Bao, Btn, IconBtn, LogoO, MaQR, Modal, Segment } from './ui'
import { useLS } from '../lib/hooks'

let suKien = null
const nghe = new Set()
const baoDoi = () => nghe.forEach((f) => f())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); suKien = e; baoDoi() })
  window.addEventListener('appinstalled', () => { suKien = null; baoDoi() })
}
export const daCaiApp = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
export const laIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const trongApp = () => /zalo|fban|fbav|instagram|line\//i.test(navigator.userAgent)

export const laDienThoai = () => laIOS() || /android|mobile/i.test(navigator.userAgent)
export const laAndroid = () => /android/i.test(navigator.userAgent)
export const loaiMay = () => (laIOS() ? 'ios' : laAndroid() ? 'android' : 'pc')

// Bật hộp cài đặt của trình duyệt (Chrome/Edge/Android). false = trình duyệt không hỗ trợ → hiện hướng dẫn
export async function caiNgay() {
  if (!suKien) return false
  const e = suKien
  e.prompt()
  try { await e.userChoice } catch { /* bỏ qua */ }
  suKien = null
  baoDoi()
  return true
}

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

export function HuongDanCai({ mo, dong, ten = 'NS Affiliate', dienThoai }) {
  if (dienThoai) return (
    <Modal mo={mo} dong={dong} tieuDe="Cài ứng dụng lên điện thoại" moTa={`Đưa ${ten} ra màn hình chính điện thoại, chạm 1 lần là mở.`} chan={<Btn kieu="den" onClick={dong}>Đã hiểu</Btn>}>
      <NoiDungCai />
    </Modal>
  )
  const ios = laIOS()
  return (
    <Modal mo={mo} dong={dong} tieuDe="Cài ứng dụng" moTa={`Đưa ${ten} ra màn hình chính, mở nhanh như app thật.`} chan={<Btn kieu="den" onClick={dong}>Đã hiểu</Btn>}>
      {trongApp() && <p className="bao xanh" style={{ marginBottom: 12 }}><span>Bạn đang mở trong Zalo/Facebook. Bấm <b>⋯</b> góc trên → <b>Mở bằng trình duyệt</b> rồi làm theo hướng dẫn.</span></p>}
      {ios ? <BuocCai loai="ios" /> : (
        <ol className="buoc-cai">
          <Buoc so={1}><b>Máy tính (Chrome, Edge):</b> bấm biểu tượng cài đặt <MonitorDown size={15} /> ở cuối thanh địa chỉ → <b>Cài đặt</b>.</Buoc>
          <Buoc so={2}><b>Android (Chrome):</b> bấm menu <MoreVertical size={15} /> → <b>Thêm vào màn hình chính</b> → <b>Cài đặt</b>.</Buoc>
          <Buoc so={3}>Không thấy mục cài đặt? Mở menu <MoreVertical size={15} /> → <b>Truyền, lưu và chia sẻ</b> → <b>Cài đặt trang dưới dạng ứng dụng</b>.</Buoc>
        </ol>
      )}
    </Modal>
  )
}

// Nội dung cài lên điện thoại (iPhone / Android) — dùng ở trang Tải ứng dụng và hộp hướng dẫn
const LOAI_DT = [{ v: 'ios', t: 'iPhone' }, { v: 'android', t: 'Android' }]
export const linkTaiApp = () => window.location.origin + '/tai-app'
export function NoiDungCai() {
  const { coNhac } = useCaiDat()
  const [loai, setLoai] = useState(() => (laAndroid() ? 'android' : 'ios'))
  const dt = laDienThoai()
  const moChrome = 'intent://' + window.location.host + '/tai-app#Intent;scheme=https;package=com.android.chrome;end'
  return (
    <div className="cai-nd">
      {!dt && (
        <div className="tai-app-qr">
          <MaQR giaTri={linkTaiApp()} size={112} />
          <div className="gian"><b>Quét mã bằng camera điện thoại</b><span>Trang cài đặt mở trên điện thoại, làm theo 3 bước bên dưới là xong.</span></div>
        </div>
      )}
      {dt && trongApp() && (laAndroid()
        ? <a className="btn den lg rong" href={moChrome}><Globe size={18} />Mở bằng Chrome để cài</a>
        : <Bao kieu="vang">Bạn đang mở trong Zalo/Facebook. Bấm <b>⋯</b> góc trên → <b>Mở bằng trình duyệt</b> (Safari) rồi làm theo các bước bên dưới.</Bao>)}
      {dt && coNhac && <Btn kieu="den" co="lg" className="rong" icon={Download} onClick={caiNgay}>Cài đặt ngay</Btn>}
      <Segment ds={LOAI_DT} giaTri={loai} onChon={setLoai} />
      <BuocCai loai={loai} />
    </div>
  )
}

// Các bước cài theo từng loại máy (trang Tải ứng dụng)
export function BuocCai({ loai }) {
  if (loai === 'ios') return (
    <ol className="buoc-cai">
      <Buoc so={1}>Mở trang này bằng <b>Safari</b>, bấm nút <b>Chia sẻ</b> <Share size={15} /> ở thanh dưới.</Buoc>
      <Buoc so={2}>Kéo xuống, chọn <b>Thêm vào MH chính</b> <PlusSquare size={15} />.</Buoc>
      <Buoc so={3}>Bấm <b>Thêm</b>. Biểu tượng Nón Sơn xuất hiện trên màn hình chính, chạm là mở.</Buoc>
    </ol>
  )
  return (
    <ol className="buoc-cai">
      <Buoc so={1}>Mở trang này bằng <b>Chrome</b>. Thấy nút <b>Cài đặt ngay</b> thì bấm, rồi bấm <b>Cài đặt</b> là xong.</Buoc>
      <Buoc so={2}>Không có nút? Bấm menu <MoreVertical size={15} /> góc trên → <b>Thêm vào màn hình chính</b> → <b>Cài đặt</b>.</Buoc>
      <Buoc so={3}>Biểu tượng Nón Sơn xuất hiện trên màn hình chính, chạm là mở.</Buoc>
    </ol>
  )
}

// render(bam) vẽ nút; ẩn hẳn khi đã chạy dạng ứng dụng
// dienThoai: chỉ cài lên điện thoại (cổng thành viên) — trên máy tính hiện mã QR để quét bằng điện thoại
export function CaiDatApp({ render, ten, dienThoai }) {
  const { daCai } = useCaiDat()
  const [mo, setMo] = useState(false)
  if (daCai) return null
  const bam = async () => {
    if (dienThoai && !laDienThoai()) { setMo(true); return }
    if (!(await caiNgay())) setMo(true)
  }
  return <>{render(bam)}<HuongDanCai mo={mo} dong={() => setMo(false)} ten={ten} dienThoai={dienThoai} /></>
}

// Thẻ mời cài app (trang chủ thành viên: ẩn được; mục Cài đặt: luôn hiện khi chưa cài)
export function TheCaiApp({ anDuoc }) {
  const [an, setAn] = useLS('ns-aff-an-cai-app', false)
  if (anDuoc && an) return null
  return (
    <CaiDatApp dienThoai render={(bam) => (
      <div className="the-cai-app">
        <LogoO co={42} />
        <div className="gian"><b>Cài NS Affiliate lên điện thoại</b><span>Mở nhanh từ màn hình chính như một ứng dụng.</span></div>
        <Btn kieu="trang" co="sm" icon={Download} onClick={bam}>Cài đặt</Btn>
        {anDuoc && <IconBtn icon={X} nhan="Ẩn" co="xs" kieu="kinh" onClick={() => setAn(true)} />}
      </div>
    )} />
  )
}
