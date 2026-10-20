# Chính sách dữ liệu và AI — EDUVERSE
*Bản nháp v1.0 — Cần người phụ trách pháp lý kiểm tra trước khi áp dụng*

## 1. Dữ liệu thu thập

EDUVERSE thu thập dữ liệu tối thiểu cần thiết để vận hành nền tảng học tập:

| Loại dữ liệu | Thu thập | Mục đích |
|---------------|----------|----------|
| Email (qua Google OAuth) | ✅ | Đăng nhập, xác thực |
| Tên hiển thị | ✅ | Hiển thị trong ứng dụng |
| Bài làm, điểm số | ✅ | Đánh giá học tập |
| XP, huy hiệu, tiến độ | ✅ | Gamification học tập |
| Hội thoại với AI | ✅ | Hỗ trợ học tập |
| Họ tên thật, lớp, trường | ❌ | Không thu thập |
| Số điện thoại, địa chỉ | ❌ | Không thu thập |
| Ảnh, video học sinh | ❌ | Không thu thập |

## 2. AI trong EDUVERSE

### AI làm gì
- **Gợi ý** cách giải bài (KHÔNG đưa đáp án trực tiếp)
- **Ôn tập** kiến thức KHTN lớp 6-9
- **Trò chuyện** thân thiện qua nhân vật Vina
- **Hỗ trợ giáo viên** soạn câu hỏi nháp (GV duyệt trước khi dùng)

### AI KHÔNG làm
- ❌ Chấm điểm cuối cùng (giáo viên quyết định)
- ❌ Gắn nhãn hoặc xếp loại học sinh
- ❌ Làm bài hộ học sinh
- ❌ Thu thập hoặc lưu thông tin cá nhân
- ❌ Chat tự do giữa các học sinh

### Biện pháp an toàn AI
- Lọc tin nhắn đầu vào (giới hạn 500 ký tự, chặn injection)
- Phát hiện từ khóa khẩn cấp (tự hại, bạo lực) → hiện số hotline 111
- Lọc thông tin cá nhân trong câu trả lời
- Giới hạn 30 lượt/ngày/học sinh
- Giáo viên có thể bật/tắt AI theo phòng học
- Giáo viên xem được tin nhắn bị gắn cờ

### Nhà cung cấp AI
- Google Gemini (Gemini 3.8 Flash)
- Dữ liệu gửi đến Gemini: chỉ nội dung câu hỏi học sinh (đã loại bỏ PII)
- KHÔNG gửi: họ tên, lớp, trường, email

## 3. Lưu trữ và bảo mật

- Dữ liệu lưu trên **Supabase** (máy chủ Singapore)
- Mã hóa khi truyền (HTTPS/TLS) và khi lưu (AES-256)
- Row Level Security (RLS): học sinh chỉ xem dữ liệu của mình
- Khóa API chỉ ở phía server, không lộ ra client
- Security headers: CSP, X-Frame-Options, nosniff

## 4. Quyền của phụ huynh

- Xem tiến trình học tập, điểm số, huy hiệu của con em
- Yêu cầu xóa tài khoản và dữ liệu của con em
- Liên hệ giáo viên để tắt AI cho con em

## 5. Liên hệ

Mọi thắc mắc về dữ liệu và quyền riêng tư, vui lòng liên hệ nhà trường hoặc giáo viên phụ trách.

---

# Mẫu phiếu đồng ý của phụ huynh
*Bản nháp — điều chỉnh theo quy định của trường/sở*

## PHIẾU ĐỒNG Ý SỬ DỤNG NỀN TẢNG HỌC TẬP EDUVERSE

**Kính gửi Quý phụ huynh,**

Trường _________________ triển khai nền tảng học tập EDUVERSE hỗ trợ môn Khoa học Tự nhiên. Xin phụ huynh đọc kỹ và cho ý kiến:

### Nền tảng sẽ:
- ✅ Hỗ trợ con em học KHTN qua trò chơi và bài tập tương tác
- ✅ Sử dụng AI để gợi ý cách giải (KHÔNG đưa đáp án)
- ✅ Thu thập: email đăng nhập, bài làm, điểm số, tiến độ
- ✅ Cho phụ huynh xem tiến trình con em

### Nền tảng KHÔNG:
- ❌ Thu thập họ tên thật, số điện thoại, địa chỉ, ảnh
- ❌ Cho học sinh chat tự do với nhau
- ❌ Để AI chấm điểm cuối cùng
- ❌ Chia sẻ dữ liệu cho bên thứ ba ngoài mục đích học tập

### Phụ huynh có quyền:
- Yêu cầu xem hoặc xóa dữ liệu con em bất cứ lúc nào
- Yêu cầu tắt tính năng AI cho con em
- Rút đồng ý bất cứ lúc nào

---

☐ **Tôi đồng ý** cho con em _________________ sử dụng EDUVERSE

☐ **Tôi không đồng ý**

Họ tên phụ huynh: _________________

Chữ ký: _________________ Ngày: ___/___/______

---

## Thông báo cho học sinh về AI

> **Trên EDUVERSE, em sẽ gặp Vina — bạn đồng hành AI.**
>
> Vina có thể giúp em hiểu bài và ôn tập, nhưng em cần nhớ:
> - 🤖 Vina là AI, không phải người thật
> - 💡 Vina gợi ý cách làm, không cho đáp án
> - ⚠️ AI có thể sai — hãy kiểm tra với thầy cô
> - 🔒 Không chia sẻ thông tin cá nhân (SĐT, địa chỉ, ảnh)
> - 😊 Nếu em gặp khó khăn, hãy nói chuyện với thầy cô hoặc gọi 111
