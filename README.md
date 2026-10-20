# EDUVERSE

Nền tảng học Khoa học Tự nhiên (KHTN) lớp 6-9 dạng thành phố pixel-art. Học sinh khám phá thành phố, vào các địa điểm để học bài, làm bài tập, chơi game ôn tập và nhận huy hiệu.

## Công nghệ

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL + RLS + Realtime)
- **AI**: Google Gemini 3.8 Flash (qua provider abstraction)
- **Engine bản đồ**: Canvas 2D tự viết
- **Deploy**: Vercel (auto-deploy từ GitHub)

## Cài đặt

```bash
# Node 24 LTS (nếu cài tại ~/.local/node)
export PATH="$HOME/.local/node/bin:$PATH"

# Clone & cài đặt
git clone https://github.com/TangXuanTuyen/Eduverse.git
cd Eduverse
npm install

# Tạo file biến môi trường
cp .env.example .env.local
# Sửa .env.local: thêm Supabase URL, anon key, service role key, Gemini API key
```

## Biến môi trường

| Biến | Mô tả | Bắt buộc |
|------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (công khai) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (chỉ server) | ✅ |
| `SUPABASE_DB_URL` | Database URL (cho migration) | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key (chỉ server) | Cho AI |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` và `GEMINI_API_KEY` KHÔNG BAO GIỜ có tiền tố `NEXT_PUBLIC_`.

## Chạy dự án

```bash
npm run dev          # http://localhost:3000
npm run build        # Build production
npm run typecheck    # Kiểm tra TypeScript
npm test             # Vitest unit tests (132 tests)
```

## Migration & Seed

```bash
npm run db:push      # Đẩy migration lên Supabase (cần SUPABASE_DB_URL)
npm run seed         # Tạo dữ liệu giả (2 GV, 10 HS, 39 câu hỏi, 3 bài giao...)
```

Seed tạo:
- 2 giáo viên, 2 phụ huynh, 10 học sinh
- Phòng "KHTN 6A1" với mã tham gia
- 39 câu hỏi KHTN lớp 6 (Lực và chuyển động) có đáp án + giải thích
- 3 bài giao, 6 huy hiệu, XP/stats cho 10 HS
- Xem `.seed-credentials.local.md` sau khi chạy

## Cấu trúc thư mục

```
app/
  (auth)/          # Đăng nhập, onboarding
  student/(city)/  # Khu vực học sinh (bản đồ thành phố)
    library/       # Thư viện học trực quan
    arcade/        # Arcade (Thử thách nhanh, Đấu trùm)
    review/        # Trạm sửa lỗi
    stem/          # Phòng thí nghiệm STEM
    assignments/   # Bài giao
    achievements/  # Thành tích
    tutor/         # AI Tutor (trang đầy đủ)
  teacher/         # Khu vực giáo viên
  parent/          # Khu vực phụ huynh
  api/             # API routes
components/
  city/            # Bản đồ, HUD, điều khiển
  character/       # Chọn & tuỳ chỉnh nhân vật
  companion/       # Chatbot Vina (áo dài pixel-art)
  games/           # Boss Battle, Drag-drop Lab
  learning/        # Modal học tập
  tutor/           # Chat AI Tutor
  ui/              # DialogFrame, BreakReminder, AnswerMark
game/engine/       # Va chạm, tìm đường, dữ liệu bản đồ
lib/
  ai/              # Provider, safety, system prompts
  auth/            # Session, roles, identifier
  supabase/        # Client, admin, proxy
services/          # Logic server: XP, grading, AI tutor, reports
supabase/migrations/ # 14 migration files
tests/
  unit/            # Vitest: grading, XP, safety, auth
  db/              # RLS tests (PGlite)
```

## Vai trò & Phân quyền

| Vai trò | Mô tả |
|---------|--------|
| `admin` | Quản trị hệ thống |
| `teacher` | Giáo viên: tạo phòng, câu hỏi, bài giao, xem báo cáo |
| `student` | Học sinh: học bài, làm bài, chơi game, hỏi AI |
| `parent` | Phụ huynh: xem báo cáo con em |

Quyền đọc từ `public.profiles` (server), KHÔNG từ metadata người dùng. Mọi ghi đi qua service role.

## Bảo mật

- RLS bật cho mọi bảng; đáp án ở bảng riêng `question_answers`
- `anon` không có quyền trên bất kỳ bảng/hàm nào
- `authenticated` chỉ SELECT hàng của mình
- Security headers: CSP, X-Frame-Options DENY, nosniff
- AI key chỉ ở server, rate limit 30 lượt/ngày/HS
- Crisis detection (tự hại/bạo lực) → hiện hotline + flag cho GV
- Không thu PII học sinh; không gửi họ tên/lớp cho AI

## Triển khai

1. Push code lên GitHub → Vercel tự deploy
2. `npm run db:push` để áp dụng migration mới
3. Thêm env vars trên Vercel: Settings → Environment Variables
4. `npm run seed` để tạo dữ liệu demo

## Giới hạn đã biết

- Engine bản đồ Canvas 2D chưa tối ưu cho máy rất yếu
- AI Tutor phụ thuộc Gemini API (cần internet, có thể chậm)
- Chưa có backup tự động (Supabase free tier)
- Chưa có i18n (chỉ tiếng Việt)
- Đăng nhập chỉ qua Google OAuth (chưa có mã HS)
