// QUY TẮC CỘNG ĐỒNG AFFILIATE NÓN SƠN — trang đọc (thành viên + công khai), tóm tắt ở form đăng ký,
// cổng xác nhận cho thành viên chưa đồng ý phiên bản hiện hành, và tự gắn link "Quy tắc cộng đồng" trong câu trả lời hỏi đáp.
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck, CircleCheck, Eye, Gavel, Handshake, Images, Landmark, MessageSquareQuote, PackageCheck, Quote, Scale, ScrollText,
  ShieldCheck, Sparkles, Sprout, Users
} from 'lucide-react'
import { useAuth } from '../components/auth'
import { Brand, Btn, Modal, useToast } from '../components/ui'
import { rpc } from '../lib/api'
import { fmtNgay } from '../lib/format'
import { canDongYQT, layQuyTac } from '../lib/quytac'
import { useCongKhai } from './Cong'
import DauTrang from './DauTrang'

const IC_MUC = [PackageCheck, BadgeCheck, Images, MessageSquareQuote, Scale, Users, Gavel, Landmark]
const IC_GIA_TRI = [Sparkles, Eye, ShieldCheck, Sprout]
const so2 = (i) => String(i + 1).padStart(2, '0')
const ngayVN = (s) => (s ? fmtNgay(s) : '')

// Khẩu hiệu tách thành các giá trị: "Tự do sáng tạo – Minh bạch – Trách nhiệm – Cùng phát triển"
const giaTri = (qt) => String(qt.khau_hieu || '').split(/\s+[–-]\s+/).map((x) => x.trim()).filter(Boolean)

function GiaTri({ qt, toi }) {
  return (
    <ul className={'qt-gt' + (toi ? ' toi' : '')} aria-label={qt.khau_hieu}>
      {giaTri(qt).map((g, i) => { const Ic = IC_GIA_TRI[i % IC_GIA_TRI.length]; return <li key={g}><Ic size={14} strokeWidth={2.4} />{g}</li> })}
    </ul>
  )
}

// Toàn văn quy tắc: phần đầu (tiêu đề, khẩu hiệu) · 8 điều · lời kết
export function NoiDungQuyTac({ qt, gon }) {
  return (
    <div className={'qt-noi' + (gon ? ' gon' : '')}>
      {!gon && (
        <section className="qt-hero">
          <span className="qt-mat" aria-hidden="true"><ScrollText size={22} strokeWidth={2.2} /></span>
          <p className="qt-eyebrow">NS Affiliate · Nón Sơn</p>
          <h2>{qt.tieu_de}</h2>
          <GiaTri qt={qt} toi />
          <p className="qt-meta">{qt.muc.length} quy tắc{qt.ngay ? ' · Áp dụng từ ' + ngayVN(qt.ngay) : ''}{qt.phien_ban > 1 ? ' · Phiên bản ' + qt.phien_ban : ''}</p>
        </section>
      )}
      {gon && <><h3 className="qt-td-gon">{qt.tieu_de}</h3><GiaTri qt={qt} /></>}
      <ol className="qt-ds">
        {qt.muc.map((m, i) => {
          const Ic = IC_MUC[i] || ShieldCheck
          return (
            <li key={i} className="qt-muc" id={'muc-' + (i + 1)}>
              <span className="qt-so" aria-hidden="true">{so2(i)}</span>
              <div className="gian">
                <h3><Ic size={16} strokeWidth={2.3} />{m.t}</h3>
                <p>{m.d}</p>
              </div>
            </li>
          )
        })}
      </ol>
      {qt.ket && (
        <blockquote className="qt-ket">
          <Quote size={20} strokeWidth={2.4} />
          <p>{qt.ket}</p>
          <cite><Handshake size={15} />Nón Sơn</cite>
        </blockquote>
      )}
    </div>
  )
}

// Trang Quy tắc cộng đồng trong app thành viên
export function TrangQuyTac() {
  const ck = useCongKhai()
  const { tv } = useAuth()
  const qt = layQuyTac(ck)
  const daDongY = tv?.dong_y_quy_tac_luc && !canDongYQT(tv, ck)
  return (
    <>
      <DauTrang lui="/toi" luiDt tieu="Quy tắc cộng đồng" phu="Affiliate Nón Sơn" />
      {daDongY && (
        <p className="qt-da"><CircleCheck size={17} strokeWidth={2.4} /><span>Bạn đã đồng ý Quy tắc cộng đồng ngày <b>{fmtNgay(tv.dong_y_quy_tac_luc)}</b>. Cảm ơn bạn đã cùng Nón Sơn xây dựng cộng đồng minh bạch.</span></p>
      )}
      <NoiDungQuyTac qt={qt} />
    </>
  )
}

// Trang công khai (chưa đăng nhập) — mở được từ trang giới thiệu và form đăng ký
export function QuyTacCongKhai() {
  const ck = useCongKhai()
  return (
    <div className="qt-cong-khai">
      <header className="qt-ck-dau">
        <Link to="/" aria-label="Trang giới thiệu"><Brand /></Link>
        <Link to="/dang-ky" className="btn vien-sang sm">Đăng ký</Link>
      </header>
      <main className="qt-ck-than"><NoiDungQuyTac qt={layQuyTac(ck)} /></main>
      <footer className="qt-ck-chan">Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link> · <Link to="/gioi-thieu">Về NS Affiliate</Link></footer>
    </div>
  )
}

// Ở form đăng ký: tóm tắt 8 điều + đọc toàn văn trong hộp + ô cam kết
export function DongYQuyTacDangKy({ daDongY, onDoi }) {
  const ck = useCongKhai()
  const qt = layQuyTac(ck)
  const [doc, setDoc] = useState(false)
  return (
    <>
      <div className="qt-tom">
        <div className="qt-tom-dau">
          <span className="qt-mat nho" aria-hidden="true"><ScrollText size={17} strokeWidth={2.3} /></span>
          <div className="gian"><b>Quy tắc cộng đồng</b><span>{qt.khau_hieu}</span></div>
        </div>
        <ol>{qt.muc.map((m, i) => <li key={i}><i>{i + 1}</i>{m.t}</li>)}</ol>
        <button type="button" className="lien-ket nho" onClick={() => setDoc(true)}>Đọc toàn văn {qt.muc.length} quy tắc</button>
      </div>
      <label className="o-dong-y">
        <input type="checkbox" checked={daDongY} onChange={(e) => onDoi(e.target.checked)} />
        <span>Tôi đã đọc và cam kết tuân thủ <button type="button" className="lien-ket-chu" onClick={() => setDoc(true)}>Quy tắc cộng đồng Affiliate Nón Sơn</button>.</span>
      </label>
      <Modal mo={doc} dong={() => setDoc(false)} tieuDe="Quy tắc cộng đồng" moTa={qt.khau_hieu} rong
        chan={<Btn kieu="den" icon={CircleCheck} onClick={() => { onDoi(true); setDoc(false) }}>Tôi đã đọc và đồng ý</Btn>}>
        <NoiDungQuyTac qt={qt} gon />
      </Modal>
    </>
  )
}

// Cổng xác nhận: thành viên chưa đồng ý phiên bản hiện hành phải đọc và đồng ý trước khi dùng tiếp
export function CongQuyTac() {
  const ck = useCongKhai()
  const { tv, taiToi, thoat } = useAuth()
  const bao = useToast()
  const [dang, setDang] = useState(false)
  if (!canDongYQT(tv, ck)) return null
  const qt = layQuyTac(ck)
  const capNhat = Number(tv.quy_tac_phien_ban || 0) > 0
  const dongY = async () => {
    setDang(true)
    try { await rpc('fn_dong_y_quy_tac'); await taiToi(); bao('Cảm ơn bạn đã đồng ý Quy tắc cộng đồng') } catch (e) { bao(e.message, 'loi'); setDang(false) }
  }
  return (
    <div className="qt-cong" role="dialog" aria-modal="true" aria-label={qt.tieu_de}>
      <div className="qt-cong-hop">
        <div className="qt-cong-cuon">
          <p className="qt-cong-loi">
            {capNhat
              ? <>Nón Sơn vừa <b>cập nhật Quy tắc cộng đồng</b>. Bạn vui lòng đọc và xác nhận để tiếp tục sử dụng NS Affiliate.</>
              : <>Chào {String(tv.ho_ten || '').trim().split(/\s+/).pop()}, Nón Sơn ban hành <b>Quy tắc cộng đồng Affiliate</b>. Bạn vui lòng đọc và xác nhận để tiếp tục sử dụng NS Affiliate.</>}
          </p>
          <NoiDungQuyTac qt={qt} />
        </div>
        <div className="qt-cong-chan">
          <Btn kieu="den" co="lg" icon={CircleCheck} loading={dang} onClick={dongY} className="gian">Tôi đã đọc và đồng ý</Btn>
          <button type="button" className="lien-ket nho" onClick={thoat}>Đăng xuất</button>
        </div>
      </div>
    </div>
  )
}

// Gắn link tới trang Quy tắc cộng đồng ở mọi chỗ câu trả lời nhắc tới "Quy tắc cộng đồng"
export function ChuQuyTac({ chu }) {
  const phan = String(chu || '').split(/(Quy tắc cộng đồng)/)
  return phan.map((p, i) => (p === 'Quy tắc cộng đồng' ? <Link key={i} to="/quy-tac" className="lien-ket-chu">{p}</Link> : <Fragment key={i}>{p}</Fragment>))
}
