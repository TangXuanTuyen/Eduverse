# EDUVERSE — hướng dẫn cho Claude

Nền tảng học KHTN lớp 6-9 dạng thành phố pixel-art. Giao diện gốc từ Google AI Studio (Vite) nằm ở `_ui-goc/` — **chỉ để đối chiếu, không sửa, không commit**. Kế hoạch tổng: `docs/KE-HOACH-BUOC-0.md`.

## Chạy dự án

Node 24 LTS cài tại `~/.local/node` (không có trong PATH mặc định):

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm run dev        # http://localhost:3000 (preview trong app: cấu hình "eduverse-dev", dùng --webpack)
npm test           # Vitest, tests/unit
npm run typecheck
npm run build
```

## Cấu trúc

- `app/student/(city)/layout.tsx` — bản đồ luôn ở dưới; mỗi địa điểm là route con (`library`, `arcade`, `review`, `stem`, `assignments`, `achievements`) hiển thị hộp thoại phía trên. URL ↔ địa điểm: `lib/student-routes.ts`.
- `components/student/` — `StudentGameProvider` (trạng thái game, **tạm** localStorage), `CityShell`, `BuildingRoute`.
- `components/{city,character,learning}/` — component từ UI gốc, giữ nguyên style. `components/ui/` — `DialogFrame` (mọi hộp thoại phải dùng), `AnswerMark`.
- `game/engine/` — va chạm, tìm đường, dữ liệu bản đồ, tiến độ. Engine bản đồ là Canvas 2D tự viết (đã quyết định không chuyển sang Phaser).

## Quyết định đã duyệt (Bước 0, Q1–Q9)

1. Giữ engine Canvas cho bản đồ; Phaser chỉ cho mini-game sau này, tải lười.
2. Tên dự án EDUVERSE; email nội bộ học sinh `mahs@hs.eduverse.local`.
3. Phụ huynh: MVP chỉ đăng nhập email.
4. Bỏ EduPoints; chỉ XP + huy hiệu; trang phục mở theo cột mốc học tập.
5. 5 mục điều hướng học sinh: Bản đồ · Bài giao · Sửa lỗi · Thành tích · Cài đặt.
6. shadcn/ui chỉ cho khu giáo viên/quản trị.
7. Thiết kế nhiều trường: `school_id` ở mọi bảng.
8. Arcade mặc định không tính giờ; chế độ "Thử thách" mới có đồng hồ.
9. Nhân vật áo dài vẽ bằng code, cùng phong cách `PixelAvatar`.

## Quy tắc bất biến (tóm tắt — không được vi phạm)

1. Chấm điểm, cộng XP, kiểm tra quyền chỉ ở server. Không tin điểm/XP/kết quả mô phỏng/vai trò từ client.
2. RLS bật cho mọi bảng; đáp án ở bảng riêng `question_answers`. Bảng mới phải có policy + test truy cập trái phép.
3. `service_role` và khóa AI chỉ ở server, không `NEXT_PUBLIC_`, không lên GitHub.
4. `security definer` phải `set search_path = ''`, chỉ grant đúng vai trò; không đặt tên hàm trùng từ khóa SQL.
5. Học sinh không sửa được `score`, `graded_by`, `graded_at`, `teacher_feedback`, XP.
6. XP ghi qua server với `idempotency_key` ổn định, có giới hạn XP/ngày.
7. Join code 6-8 ký tự (bỏ O/0/I/1), có hạn, giới hạn thử; tham gia lớp chỉ qua RPC/endpoint.
8. Không thu email/SĐT/địa chỉ/ảnh học sinh; không gửi họ tên/lớp/trường cho AI.
9. Không chat tự do giữa học sinh — chỉ biểu cảm/câu chọn sẵn trong lớp.
10. Không bảng xếp hạng công khai, hộp quà ngẫu nhiên, "mất chuỗi ngày". XP thưởng hành vi học tốt, không thưởng số lượng.
11. AI không chấm điểm cuối, không gắn nhãn học sinh, không làm bài hộ.
12. Tính năng nặng phải tải lười, có dự phòng cho máy/mạng yếu.

Vai trò: admin, school_admin, teacher, student, parent — chỉ quản trị cấp, không đọc vai trò từ metadata người dùng sửa được.

## Cách làm việc

- Làm đúng phạm vi bước được giao. Đọc mã trước, nêu kế hoạch + giả định; hỏi khi mơ hồ ảnh hưởng kiến trúc/bảo mật.
- Migration mới trong `supabase/migrations/`, không sửa migration đã chạy.
- Tiếng Việt toàn bộ UI, giọng ngắn gọn, khích lệ. Vùng chạm ≥ 44 px, không chỉ dùng màu, tôn trọng `prefers-reduced-motion`.
- Nội dung khoa học mẫu: không bịa; đánh dấu cần giáo viên kiểm tra.
- Mỗi bước kết thúc bằng: (a) file tạo/sửa, (b) cách chạy/kiểm tra, (c) điểm chưa làm/rủi ro, (d) đối chiếu tiêu chí nghiệm thu.
