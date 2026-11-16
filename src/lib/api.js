// Lớp truy cập dữ liệu duy nhất của ứng dụng
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY, MIEN_NHAN_SU, MIEN_CUA_HANG } from '../config'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ns-aff-auth' }
})

export class LoiApi extends Error {}

export function thongDiep(e) {
  const m = (e && (e.message || e.error_description || e.loi || e.error || String(e))) || 'Có lỗi xảy ra'
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Mất kết nối mạng. Kiểm tra Internet và thử lại.'
  if (/JWT expired|invalid JWT/i.test(m)) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'
  if (/Invalid login credentials/i.test(m)) return 'Thông tin đăng nhập chưa đúng.'
  if (/Email not confirmed/i.test(m)) return 'Tài khoản chưa được kích hoạt.'
  if (/permission denied/i.test(m)) return 'Bạn không có quyền thực hiện thao tác này.'
  if (/duplicate key/i.test(m)) return 'Dữ liệu bị trùng, vui lòng kiểm tra lại.'
  if (/Password should be|weak/i.test(m)) return 'Mật khẩu quá yếu (tối thiểu 8 ký tự, nên có chữ và số).'
  if (/rate limit/i.test(m)) return 'Bạn thao tác quá nhanh, vui lòng đợi một chút.'
  return m
}
const boc = (e) => new LoiApi(thongDiep(e))

export async function rpc(ten, thamSo) {
  const { data, error } = await sb.rpc(ten, thamSo || {})
  if (error) throw boc(error)
  return data
}

// Edge Function "tai-khoan" (đăng ký, đặt lại mật khẩu, tạo tài khoản nhân sự/cửa hàng)
export async function taiKhoan(hanhDong, duLieu = {}) {
  const { data: { session } } = await sb.auth.getSession()
  let res
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/tai-khoan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (session?.access_token || SUPABASE_KEY) },
      body: JSON.stringify({ hanh_dong: hanhDong, ...duLieu })
    })
  } catch (e) { throw boc(e) }
  const kq = await res.json().catch(() => ({}))
  if (!res.ok || kq.loi) throw new LoiApi(kq.loi || 'Hệ thống đang bận, vui lòng thử lại.')
  return kq
}

// ---------- Đăng nhập ----------
export const emailNhanSu = (ma) => String(ma || '').trim().toLowerCase() + '@' + MIEN_NHAN_SU
export const emailCuaHang = (ma) => String(ma || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') + '@' + MIEN_CUA_HANG

export async function dangNhap(email, matKhau) {
  const { data, error } = await sb.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: matKhau })
  if (error) throw boc(error)
  return data.session
}
export async function dangXuat() { await sb.auth.signOut() }
export async function doiMatKhau(matKhau) {
  const { error } = await sb.auth.updateUser({ password: matKhau })
  if (error) throw boc(error)
}

// ---------- Kho tệp ----------
export const urlCongKhai = (path) => (!path ? null : /^https?:\/\//.test(path) ? path : `${SUPABASE_URL}/storage/v1/object/public/cong-khai/${path}`)

function tenTep(file) {
  const duoi = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${duoi}`
}

// Nén ảnh lớn trước khi tải lên (giữ tỉ lệ, cạnh dài tối đa 1600px)
async function nenAnh(file, max = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file
  try {
    const bmp = await createImageBitmap(file)
    const tl = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * tl); c.height = Math.round(bmp.height * tl)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/webp', 0.86))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file
  } catch { return file }
}

export async function taiAnhLen(file) {
  const f = await nenAnh(file)
  const path = tenTep(f)
  const { error } = await sb.storage.from('cong-khai').upload(path, f, { contentType: f.type, upsert: false })
  if (error) throw boc(error)
  return urlCongKhai(path)
}

export async function taiTepRieng(file, onTienDo) {
  const path = tenTep(file)
  onTienDo && onTienDo(5)
  const { error } = await sb.storage.from('tai-nguyen').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) throw boc(error)
  onTienDo && onTienDo(100)
  return path
}

export async function xoaTepRieng(path) { if (path) await sb.storage.from('tai-nguyen').remove([path]) }

export async function linkTai(path, tenTai) {
  const { data, error } = await sb.storage.from('tai-nguyen').createSignedUrl(path, 600, tenTai ? { download: tenTai } : undefined)
  if (error) throw boc(error)
  return data.signedUrl
}
