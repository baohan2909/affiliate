# Nón Sơn · Affiliate Hub

Web app / PWA cho cộng đồng Affiliate của Nón Sơn (trước mắt là Shopee Affiliate).

| Cổng | Đường dẫn | Ai dùng |
|---|---|---|
| Thành viên | `/` | Người làm Affiliate: sản phẩm, chiến dịch, đặt lịch quay chụp, ưu đãi, tài nguyên, hỗ trợ |
| Quản trị | `/quantri` | Đội Affiliate Nón Sơn (đăng nhập bằng mã nhân viên) |
| Cửa hàng | `/cuahang` | Cửa hàng nhận thành viên đến quay chụp (đăng nhập bằng mã cửa hàng) |

## Công nghệ

- React 18 + Vite 5, react-router 6, lucide-react
- Supabase (khu vực Sydney): Auth, Postgres, Storage, Edge Function
- Triển khai GitHub Pages qua GitHub Actions (`.github/workflows/deploy.yml`)

## Bảo mật

- Trình duyệt chỉ giữ URL + khóa công khai (anon). Toàn bộ bảng dữ liệu bị khóa (RLS, không cấp quyền);
  mọi đọc/ghi đi qua hàm máy chủ có kiểm tra quyền.
- SQL, Edge Function và Apps Script được quản lý riêng, **không** nằm trong repo này.

## Chạy thử trên máy

```bash
npm install
npm run dev
```

## Đổi sang tên miền riêng

1. Trỏ tên miền (VD `affiliate.nonson.vn`) về GitHub Pages và khai báo trong Settings → Pages.
2. Sửa `VITE_BASE` trong workflow thành `/`.
3. Cập nhật “Địa chỉ ứng dụng” trong Quản trị → Hệ thống → Cấu hình.
