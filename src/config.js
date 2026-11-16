// Kết nối Supabase. URL + khóa công khai (anon) được phép nằm ở trình duyệt:
// bảng dữ liệu bị khóa hoàn toàn, mọi đọc/ghi đi qua hàm máy chủ có kiểm quyền. KHÔNG BAO GIỜ đặt khóa service_role ở đây.
export const SUPABASE_URL = 'https://glcghclyauustsvgyuly.supabase.co'
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2doY2x5YXV1c3Rzdmd5dWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MDUyNTQsImV4cCI6MjExMDM4MTI1NH0.ZlZkoiwOvfyrVjKlOmLKvOFiXU96RQ0gTeoUyQt7vcU'
// Miền email nội bộ cho tài khoản nhân sự / cửa hàng (không gửi thư tới các miền này)
export const MIEN_NHAN_SU = 'nhansu.nsaffiliate.vn'
export const MIEN_CUA_HANG = 'cuahang.nsaffiliate.vn'
export const TEN_APP = 'NS Affiliate'
export const PHIEN_BAN = '1.0.0'
