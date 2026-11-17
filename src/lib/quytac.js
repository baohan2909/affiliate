// Quy tắc cộng đồng Affiliate Nón Sơn — bản gốc dùng khi chưa tải được cấu hình (nội dung chính thức lưu ở cấu hình "quy_tac", quản trị sửa được).
// Giữ nguyên câu chữ. Đổi nội dung thì tăng phien_ban để mọi thành viên xác nhận lại.
export const QUY_TAC_GOC = {
  "phien_ban": 1,
  "ngay": "2026-11-17",
  "tieu_de": "QUY TẮC CỘNG ĐỒNG AFFILIATE NÓN SƠN",
  "khau_hieu": "Tự do sáng tạo – Minh bạch – Trách nhiệm – Cùng phát triển",
  "muc": [
    {
      "t": "Sản phẩm và nội dung phải đồng nhất",
      "d": "Video, hình ảnh và liên kết mua hàng phải thể hiện đúng sản phẩm được giới thiệu. Không sử dụng sản phẩm thương hiệu khác, hàng giả hoặc hàng nhái để gắn liên kết Nón Sơn và ngược lại."
    },
    {
      "t": "Tôn trọng thương hiệu",
      "d": "Nhà sáng tạo được tự do tiếp thị liên kết các ngành hàng khác. Tuy nhiên, khi đã tham gia quảng bá sản phẩm Nón Sơn, Nhà sáng tạo không đồng thời quảng bá, giới thiệu hoặc gắn liên kết bán các sản phẩm mũ nón của thương hiệu khác trong suốt thời gian hợp tác với Nón Sơn."
    },
    {
      "t": "Sử dụng đúng hình ảnh và tài nguyên",
      "d": "Không sử dụng logo, hình ảnh, video Nón Sơn để quảng bá sản phẩm khác, giả mạo thương hiệu hoặc sử dụng ngoài phạm vi được cho phép."
    },
    {
      "t": "Quảng bá trung thực",
      "d": "Thông tin sản phẩm, chất lượng, giá bán và chương trình ưu đãi phải chính xác. Không quảng cáo sai sự thật, gây hiểu nhầm hoặc đưa ra cam kết chưa được Nón Sơn xác nhận."
    },
    {
      "t": "Cạnh tranh lành mạnh",
      "d": "Không gian lận đơn hàng, hoa hồng, lượt tương tác; không sao chép nội dung trái phép, mạo danh hoặc thực hiện hành vi ảnh hưởng đến quyền lợi khách hàng và các Nhà sáng tạo khác."
    },
    {
      "t": "Tuân thủ quy định cộng đồng",
      "d": "Tôn trọng các thành viên, bảo mật thông tin và tuân thủ quy định của Nón Sơn, Shopee cùng pháp luật hiện hành. Hoạt động quay chụp tại cửa hàng cần được Nón Sơn chấp thuận trước."
    },
    {
      "t": "Nguyên tắc xử lý vi phạm",
      "d": "Nón Sơn có quyền chủ động ban hành, điều chỉnh quy định và áp dụng các biện pháp quản lý phù hợp, từ nhắc nhở, yêu cầu khắc phục đến tạm dừng hoặc chấm dứt hợp tác tùy mức độ vi phạm. Trường hợp nghiêm trọng, Nón Sơn sẽ phối hợp với Shopee để đề nghị xử lý nội dung, liên kết sản phẩm hoặc tài khoản theo quy định nền tảng. Các thay đổi về quy định sẽ được thông báo đến thành viên."
    },
    {
      "t": "Trách nhiệm pháp lý của Nhà sáng tạo",
      "d": "Nhà sáng tạo tự chịu trách nhiệm trước pháp luật về nội dung, hình ảnh, phát ngôn và các hoạt động do mình thực hiện; đồng thời chịu trách nhiệm đối với hành vi vi phạm và thiệt hại phát sinh do lỗi của mình. Nón Sơn không chịu trách nhiệm thay cho những hành vi tự ý, ngoài phạm vi ủy quyền của Nhà sáng tạo, trừ trường hợp pháp luật có quy định khác."
    }
  ],
  "ket": "Nón Sơn trân trọng sự sáng tạo của mỗi thành viên và mong muốn xây dựng một cộng đồng Affiliate minh bạch, chuyên nghiệp, cùng phát triển bền vững."
}

export const layQuyTac = (ck) => (ck?.quy_tac?.muc?.length ? ck.quy_tac : QUY_TAC_GOC)
export const phienBanQT = (ck) => Number(layQuyTac(ck).phien_ban) || 1
// Thành viên cần xác nhận khi chưa đồng ý phiên bản hiện hành
export const canDongYQT = (tv, ck) => !!tv && !!ck && Number(tv.quy_tac_phien_ban || 0) < phienBanQT(ck)
