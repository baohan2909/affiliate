// Trang "Nón Sơn đang hoàn thiện hệ thống" — hiện thay trang giới thiệu, đăng ký, tải app khi quản trị bật cấu hình "bao_tri".
// Đăng nhập (cho thành viên đã có tài khoản), quản trị và cổng cửa hàng vẫn dùng bình thường.
import { Link } from 'react-router-dom'
import { CalendarClock, ExternalLink, MessageCircle } from 'lucide-react'
import { Brand, LogoO } from '../components/ui'
import { fmtNgay } from '../lib/format'
import { NOI_DUNG_HT, TIEU_DE_HT } from '../lib/baotri'
import { useCongKhai } from './Cong'

export default function TrangHoanThien() {
  const ck = useCongKhai()
  const bt = ck?.bao_tri || {}
  const zalo = ck?.zalo?.link
  const web = ck?.lien_he?.website
  return (
    <div className="ht">
      <div className="ht-nen" aria-hidden="true"><i className="g1" /><i className="g2" /><i className="g3" /></div>
      <header className="ht-dau"><Brand /></header>
      <main className="ht-than">
        <div className="ht-logo" aria-hidden="true"><span className="ht-vong" /><span className="ht-vong v2" /><LogoO co={88} /></div>
        <p className="ht-eyebrow">Cộng đồng Affiliate Nón Sơn</p>
        <h1>{bt.tieu_de || TIEU_DE_HT}</h1>
        <p className="ht-mo">{bt.noi_dung || NOI_DUNG_HT}</p>
        <div className="ht-tien" role="status"><span className="ht-thanh"><i /></span>Đang hoàn thiện</div>
        {bt.ngay && <p className="ht-ngay"><CalendarClock size={16} strokeWidth={2.2} />Dự kiến mở đăng ký <b>{fmtNgay(bt.ngay)}</b></p>}
        {(zalo || web) && (
          <div className="ht-nut">
            {zalo && <a className="btn trang lg" href={zalo} target="_blank" rel="noreferrer"><MessageCircle size={18} />Vào nhóm Zalo nhận tin sớm</a>}
            {web && <a className="btn vien-sang lg" href={web} target="_blank" rel="noreferrer">Ghé nonson.vn<ExternalLink size={16} /></a>}
          </div>
        )}
      </main>
      <footer className="ht-chan">Đã là thành viên? <Link to="/dang-nhap">Đăng nhập</Link><span>·</span><b className="ht-ban-quyen">© Nón Sơn</b></footer>
    </div>
  )
}
