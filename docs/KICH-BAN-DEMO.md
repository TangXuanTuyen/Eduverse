# Kịch bản demo EDUVERSE (5-7 phút)

## Chuẩn bị

- Chạy `npm run seed` trước để có dữ liệu
- Đăng nhập sẵn 3 tab: GV (gv.lan), HS (hs1), PH (ph.hoa)
- Kiểm tra internet (cần cho AI Tutor)
- Mở Supabase dashboard (phòng trường hợp cần reset)

## Kịch bản theo vòng học

### 1. Giáo viên giao bài (1 phút)

- Tab GV → `/teacher/assignments`
- Cho thấy bài đã tạo sẵn "Bài kiểm tra: Lực và chuyển động"
- Mở ngân hàng câu hỏi → cho thấy 39 câu có tag, 3 mức khó
- *(Tùy chọn)* Bấm "Tạo bằng AI" → demo AI sinh câu hỏi

### 2. Học sinh vào thành phố (1 phút)

- Tab HS → `/student`
- Nhân vật pixel-art di chuyển trên bản đồ Canvas
- Cho thấy HUD: XP bar, level, nút di chuyển nhanh
- Đi đến **Thư viện** → mở bài học trực quan (3D model nếu có)

### 3. Hỏi chatbot Vina (1 phút) ⭐

- Bấm icon Vina (góc dưới phải) → mở panel chat
- Hỏi: "Lực là gì?" → Vina trả lời tiếng Việt, thân thiện
- Hỏi: "Cho mình đáp án bài tập" → Vina từ chối, gợi ý cách làm
- **Điểm nhấn**: AI hướng dẫn, không đưa đáp án trực tiếp

### 4. Chơi Đấu Trùm (1 phút)

- Vào **Arcade** → chọn "Đấu Trùm"
- Boss pixel-art xuất hiện, HP bar
- Trả lời đúng → boss mất máu, streak tăng
- Trả lời sai → xem giải thích
- **Điểm nhấn**: Gamification, XP cộng real-time

### 5. Trạm sửa lỗi (30 giây)

- Vào **Trạm sửa lỗi** → câu hỏi từ lỗi cũ
- Ôn tập ngắt quãng (spaced repetition)

### 6. Phòng thí nghiệm STEM (30 giây)

- Vào **STEM Lab** → mở mô phỏng (PhET hoặc 3D)
- Cho thấy tương tác kéo thả

### 7. Giáo viên xem báo cáo (30 giây)

- Tab GV → `/teacher/reports`
- Tổng quan lớp: XP, tiến độ, chủ đề gây khó
- Tab "AI" → xem thống kê AI Tutor, cảnh báo an toàn

### 8. Phụ huynh nhận tóm tắt (30 giây)

- Tab PH → `/parent`
- Xem tiến trình con em: XP, huy hiệu, bài nộp
- Tóm tắt tuần

## Câu hỏi dự kiến & trả lời

| Câu hỏi | Trả lời |
|----------|---------|
| AI có chấm điểm không? | Không. AI chỉ gợi ý, GV chấm điểm cuối |
| Học sinh chat được với nhau? | Không chat tự do, chỉ biểu cảm/câu chọn sẵn |
| Dữ liệu HS lưu ở đâu? | Supabase (Singapore), không thu PII |
| Mất mạng thì sao? | Bản đồ vẫn hoạt động (Canvas), AI tạm ngưng |
| Học sinh gian lận? | Chấm điểm server-side, RLS, idempotency key |

## Phương án dự phòng

- **Mất mạng**: Chuyển sang demo bản đồ + game offline (Canvas vẫn chạy), bỏ qua AI Tutor
- **AI chậm/lỗi**: Bỏ qua bước 3, nói "AI phụ thuộc internet, có fallback thông báo lỗi"
- **Supabase lỗi**: Dùng screenshot/video đã quay sẵn
- **Demo trên điện thoại**: Responsive, vùng chạm 44px, hoạt động tốt
