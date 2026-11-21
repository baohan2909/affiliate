// SÓC TIA CHỚP — Bàn làm việc của agent tiếp thị tự vận hành (chỉ quản trị cấp cao)
// Sóc tự chọn sản phẩm → nhờ Claude viết → tự kiểm tra → tự đăng Fanpage theo lịch → gửi bình luận hội nhóm + báo cáo về Telegram.
// Anh không phải duyệt; trang này để theo dõi, bật/tắt và (khi cần) can thiệp 1 bài.
import { useEffect, useState } from 'react'
import {
  Bot, BrainCircuit, CalendarClock, Check, CircleAlert, Copy, ExternalLink, History, Newspaper, Link2, MessageCircle, MessagesSquare,
  Pencil, PlayCircle, RefreshCw, Save, Send, Settings2, Sparkles, Trash2, Zap
} from 'lucide-react'
import { Anh, Bao, Btn, Chips, Chon, Empty, Field, IconBtn, KhungTai, LoiTai, Modal, Segment, TextArea, saoChep, useToast, useXacNhan } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { rpc, sb } from '../lib/api'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import { fmtNgayGio, fmtTien, tuongDoi } from '../lib/format'

export const PHONG_CACH = {
  san_sale: 'Săn món hời', chia_se: 'Chia sẻ đồ tốt', danh_gia: 'Nhận xét nhanh', goi_y: 'Gợi ý mua sắm', gan_gui: 'Gần gũi đời thường'
}
const GIO_GOI_Y = ['07:30', '08:30', '10:00', '11:45', '13:30', '15:30', '17:30', '19:00', '20:15', '21:30']
const MODEL = [
  { v: 'claude-sonnet-5-5', t: 'Claude Sonnet 5.5', phu: 'Cân bằng chất lượng và chi phí (khuyên dùng)' },
  { v: 'claude-opus-5-5', t: 'Claude Opus 5.5', phu: 'Viết hay nhất, chi phí cao hơn' },
  { v: 'claude-haiku-5-5', t: 'Claude Haiku 5.5', phu: 'Nhanh, rẻ nhất' }
]
const LOAI_NK = {
  viet: { t: 'Viết', mau: '#E9F5F2', chu: '#0E7F63' }, dang: { t: 'Đăng', mau: '#E3F5EE', chu: '#0E7F63' },
  loi: { t: 'Lỗi', mau: '#FDECEC', chu: '#B93838' }, cai_dat: { t: 'Cài đặt', mau: '#F1F0F4', chu: '#4A4452' },
  kiem_tra: { t: 'Kiểm tra', mau: '#EEF2FB', chu: '#3557A6' }, can_thiep: { t: 'Can thiệp', mau: '#FFF4E0', chu: '#8A5410' },
  quay_ve: { t: 'Quay về', mau: '#FFF4E0', chu: '#8A5410' }
}
const TT_NHOM = { cho_dang: 'Chờ gửi Telegram', da_gui_tg: 'Đã gửi Telegram', da_dan: 'Đã dán vào nhóm' }
const tenGon = (t) => String(t || '').replace(/^\s*(\[[^\]]*\]|ưu đãi)\s*[-–:]?\s*/i, '').trim()
const soVN = (n) => Number(n || 0).toLocaleString('vi-VN')

export async function goiSoc(hanhDong, them = {}) {
  const { data: { session } } = await sb.auth.getSession()
  const r = await fetch(SUPABASE_URL + '/functions/v1/soc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (session?.access_token || '') },
    body: JSON.stringify({ hanh_dong: hanhDong, ...them })
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.loi || 'Không gọi được Sóc')
  return j
}

// ---------- Đầu trang: Sóc + công tắc + kết nối ----------
function DauSoc({ d, onDoi, dangDoi, onViet, dangViet }) {
  const c = d.cai_dat
  const ketNoi = [
    { k: 'claude', t: 'Claude', ok: c.co_claude, ic: BrainCircuit },
    { k: 'fb', t: c.fb_trang_ten || 'Fanpage', ok: c.co_fb, ic: Newspaper },
    { k: 'tg', t: 'Telegram', ok: c.co_tg, ic: Send },
    { k: 'aff', t: 'ID Shopee', ok: !!c.aff_id, ic: Link2 }
  ]
  const thieu = ketNoi.filter((x) => !x.ok && x.k !== 'fb' && x.k !== 'tg')
  return (
    <section className={'soc-hero' + (c.bat ? ' lam' : '')}>
      <div className="soc-dau">
        <span className="soc-mat" aria-hidden="true"><Zap size={30} strokeWidth={2.4} fill="currentColor" /></span>
        <div className="gian">
          <p className="soc-eyebrow">Agent tự vận hành</p>
          <h1>Sóc Tia Chớp</h1>
          <p className="soc-tt"><i />{c.bat ? 'Đang làm việc' : 'Đang nghỉ'}</p>
        </div>
        <button type="button" role="switch" aria-checked={c.bat} aria-label={c.bat ? 'Cho Sóc nghỉ' : 'Cho Sóc làm việc'} disabled={dangDoi}
          className={'soc-cong-tac' + (c.bat ? ' on' : '')} onClick={onDoi}><span /></button>
      </div>
      <p className="soc-mo">Tự chọn sản phẩm bán chạy, viết bài bằng Claude, tự kiểm tra giá và nội dung, tự đăng Fanpage theo lịch. Bình luận cho hội nhóm và báo cáo cuối ngày gửi về Telegram.</p>
      <div className="soc-kn">
        {ketNoi.map((x) => (
          <span key={x.k} className={'soc-kn-o' + (x.ok ? ' ok' : '')}>
            <x.ic size={14} strokeWidth={2.3} /><b className="cat">{x.t}</b>{x.ok ? <Check size={13} strokeWidth={3} /> : <span className="chua">chưa</span>}
          </span>
        ))}
      </div>
      {thieu.length > 0 && <p className="soc-thieu"><CircleAlert size={15} />Cần {thieu.map((x) => x.t).join(' và ')} để Sóc viết được. Vào tab Cài đặt.</p>}
      <div className="soc-nut">
        <Btn kieu="kinh" co="sm" icon={Sparkles} loading={dangViet} disabled={!c.co_claude || !c.aff_id} onClick={onViet}>Viết ngay 1 bài</Btn>
      </div>
    </section>
  )
}

// ---------- 1 bài Fanpage trong lịch / đã đăng ----------
function TheBai({ b, coFb, onXong }) {
  const bao = useToast()
  const xacNhan = useXacNhan()
  const [mo, setMo] = useState(false)
  const [sua, setSua] = useState(null)
  const [dang, setDang] = useState('')
  const lam = async (hd, noi) => {
    setDang(hd)
    try { await rpc('fn_qt_soc_bai', { p_id: b.id, p_hanh_dong: hd, p_noi_dung: noi ?? null }); onXong(); setSua(null) } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const dangNgay = async () => {
    if (!(await xacNhan({ tieuDe: 'Đăng bài này lên Fanpage ngay?', moTa: tenGon(b.ten_sp), nut: 'Đăng ngay' }))) return
    setDang('dang')
    try { await goiSoc('dang_ngay', { bai_id: b.id }); bao('Đã đăng lên Fanpage'); onXong() } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const bo = async () => { if (await xacNhan({ tieuDe: 'Bỏ bài này?', moTa: 'Sóc sẽ viết bài khác cho khung giờ này.', nut: 'Bỏ bài', nguyHiem: true })) lam('bo') }
  const daDang = !!b.dang_luc
  return (
    <article className={'soc-bai' + (b.trang_thai === 'loi' ? ' loi' : '')}>
      <div className="soc-bai-dau">
        <Anh src={b.anh} alt="" className="soc-bai-anh" />
        <div className="gian">
          <b className="cat2">{tenGon(b.ten_sp)}</b>
          <span className="soc-meta">
            {daDang ? <><Check size={13} strokeWidth={3} />Đã đăng {fmtNgayGio(b.dang_luc)}</> : <><CalendarClock size={13} />Đăng lúc {fmtNgayGio(b.hen_luc)}</>}
            {b.phong_cach && <span className="soc-pc">{PHONG_CACH[b.phong_cach] || b.phong_cach}</span>}
            {b.gia != null && <span>{fmtTien(b.gia)}</span>}
          </span>
        </div>
      </div>
      {b.trang_thai === 'loi' && <Bao kieu="loi">Đăng lỗi sau 3 lần thử: {b.loi}</Bao>}
      {b.trang_thai === 'cho_dang' && b.loi && <p className="nho muted">Lần thử trước lỗi: {b.loi}</p>}
      <button type="button" className={'soc-noi' + (mo ? ' mo' : '')} onClick={() => setMo(!mo)}>{b.noi_dung}</button>
      <div className="soc-tac">
        {daDang ? (
          b.fb_post_id && <a className="btn vien sm" href={'https://www.facebook.com/' + b.fb_post_id} target="_blank" rel="noreferrer"><ExternalLink size={15} />Xem trên Facebook</a>
        ) : <>
          {b.trang_thai === 'cho_dang' && coFb && <Btn co="sm" kieu="den" icon={PlayCircle} loading={dang === 'dang'} onClick={dangNgay}>Đăng ngay</Btn>}
          {b.trang_thai === 'loi' && <Btn co="sm" kieu="den" icon={RefreshCw} loading={dang === 'dang_lai'} onClick={() => lam('dang_lai')}>Đăng lại</Btn>}
          <Btn co="sm" kieu="vien" icon={Pencil} onClick={() => setSua(b.noi_dung)}>Sửa</Btn>
          <Btn co="sm" kieu="trong" icon={Trash2} loading={dang === 'bo'} onClick={bo}>Bỏ</Btn>
        </>}
        <IconBtn icon={Copy} nhan="Chép nội dung" co="sm" className="soc-chep" onClick={() => saoChep(b.noi_dung).then(() => bao('Đã chép nội dung'))} />
      </div>
      <Modal mo={sua != null} dong={() => setSua(null)} tieuDe="Sửa bài trước khi Sóc đăng" moTa={tenGon(b.ten_sp)} rong
        chan={<><Btn kieu="trong" onClick={() => setSua(null)}>Hủy</Btn><Btn kieu="den" icon={Save} loading={dang === 'sua'} onClick={() => lam('sua', sua)}>Lưu</Btn></>}>
        <TextArea nhan="Nội dung" rows={12} value={sua || ''} onChange={(e) => setSua(e.target.value)} />
      </Modal>
    </article>
  )
}

function TheBinhLuan({ b, onXong }) {
  const bao = useToast()
  const [dang, setDang] = useState(false)
  const daDan = async () => {
    setDang(true)
    try { await rpc('fn_qt_soc_bai', { p_id: b.id, p_hanh_dong: 'da_dan' }); onXong() } catch (e) { bao(e.message, 'loi') } finally { setDang(false) }
  }
  return (
    <article className={'soc-bai bl' + (b.trang_thai === 'da_dan' ? ' xong' : '')}>
      <div className="soc-bai-dau">
        <Anh src={b.anh} alt="" className="soc-bai-anh nho" />
        <div className="gian">
          <b className="cat">{tenGon(b.ten_sp)}</b>
          <span className="soc-meta"><span className={'soc-tt-bl t-' + b.trang_thai}>{TT_NHOM[b.trang_thai] || b.trang_thai}</span>{tuongDoi(b.tao_luc)}</span>
        </div>
      </div>
      <p className="soc-bl">{b.noi_dung}</p>
      <div className="soc-tac">
        <Btn co="sm" kieu="den" icon={Copy} onClick={() => saoChep(b.noi_dung).then(() => bao('Đã chép, dán vào bình luận trong nhóm'))}>Chép bình luận</Btn>
        {b.trang_thai !== 'da_dan' && <Btn co="sm" kieu="trong" icon={Check} loading={dang} onClick={daDan}>Đã dán</Btn>}
      </div>
    </article>
  )
}

// ---------- Cài đặt ----------
function KhoaBiMat({ nhan, co, value, onChange, goiY }) {
  return <Field nhan={nhan} type="password" autoComplete="off" value={value} onChange={onChange} placeholder={co ? 'Đã lưu · nhập để thay' : 'Dán vào đây'} goiY={goiY} />
}

function CaiDat({ c, reload }) {
  const bao = useToast()
  const [f, setF] = useState(() => ({
    model: c.model, aff_id: c.aff_id || '', fb_trang_id: c.fb_trang_id || '', tg_chat: c.tg_chat || '',
    gio_dang: c.gio_dang || [], binh_luan_ngay: c.binh_luan_ngay, gio_bao_cao: c.gio_bao_cao, phong_cach: c.phong_cach || [],
    danh_muc: c.danh_muc || [], thuong_hieu: c.thuong_hieu || '', giong_van: c.giong_van || '',
    claude_khoa: '', fb_token: '', tg_token: ''
  }))
  const [dang, setDang] = useState('')
  // Sóc tự tìm được Chat ID / đổi Page ID → đưa vào form để lần lưu sau không xóa mất
  useEffect(() => { setF((x) => ({ ...x, tg_chat: x.tg_chat || c.tg_chat || '' })) }, [c.tg_chat])
  const dat = (k, v) => setF({ ...f, [k]: v })
  const luu = async (imLang) => {
    if (!f.gio_dang.length) { bao('Chọn ít nhất 1 khung giờ đăng', 'loi'); return false }
    if (!f.phong_cach.length) { bao('Chọn ít nhất 1 phong cách viết', 'loi'); return false }
    setDang('luu')
    try {
      await rpc('fn_qt_soc_luu', { p: { ...f, so_bai_ngay: f.gio_dang.length, danh_muc: f.danh_muc.length ? f.danh_muc : null } })
      setF({ ...f, claude_khoa: '', fb_token: '', tg_token: '' })
      await reload(true)
      if (!imLang) bao('Đã lưu cài đặt của Sóc')
      return true
    } catch (e) { bao(e.message, 'loi'); return false } finally { setDang('') }
  }
  const kiem = async (hd, ten) => {
    if (!(await luu(true))) return
    setDang(hd)
    try {
      const r = await goiSoc(hd)
      if (hd === 'thu_claude') bao('Claude trả lời: ' + r.tra_loi)
      if (hd === 'thu_fb') bao('Đã kết nối Fanpage ' + r.ten + (r.doi_ma ? ' (đã đổi sang mã Fanpage dài hạn)' : ''))
      if (hd === 'thu_tg') bao('Đã gửi tin thử về Telegram')
      await reload(true)
    } catch (e) { bao(ten + ': ' + e.message, 'loi') } finally { setDang('') }
  }
  return (
    <div className="soc-cd">
      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2><BrainCircuit size={18} />Bộ não · Claude</h2>{c.co_claude && <span className="tag ok-tag">Đã kết nối</span>}</div>
        <KhoaBiMat nhan="Khóa Claude API" co={c.co_claude} value={f.claude_khoa} onChange={(e) => dat('claude_khoa', e.target.value)} goiY="Tạo ở console.anthropic.com → API Keys. Khóa chỉ lưu trên máy chủ, không hiện lại." />
        <Chon nhan="Mô hình viết bài" ds={MODEL} giaTri={f.model} onChon={(v) => dat('model', v)} />
        <div><Btn co="sm" kieu="vien" icon={RefreshCw} loading={dang === 'thu_claude'} onClick={() => kiem('thu_claude', 'Claude')}>Lưu & kiểm tra</Btn></div>
      </div>

      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2><Newspaper size={18} />Fanpage</h2>{c.co_fb && <span className="tag ok-tag">{c.fb_trang_ten || 'Đã kết nối'}</span>}</div>
        <Field nhan="Page ID" inputMode="numeric" value={f.fb_trang_id} onChange={(e) => dat('fb_trang_id', e.target.value.replace(/\D/g, ''))} goiY="Trang Fanpage → Giới thiệu → Minh bạch về Trang → ID Trang" />
        <KhoaBiMat nhan="Mã truy cập (access token)" co={c.co_fb} value={f.fb_token} onChange={(e) => dat('fb_token', e.target.value)} />
        <details className="soc-hd">
          <summary>Cách lấy mã truy cập Fanpage dài hạn</summary>
          <ol>
            <li>Vào developers.facebook.com → tạo ứng dụng (loại Doanh nghiệp), thêm trường hợp sử dụng "Quản lý mọi thứ trên Trang".</li>
            <li>Mở Graph API Explorer, chọn ứng dụng đó, chọn quyền <b>pages_show_list, pages_read_engagement, pages_manage_posts, pages_manage_engagement</b> → Generate Access Token.</li>
            <li>Mở Access Token Debugger, dán mã vừa tạo → bấm <b>Extend Access Token</b> (gia hạn 60 ngày) → chép mã mới.</li>
            <li>Dán vào ô trên, bấm "Lưu & kiểm tra": Sóc tự đổi sang mã Fanpage không hết hạn.</li>
          </ol>
        </details>
        <div><Btn co="sm" kieu="vien" icon={RefreshCw} loading={dang === 'thu_fb'} onClick={() => kiem('thu_fb', 'Fanpage')}>Lưu & kiểm tra</Btn></div>
      </div>

      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2><Send size={18} />Telegram</h2>{c.co_tg && <span className="tag ok-tag">Đã kết nối</span>}</div>
        <KhoaBiMat nhan="Bot token" co={c.co_tg_token} value={f.tg_token} onChange={(e) => dat('tg_token', e.target.value)} goiY="Nhắn @BotFather trên Telegram → /newbot → đặt tên → nhận token." />
        <Field nhan="Chat ID (để trống để Sóc tự tìm)" value={f.tg_chat} onChange={(e) => dat('tg_chat', e.target.value.trim())} goiY='Mở bot vừa tạo, nhắn "/start" rồi bấm nút dưới.' />
        <div><Btn co="sm" kieu="vien" icon={Send} loading={dang === 'thu_tg'} onClick={() => kiem('thu_tg', 'Telegram')}>Lưu & gửi tin thử</Btn></div>
      </div>

      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2><CalendarClock size={18} />Lịch làm việc</h2></div>
        <div className="cot" style={{ gap: 8 }}>
          <span className="nhan-nho">Khung giờ đăng Fanpage · {f.gio_dang.length} bài/ngày</span>
          <Chips nhieu tick co="sm" ds={GIO_GOI_Y} giaTri={f.gio_dang} onChon={(v) => dat('gio_dang', [...v].sort())} />
        </div>
        <div className="luoi-form">
          <Chon nhan="Bình luận hội nhóm mỗi ngày" ds={[0, 2, 4, 6, 8, 10, 12].map((n) => ({ v: n, t: n ? n + ' bình luận' : 'Không soạn' }))} giaTri={f.binh_luan_ngay} onChon={(v) => dat('binh_luan_ngay', Number(v))} />
          <Chon nhan="Giờ gửi báo cáo Telegram" ds={['18:00', '19:30', '21:00', '21:30', '22:30'].map((v) => ({ v, t: v }))} giaTri={f.gio_bao_cao} onChon={(v) => dat('gio_bao_cao', v)} />
        </div>
        <Field nhan="ID Shopee Affiliate gắn vào link" inputMode="numeric" value={f.aff_id} onChange={(e) => dat('aff_id', e.target.value.replace(/\D/g, ''))} goiY="Link Sóc đăng mang ID này, kèm mã phụ soc-fanpage / soc-nhom để xem riêng trong báo cáo Shopee." />
      </div>

      <div className="card cot" style={{ gap: 12 }}>
        <div className="dau-the"><h2><Sparkles size={18} />Nội dung</h2></div>
        <div className="cot" style={{ gap: 8 }}>
          <span className="nhan-nho">Phong cách viết (Sóc xoay vòng)</span>
          <Chips nhieu tick co="sm" ds={Object.entries(PHONG_CACH).map(([v, t]) => ({ v, t }))} giaTri={f.phong_cach} onChon={(v) => dat('phong_cach', v)} />
        </div>
        <div className="cot" style={{ gap: 8 }}>
          <span className="nhan-nho">Danh mục sản phẩm (không chọn = tất cả)</span>
          <Chips nhieu tick co="sm" ds={['Mũ bảo hiểm', 'Nón vải']} giaTri={f.danh_muc} onChon={(v) => dat('danh_muc', v)} />
        </div>
        <TextArea nhan="Thông tin thương hiệu Sóc được dùng" rows={3} value={f.thuong_hieu} onChange={(e) => dat('thuong_hieu', e.target.value)} goiY="Chỉ ghi điều chắc chắn đúng. Sóc không được nói gì ngoài các thông tin này và dữ liệu sản phẩm." />
        <TextArea nhan="Yêu cầu thêm về giọng văn (không bắt buộc)" rows={2} value={f.giong_van} onChange={(e) => dat('giong_van', e.target.value)} placeholder="VD: xưng mình – bạn, trẻ trung, ít emoji" />
      </div>

      <div className="soc-luu"><Btn kieu="den" co="lg" icon={Save} loading={dang === 'luu'} onClick={() => luu(false)}>Lưu cài đặt</Btn></div>
    </div>
  )
}

function NhatKy({ ds }) {
  if (!ds.length) return <Empty icon={History} tieuDe="Chưa có hoạt động">Khi Sóc làm việc, mọi bước sẽ ghi lại ở đây.</Empty>
  return (
    <div className="card soc-nk">
      {ds.map((n) => {
        const l = LOAI_NK[n.loai] || { t: n.loai, mau: '#F1F0F4', chu: '#4A4452' }
        return (
          <div key={n.id} className="soc-nk-dong">
            <span className="tg">{fmtNgayGio(n.luc)}</span>
            <span className="tag" style={{ background: l.mau, color: l.chu }}>{l.t}</span>
            <span className="nd">{n.noi_dung}{(n.token_vao || n.token_ra) ? <small> · token {soVN(n.token_vao)} vào / {soVN(n.token_ra)} ra</small> : null}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Soc() {
  const bao = useToast()
  const xacNhan = useXacNhan()
  const { data: d, loading, error, reload } = useAsync(() => rpc('fn_qt_soc'), [])
  const [tab, setTab] = useState('lich')
  const [dang, setDang] = useState('')
  useEffect(() => { const h = setInterval(() => reload(true), 60000); return () => clearInterval(h) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (loading && !d) return <KhungTai dong={5} />
  if (error && !d) return <LoiTai loi={error} thuLai={reload} />
  const c = d.cai_dat
  const doi = async () => {
    const bat = !c.bat
    if (bat && (!c.co_claude || !c.aff_id)) { bao('Cần kết nối Claude và có ID Shopee Affiliate trước khi cho Sóc làm việc', 'loi'); setTab('cai_dat'); return }
    if (bat && !(await xacNhan({ tieuDe: 'Cho Sóc bắt đầu làm việc?', moTa: c.co_fb ? `Sóc sẽ tự viết và tự đăng ${c.gio_dang.length} bài/ngày lên ${c.fb_trang_ten || 'Fanpage'}, không cần duyệt.` : 'Chưa kết nối Fanpage: Sóc chỉ soạn bình luận hội nhóm' + (c.co_tg ? ' và gửi về Telegram.' : '.'), nut: 'Bắt đầu' }))) return
    setDang('doi')
    try { await rpc('fn_qt_soc_luu', { p: { bat } }); await reload(true); bao(bat ? 'Sóc bắt đầu làm việc, ca đầu tiên trong vòng 10 phút' : 'Sóc đã nghỉ') } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const vietNgay = async () => {
    setDang('viet')
    try {
      const r = await goiSoc('viet_ngay')
      bao(`Sóc vừa viết cho ${r.san_pham}: ${r.fanpage ? '1 bài Fanpage, ' : ''}${r.nhom} bình luận nhóm`)
      await reload(true); setTab(r.fanpage ? 'lich' : 'nhom')
    } catch (e) { bao(e.message, 'loi') } finally { setDang('') }
  }
  const h = d.hom_nay
  const tabs = [
    { v: 'lich', t: 'Lịch đăng', icon: CalendarClock, dem: d.lich.length },
    { v: 'da_dang', t: 'Đã đăng', icon: Newspaper },
    { v: 'nhom', t: 'Bình luận nhóm', icon: MessagesSquare, dem: d.nhom.filter((x) => x.trang_thai !== 'da_dan').length },
    { v: 'nhat_ky', t: 'Nhật ký', icon: History },
    { v: 'cai_dat', t: 'Cài đặt', icon: Settings2 }
  ]
  return (
    <>
      <DauSoc d={d} onDoi={doi} dangDoi={dang === 'doi'} onViet={vietNgay} dangViet={dang === 'viet'} />
      <div className="kpis">
        <div className="kpi xanh"><span className="nhan">Đã đăng hôm nay</span><span className="so-lon">{h.da_dang}</span><span className="ghi">{d.thang.da_dang} bài trong tháng</span></div>
        <div className="kpi"><span className="nhan">Đang xếp lịch</span><span className="so-lon">{h.cho_dang}</span><span className="ghi">{c.gio_dang.join(' · ')}</span></div>
        <div className="kpi vang"><span className="nhan">Bình luận nhóm</span><span className="so-lon">{h.binh_luan}</span><span className="ghi">hôm nay · mục tiêu {c.binh_luan_ngay}</span></div>
        <div className={'kpi' + (h.loi ? ' do' : '')}><span className="nhan">Token hôm nay</span><span className="so-lon nho-hon">{soVN(h.token_vao + h.token_ra)}</span><span className="ghi">{h.loi ? <b className="soc-loi-ghi">{h.loi} lỗi 24 giờ · </b> : null}tháng {soVN(d.thang.token_vao + d.thang.token_ra)}</span></div>
      </div>
      <div className="soc-tab"><Segment trang giaTri={tab} onChon={setTab} ds={tabs} /></div>
      {tab === 'lich' && (d.lich.length === 0
        ? <Empty icon={CalendarClock} tieuDe="Chưa có bài trong lịch">{c.co_fb ? (c.bat ? 'Sóc sẽ tự viết cho các khung giờ sắp tới trong ca kế tiếp.' : 'Bật Sóc để Sóc tự viết và xếp lịch.') : 'Kết nối Fanpage ở tab Cài đặt để Sóc tự đăng bài.'}</Empty>
        : <div className="soc-ds">{d.lich.map((b) => <TheBai key={b.id} b={b} coFb={c.co_fb} onXong={() => reload(true)} />)}</div>)}
      {tab === 'da_dang' && (d.da_dang.length === 0
        ? <Empty icon={Newspaper} tieuDe="Chưa có bài nào được đăng">Bài Sóc đăng lên Fanpage sẽ hiện ở đây kèm link xem trên Facebook.</Empty>
        : <div className="soc-ds">{d.da_dang.map((b) => <TheBai key={b.id} b={b} coFb={c.co_fb} onXong={() => reload(true)} />)}</div>)}
      {tab === 'nhom' && (d.nhom.length === 0
        ? <Empty icon={MessageCircle} tieuDe="Chưa có bình luận soạn sẵn">Sóc soạn {c.binh_luan_ngay} bình luận/ngày cho hội nhóm{c.co_tg ? ' và gửi về Telegram' : ''}. Anh chép và dán vào bài hỏi mua nón, mũ phù hợp.</Empty>
        : <div className="soc-ds">{d.nhom.map((b) => <TheBinhLuan key={b.id} b={b} onXong={() => reload(true)} />)}</div>)}
      {tab === 'nhat_ky' && <NhatKy ds={d.nhat_ky} />}
      {tab === 'cai_dat' && <CaiDat c={c} reload={reload} />}
      <p className="soc-chu"><Bot size={14} />Sóc chỉ dùng giá niêm yết thật, không bịa khuyến mãi; bài vi phạm sẽ tự bị hủy và viết lại.</p>
    </>
  )
}
