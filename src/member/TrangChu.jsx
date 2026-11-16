import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, CircleCheck, FileWarning, Gift, LifeBuoy, Mail, Megaphone, Send, Star, Target } from 'lucide-react'
import { useAuth } from '../components/auth'
import { Btn, Bao, KhungTai, LoiTai, Segment, ThanhTienDo, useToast, Nhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc } from '../lib/api'
import { fmtNgay, fmtNgayThu, tuongDoi, conLai } from '../lib/format'
import { TT_LICH, NHAN_TOP, LOAI_UU_DAI } from '../lib/hang'
import { TheSanPham } from './SanPham'
import { TheChienDich } from './ChienDich'
import { TheTaiNguyen } from './Khac'
import { NutZalo } from './CongKhai'

export function NhacXacThuc() {
  const { tv } = useAuth()
  const bao = useToast()
  const [dang, setDang] = useState(false)
  if (!tv || tv.email_xac_thuc) return null
  const gui = async () => {
    setDang(true)
    try { await rpc('fn_gui_lai_xac_thuc'); bao('Đã gửi lại thư xác nhận tới ' + tv.email) } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <Bao kieu="vang">
      <div className="hang wrap" style={{ gap: 10 }}>
        <span className="gian" style={{ minWidth: 200 }}><b>Xác nhận email để mở khóa đầy đủ.</b> Thư đã gửi tới {tv.email} (kiểm tra cả mục Spam).</span>
        <Btn co="sm" kieu="trang" icon={Mail} loading={dang} onClick={gui}>Gửi lại thư</Btn>
      </div>
    </Bao>
  )
}

export function TheCapDo({ tv }) {
  const ke = tv.cap_ke
  const cs = tv.chi_so || {}
  if (!ke) return null
  const muc = [['chien_dich', 'dk_chien_dich', 'chiến dịch'], ['bai_dat', 'dk_bai_dat', 'bài đạt'], ['buoi_quay', 'dk_buoi_quay', 'buổi quay']].filter(([, k]) => ke[k] > 0)
  const pct = muc.length ? (muc.reduce((s, [a, k]) => s + Math.min(1, (cs[a] || 0) / ke[k]), 0) / muc.length) * 100 : 100
  return (
    <div style={{ marginTop: 16 }}>
      <ThanhTienDo pct={pct} nhan={'Tiến tới cấp ' + ke.ten} so={<span style={{ color: 'rgba(255,255,255,.75)' }}>{muc.map(([a, k, t]) => `${Math.min(cs[a] || 0, ke[k])}/${ke[k]} ${t}`).join(' · ')}</span>} />
    </div>
  )
}

export default function TrangChu() {
  const { tv } = useAuth()
  const nav = useNavigate()
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_trang_chu'), [])
  const [nhan, setNhan] = useState('ban_chay')
  if (loading && !d) return <KhungTai dong={5} />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const cs = tv.chi_so || {}
  const nhanCo = Object.keys(NHAN_TOP).filter((k) => (d.top || []).some((x) => x.nhan_top === k))
  const nhanHien = nhanCo.includes(nhan) ? nhan : nhanCo[0]
  const topHien = (d.top || []).filter((x) => x.nhan_top === nhanHien)
  const conBuoc = (d.khoi_dong || []).filter((b) => !b.xong).length
  const viec = [
    ...(d.lich || []).map((l) => ({ key: l.id, to: '/lich-quay?ma=' + l.ma, ic: CalendarDays, mau: ['#FDE6F1', '#A3004F'], t: `${l.gio} · ${fmtNgayThu(l.ngay)}`, p: l.cua_hang, tag: <Nhan bang={TT_LICH} ma={l.trang_thai} /> })),
    ...(d.nhiem_vu || []).map((n) => ({ key: n.id, to: '/chien-dich/' + n.chien_dich_id, ic: Target, mau: ['#EAF0FD', '#2E5BC9'], t: n.ten, p: `${n.chien_dich} · đã nộp ${n.da_nop}/${n.so_bai}${n.han_nop ? ' · ' + conLai(n.han_nop) : ''}` })),
    d.bai_can_sua > 0 && { key: 'sua', to: '/toi?tab=bai_nop', ic: FileWarning, mau: ['#FDF3E3', '#8A5410'], t: `${d.bai_can_sua} bài nộp cần chỉnh sửa`, p: 'Xem góp ý của Nón Sơn' },
    d.ho_tro_moi > 0 && { key: 'ht', to: '/ho-tro', ic: LifeBuoy, mau: ['#E3F5EE', '#0E7F63'], t: `${d.ho_tro_moi} yêu cầu hỗ trợ đã có trả lời`, p: 'Mở để xem' }
  ].filter(Boolean)

  return (
    <>
      <section className="hero-tv">
        <div className="glow hong" style={{ width: 300, height: 300, right: -90, top: -130, opacity: 0.55 }} />
        <div className="glow vang" style={{ width: 160, height: 160, left: -60, bottom: -80, opacity: 0.22 }} />
        <div className="hang wrap" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div className="gian" style={{ minWidth: 220 }}>
            <p className="eyebrow sang">{tv.kinh_nghiem === 'moi' ? 'Người mới bắt đầu' : 'Affiliate Nón Sơn'}</p>
            <h1 style={{ marginTop: 8 }}>Chào <b>{tv.ho_ten.split(' ').pop()}</b>, hôm nay quảng bá gì?</h1>
          </div>
          <span className="chip-cap"><i style={{ background: tv.cap_do?.mau || 'var(--pink)' }}><Star size={12} fill="#fff" /></i>{tv.cap_do?.ten || 'Thành viên'}</span>
        </div>
        <div className="hang-so">
          <div className="o-so"><b>{cs.chien_dich || 0}</b><span>Chiến dịch tham gia</span></div>
          <div className="o-so"><b>{cs.bai_dat || 0}</b><span>Bài đăng đạt</span></div>
          <div className="o-so"><b>{cs.buoi_quay || 0}</b><span>Buổi quay hoàn thành</span></div>
        </div>
        <TheCapDo tv={tv} />
      </section>

      <NhacXacThuc />

      {viec.length > 0 && (
        <section>
          <div className="muc-dau"><h2>Việc của bạn</h2></div>
          <div className="cot" style={{ gap: 10 }}>
            {viec.map((v) => (
              <Link key={v.key} to={v.to} className="viec">
                <span className="ic" style={{ background: v.mau[0], color: v.mau[1] }}><v.ic size={20} /></span>
                <div className="gian"><b className="cat">{v.t}</b><span className="cat">{v.p}</span></div>
                {v.tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {conBuoc > 0 && (
        <section className="card">
          <div className="dau-the"><h2>Lộ trình bắt đầu</h2><span className="nho muted">{5 - conBuoc}/5 bước</span></div>
          {(d.khoi_dong || []).map((b, i) => {
            const den = { xac_thuc: null, ho_so: '/toi', huong_dan: '/tai-nguyen', san_pham: '/san-pham', chien_dich: '/chien-dich' }[b.ma]
            return (
              <div key={b.ma} className={'buoc-moi' + (b.xong ? ' xong' : '')}>
                <span className="so">{b.xong ? <CircleCheck size={16} /> : i + 1}</span>
                <span className="gian">{b.ten}</span>
                {!b.xong && den && <Link to={den} className="lien-ket nho">Làm ngay <ArrowRight size={14} /></Link>}
              </div>
            )
          })}
        </section>
      )}

      {(d.uu_dai || []).length > 0 && (
        <section>
          <div className="muc-dau"><h2>Ưu đãi bạn đang được hưởng</h2><Link to="/uu-dai" className="lien-ket nho">Tất cả</Link></div>
          <div className="cuon-ngang">
            {d.uu_dai.map((u) => (
              <Link key={u.id} to="/uu-dai" className={'the-ud' + (u.rieng ? ' rieng' : '')} style={{ color: 'var(--ink)' }}>
                <span className="ic"><Gift size={22} /></span>
                <div className="gian">
                  {u.rieng && <span className="tag rieng" style={{ marginBottom: 6 }}>Dành riêng cho bạn</span>}
                  <h3>{u.ten}</h3>
                  <p>{u.mo_ta || LOAI_UU_DAI[u.loai]}</p>
                  {u.ket_thuc && <p style={{ fontWeight: 700, color: 'var(--pink-deep)' }}>Đến {fmtNgay(u.ket_thuc)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="muc-dau"><h2>Chiến dịch dành cho bạn</h2><Link to="/chien-dich" className="lien-ket nho">Tất cả</Link></div>
        {(d.chien_dich || []).length === 0
          ? <div className="card gon nho muted"><Megaphone size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Chưa có chiến dịch đang mở. Nón Sơn sẽ thông báo ngay khi có chương trình mới.</div>
          : <div className="cuon-ngang">{d.chien_dich.map((c) => <TheChienDich key={c.id} c={c} />)}</div>}
      </section>

      <section>
        <div className="muc-dau">
          <h2>Top sản phẩm nổi bật</h2>
          <Link to="/san-pham" className="lien-ket nho">Xem tất cả</Link>
        </div>
        {topHien.length === 0
          ? <div className="card gon nho muted">Danh sách Top sản phẩm đang được cập nhật.</div>
          : <>
              <div className="hang wrap" style={{ gap: 10, marginBottom: 12 }}>
                {nhanCo.length > 1 && <Segment trang ds={nhanCo.map((k) => ({ v: k, t: NHAN_TOP[k].ngan }))} giaTri={nhanHien} onChon={setNhan} />}
                {d.du_lieu_den && <span className="du-lieu-den">Dữ liệu cập nhật đến {fmtNgay(d.du_lieu_den)}{d.nguon_top ? ' · ' + d.nguon_top : ''}</span>}
              </div>
              <div className="cuon-ngang">{topHien.map((s) => <TheSanPham key={s.id} s={s} onClick={() => nav('/san-pham/' + s.id)} />)}</div>
            </>}
      </section>

      <div className="hai-cot">
        <section className="lon card">
          <div className="dau-the"><h2>Thông báo mới</h2><Link to="/thong-bao" className="lien-ket nho">Tất cả</Link></div>
          {(d.thong_bao || []).length === 0 ? <p className="nho muted">Chưa có thông báo.</p>
            : d.thong_bao.map((b) => (
              <Link key={b.id} to={b.lien_ket || '/thong-bao'} className={'tin' + (b.doc ? '' : ' moi')}>
                <span className="ic"><Bell size={17} /></span>
                <div className="gian"><b>{b.tieu_de}</b>{b.noi_dung && <p>{b.noi_dung}</p>}<small>{tuongDoi(b.luc)}</small></div>
                {!b.doc && <span className="cham-moi" />}
              </Link>
            ))}
        </section>
        <section className="nho-cot">
          <div className="card">
            <div className="dau-the"><h2>{tv.kinh_nghiem === 'moi' ? 'Hướng dẫn cho bạn' : 'Tài nguyên mới'}</h2><Link to="/tai-nguyen" className="lien-ket nho">Thư viện</Link></div>
            <div className="cot" style={{ gap: 10 }}>{(d.tai_nguyen_moi || []).map((r) => <TheTaiNguyen key={r.id} r={r} gon />)}</div>
          </div>
          <div className="the-zalo">
            <span className="ic">Zalo</span>
            <div className="gian"><b>{d.zalo?.ten_nhom || 'Nhóm Zalo cộng đồng'}</b><span>Hỏi đáp, chia sẻ kinh nghiệm cùng các thành viên.</span></div>
            {d.zalo?.link ? <a className="btn trang sm" href={d.zalo.link} target="_blank" rel="noreferrer" onClick={() => rpc('fn_su_kien', { p_loai: 'mo_zalo', p_id: null }).catch(() => {})}><Send size={15} />Vào nhóm</a> : <NutZalo zalo={d.zalo} sang />}
            {d.zalo?.qr && <img className="qr-zalo nho" src={d.zalo.qr} alt="Mã QR nhóm Zalo" loading="lazy" />}
          </div>
        </section>
      </div>
    </>
  )
}
