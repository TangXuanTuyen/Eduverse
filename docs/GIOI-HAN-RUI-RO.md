# Giới hạn đã biết và rủi ro

## Bắt buộc sửa trước khi cho học sinh thật dùng

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| 1 | **Backup dữ liệu** | Cao | Supabase free tier không có backup tự động. Cần script xuất dữ liệu định kỳ hoặc nâng lên Pro ($25/tháng) |
| 2 | **Đăng nhập bằng mã HS** | Cao | Hiện chỉ có Google OAuth. Nhiều HS tiểu học không có email Google. Cần thêm luồng đăng nhập mã HS như thiết kế ban đầu |
| 3 | **Kiểm duyệt nội dung AI** | Trung bình | Crisis detection dựa trên từ khóa, có thể bỏ sót. Cần GV theo dõi dashboard AI review thường xuyên |
| 4 | **Phiếu đồng ý phụ huynh** | Cao | Bản nháp cần pháp lý kiểm tra, phù hợp quy định trường/sở |
| 5 | **Rate limiting đăng nhập** | Trung bình | Google OAuth tự giới hạn, nhưng nếu thêm mã HS cần rate limit riêng |
| 6 | **Supabase hibernation** | Thấp | Project free tier ngủ sau 7 ngày không dùng. Cần script đánh thức trước demo/buổi học |

## Có thể để sau

| # | Vấn đề | Ghi chú |
|---|--------|---------|
| 1 | **i18n** | Chỉ tiếng Việt. Chưa cần đa ngôn ngữ |
| 2 | **PWA / Offline** | Bản đồ Canvas hoạt động offline, nhưng API cần mạng |
| 3 | **Hiệu năng Canvas trên máy rất cũ** | Đã có list mode fallback, nhưng chưa test trên máy < 2GB RAM |
| 4 | **PhET iframe CSP** | Đã thêm `frame-src phet.colorado.edu` nhưng một số sim PhET có thể cần thêm domain |
| 5 | **Email thông báo** | Chưa gửi email cho PH. Hiện PH phải tự vào web xem |
| 6 | **Xuất báo cáo PDF** | GV chưa xuất được báo cáo dạng PDF/Excel |
| 7 | **Multi-tenant hoàn chỉnh** | Schema có `school_id` nhưng UI admin trường chưa có |
| 8 | **Test end-to-end** | Chưa có Playwright/Cypress tests |
| 9 | **Monitoring/alerting** | Chưa có APM (Sentry, Datadog). Chỉ có console.error |
| 10 | **Gemini quota** | Free tier có giới hạn RPM. Nếu nhiều HS dùng cùng lúc cần nâng quota hoặc queue |

## Kết quả kiểm thử hiện tại

- **TypeScript**: 0 lỗi
- **Unit tests**: 132/132 pass
  - RLS: 89 tests (mọi bảng, mọi vai trò)
  - Grading: 14 tests (6 loại câu hỏi)
  - XP: 6 tests
  - AI Safety: 12 tests
  - Auth: 11 tests
- **Build production**: Thành công
- **Seed**: Tái tạo được từ đầu bằng `npm run seed`
