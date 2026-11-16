import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CalendarPlus, Clock, LocateFixed, MapPin, Navigation, QrCode, Search, Store, X, History } from 'lucide-react'
import { Btn, Chips, Chon, Empty, Field, KhungTai, LoiTai, MaQR, Modal, Nhan, Sao, Segment, TrangDau, useToast, useXacNhan, Bao, Md, TextArea } from '../components/ui'
import { useAuth } from '../components/auth'
import { useAsync } from '../lib/hooks'
import { rpc } from '../lib/api'
import { congNgay, fmtNgayThu, homNay, khoangCach, khop, linkBanDo, thuCua, fmtNgayGio } from '../lib/format'
import { TT_LICH, NHU_CAU } from '../lib/hang'
import { NhacXacThuc } from './TrangChu'

function MaLich({ l, luuY, dong }) {
  return (
    <Modal mo={!!l} dong={dong} tieuDe={'Mã lịch ' + (l?.ma || '')} moTa="Đưa mã này cho nhân viên cửa hàng khi đến.">
      {l && <div className="cot" style={{ alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <MaQR giaTri={l.ma} size={200} />
        <b style={{ fontSize: 24, letterSpacing: '.06em' }}>{l.ma}</b>
        <div><b>{l.cua_hang.ten}</b><p className="nho muted-2">{l.cua_hang.dia_chi}</p><p style={{ fontWeight: 700, marginTop: 6 }}>{l.gio} – {l.gio_ket_thuc} · {fmtNgayThu(l.ngay)}</p></div>
        {linkBanDo(l.cua_hang) && <a className="btn vien rong" href={linkBanDo(l.cua_hang)} target="_blank" rel="noreferrer"><Navigation size={16} />Chỉ đường</a>}
        {luuY && <div className="bao vang" style={{ textAlign: 'left', width: '100%' }}><div><b>Lưu ý khi đến cửa hàng</b><Md chu={luuY.split('\n').map((x) => '- ' + x).join('\n')} className="nho" /></div></div>}
      </div>}
    </Modal>
  )
}

function TheLich({ l, noi, onMa, taiLai }) {
  const bao = useToast()
  const xn = useXacNhan()
  const nav = useNavigate()
  const [ls, setLs] = useState(false)
  const [sao, setSao] = useState(l.danh_gia_sao || 0)
  const [nx, setNx] = useState(l.danh_gia_nhan_xet || '')
  const sapToi = ['cho_xac_nhan', 'da_xac_nhan', 'de_xuat_doi'].includes(l.trang_thai)
  const huy = async () => {
    const kq = await xn({ tieuDe: 'Hủy lịch ' + l.ma + '?', moTa: 'Hủy sớm để nhường chỗ cho thành viên khác.', nut: 'Hủy lịch', nguyHiem: true, nhapLyDo: true, nhanLyDo: 'Lý do (không bắt buộc)' })
    if (!kq) return
    try { await rpc('fn_lich_huy', { p_id: l.id, p_ly_do: kq.ly_do || null }); bao('Đã hủy lịch'); taiLai() } catch (e) { bao(e.message, 'loi') }
  }
  const traLoi = async (dongY) => {
    try {
      const kq = await rpc('fn_lich_tra_loi_doi', { p_id: l.id, p_dong_y: dongY })
      if (dongY) { bao('Lịch đã được xác nhận', 'hong'); taiLai() } else nav('/lich-quay/dat?ch=' + kq.cua_hang_id)
    } catch (e) { bao(e.message, 'loi') }
  }
  const danhGia = async () => {
    try { await rpc('fn_lich_danh_gia', { p_id: l.id, p_sao: sao, p_nhan_xet: nx }); bao('Cảm ơn bạn đã đánh giá!'); taiLai() } catch (e) { bao(e.message, 'loi') }
  }
  const [y, m, d] = l.ngay.split('-')
  return (
    <div className={'the-lich' + (noi ? ' noi' : '')} id={'lich-' + l.ma}>
      <div className="ngay"><small>{thuCua(l.ngay, true)}</small><b>{d}</b><span>Th{Number(m)}/{y.slice(2)}</span></div>
      <div className="gian cot" style={{ gap: 8 }}>
        <div className="hang wrap" style={{ gap: 8 }}>
          <h3 className="gian" style={{ minWidth: 160 }}>{l.cua_hang.ten}</h3>
          <Nhan bang={TT_LICH} ma={l.trang_thai} />
        </div>
        <p className="nho muted-2"><Clock size={13} style={{ verticalAlign: -2 }} /> {l.gio} – {l.gio_ket_thuc} · {NHU_CAU[l.nhu_cau]} · {l.so_nguoi} người · <b>{l.ma}</b></p>
        <p className="nho muted"><MapPin size={13} style={{ verticalAlign: -2 }} /> {l.cua_hang.dia_chi}</p>
        {l.trang_thai === 'de_xuat_doi' && (
          <div className="bao xanh"><div>
            <b>Nón Sơn đề xuất lịch mới: {l.de_xuat_gio} · {fmtNgayThu(l.de_xuat_ngay)}</b>{l.ly_do && <div>Lý do: {l.ly_do}</div>}
            <div className="hang wrap" style={{ gap: 8, marginTop: 10 }}><Btn co="sm" kieu="den" onClick={() => traLoi(true)}>Đồng ý lịch mới</Btn><Btn co="sm" kieu="trang" onClick={() => traLoi(false)}>Chọn lịch khác</Btn></div>
          </div></div>
        )}
        {l.trang_thai === 'da_huy' && l.ly_do && <p className="nho" style={{ color: 'var(--err)' }}>{l.khong_den ? 'Không đến theo lịch' : 'Lý do'}: {l.ly_do}</p>}
        {l.trang_thai === 'hoan_thanh' && (
          <div className="dong-switch" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <b className="nho">{l.danh_gia_sao ? 'Đánh giá của bạn' : 'Đánh giá buổi quay chụp'}</b>
            <Sao giaTri={sao} onChon={l.danh_gia_sao ? undefined : setSao} />
            {!l.danh_gia_sao ? <>
              <Field kieu="gon" nhan="Nhận xét (không bắt buộc)" value={nx} onChange={(e) => setNx(e.target.value)} />
              <Btn co="sm" kieu="den" disabled={!sao} onClick={danhGia}>Gửi đánh giá</Btn>
            </> : l.danh_gia_nhan_xet && <span className="nho muted-2">{l.danh_gia_nhan_xet}</span>}
            <Link to={'/ho-tro?lich=' + l.id} className="lien-ket nho">Phản ánh về buổi quay chụp</Link>
          </div>
        )}
        <div className="hang wrap" style={{ gap: 8 }}>
          {['da_xac_nhan', 'cho_xac_nhan'].includes(l.trang_thai) && <Btn co="sm" kieu={l.trang_thai === 'da_xac_nhan' ? 'den' : 'mem'} icon={QrCode} onClick={() => onMa(l)}>Mã QR</Btn>}
          {sapToi && linkBanDo(l.cua_hang) && <a className="btn mem sm" href={linkBanDo(l.cua_hang)} target="_blank" rel="noreferrer"><Navigation size={15} />Chỉ đường</a>}
          {sapToi && <Btn co="sm" kieu="trong" icon={X} onClick={huy}>Hủy lịch</Btn>}
          <Btn co="sm" kieu="trong" icon={History} onClick={() => setLs(!ls)}>{ls ? 'Ẩn lịch sử' : 'Lịch sử'}</Btn>
        </div>
        {ls && <div className="cot" style={{ gap: 6 }}>{l.lich_su.map((h, i) => <div key={i} className="nho muted-2">• {fmtNgayGio(h.luc)} — {TT_LICH[h.den]?.ten || h.den}{h.ghi_chu ? ': ' + h.ghi_chu : ''} <span className="muted">({h.boi})</span></div>)}</div>}
      </div>
    </div>
  )
}

export function LichCuaToi() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { data, loading, error, reload } = useAsync(() => rpc('fn_lich_cua_toi'), [])
  const [tab, setTab] = useState('sap')
  const [ma, setMa] = useState(null)
  const maUrl = sp.get('ma')
  const ds = data?.ds || []
  useEffect(() => {
    if (!maUrl || !ds.length) return
    const l = ds.find((x) => x.ma === maUrl)
    if (!l) return
    if (!['cho_xac_nhan', 'da_xac_nhan', 'de_xuat_doi'].includes(l.trang_thai)) setTab('qua')
    setTimeout(() => document.getElementById('lich-' + l.ma)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
  }, [maUrl, ds.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const sapToi = ds.filter((l) => ['cho_xac_nhan', 'da_xac_nhan', 'de_xuat_doi'].includes(l.trang_thai)).sort((a, b) => (a.ngay + a.gio).localeCompare(b.ngay + b.gio))
  const daQua = ds.filter((l) => !['cho_xac_nhan', 'da_xac_nhan', 'de_xuat_doi'].includes(l.trang_thai))
  const hien = tab === 'sap' ? sapToi : daQua
  return (
    <>
      <TrangDau tieuDe="Lịch quay chụp" phu="Đặt lịch đến cửa hàng Nón Sơn để quay video, chụp ảnh sản phẩm thật."
        phai={<Btn kieu="den" icon={CalendarPlus} onClick={() => nav('/lich-quay/dat')}>Đặt lịch</Btn>} />
      <NhacXacThuc />
      <div><Segment trang giaTri={tab} onChon={setTab} ds={[{ v: 'sap', t: 'Sắp tới', dem: sapToi.length }, { v: 'qua', t: 'Đã qua' }]} /></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} />
        : hien.length === 0
          ? <Empty icon={CalendarDays} tieuDe={tab === 'sap' ? 'Chưa có lịch sắp tới' : 'Chưa có lịch đã qua'} hanhDong={tab === 'sap' && <Btn kieu="den" icon={CalendarPlus} onClick={() => nav('/lich-quay/dat')}>Đặt lịch đầu tiên</Btn>}>Chọn cửa hàng gần bạn và khung giờ phù hợp.</Empty>
          : <div className="cot" style={{ gap: 12 }}>{hien.map((l) => <TheLich key={l.id} l={l} noi={l.ma === maUrl} onMa={setMa} taiLai={() => reload(true)} />)}</div>}
      <MaLich l={ma} luuY={data?.luu_y} dong={() => setMa(null)} />
    </>
  )
}

export function DatLich() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const bao = useToast()
  const { tv } = useAuth()
  const { data: dsCh, loading, error, reload } = useAsync(() => rpc('fn_cua_hang_ds'), [])
  const [buoc, setBuoc] = useState(0)
  const [tinh, setTinh] = useState('')
  const [q, setQ] = useState('')
  const [viTri, setViTri] = useState(null)
  const [ch, setCh] = useState(null)
  const [ngay, setNgay] = useState(congNgay(homNay(), 1))
  const [kg, setKg] = useState(null)
  const [gio, setGio] = useState('')
  const [f, setF] = useState({ nhu_cau: 'ca_hai', san_pham_quan_tam: '', so_nguoi: 1, ghi_chu: '' })
  const [dang, setDang] = useState(false)

  useEffect(() => { const id = sp.get('ch'); if (id && dsCh) { const c = dsCh.find((x) => x.id === id); if (c) { setCh(c); setBuoc(1) } } }, [dsCh]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!tinh && tv?.tinh_thanh && dsCh?.some((c) => c.tinh_thanh === tv.tinh_thanh)) setTinh(tv.tinh_thanh) }, [dsCh]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ch || buoc !== 1) return
    setKg(null); setGio('')
    rpc('fn_khung_gio', { p_cua_hang: ch.id, p_ngay: ngay }).then(setKg).catch((e) => setKg({ loi: e.message }))
  }, [ch, ngay, buoc])

  const dsTinh = useMemo(() => { const m = {}; (dsCh || []).forEach((c) => { const t = c.tinh_thanh || c.khu_vuc || 'Khác'; m[t] = (m[t] || 0) + 1 }); return Object.entries(m).sort((a, b) => b[1] - a[1]) }, [dsCh])
  const loc = useMemo(() => {
    let r = (dsCh || []).filter((c) => (!tinh || (c.tinh_thanh || c.khu_vuc) === tinh) && khop(c.ten + ' ' + c.dia_chi + ' ' + c.ma, q))
    if (viTri) r = r.map((c) => ({ ...c, km: c.lat ? khoangCach(viTri, c) : null })).sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
    return r
  }, [dsCh, tinh, q, viTri])
  const ganToi = () => {
    if (!navigator.geolocation) { bao('Thiết bị không hỗ trợ định vị', 'loi'); return }
    navigator.geolocation.getCurrentPosition((p) => { setViTri({ lat: p.coords.latitude, lng: p.coords.longitude }); setTinh('') }, () => bao('Chưa lấy được vị trí. Hãy cho phép định vị hoặc chọn tỉnh/thành.', 'loi'), { timeout: 10000 })
  }
  const toiDa = kg?.toi_da_ngay || 14
  const dsNgay = Array.from({ length: toiDa + 1 }, (_, i) => congNgay(homNay(), i))
  const gui = async () => {
    setDang(true)
    try {
      const kq = await rpc('fn_lich_dat', { p: { cua_hang_id: ch.id, ngay, gio, ...f } })
      bao('Đã gửi yêu cầu ' + kq.ma + '. Nón Sơn sẽ xác nhận sớm.', 'hong', { ms: 5000 })
      nav('/lich-quay?ma=' + kq.ma, { replace: true })
    } catch (e) { bao(e.message, 'loi'); setDang(false) }
  }
  if (loading && !dsCh) return <KhungTai />
  if (error && !dsCh) return <LoiTai loi={error} thuLai={reload} />
  return (
    <>
      <div><button type="button" className="lien-ket" onClick={() => (buoc > 0 ? setBuoc(buoc - 1) : nav('/lich-quay'))}><ArrowLeft size={16} />{buoc > 0 ? 'Bước trước' : 'Lịch của tôi'}</button></div>
      <TrangDau eyebrow={`Bước ${buoc + 1}/4`} tieuDe={['Chọn cửa hàng', 'Chọn ngày và giờ', 'Nhu cầu quay chụp', 'Xác nhận đặt lịch'][buoc]} />
      <div className="buoc-dat">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= buoc ? 'on' : ''} />)}</div>
      {!tv.email_xac_thuc && <NhacXacThuc />}

      {buoc === 0 && (
        <div className="cot" style={{ gap: 12 }}>
          <div className="toolbar">
            <label className="input-tron"><Search size={17} /><input placeholder="Tìm cửa hàng, đường, phường…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <Chon kieu="tron" tim ds={[{ v: '', t: 'Mọi tỉnh/thành', phu: (dsCh || []).length + ' cửa hàng' }, ...dsTinh.map(([t, n]) => ({ v: t, t, phu: n + ' cửa hàng' }))]} giaTri={tinh} onChon={(v) => { setTinh(v); setViTri(null) }} />
            <Btn kieu={viTri ? 'dam' : 'vien'} co="md" icon={LocateFixed} onClick={ganToi}>Gần tôi</Btn>
          </div>
          {loc.length === 0 ? <Empty icon={Store} tieuDe="Không có cửa hàng phù hợp">Thử tìm với từ khóa khác hoặc chọn tỉnh/thành khác.</Empty>
            : <div className="ds-ch">{loc.slice(0, 80).map((c) => (
                <button key={c.id} type="button" className={'o-ch' + (ch?.id === c.id ? ' on' : '')} onClick={() => { setCh(c); setBuoc(1) }}>
                  <span className="logo-tron" style={{ background: 'var(--soft)', color: 'var(--pink-deep)', width: 40, height: 40 }}><Store size={18} /></span>
                  <div className="gian"><b>{c.ten}</b><span className="cat">{c.dia_chi}</span></div>
                  {c.km != null && <span className="km">{c.km < 1 ? Math.round(c.km * 1000) + ' m' : c.km.toFixed(1) + ' km'}</span>}
                </button>))}
              </div>}
        </div>
      )}

      {buoc === 1 && ch && (
        <div className="cot" style={{ gap: 14 }}>
          <div className="o-ch on"><span className="logo-tron" style={{ background: '#fff', color: 'var(--pink-deep)', width: 40, height: 40 }}><Store size={18} /></span><div className="gian"><b>{ch.ten}</b><span className="cat">{ch.dia_chi}</span></div><button type="button" className="lien-ket nho" onClick={() => setBuoc(0)}>Đổi</button></div>
          <div className="dai-ngay">
            {dsNgay.map((d) => (
              <button key={d} type="button" className={'o-ngay' + (d === ngay ? ' on' : '')} onClick={() => setNgay(d)}>
                <small>{d === homNay() ? 'Hôm nay' : thuCua(d, true)}</small><b>{d.slice(8)}</b><span>Th{Number(d.slice(5, 7))}</span>
              </button>
            ))}
          </div>
          {kg?.uu_tien && <Bao kieu="ok">Bạn có ưu đãi <b>ưu tiên đặt lịch</b>: đặt xa hơn và sát giờ hơn thành viên thường.</Bao>}
          {!kg ? <KhungTai dong={2} /> : kg.loi ? <Bao kieu="loi">{kg.loi}</Bao>
            : kg.nghi ? <Empty icon={CalendarDays} tieuDe="Cửa hàng nghỉ nhận lịch ngày này">Chọn ngày khác nhé.</Empty>
              : kg.khung.length === 0 ? <Empty icon={Clock} tieuDe="Không có khung giờ">Chọn ngày khác nhé.</Empty>
                : <div className="luoi-gio">
                    {kg.khung.map((k) => {
                      const het = k.qua_gio || k.con_lai < f.so_nguoi
                      return <button key={k.gio} type="button" disabled={het} className={'o-gio' + (gio === k.gio ? ' on' : '')} onClick={() => setGio(k.gio)}>
                        <b>{k.gio}</b><span>{k.qua_gio ? 'Đã qua hạn đặt' : k.con_lai === 0 ? 'Đã kín' : `Còn ${k.con_lai} chỗ`}</span>
                      </button>
                    })}
                  </div>}
          {kg && !kg.loi && <p className="nho muted">Đặt trước ít nhất {kg.dat_truoc_gio} giờ · trong vòng {kg.toi_da_ngay} ngày tới.</p>}
          <Btn kieu="den" co="lg" disabled={!gio} onClick={() => setBuoc(2)}>Tiếp tục</Btn>
        </div>
      )}

      {buoc === 2 && (
        <div className="card cot" style={{ gap: 12 }}>
          <span className="nhan-nhom">Bạn đến để</span>
          <Chips ds={Object.entries(NHU_CAU).map(([v, t]) => ({ v, t }))} giaTri={f.nhu_cau} onChon={(v) => setF({ ...f, nhu_cau: v })} tick />
          <span className="nhan-nhom" style={{ marginTop: 6 }}>Số người đi cùng (kể cả bạn)</span>
          <Chips ds={[1, 2, 3, 4].map((n) => ({ v: n, t: n + ' người' }))} giaTri={f.so_nguoi} onChon={(v) => setF({ ...f, so_nguoi: v })} />
          <Field nhan="Sản phẩm quan tâm" placeholder="VD: mũ 3/4 màu hồng, nón vải đi biển…" value={f.san_pham_quan_tam} onChange={(e) => setF({ ...f, san_pham_quan_tam: e.target.value })} />
          <TextArea nhan="Ghi chú cho cửa hàng" placeholder="Ý tưởng nội dung, thiết bị mang theo…" value={f.ghi_chu} onChange={(e) => setF({ ...f, ghi_chu: e.target.value })} />
          <Btn kieu="den" co="lg" onClick={() => setBuoc(3)}>Tiếp tục</Btn>
        </div>
      )}

      {buoc === 3 && ch && (
        <div className="card cot" style={{ gap: 4 }}>
          <div className="dong-tt"><span>Cửa hàng</span><b>{ch.ten}</b></div>
          <div className="dong-tt"><span>Địa chỉ</span><span>{ch.dia_chi}</span></div>
          <div className="dong-tt"><span>Thời gian</span><b>{gio} · {fmtNgayThu(ngay)}</b></div>
          <div className="dong-tt"><span>Nhu cầu</span><span>{NHU_CAU[f.nhu_cau]} · {f.so_nguoi} người</span></div>
          {f.san_pham_quan_tam && <div className="dong-tt"><span>Sản phẩm</span><span>{f.san_pham_quan_tam}</span></div>}
          {f.ghi_chu && <div className="dong-tt"><span>Ghi chú</span><span>{f.ghi_chu}</span></div>}
          <Bao kieu="xanh">Lịch sẽ ở trạng thái <b>Chờ xác nhận</b>. Bạn nhận email và thông báo khi Nón Sơn xác nhận hoặc đề xuất giờ khác.</Bao>
          <Btn kieu="den" co="lg" style={{ marginTop: 10 }} loading={dang} disabled={!tv.email_xac_thuc} onClick={gui}>Gửi yêu cầu đặt lịch</Btn>
          {!tv.email_xac_thuc && <p className="nho" style={{ color: 'var(--err)', textAlign: 'center' }}>Cần xác nhận email trước khi đặt lịch.</p>}
        </div>
      )}
    </>
  )
}
