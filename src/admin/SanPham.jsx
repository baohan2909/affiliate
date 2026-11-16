import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, Plus, Trash2, Upload, X, ExternalLink, Save } from 'lucide-react'
import { Anh, Bao, Btn, Chips, Chon, DongSwitch, Field, KhungTai, LoiTai, Modal, Segment, Switch, TextArea, TrangDau, useToast, useXacNhan } from '../components/ui'
import { useAsync, useDebounced } from '../lib/hooks'
import { rpc, taiAnhLen } from '../lib/api'
import { fmtNgay, fmtNgayGio, fmtPhanTram, fmtSo, fmtTien, homNay, khop } from '../lib/format'
import { NHAN_TOP } from '../lib/hang'
import { BangDL, OTim, ONhapAnh, docExcel, lamMoiTuyChon, useCauHinh, xuatExcel } from './chung'

const RONG = { ma: '', sku: '', link_web: '', ghi_chu: '', ten: '', danh_muc: '', nen_tang: 'shopee', shop: '', link: '', anh: '', anh_phu: [], gia: '', gia_goc: '', hoa_hong: '', hoa_hong_ghi_chu: '', luot_ban: '', du_lieu_den: '', mo_ta: '', diem_noi_bat: '', hien: true, thu_tu: 0, nguon: 'nhap_tay' }

function SuaSP({ sp, dong, xong }) {
  const bao = useToast()
  const xn = useXacNhan()
  const ch = useCauHinh()
  const [f, setF] = useState(() => ({ ...RONG, ...sp, anh_phu: sp.anh_phu || [] }))
  const [dang, setDang] = useState(false)
  const [taiPhu, setTaiPhu] = useState(false)
  const inp = useRef(null)
  const doi = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const so = (k) => (e) => setF({ ...f, [k]: e.target.value.replace(/[^0-9.]/g, '') })
  const luu = async () => {
    setDang(true)
    try { await rpc('fn_qt_san_pham_luu', { p: f }); bao('Đã lưu sản phẩm'); lamMoiTuyChon(); xong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  const xoa = async () => {
    if (!(await xn({ tieuDe: 'Xóa sản phẩm ' + f.ma + '?', moTa: 'Sản phẩm sẽ bị gỡ khỏi chiến dịch, Top và danh sách đã lưu của thành viên. Muốn tạm ẩn, hãy tắt “Hiển thị”.', nut: 'Xóa vĩnh viễn', nguyHiem: true }))) return
    try { await rpc('fn_qt_san_pham_xoa', { p_id: f.id }); lamMoiTuyChon(); xong() } catch (e) { bao(e.message, 'loi') }
  }
  const themAnhPhu = async (files) => {
    setTaiPhu(true)
    try { const urls = []; for (const x of [...files].slice(0, 8)) urls.push(await taiAnhLen(x)); setF((v) => ({ ...v, anh_phu: [...v.anh_phu, ...urls] })) } catch (e) { bao(e.message, 'loi') } finally { setTaiPhu(false) }
  }
  return (
    <Modal mo dong={dong} rong={2} tieuDe={f.id ? 'Sửa sản phẩm ' + f.ma : 'Thêm sản phẩm'}
      chan={<>{f.id && <Btn kieu="trong" icon={Trash2} style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={xoa}>Xóa</Btn>}<Btn kieu="trong" onClick={dong}>Hủy</Btn><Btn kieu="den" loading={dang} onClick={luu}>Lưu sản phẩm</Btn></>}>
      <div className="cot" style={{ gap: 14 }}>
        <div className="luoi-form">
          <Field nhan="Mã sản phẩm" batBuoc value={f.ma} onChange={(e) => setF({ ...f, ma: e.target.value.toUpperCase() })} />
          <Field nhan="Tên sản phẩm" batBuoc value={f.ten} onChange={doi('ten')} />
          <Field nhan="SKU" value={f.sku || ''} onChange={doi('sku')} />
          <Field nhan="Link sản phẩm trên website Nón Sơn" inputMode="url" value={f.link_web || ''} onChange={doi('link_web')} />
          <Chon nhan="Danh mục" ds={[{ v: '', t: '— Không chọn —' }, ...(ch?.danh_muc || []).map((x) => ({ v: x, t: x }))]} giaTri={f.danh_muc || ''} onChon={doi('danh_muc')} />
          <Field nhan="Tên shop" value={f.shop || ''} onChange={doi('shop')} />
          <div className="toan"><Field nhan="Link sản phẩm Shopee (link gốc)" inputMode="url" value={f.link || ''} onChange={doi('link')} /></div>
        </div>
        <div className="hai-cot" style={{ gap: 14 }}>
          <div className="lon" style={{ gap: 10 }}><ONhapAnh nhan="Ảnh chính" giaTri={f.anh} onDoi={(v) => setF({ ...f, anh: v })} /></div>
          <div className="nho-cot" style={{ gap: 8 }}>
            <span className="nhan-nhom" style={{ margin: 0 }}>Ảnh phụ ({f.anh_phu.length})</span>
            <div className="hang wrap" style={{ gap: 8 }}>
              {f.anh_phu.map((a, i) => (
                <div key={a + i} className="o-anh" style={{ width: 72, height: 72, borderStyle: 'solid' }}>
                  <img src={a} alt="" />
                  <button type="button" className="icon-btn xs xoa-anh" aria-label="Bỏ ảnh" onClick={() => setF({ ...f, anh_phu: f.anh_phu.filter((_, j) => j !== i) })}><X size={12} /></button>
                </div>
              ))}
              <button type="button" className="o-anh" style={{ width: 72, height: 72 }} onClick={() => inp.current?.click()} disabled={taiPhu}>{taiPhu ? '…' : <Plus size={20} />}</button>
              <input ref={inp} type="file" accept="image/*" multiple hidden onChange={(e) => { themAnhPhu(e.target.files); e.target.value = '' }} />
            </div>
          </div>
        </div>
        <div className="khoi-form">
          <h4>Giá & chỉ số (chỉ nhập khi có nguồn dữ liệu thật)</h4>
          <div className="luoi-form">
            <Field nhan="Giá bán (đ)" inputMode="numeric" value={f.gia ?? ''} onChange={so('gia')} goiY={f.gia ? fmtTien(f.gia) : ''} />
            <Field nhan="Giá gốc (đ)" inputMode="numeric" value={f.gia_goc ?? ''} onChange={so('gia_goc')} goiY={f.gia_goc ? fmtTien(f.gia_goc) : ''} />
            <Field nhan="Hoa hồng (%)" inputMode="decimal" value={f.hoa_hong ?? ''} onChange={so('hoa_hong')} />
            <Field nhan="Ghi chú hoa hồng" value={f.hoa_hong_ghi_chu || ''} onChange={doi('hoa_hong_ghi_chu')} placeholder="VD: áp dụng đến 30/11" />
            <Field nhan="Lượt bán" inputMode="numeric" value={f.luot_ban ?? ''} onChange={(e) => setF({ ...f, luot_ban: e.target.value.replace(/\D/g, '') })} />
            <Field nhan="Dữ liệu cập nhật đến" type="date" value={f.du_lieu_den || ''} onChange={doi('du_lieu_den')} />
          </div>
        </div>
        <TextArea nhan="Điểm nên nói khi quảng bá (mỗi dòng 1 ý)" rows={4} value={f.diem_noi_bat || ''} onChange={doi('diem_noi_bat')} />
        <TextArea nhan="Ghi chú cho thành viên (hiện trong trang sản phẩm)" rows={2} value={f.ghi_chu || ''} onChange={doi('ghi_chu')} />
        <TextArea nhan="Mô tả sản phẩm" rows={5} value={f.mo_ta || ''} onChange={doi('mo_ta')} goiY="Hỗ trợ ## tiêu đề, - gạch đầu dòng, **đậm**." />
        <div className="luoi-form">
          <DongSwitch nhan="Hiển thị cho thành viên" on={f.hien} onDoi={(v) => setF({ ...f, hien: v })} />
          <Field nhan="Thứ tự ưu tiên (nhỏ hiện trước)" inputMode="numeric" value={f.thu_tu ?? 0} onChange={(e) => setF({ ...f, thu_tu: e.target.value.replace(/\D/g, '') })} />
        </div>
      </div>
    </Modal>
  )
}

// ---------- Nhập hàng loạt từ Excel / CSV ----------
const COT_NHAP = {
  ma: ['ma', 'mã', 'mã sp', 'mã sản phẩm', 'sku', 'ma sp'], ten: ['ten', 'tên', 'tên sản phẩm', 'tên sp', 'sản phẩm'], danh_muc: ['danh mục', 'danh_muc', 'nhóm hàng'],
  shop: ['shop', 'tên shop'], link: ['link', 'link sản phẩm', 'url', 'đường dẫn'], anh: ['ảnh', 'anh', 'hình', 'link ảnh', 'image'],
  gia: ['giá', 'gia', 'giá bán'], gia_goc: ['giá gốc', 'gia_goc'], hoa_hong: ['hoa hồng', 'hoa_hong', '% hoa hồng', 'hoa hồng (%)'],
  luot_ban: ['lượt bán', 'luot_ban', 'đã bán', 'số lượng bán'], mo_ta: ['mô tả', 'mo_ta'], nhan: ['nhãn', 'nhan', 'top', 'nhãn top']
}
const chuanHoa = (s) => String(s || '').trim().toLowerCase()
function anhXa(dong) {
  return dong.map((r) => {
    const o = {}
    for (const [k, ten] of Object.entries(COT_NHAP)) {
      const cot = Object.keys(r).find((c) => ten.includes(chuanHoa(c)))
      if (cot !== undefined && String(r[cot]).trim() !== '') o[k] = String(r[cot]).trim()
    }
    return o
  }).filter((o) => o.ma)
}

function NhapSP({ xong }) {
  const bao = useToast()
  const inp = useRef(null)
  const [dong, setDong] = useState(null)
  const [tenTep, setTenTep] = useState('')
  const [nguon, setNguon] = useState('')
  const [den, setDen] = useState(homNay())
  const [dang, setDang] = useState(false)
  const [kq, setKq] = useState(null)
  const doc = async (f) => {
    if (!f) return
    try { const r = anhXa(await docExcel(f)); setDong(r); setTenTep(f.name); setKq(null); if (!r.length) bao('Không tìm thấy cột “Mã” trong tệp', 'loi') } catch (e) { bao('Không đọc được tệp: ' + e.message, 'loi') }
  }
  const mau = () => xuatExcel('mau-nhap-san-pham', [{ 'Mã': 'NS-A01', 'Tên': 'Mũ bảo hiểm 3/4 Nón Sơn', 'Danh mục': 'Mũ bảo hiểm', 'Shop': 'Nón Sơn Official', 'Link': 'https://shopee.vn/…', 'Ảnh': 'https://…', 'Giá': 450000, 'Giá gốc': 520000, 'Hoa hồng': 8, 'Lượt bán': 1200, 'Nhãn': 'Bán chạy', 'Mô tả': '' }], 'San pham')
  const gui = async () => {
    if (!nguon.trim()) { bao('Ghi rõ nguồn dữ liệu (VD: Shopee Affiliate báo cáo tháng 11)', 'loi'); return }
    setDang(true)
    try { const r = await rpc('fn_qt_san_pham_nhap', { p_rows: dong, p_nguon: nguon.trim(), p_du_lieu_den: den || null }); setKq(r); bao(`Thêm ${r.them} · cập nhật ${r.cap_nhat}${r.loi.length ? ` · ${r.loi.length} lỗi` : ''}`); lamMoiTuyChon(); xong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="cot" style={{ gap: 14 }}>
      <Bao kieu="xanh">Khớp theo <b>Mã</b>: mã đã có → cập nhật các cột có giá trị; mã mới → thêm (cần Tên). Cột “Nhãn” nhận: Bán chạy / Tăng trưởng / Đề xuất. Lượt bán & hoa hồng chỉ hiển thị cho thành viên kèm nguồn và ngày dữ liệu.</Bao>
      <div className="hang wrap" style={{ gap: 10 }}>
        <Btn kieu="den" icon={Upload} onClick={() => inp.current?.click()}>Chọn tệp Excel / CSV</Btn>
        <Btn kieu="vien" icon={FileSpreadsheet} onClick={mau}>Tải tệp mẫu</Btn>
        {tenTep && <span className="nho muted-2">{tenTep} · {dong?.length || 0} dòng hợp lệ</span>}
        <input ref={inp} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { doc(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {dong?.length > 0 && (
        <>
          <div className="luoi-form">
            <Field nhan="Nguồn dữ liệu" batBuoc value={nguon} onChange={(e) => setNguon(e.target.value)} placeholder="VD: Báo cáo Shopee Affiliate 01–15/11" />
            <Field nhan="Dữ liệu tính đến ngày" type="date" value={den} onChange={(e) => setDen(e.target.value)} />
          </div>
          <div className="bang-khung"><div className="bang-cuon"><table className="bang">
            <thead><tr><th className="stt">#</th><th>Mã</th><th>Tên</th><th className="c-giua">Giá</th><th className="c-giua">Hoa hồng</th><th className="c-giua">Lượt bán</th><th className="c-giua">Nhãn</th></tr></thead>
            <tbody>{dong.slice(0, 12).map((r, i) => <tr key={i}><td className="stt">{i + 1}</td><td><b>{r.ma}</b></td><td className="cat" style={{ maxWidth: 280 }}>{r.ten || <span className="muted">(giữ nguyên)</span>}</td><td className="c-giua">{r.gia || ''}</td><td className="c-giua">{r.hoa_hong || ''}</td><td className="c-giua">{r.luot_ban || ''}</td><td className="c-giua">{r.nhan || ''}</td></tr>)}</tbody>
          </table></div>{dong.length > 12 && <div className="chan-bang">… và {dong.length - 12} dòng nữa</div>}</div>
          <div><Btn kieu="den" co="lg" icon={Save} loading={dang} onClick={gui}>Nhập {dong.length} dòng</Btn></div>
        </>
      )}
      {kq?.loi?.length > 0 && <Bao kieu="loi"><b>{kq.loi.length} dòng lỗi:</b><br />{kq.loi.slice(0, 20).map((x) => `Dòng ${x.dong} (${x.ma || '—'}): ${x.loi}`).join(' · ')}</Bao>}
    </div>
  )
}

// ---------- Quản lý Top sản phẩm ----------
function QuanLyTop({ ds, top, nguonTop, xong }) {
  const bao = useToast()
  const [nhan, setNhan] = useState('ban_chay')
  const dauTien = (k) => top.filter((x) => x.nhan === k).sort((a, b) => a.thu_tu - b.thu_tu)
  const [ids, setIds] = useState(() => Object.fromEntries(Object.keys(NHAN_TOP).map((k) => [k, dauTien(k).map((x) => x.san_pham_id)])))
  const [den, setDen] = useState(() => Object.fromEntries(Object.keys(NHAN_TOP).map((k) => [k, dauTien(k)[0]?.du_lieu_den || homNay()])))
  const [nguon, setNguon] = useState(() => Object.fromEntries(Object.keys(NHAN_TOP).map((k) => [k, dauTien(k)[0]?.nguon || nguonTop || ''])))
  const [dang, setDang] = useState(false)
  const sp = (id) => ds.find((s) => s.id === id)
  const cur = ids[nhan]
  const doiCho = (i, d) => { const a = [...cur]; [a[i], a[i + d]] = [a[i + d], a[i]]; setIds({ ...ids, [nhan]: a }) }
  const luu = async () => {
    setDang(true)
    try { await rpc('fn_qt_top_luu', { p_nhan: nhan, p_ids: cur, p_du_lieu_den: den[nhan] || null, p_nguon: nguon[nhan] || null }); bao('Đã lưu ' + NHAN_TOP[nhan].ten); xong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <div className="cot" style={{ gap: 14 }}>
      <Segment trang giaTri={nhan} onChon={setNhan} ds={Object.entries(NHAN_TOP).map(([v, x]) => ({ v, t: x.ten, dem: ids[v].length }))} />
      <div className="luoi-form">
        <Field nhan="Nguồn dữ liệu (hiện cho thành viên)" value={nguon[nhan]} onChange={(e) => setNguon({ ...nguon, [nhan]: e.target.value })} placeholder="VD: Shopee Affiliate · Nón Sơn tổng hợp" />
        <Field nhan="Dữ liệu cập nhật đến" type="date" value={den[nhan] || ''} onChange={(e) => setDen({ ...den, [nhan]: e.target.value })} />
      </div>
      <div style={{ maxWidth: 520 }}><Chon kieu="tron" tim goiY="+ Thêm sản phẩm vào danh sách" giaTri="" ds={ds.filter((s) => !cur.includes(s.id)).map((s) => ({ v: s.id, t: s.ten, phu: s.ma }))} onChon={(v) => setIds({ ...ids, [nhan]: [...cur, v] })} /></div>
      <div className="bang-khung"><div className="bang-cuon"><table className="bang">
        <thead><tr><th className="stt">Hạng</th><th>Sản phẩm</th><th className="c-giua">Giá</th><th className="c-giua">Lượt bán</th><th className="c-giua">Hiển thị</th><th className="c-phai">Sắp xếp</th></tr></thead>
        <tbody>
          {cur.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Chưa có sản phẩm trong {NHAN_TOP[nhan].ten}</td></tr>}
          {cur.map((id, i) => { const s = sp(id); return s && (
            <tr key={id}>
              <td className="stt"><b>{i + 1}</b></td>
              <td><div className="ten-o"><span className="anh-nho"><Anh src={s.anh} alt="" /></span><div className="gian"><b>{s.ten}</b><span>{s.ma}</span></div></div></td>
              <td className="c-giua">{fmtTien(s.gia)}</td><td className="c-giua">{s.luot_ban != null ? fmtSo(s.luot_ban) : ''}</td>
              <td className="c-giua">{s.hien ? 'Có' : <span style={{ color: 'var(--err)' }}>Đang ẩn</span>}</td>
              <td className="c-phai"><span className="hang" style={{ gap: 4, justifyContent: 'flex-end' }}>
                <button type="button" className="icon-btn xs mem" disabled={i === 0} onClick={() => doiCho(i, -1)} aria-label="Lên"><ArrowUp size={14} /></button>
                <button type="button" className="icon-btn xs mem" disabled={i === cur.length - 1} onClick={() => doiCho(i, 1)} aria-label="Xuống"><ArrowDown size={14} /></button>
                <button type="button" className="icon-btn xs mem" onClick={() => setIds({ ...ids, [nhan]: cur.filter((x) => x !== id) })} aria-label="Bỏ"><X size={14} /></button>
              </span></td>
            </tr>) })}
        </tbody>
      </table></div></div>
      <div><Btn kieu="den" icon={Save} loading={dang} onClick={luu}>Lưu {NHAN_TOP[nhan].ten}</Btn></div>
    </div>
  )
}

export default function SanPham() {
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'ds'
  const bao = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => rpc('fn_qt_san_pham_ds'), [])
  const [q, setQ] = useState('')
  const [dm, setDm] = useState('')
  const [hien, setHien] = useState('')
  const [sua, setSua] = useState(null)
  const qd = useDebounced(q, 200)
  const ds = data?.ds || []
  const dsDm = useMemo(() => [...new Set(ds.map((s) => s.danh_muc).filter(Boolean))], [ds])
  const loc = useMemo(() => ds.filter((s) => khop(`${s.ten} ${s.ma} ${s.sku || ''} ${s.shop || ''}`, qd) && (!dm || s.danh_muc === dm) && (!hien || String(s.hien) === hien)), [ds, qd, dm, hien])
  const batHien = async (s, v) => {
    setData((d) => ({ ...d, ds: d.ds.map((x) => (x.id === s.id ? { ...x, hien: v } : x)) }))
    try { await rpc('fn_qt_san_pham_luu', { p: { ...s, hien: v } }) } catch (e) { bao(e.message, 'loi'); reload(true) }
  }
  const cot = [
    { k: 'thu_tu', t: 'STT', canh: 'giua' },
    { k: 'ten', t: 'Sản phẩm', o: (s) => <div className="ten-o"><span className="anh-nho"><Anh src={s.anh} alt="" /></span><div className="gian"><b>{s.ten}</b><span>{s.ma}{s.sku ? ' · SKU ' + s.sku : ''}</span></div></div> },
    { k: 'danh_muc', t: 'Danh mục' },
    { k: 'gia', t: 'Giá', canh: 'giua', o: (s) => fmtTien(s.gia) },
    { k: 'hoa_hong', t: 'Hoa hồng', canh: 'giua', o: (s) => fmtPhanTram(s.hoa_hong) },
    { k: 'luot_ban', t: 'Lượt bán', canh: 'giua', o: (s) => (s.luot_ban != null ? fmtSo(s.luot_ban) : '') },
    { k: 'nhan', t: 'Top', sx: (s) => s.nhan.length, o: (s) => s.nhan.map((n) => NHAN_TOP[n.nhan]?.ngan).join(', ') },
    { k: 'xem', t: 'Xem', canh: 'giua' },
    { k: 'mo', t: 'Mở/chép', canh: 'giua' },
    { k: 'luu', t: 'Lưu', canh: 'giua' },
    { k: 'du_lieu_den', t: 'Dữ liệu đến', canh: 'giua', o: (s) => fmtNgay(s.du_lieu_den) },
    { k: 'hien', t: 'Hiện', canh: 'giua', o: (s) => <span onClick={(e) => e.stopPropagation()}><Switch on={s.hien} nhan="Hiển thị" onDoi={(v) => batHien(s, v)} /></span> },
    { k: 'link', t: '', sx: false, o: (s) => s.link && <a href={s.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="icon-btn xs mem" aria-label="Mở Shopee"><ExternalLink size={14} /></a> }
  ]
  const xuat = () => xuatExcel('san-pham-affiliate-' + homNay(), loc.map((s) => ({ 'Mã': s.ma, 'Tên': s.ten, 'Danh mục': s.danh_muc || '', 'Shop': s.shop || '', 'Link': s.link || '', 'Ảnh': s.anh || '', 'Giá': s.gia ?? '', 'Giá gốc': s.gia_goc ?? '', 'Hoa hồng': s.hoa_hong ?? '', 'Lượt bán': s.luot_ban ?? '', 'Nhãn': s.nhan.map((n) => NHAN_TOP[n.nhan]?.ngan).join(', '), 'Hiển thị': s.hien ? 'Có' : 'Ẩn', 'Lượt xem': s.xem, 'Mở/chép link': s.mo, 'Lượt lưu': s.luu })), 'San pham')
  return (
    <>
      <TrangDau eyebrow="Nội dung" tieuDe="Sản phẩm Affiliate" phu={`${ds.length} sản phẩm · ${ds.filter((s) => s.hien).length} đang hiển thị`}
        phai={<><Btn kieu="vien" icon={Download} disabled={!loc.length} onClick={xuat}>Xuất Excel</Btn><Btn kieu="den" icon={Plus} onClick={() => setSua({ ...RONG })}>Thêm sản phẩm</Btn></>} />
      <div><Segment trang giaTri={tab} onChon={(v) => setSp({ tab: v }, { replace: true })} ds={[{ v: 'ds', t: 'Danh sách' }, { v: 'top', t: 'Top sản phẩm' }, { v: 'nhap', t: 'Nhập Excel' }, { v: 'ls', t: 'Lịch sử nhập' }]} /></div>
      {loading && !data ? <KhungTai /> : error && !data ? <LoiTai loi={error} thuLai={reload} /> : (
        <>
          {tab === 'ds' && <>
            <div className="toolbar">
              <OTim giaTri={q} onDoi={setQ} goiY="Tên, mã, SKU…" />
              {dsDm.length > 0 && <Chon kieu="tron" ds={[{ v: '', t: 'Mọi danh mục' }, ...dsDm.map((x) => ({ v: x, t: x }))]} giaTri={dm} onChon={setDm} />}
              <Chips co="sm" trang ds={[{ v: '', t: 'Tất cả' }, { v: 'true', t: 'Đang hiện' }, { v: 'false', t: 'Đang ẩn' }]} giaTri={hien} onChon={setHien} />
            </div>
            {ds.some((s) => s.nguon === 'sheet_shopee') && <Bao kieu="xanh">Sản phẩm đồng bộ tự động từ Google Sheet <b>THÔNG TIN SẢN PHẨM AFFILIATE - SHOPEE GỐC</b>. Giá, % hoa hồng, chiết khấu, trạng thái và thứ tự (STT) sửa tại sheet; ảnh, điểm nổi bật, mô tả, ảnh phụ có thể bổ sung tại đây.</Bao>}
            <BangDL cot={cot} ds={loc} macDinh="thu_tu" chieu="tang" onBam={(s) => setSua(s)} trong="Chưa có sản phẩm. Thêm tay hoặc nhập từ Excel." />
          </>}
          {tab === 'top' && <div className="card"><QuanLyTop key={data.top.length + ':' + ds.length} ds={ds} top={data.top} nguonTop={data.nguon_top} xong={() => reload(true)} /></div>}
          {tab === 'nhap' && <div className="card"><NhapSP xong={() => reload(true)} /></div>}
          {tab === 'ls' && (
            <div className="card">
              {data.dong_bo.length === 0 ? <p className="nho muted">Chưa có lần nhập nào.</p> : data.dong_bo.map((x) => (
                <div key={x.id} className="nk-dong">
                  <div className="hang wrap" style={{ gap: 8, justifyContent: 'space-between' }}><b>{x.nguon === 'sheet_shopee' ? 'Google Sheet · SHOPEE GỐC' : x.nguon}</b><span className="nho muted">{fmtNgayGio(x.luc)} · {x.boi_ten || 'Hệ thống'}</span></div>
                  <span className="nho muted-2">{x.loai === 'san_pham' ? 'Sản phẩm' : x.loai} · {x.so_dong} dòng · thêm {x.chi_tiet?.them ?? 0} · cập nhật {x.chi_tiet?.cap_nhat ?? 0}{x.chi_tiet?.an ? ' · ẩn ' + x.chi_tiet.an : ''}{x.chi_tiet?.du_lieu_den ? ' · dữ liệu đến ' + fmtNgay(x.chi_tiet.du_lieu_den) : ''}{x.loi ? ' · ' + x.loi : ''}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {sua && <SuaSP sp={sua} dong={() => setSua(null)} xong={() => { setSua(null); reload(true) }} />}
    </>
  )
}
