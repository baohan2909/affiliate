// Bảng nhãn & màu dùng chung (trạng thái luôn kèm chữ, không chỉ dựa vào màu)
const T = (ten, bg, fg) => ({ ten, bg, fg })

export const TT_LICH = {
  cho_xac_nhan: T('Chờ xác nhận', '#FDF3E3', '#8A5410'),
  da_xac_nhan: T('Đã xác nhận', '#E3F5EE', '#0E7F63'),
  de_xuat_doi: T('Đề xuất đổi lịch', '#EAF0FD', '#2E5BC9'),
  hoan_thanh: T('Đã hoàn thành', '#EFECF2', '#4A4452'),
  da_huy: T('Đã hủy', '#FDECEC', '#B93838')
}
export const NHU_CAU = { video: 'Quay video', anh: 'Chụp ảnh', ca_hai: 'Quay video + chụp ảnh' }

export const GIAI_DOAN = {
  sap_dien_ra: T('Sắp diễn ra', '#EAF0FD', '#2E5BC9'),
  dang_dien_ra: T('Đang diễn ra', '#E3F5EE', '#0E7F63'),
  da_ket_thuc: T('Đã kết thúc', '#EFECF2', '#6B6472')
}
export const TT_CD = {
  nhap: T('Nháp', '#EFECF2', '#6B6472'),
  cong_bo: T('Đã công bố', '#E3F5EE', '#0E7F63'),
  an: T('Đã ẩn', '#FDECEC', '#B93838')
}
export const TT_DANG_KY = {
  cho_duyet: T('Chờ duyệt', '#FDF3E3', '#8A5410'),
  da_tham_gia: T('Đã tham gia', '#E3F5EE', '#0E7F63'),
  tu_choi: T('Chưa phù hợp', '#FDECEC', '#B93838'),
  da_rut: T('Đã rút', '#EFECF2', '#6B6472')
}
export const TT_BAI = {
  cho_duyet: T('Chờ duyệt', '#FDF3E3', '#8A5410'),
  dat: T('Đạt', '#E3F5EE', '#0E7F63'),
  can_sua: T('Cần sửa', '#EAF0FD', '#2E5BC9'),
  khong_dat: T('Chưa đạt', '#FDECEC', '#B93838')
}
export const TT_HO_TRO = {
  moi: T('Mới', '#FDE6F1', '#A3004F'),
  dang_xu_ly: T('Đang xử lý', '#FDF3E3', '#8A5410'),
  da_tra_loi: T('Đã trả lời', '#E3F5EE', '#0E7F63'),
  da_dong: T('Đã đóng', '#EFECF2', '#6B6472')
}
export const TT_THU = {
  cho: T('Chờ gửi', '#FDF3E3', '#8A5410'),
  dang_gui: T('Đang gửi', '#EAF0FD', '#2E5BC9'),
  da_gui: T('Đã gửi', '#E3F5EE', '#0E7F63'),
  loi: T('Lỗi', '#FDECEC', '#B93838'),
  huy: T('Đã hủy', '#EFECF2', '#6B6472')
}

export const NHAN_TOP = {
  ban_chay: { ten: 'Top bán chạy', ngan: 'Bán chạy' },
  tang_truong: { ten: 'Đang tăng trưởng', ngan: 'Tăng trưởng' },
  de_xuat: { ten: 'Đề xuất quảng bá', ngan: 'Đề xuất' }
}

export const LOAI_UU_DAI = {
  chien_dich: 'Quyền vào chiến dịch đặc biệt',
  uu_tien_lich: 'Ưu tiên đặt lịch quay chụp',
  hoa_hong: 'Chính sách hoa hồng riêng',
  tai_nguyen: 'Tài nguyên độc quyền',
  qua_tang: 'Quà tặng / mẫu sản phẩm',
  khac: 'Quyền lợi khác'
}

export const LOAI_TN = {
  huong_dan: 'Hướng dẫn', anh: 'Hình ảnh', video: 'Video', tai_lieu: 'Tài liệu', quy_dinh: 'Quy định', lien_ket: 'Liên kết'
}

export const NEN_TANG = {
  tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram', shopee_video: 'Shopee Video',
  shopee: 'Shopee', threads: 'Threads', khac: 'Khác'
}

export const LOAI_HO_TRO = {
  tai_khoan: 'Tài khoản', san_pham: 'Sản phẩm', chien_dich: 'Chiến dịch', lich_quay: 'Lịch quay chụp', cua_hang: 'Phản ánh khi đến cửa hàng', khac: 'Khác'
}

export const VAI_TRO = { quan_tri: 'Quản trị cấp cao', phu_trach: 'Phụ trách Affiliate', cua_hang: 'Cửa hàng' }
export const KINH_NGHIEM = { moi: 'Người mới bắt đầu', co_kinh_nghiem: 'Đã có kinh nghiệm' }

export const LOAI_TB = {
  he_thong: 'Hệ thống', chien_dich: 'Chiến dịch', uu_dai: 'Ưu đãi', lich: 'Lịch quay', tin: 'Tin cộng đồng', ho_tro: 'Hỗ trợ', bai_nop: 'Bài nộp'
}

export const KIEU_DOI_TUONG = {
  tat_ca: 'Tất cả thành viên', nhom: 'Nhóm', cap_do: 'Cấp độ', kinh_nghiem: 'Kinh nghiệm', thanh_vien: 'Thành viên cụ thể'
}
