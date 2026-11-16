import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, FileCheck2, LifeBuoy, MailWarning, Megaphone, Store, UserPlus, ArrowRight } from 'lucide-react'
import { Anh, KhungTai, LoiTai, Nhan, TrangDau } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc } from '../lib/api'
import { fmtNgay, fmtNgayThu, fmtSo, thuCua } from '../lib/format'
import { GIAI_DOAN, TT_LICH } from '../lib/hang'
import { useQt } from './Cong'

function BieuDoNgay({ ds }) {
  const [tro, setTro] = useState(null)
  const max = Math.max(1, ...ds.map((x) => x.n))
  return (
    <div className="bieu-do">
      <div className="bd-cot" style={{ height: 150 }}>
        {ds.map((x, i) => (
          <div key={x.ngay} className="c" onMouseEnter={() => setTro(i)} onMouseLeave={() => setTro(null)}>
            {tro === i && <span className="goi-y-bd" style={{ left: '50%', top: 0 }}>{fmtNgay(x.ngay)}: {x.n} đăng ký</span>}
            <div className={'t' + (x.n ? '' : ' mo')} style={{ height: Math.max(2, (x.n / max) * 100) + '%' }} />
            <span className="nhan">{i % 5 === 4 || i === ds.length - 1 ? x.ngay.slice(8) + '/' + x.ngay.slice(5, 7) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TongQuan() {
  const { ns } = useQt()
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_qt_tong_quan'), [])
  if (loading && !d) return <KhungTai dong={5} />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const cho = d.cho || {}
  const viec = [
    { to: 'lich-quay', n: cho.lich, t: 'Lịch quay chờ xác nhận', ic: CalendarDays },
    { to: 'chien-dich', n: cho.dang_ky, t: 'Đăng ký chiến dịch chờ duyệt', ic: Megaphone },
    { to: 'chien-dich?tab=bai', n: cho.bai_nop, t: 'Bài nộp chờ duyệt', ic: FileCheck2 },
    { to: 'ho-tro', n: cho.ho_tro, t: 'Yêu cầu hỗ trợ đang mở', ic: LifeBuoy },
    { to: 'cua-hang?tab=khach', n: cho.khach_khong_lich, t: 'Khách đến không đặt lịch', ic: Store },
    ns?.vai_tro === 'quan_tri' && { to: 'he-thong?tab=thu', n: cho.thu_loi, t: 'Email gửi lỗi', ic: MailWarning }
  ].filter(Boolean)
  const tongMoi = d.dang_ky_ngay.reduce((s, x) => s + x.n, 0)
  return (
    <>
      <TrangDau eyebrow={'Xin chào ' + (ns?.ho_ten?.split(' ').pop() || '')} tieuDe="Tổng quan cộng đồng" phu={`${thuCua(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }))}, ${fmtNgay(new Date())}`} />
      <div className="kpis">
        <Link to="/quantri/thanh-vien" className="kpi"><span className="nhan">Thành viên</span><span className="so-lon">{fmtSo(d.tv.tong)}</span><span className="ghi">+{d.tv.moi_7} tuần này · {fmtSo(d.tv.da_xac_thuc)} đã xác thực</span></Link>
        <Link to="/quantri/thanh-vien" className="kpi xanh"><span className="nhan">Hoạt động 30 ngày</span><span className="so-lon">{fmtSo(d.tv.hoat_dong_30)}</span><span className="ghi">{d.tv.moi_bat_dau} người mới · {d.tv.co_kinh_nghiem} có kinh nghiệm</span></Link>
        <Link to="/quantri/lich-quay" className="kpi vang"><span className="nhan">Lịch quay chụp</span><span className="so-lon">{fmtSo(d.lich.sap_toi)}</span><span className="ghi">sắp tới · {d.lich.hom_nay} hôm nay · {fmtSo(d.lich.hoan_thanh)} đã hoàn thành</span></Link>
        <Link to="/quantri/chien-dich" className="kpi"><span className="nhan">Chiến dịch đang chạy</span><span className="so-lon">{fmtSo(d.chien_dich_chay)}</span><span className="ghi">{d.chien_dich.length} chiến dịch đã công bố gần đây</span></Link>
      </div>

      <div className="hai-cot">
        <section className="lon">
          <div className="card">
            <div className="dau-the"><h2>Đăng ký mới 30 ngày</h2><span className="nho muted">{tongMoi} thành viên</span></div>
            <BieuDoNgay ds={d.dang_ky_ngay} />
          </div>
          <div className="card">
            <div className="dau-the"><h2>Lịch quay sắp tới</h2><Link to="/quantri/lich-quay" className="lien-ket nho">Tất cả <ArrowRight size={14} /></Link></div>
            {d.lich_sap_toi.length === 0 ? <p className="nho muted">Chưa có lịch sắp tới.</p> : (
              <div className="bang-cuon"><table className="bang"><thead><tr><th>Mã</th><th>Thời gian</th><th>Thành viên</th><th>Cửa hàng</th><th className="c-giua">Trạng thái</th></tr></thead>
                <tbody>{d.lich_sap_toi.map((l) => (
                  <tr key={l.id}><td><b>{l.ma}</b></td><td>{l.gio} · {fmtNgayThu(l.ngay)}</td><td>{l.thanh_vien}</td><td className="cat" style={{ maxWidth: 220 }}>{l.cua_hang}</td><td className="c-giua"><Nhan bang={TT_LICH} ma={l.trang_thai} /></td></tr>
                ))}</tbody></table></div>
            )}
          </div>
          <div className="card">
            <div className="dau-the"><h2>Chiến dịch gần đây</h2><Link to="/quantri/chien-dich" className="lien-ket nho">Quản lý <ArrowRight size={14} /></Link></div>
            {d.chien_dich.length === 0 ? <p className="nho muted">Chưa có chiến dịch công bố.</p> : (
              <div className="bang-cuon"><table className="bang"><thead><tr><th>Chiến dịch</th><th className="c-giua">Giai đoạn</th><th className="c-giua">Tham gia</th><th className="c-giua">Chờ duyệt</th><th className="c-giua">Bài nộp</th></tr></thead>
                <tbody>{d.chien_dich.map((c) => (
                  <tr key={c.id}><td className="cat" style={{ maxWidth: 280 }}><b>{c.ten}</b></td><td className="c-giua"><Nhan bang={GIAI_DOAN} ma={c.giai_doan} /></td><td className="c-giua">{c.tham_gia}</td><td className="c-giua">{c.cho}</td><td className="c-giua">{c.bai}</td></tr>
                ))}</tbody></table></div>
            )}
          </div>
        </section>
        <section className="nho-cot">
          <div className="card cot" style={{ gap: 8 }}>
            <div className="dau-the"><h2>Việc cần xử lý</h2></div>
            {viec.map((v) => (
              <Link key={v.to} to={'/quantri/' + v.to} className="o-cho">
                <span className={'so' + (v.n ? '' : ' khong')}>{v.n || 0}</span>
                <span className="gian">{v.t}</span>
                <v.ic size={17} className="muted" />
              </Link>
            ))}
          </div>
          <div className="card">
            <div className="dau-the"><h2>Sản phẩm được quan tâm</h2><span className="nho muted">30 ngày</span></div>
            {d.sp_quan_tam.length === 0 ? <p className="nho muted">Chưa có lượt xem sản phẩm.</p> : d.sp_quan_tam.map((s) => (
              <div key={s.id} className="hang" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', flex: 'none', background: 'var(--soft)' }}><Anh src={s.anh} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>
                <b className="gian cat nho">{s.ten}</b>
                <span className="nho muted-2 nowrap">{s.xem} xem · {s.mo} mở · {s.luu} lưu</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="dau-the"><h2>Thành viên theo tỉnh</h2><UserPlus size={16} className="muted" /></div>
            {d.tinh_thanh.map((t) => {
              const max = d.tinh_thanh[0]?.n || 1
              return (
                <div key={t.ten} style={{ padding: '6px 0' }}>
                  <div className="hang nho" style={{ justifyContent: 'space-between', fontWeight: 600 }}><span>{t.ten}</span><b>{t.n}</b></div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--soft)', marginTop: 4 }}><div style={{ width: (t.n / max) * 100 + '%', height: '100%', borderRadius: 99, background: 'var(--nut-chinh)' }} /></div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
