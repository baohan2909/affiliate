import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, BookOpen, CalendarDays, CalendarPlus, ChevronRight, CircleCheck, FileWarning, Gift, LifeBuoy, Link2, Mail, Megaphone, Send, ShoppingBag, Star, Target } from 'lucide-react'
import { useAuth } from '../components/auth'
import { Anh, Btn, Bao, KhungTai, LoiTai, ThanhTienDo, useToast, Nhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc } from '../lib/api'
import { fmtNgay, fmtNgayThu, fmtPhanTram, tuongDoi, conLai } from '../lib/format'
import { TT_LICH, LOAI_UU_DAI } from '../lib/hang'
import { TheSanPham, doanDanhMuc, tenGon, useLayLink } from './SanPham'
import { TheChienDich } from './ChienDich'
import { TheTaiNguyen } from './Khac'
import { NutZalo } from './CongKhai'
import { TheCaiApp } from '../components/caidat'

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

// Banner sản phẩm đang triển khai: tự chuyển 5 giây, chấm để chọn, vuốt được
function BannerSP({ ds, onLay, onMo, hhMax }) {
  const [i, setI] = useState(0)
  const [dung, setDung] = useState(false)
  const cham = useRef(null)
  const n = ds.length
  useEffect(() => { if (n < 2 || dung) return; const h = setInterval(() => setI((x) => (x + 1) % n), 5000); return () => clearInterval(h) }, [n, dung])
  if (!n) return (
    <section className="banner trong">
      <div className="bn-chu"><span className="bn-eyebrow">NS Affiliate</span><h2>Chọn sản phẩm Nón Sơn, lấy link, nhận hoa hồng{hhMax ? ` đến ${fmtPhanTram(hhMax)}` : ''}.</h2>
        <Link to="/san-pham" className="btn trang">Xem sản phẩm<ArrowRight size={16} /></Link></div>
    </section>
  )
  const g = ds[i % n]
  const vuot = (e) => { cham.current = e.touches?.[0]?.clientX ?? null }
  const tha = (e) => {
    if (cham.current == null) return
    const dx = (e.changedTouches?.[0]?.clientX ?? cham.current) - cham.current
    if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n)
    cham.current = null
  }
  return (
    <section className="banner" onMouseEnter={() => setDung(true)} onMouseLeave={() => setDung(false)} onTouchStart={vuot} onTouchEnd={tha} aria-roledescription="carousel">
      <div className="bn-noi" key={g.id}>
        <div className="bn-chu">
          <span className="bn-eyebrow">Đang bán chạy · {g.danh_muc || doanDanhMuc(g)}</span>
          <h2 onClick={() => onMo(g)}>{tenGon(g.ten)}</h2>
          {g.hoa_hong != null && <p className="bn-hh">Hoa hồng <b>{fmtPhanTram(g.hoa_hong)}</b></p>}
          <div className="bn-nut">
            <button type="button" className="nut-lay" onClick={(e) => onLay(g, e)}><Link2 size={16} strokeWidth={2.4} />Lấy link</button>
            <button type="button" className="btn kinh sm bn-ct" onClick={() => onMo(g)}>Chi tiết</button>
          </div>
        </div>
        <button type="button" className="bn-anh" onClick={() => onMo(g)} aria-label={'Xem ' + tenGon(g.ten)}><Anh src={g.anh} alt="" /></button>
      </div>
      {n > 1 && <div className="bn-cham">{ds.map((x, j) => <button key={x.id} type="button" aria-label={'Sản phẩm ' + (j + 1)} className={j === i % n ? 'on' : ''} onClick={() => setI(j)} />)}</div>}
    </section>
  )
}

const LOI_TAT = [
  { to: '/san-pham', ten: 'Sản phẩm', ic: ShoppingBag },
  { to: '/chien-dich', ten: 'Chiến dịch', ic: Megaphone },
  { to: '/lich-quay/dat', ten: 'Đặt lịch quay', ic: CalendarPlus },
  { to: '/tai-nguyen', ten: 'Hướng dẫn', ic: BookOpen }
]

export default function TrangChu() {
  const { tv } = useAuth()
  const nav = useNavigate()
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_trang_chu'), [])
  const ll = useLayLink()
  if (loading && !d) return <KhungTai dong={5} />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const moSP = (g) => nav('/san-pham/' + g.id)
  const noiBat = d.noi_bat || []
  const banner = noiBat.filter((x) => (x.danh_muc || doanDanhMuc(x)) !== 'Phụ kiện').slice(0, 5)
  const buoc = d.khoi_dong || []
  const conBuoc = buoc.filter((b) => !b.xong).length
  const viec = [
    ...(d.lich || []).map((l) => ({ key: l.id, to: '/lich-quay?ma=' + l.ma, ic: CalendarDays, t: `${l.gio} · ${fmtNgayThu(l.ngay)}`, p: l.cua_hang, tag: <Nhan bang={TT_LICH} ma={l.trang_thai} /> })),
    ...(d.nhiem_vu || []).map((n) => ({ key: n.id, to: '/chien-dich/' + n.chien_dich_id, ic: Target, t: n.ten, p: `${n.chien_dich} · đã nộp ${n.da_nop}/${n.so_bai}${n.han_nop ? ' · ' + conLai(n.han_nop) : ''}` })),
    d.bai_can_sua > 0 && { key: 'sua', to: '/toi?tab=bai_nop', ic: FileWarning, t: `${d.bai_can_sua} bài nộp cần chỉnh sửa`, p: 'Xem góp ý của Nón Sơn' },
    d.ho_tro_moi > 0 && { key: 'ht', to: '/ho-tro', ic: LifeBuoy, t: `${d.ho_tro_moi} yêu cầu hỗ trợ đã có trả lời`, p: 'Mở để xem' }
  ].filter(Boolean)
  const denBuoc = { xac_thuc: null, shopee: 'ket_noi', ho_so: '/toi?tab=ho_so', san_pham: '/san-pham', chien_dich: '/chien-dich' }

  return (
    <>
      <div className="chao">
        <div className="gian">
          <p>Xin chào,</p>
          <h1>{tv.ho_ten.split(' ').pop()}</h1>
        </div>
        <Link to="/toi" className="chip-cap-sang"><Star size={13} fill="currentColor" />{tv.cap_do?.ten || 'Thành viên'}</Link>
      </div>

      <NhacXacThuc />
      <BannerSP ds={banner} onLay={ll.lay} onMo={moSP} hhMax={d.hoa_hong_max} />

      <nav className="loi-tat" aria-label="Lối tắt">
        {LOI_TAT.map((x) => <Link key={x.to} to={x.to}><span className="ic"><x.ic size={21} /></span>{x.ten}</Link>)}
      </nav>

      {viec.length > 0 && (
        <section>
          <div className="muc-dau"><h2>Việc của bạn</h2></div>
          <div className="cot" style={{ gap: 8 }}>
            {viec.map((v) => (
              <Link key={v.key} to={v.to} className="dong-lk">
                <span className="ic"><v.ic size={18} /></span>
                <div className="gian"><b className="cat">{v.t}</b><span className="cat">{v.p}</span></div>
                {v.tag || <ChevronRight size={18} className="mui" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      {conBuoc > 0 && (
        <section className="card bat-dau">
          <div className="dau-the"><h2>Bắt đầu làm Affiliate</h2><span className="nho muted">{buoc.length - conBuoc}/{buoc.length}</span></div>
          <div className="bd-thanh"><i style={{ width: ((buoc.length - conBuoc) / buoc.length) * 100 + '%' }} /></div>
          {buoc.map((b, i) => {
            const den = denBuoc[b.ma]
            return (
              <div key={b.ma} className={'buoc-moi' + (b.xong ? ' xong' : '')}>
                <span className="so">{b.xong ? <CircleCheck size={16} /> : i + 1}</span>
                <span className="gian">{b.ten}</span>
                {!b.xong && den && (den === 'ket_noi'
                  ? <button type="button" className="lien-ket nho" onClick={ll.moKetNoi}>Kết nối <ArrowRight size={14} /></button>
                  : <Link to={den} className="lien-ket nho">Làm ngay <ArrowRight size={14} /></Link>)}
              </div>
            )
          })}
        </section>
      )}

      {noiBat.length > 0 && (
        <section>
          <div className="muc-dau"><h2>Sản phẩm nổi bật</h2><Link to="/san-pham" className="lien-ket nho">Xem tất cả {d.so_san_pham ? `(${d.so_san_pham})` : ''}</Link></div>
          <div className="luoi-sp noi-bat">{noiBat.slice(0, 8).map((s) => <TheSanPham key={s.id} s={s} onLay={ll.lay} onClick={() => moSP(s)} />)}</div>
        </section>
      )}

      <section>
        <div className="muc-dau"><h2>Chiến dịch dành cho bạn</h2><Link to="/chien-dich" className="lien-ket nho">Tất cả</Link></div>
        {(d.chien_dich || []).length === 0
          ? <div className="card gon trong-nhe"><Megaphone size={18} /><span>Chưa có chiến dịch đang mở. Nón Sơn sẽ thông báo ngay khi có chương trình mới.</span></div>
          : <div className="luoi-cd gon">{d.chien_dich.slice(0, 3).map((c) => <TheChienDich key={c.id} c={c} />)}</div>}
      </section>

      {(d.uu_dai || []).length > 0 && (
        <section>
          <div className="muc-dau"><h2>Ưu đãi của bạn</h2><Link to="/uu-dai" className="lien-ket nho">Tất cả</Link></div>
          <div className="cot" style={{ gap: 8 }}>
            {d.uu_dai.slice(0, 3).map((u) => (
              <Link key={u.id} to="/uu-dai" className="dong-lk">
                <span className="ic"><Gift size={18} /></span>
                <div className="gian"><b className="cat">{u.ten}</b><span className="cat">{u.mo_ta || LOAI_UU_DAI[u.loai]}{u.ket_thuc ? ' · đến ' + fmtNgay(u.ket_thuc) : ''}</span></div>
                {u.rieng ? <span className="tag rieng">Riêng bạn</span> : <ChevronRight size={18} className="mui" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="hai-cot tc-duoi">
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
            <div className="dau-the"><h2>Hướng dẫn cho bạn</h2><Link to="/tai-nguyen" className="lien-ket nho">Xem thêm</Link></div>
            {(d.tai_nguyen_moi || []).length === 0 ? <p className="nho muted">Hướng dẫn sẽ sớm được cập nhật.</p>
              : <div className="cot" style={{ gap: 8 }}>{d.tai_nguyen_moi.map((r) => <TheTaiNguyen key={r.id} r={r} gon />)}</div>}
          </div>
          <div className="the-zalo">
            <span className="ic">Zalo</span>
            <div className="gian"><b>{d.zalo?.ten_nhom || 'Nhóm Zalo cộng đồng'}</b><span>Hỏi đáp, chia sẻ kinh nghiệm cùng các thành viên.</span></div>
            {d.zalo?.link ? <a className="btn trang sm" href={d.zalo.link} target="_blank" rel="noreferrer" onClick={() => rpc('fn_su_kien', { p_loai: 'mo_zalo', p_id: null }).catch(() => {})}><Send size={15} />Vào nhóm</a> : <NutZalo zalo={d.zalo} sang />}
          </div>
        </section>
      </div>

      <TheCaiApp anDuoc />
      {ll.giaoDien}
    </>
  )
}
