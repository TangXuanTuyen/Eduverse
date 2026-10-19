# BƯỚC 0 — Rà soát giao diện EDUVERSE và kế hoạch nối backend

> Nguồn rà soát: `Eduverse-main.zip` (giải nén nguyên trạng tại `_ui-goc/Eduverse-main/`, chưa sửa, chưa chạy `npm install`).
> Ngày: 19/10/2026. Bước này **chưa viết mã tính năng**.

---

## 1. Hiện trạng mã nguồn

### 1.1 Công nghệ đang dùng

| Hạng mục | Hiện có | So với đặc tả |
|---|---|---|
| Khung | **Vite 8 + React 19, SPA một trang** (`index.html` → `src/main.tsx` → `App.tsx`) | ❌ Chưa phải Next.js App Router |
| Router | Không có. Mọi "màn hình" là **modal** mở đè lên bản đồ, điều khiển bằng `activeBuilding` trong state | ❌ Không có URL riêng, không deep-link được |
| CSS | Tailwind **v4** (`@tailwindcss/vite`, `@import "tailwindcss"`), không có `tailwind.config` | ✅ Giữ được |
| UI kit | `lucide-react` (icon). **Không dùng shadcn/ui** | → Không thêm shadcn cho khu học sinh; cân nhắc cho khu giáo viên/quản trị (xem câu hỏi Q6) |
| Bản đồ / game | **Engine Canvas 2D tự viết** (`CityMapCanvas.tsx` 2.726 dòng, vẽ thủ tục toàn bộ, không có ảnh asset), có va chạm, tìm đường A*, camera lerp | ⚠️ Đặc tả ghi Phaser 3 (xem Q1) |
| 3D / mô phỏng | Không có `model-viewer`, không có PhET. STEM Lab là mô phỏng React tự vẽ (quỳ tím, mạch điện, kính hiển vi) | ❌ Cần bổ sung |
| Backend | Không có. `@google/genai`, `express`, `dotenv` đã cài nhưng **không dùng ở đâu**. `motion` cũng cài mà không dùng | ❌ |
| Lưu dữ liệu | `localStorage` (`eduverse_character_v2`, `eduverse_progress_v2`, `eduverse_first_time_v2`) | ❌ Cần chuyển sang Supabase |
| Kiểm thử | `src/engine/engine.test.ts` (node:test) cho va chạm, tìm đường, lên cấp — **chưa có script `test`** trong `package.json` | Giữ, chuyển sang Vitest |
| TypeScript | `^7.0.2` (bản biên dịch native) | ⚠️ Rủi ro tương thích với plugin TS của Next (R5) |

Quy mô: ~8.200 dòng TSX/TS, 20 file. Thư mục `.aistudio/` chứa 50 ảnh chụp màn hình (8,8 MB) + bản kế hoạch của AI Studio → **không đưa lên GitHub**.

### 1.2 Cấu trúc và component

```
src/
├─ App.tsx                       # State gốc, toàn bộ logic XP/quest/mở khóa (client)
├─ types/game.ts                 # CharacterConfig, QuizQuestion (có correctIndex), PlayerProgress…
├─ engine/  cityData.ts · collision.ts · pathfinding.ts · progression.ts · engine.test.ts
├─ utils/audio.ts                # Âm thanh WebAudio tổng hợp
└─ components/
   ├─ city/       CityMapCanvas · CityHUD · PlayerController (D-pad cảm ứng)
   ├─ character/  CharacterSelection · PixelAvatar
   └─ learning/   LibraryModal · QuizArcadeModal · ReviewStationModal · StemLabModal
                  SchoolModal · AchievementPlazaModal · RoomInteriorScene (cảnh nội thất pixel)
```

**Component dùng lại được gần như nguyên vẹn:** `CityMapCanvas`, `CityHUD`, `PlayerController`, `PixelAvatar`, `CharacterSelection`, `RoomInteriorScene`, `audio.ts`, `engine/*` (trừ `progression.ts` phải tách: phần tính toán chuyển lên server, phần hiển thị giữ ở client). Các modal học tập giữ **khung giao diện**, thay phần dữ liệu cứng bằng props/dữ liệu từ server.

### 1.3 Dữ liệu giả (mock) nhúng cứng

| Vị trí | Mock | Thay bằng |
|---|---|---|
| `App.tsx` `DEFAULT_CHARACTER` | Học sinh "Nguyễn Minh Khang", "Lớp 7A1" | Hồ sơ + avatar từ DB |
| `progression.ts` `INITIAL_QUESTS`, `INITIAL_PROGRESS` | 4 nhiệm vụ, 100 EduPoints ban đầu | Bài giao giáo viên + tiến độ thật |
| `LibraryModal.tsx` `LESSONS` | 3 bài (Quang học 7, Nguyên tử 7, Tế bào/Quang hợp 6-7) kèm đáp án | Bảng `lessons`, `lesson_blocks` |
| `QuizArcadeModal.tsx` `QUESTION_BANK` | 5 câu, **có `correctIndex` + giải thích ngay trên client** | `questions` + `question_answers` (ẩn) |
| `ReviewStationModal.tsx` `SAMPLE_MISTAKES` | Câu sai mẫu hiện khi học sinh **chưa sai câu nào** | Xóa; hiện trạng thái rỗng thân thiện |
| `StemLabModal.tsx` `SOLUTIONS` … | 3 thí nghiệm, tự báo "hoàn thành" ở client | `stem_missions` + chấm ở server |
| `SchoolModal.tsx` | Lời nhắn "Cô Lan" cứng | Thông báo lớp từ DB |
| `AchievementPlazaModal.tsx` `BADGES` | 4 huy hiệu tính từ state client | `badges`, `student_badges` (server cấp) |

---

## 2. Bảng đối chiếu màn hình ↔ đặc tả

Ký hiệu: ✅ có, dùng được · 🟡 có nhưng mock / cần sửa nhiều · ❌ chưa có

### Học sinh

| Trang đặc tả | Hiện có | Trạng thái | Ghi chú |
|---|---|---|---|
| Trang chủ | — | ❌ | Đề xuất: bản đồ **chính là** trang chủ, thêm thẻ "Việc cần làm hôm nay" trên HUD |
| Bản đồ thành phố | `CityMapCanvas` + `CityHUD` + `PlayerController` | ✅ | Cần sửa hiệu năng (mục 3.3), thêm danh sách điểm đến dạng văn bản cho bàn phím/đọc màn hình (HUD đã có một phần) |
| Thư viện | `LibraryModal` | 🟡 | Chỉ có văn bản + 1 câu hỏi. Thiếu 3D, PhET, phòng thí nghiệm ảo |
| Bài học (chi tiết) | nằm trong `LibraryModal` | 🟡 | Cần route riêng `/student/lessons/[id]` |
| Quiz Arcade | `QuizArcadeModal` | 🟡 | Chấm ở client, XP theo điểm số (trái quy tắc 10) |
| Trạm sửa lỗi | `ReviewStationModal` | 🟡 | Chưa có lịch ôn (spaced repetition); có mock fallback |
| Bài giao (School) | `SchoolModal` | 🟡 | Hiện là "nhiệm vụ game", chưa phải bài giáo viên giao; nút "Nhận thưởng" nhảy (`animate-bounce`) |
| Phòng STEM | `StemLabModal` | 🟡 | Mô phỏng tốt để làm nền; chưa có quy trình STEM (giả thuyết → làm → ghi nhận → kết luận) và nộp bài |
| Thành tích | `AchievementPlazaModal` | 🟡 | Chỉ cá nhân, **không có bảng xếp hạng** — đúng hướng |
| Trợ giúp AI (`/student/tutor`) | — | ❌ | |
| Chatbot áo dài (widget nổi) | — | ❌ | Cần sprite pixel-art áo dài mới |
| Phòng chung (biểu cảm, câu chọn sẵn) | — | ❌ | Supabase Realtime |
| Cài đặt (cỡ chữ, giảm chuyển động, âm thanh, đổi mật khẩu) | Chỉ có nút tắt âm | ❌ | |
| Tùy chỉnh nhân vật | `CharacterSelection` | ✅ | Ngoài đặc tả nhưng nên giữ; bỏ trường `gender` khỏi dữ liệu lưu (mục 3.1) |
| Đăng nhập / đổi mật khẩu lần đầu | — | ❌ | |

### Giáo viên · Phụ huynh · Quản trị — **chưa có màn hình nào**

| Vai trò | Trang cần làm mới |
|---|---|
| Giáo viên | Tổng quan · Lớp (join code, danh sách HS, đặt lại mật khẩu) · Ngân hàng câu hỏi · Bài học · Bài giao · Chấm bài · Báo cáo · Phòng (quản lý phòng chung) · Thống kê AI (+ công tắc AI theo lớp) |
| Phụ huynh | Tổng quan con · Liên kết (nhập mã một lần, chờ duyệt) |
| Quản trị trường | Tạo/nhập HS hàng loạt (mã HS + mật khẩu tạm), giáo viên, lớp, cấp mã liên kết phụ huynh, duyệt liên kết, đặt lại mật khẩu |
| Admin hệ thống | Quản lý trường, tài khoản school_admin, nhật ký hệ thống |

Các trang này không có giao diện mẫu → sẽ dựng bằng Tailwind theo cùng bảng màu/phông, phong cách gọn kiểu dashboard (không pixel-art nặng).

---

## 3. Vấn đề phát hiện

### 3.1 Xung đột với quy tắc bất biến

| # | Vấn đề | Quy tắc | Hướng xử lý |
|---|---|---|---|
| 1 | XP, EduPoints, cấp độ, mở khóa tòa nhà, mở khóa trang phục đều tính ở client và lưu `localStorage` | 1, 5, 6 | Server Action/RPC ghi `xp_events` có `idempotency_key`; client chỉ hiển thị |
| 2 | Đáp án (`correctIndex`) và giải thích được gửi kèm câu hỏi | 2 | Tách `question_answers`; chấm qua RPC, chỉ trả giải thích **sau** khi nộp |
| 3 | Quiz: XP = `điểm × 0,8 + 80`, combo cộng điểm, đồng hồ 15 s | 10 | XP cho "sửa đúng câu sai", "tiến bộ so với lần trước", "học đều"; bỏ XP theo số lượng; đồng hồ có thể tắt trong Cài đặt |
| 4 | Nhiệm vụ "Nhận thưởng" + EduPoints (tiền tệ ảo) | 10 | Xem Q4 |
| 5 | Lưu `gender` của nhân vật | 8 | Đổi thành "kiểu dáng nhân vật" (thuần thẩm mỹ), không lưu giới tính |
| 6 | Họ tên + lớp hiển thị trên HUD | 8 | Được phép hiển thị nội bộ; **không** gửi cho Gemini (dùng mã nội bộ) |

### 3.2 Lỗi chức năng có sẵn

- `App.tsx:140` tìm nhiệm vụ `q_enroll` nhưng nhiệm vụ thật có id `q_school_welcome` → nhiệm vụ nhập học **không bao giờ hoàn thành**.
- `App.tsx:346` `hasNearbyBuilding={false}` cố định; `App.tsx:343` mở danh sách khu vực bằng `document.querySelector(...).click()` (dễ vỡ).
- `App.tsx:102-105` `useEffect` thiếu dependency, đọc `character` cũ.
- Nút đóng ghi "Đóng [Esc]" nhưng các modal **không xử lý phím Esc**.

### 3.3 Hiệu năng

- **`CityMapCanvas.tsx:414`**: khi nhân vật đứng yên, điều kiện `!player.isWalking && lastSaveTime !== 0` đúng ở mọi khung hình → gọi `onPositionChange` **~60 lần/giây** → `App` `setProgress` → render lại toàn bộ cây React + ghi `localStorage` 60 lần/giây. Đây là nguyên nhân tốn pin/nóng máy lớn nhất.
- Vòng `requestAnimationFrame` chạy liên tục kể cả khi modal đang mở hoặc tab ẩn.
- `drawGround` vẽ lại toàn bộ nền thủ tục mỗi khung; nên vẽ sẵn vào canvas phụ (offscreen) một lần.
- Không xử lý `devicePixelRatio` (mờ trên màn hình retina hoặc phải vẽ quá nhiều pixel nếu sửa vội).
- Mọi modal import tĩnh → bundle đầu nặng; chưa tải lười.
- Tải 3 họ phông Google Fonts (Be Vietnam Pro 6 độ đậm + 2 phông pixel) → dùng `next/font` tự host, giảm độ đậm.

### 3.4 Truy cập (a11y) và mobile

- `index.html` khai báo `lang="en"` trong khi nội dung tiếng Việt.
- Modal không có `role="dialog"`, `aria-modal`, bẫy focus, trả focus khi đóng.
- **Không tôn trọng `prefers-reduced-motion`** (animate-bounce, animate-pulse, lá bay, camera lerp, nhân vật nhảy ăn mừng).
- Chữ rất nhỏ (`text-[10px]`, `text-[11px]`), nhiều nút `py-1.5` < 44 px; không có chỉnh cỡ chữ.
- `user-select: none` toàn trang → học sinh không chọn/sao chép được nội dung bài học.
- Đúng/sai trong quiz chủ yếu báo bằng màu (có kèm dòng chữ phản hồi — cần thêm biểu tượng ✓/✗).
- Bản đồ canvas không đọc được bằng trình đọc màn hình → cần chế độ "Danh sách địa điểm" thay thế đầy đủ (HUD đã có nền tảng).
- Mobile: D-pad có sẵn, modal `max-h-[92vh]` ổn; header modal (2 nút đóng + tiêu đề dài) chật ở 360 px.

### 3.5 Nội dung khoa học cần giáo viên kiểm tra

- `StemLabModal.tsx:64` gọi nước chanh là **"Axit mạnh"** — axit citric là axit yếu. Sai kiến thức.
- `ReviewStationModal.tsx:45` lỗi chính tả "Khí Khí Oxygen".
- Nước vôi trong ghi pH 11,5 (thực tế bão hòa ≈ 12,4) — nên ghi "pH > 7" thay vì con số cụ thể.
- Nội dung trộn lớp 6-8 và gắn nhãn "Vật lý/Hóa/Sinh" kiểu chương trình cũ; seed mới sẽ chỉ dùng **KHTN 6 — chủ đề Tế bào**, gắn cờ `needs_teacher_review = true`.

---

## 4. Phương án di chuyển sang Next.js App Router (CHỜ DUYỆT)

### Phương án đề xuất: "Bê nguyên component, đổi vỏ"

1. Tạo dự án Next.js mới (App Router, TS, Tailwind v4) **bên cạnh** mã cũ; chép `components/`, `engine/`, `types/`, `utils/` sang, giữ nguyên tên và class Tailwind.
2. Đánh dấu `'use client'` cho mọi component có canvas/state; `CityMapCanvas` nạp bằng `next/dynamic` với `ssr: false` + màn hình chờ/khung tĩnh dự phòng.
3. Trang bản đồ `/student` giữ mô hình "modal trên bản đồ" nhưng **mỗi địa điểm có URL riêng** bằng intercepting + parallel routes: bấm từ bản đồ → mở modal (`@modal/(.)library`), mở trực tiếp/tải lại → trang đầy đủ `/student/library`. Như vậy vừa giữ trải nghiệm game, vừa deep-link, vừa có nút Back của trình duyệt.
4. Tách `App.tsx` thành: `StudentCityShell` (client, chỉ trạng thái UI) + dữ liệu lấy từ Server Component/Server Action. Xóa `localStorage` cho dữ liệu học tập (chỉ giữ tùy chọn hiển thị như tắt âm).
5. Chạy song song bản cũ để so sánh giao diện, rồi xóa thư mục cũ.

> **Cập nhật khi thực hiện (Bước 1):** thay vì intercepting/parallel routes, dùng cách đơn giản hơn mà đạt cùng mục tiêu: route group `app/student/(city)/` có `layout.tsx` vẽ bản đồ, mỗi địa điểm là trang con hiển thị hộp thoại phía trên. Layout không bị tải lại khi chuyển trang nên bản đồ giữ nguyên trạng thái; URL riêng, deep-link và nút Back vẫn hoạt động. Mở thẳng URL địa điểm chưa mở khóa → chuyển về `/student`.

| Ưu | Nhược |
|---|---|
| Giữ 100% giao diện và engine bản đồ đã ổn; rủi ro thấp | App Router + canvas cần cẩn thận ranh giới server/client |
| Có route thật, middleware phân quyền theo vai trò, Server Actions cho chấm điểm/XP | Intercepting routes hơi phức tạp hơn một trang SPA |
| Khớp hạ tầng Vercel + Supabase SSR (`@supabase/ssr`) | |

**Công sức ước tính:** 1,5–2,5 ngày làm việc cho phần di chuyển thuần (chưa nối dữ liệu): dựng khung + chép component 0,5 ngày; routes/modal + tải lười 0,5–1 ngày; sửa lỗi mục 3.2-3.3 + kiểm tra mobile 0,5–1 ngày.

**Phương án đã cân nhắc và không chọn:** giữ Vite SPA + backend riêng (Express/Edge Functions) — ít việc trước mắt nhưng trái đặc tả, mất Server Actions/middleware, phải tự lo SSR auth.

---

## 5. Cấu trúc thư mục đề xuất

```
/
├─ app/
│  ├─ (auth)/login/ · doi-mat-khau/            # mã HS / email phụ huynh
│  ├─ student/
│  │  ├─ layout.tsx                             # HUD, widget áo dài, ≤5 mục điều hướng
│  │  ├─ page.tsx                               # bản đồ (trang chủ)
│  │  ├─ @modal/(.)library/ (.)arcade/ …        # modal chặn route
│  │  ├─ library/ lessons/[id]/ arcade/ review/ assignments/ stem/ achievements/
│  │  ├─ tutor/ room/ settings/
│  ├─ teacher/  (dashboard)/ classes/ questions/ lessons/ assignments/ grading/ reports/ rooms/ ai-stats/
│  ├─ parent/   page.tsx · link/
│  ├─ school-admin/ …   ·   admin/ …
│  └─ api/tutor/route.ts · api/auth/student-login/route.ts …
├─ components/
│  ├─ city/ character/ learning/                # chuyển nguyên từ UI cũ
│  ├─ companion/                                # chatbot áo dài
│  ├─ ui/                                       # nút, modal a11y, input dùng chung
│  └─ dashboard/                                # cho giáo viên/phụ huynh/quản trị
├─ game/
│  ├─ engine/  collision · pathfinding · cityData   # từ src/engine
│  └─ minigames/                                # (Phaser nếu duyệt Q1), tải lười
├─ lib/
│  ├─ supabase/ client.ts · server.ts · admin.ts (service role, chỉ server) · middleware.ts
│  ├─ auth/ roles.ts · rate-limit.ts
│  ├─ ai/ gemini.ts · safety.ts · redact.ts
│  └─ validation/ (zod schemas)
├─ services/   grading.ts · xp.ts · review-schedule.ts · join-code.ts …   # nghiệp vụ phía server
├─ supabase/
│  ├─ migrations/ 0001_… .sql
│  ├─ seed.sql                                  # KHTN 6 — Tế bào, HS giả
│  └─ tests/  (pgTAP: kiểm thử RLS truy cập trái phép)
├─ tests/  unit/ (Vitest) · e2e/ (Playwright)
└─ public/  sprites/ (áo dài), models/ (.glb 3D)
```

---

## 6. Rủi ro kỹ thuật

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | Engine canvas 2.700 dòng một file, khó bảo trì; đổi sang Phaser = viết lại toàn bộ đồ họa | Cao | Giữ engine hiện tại (Q1), chỉ tách file và sửa hiệu năng |
| R2 | Khóa tạm theo tài khoản: Supabase Auth chỉ giới hạn theo IP, không khóa theo tài khoản | Trung bình | Đăng nhập HS qua route server riêng, đếm lần sai trong bảng `login_attempts`, khóa 15 phút sau N lần |
| R3 | Đăng nhập phụ huynh bằng **số điện thoại** cần nhà cung cấp SMS (chi phí, đăng ký brandname tại VN) | Trung bình | Q3 — MVP chỉ email |
| R4 | Học sinh không có email thật → không reset tự động; giáo viên đặt lại phải qua service role | Thấp | Server Action có kiểm tra giáo viên thuộc lớp của HS |
| R5 | TypeScript 7 có thể chưa tương thích plugin/type-check của Next.js | Trung bình | Ghim phiên bản TS mà Next.js hỗ trợ chính thức khi dựng khung; kiểm tra `next build` |
| R6 | Nhúng PhET iframe phụ thuộc mạng ngoài; model 3D `.glb` nặng | Trung bình | Tải lười, ảnh tĩnh dự phòng, nén Draco, giới hạn dung lượng |
| R7 | Gemini có thể "lỡ" đưa đáp án, hoặc học sinh nhập thông tin cá nhân vào chat | Cao | Prompt hệ thống Socratic + bộ lọc đầu ra; lọc PII đầu vào; khóa khi có kiểm tra; ghi log để giáo viên xem thống kê |
| R8 | Realtime phòng chung: chi phí và lạm dụng (spam biểu cảm) | Thấp | Chỉ gửi id biểu cảm/câu chọn sẵn, giới hạn tần suất, phạm vi lớp |
| R9 | Mã Vite cũ và dự án Next cùng tồn tại trong thời gian chuyển → nhầm lẫn | Thấp | Mã gốc để ở `_ui-goc/` (chỉ đọc), xóa sau khi đối chiếu xong |
| R10 | Dữ liệu trẻ vị thành niên (Nghị định 13/2023 về dữ liệu cá nhân) | Cao | Tối thiểu hóa dữ liệu, chọn vùng Supabase Singapore, có quy trình xóa dữ liệu theo yêu cầu |

---

## 7. Câu hỏi cần anh/chị quyết định

| # | Câu hỏi | Đề xuất của tôi |
|---|---|---|
| **Q1** | Bản đồ: giữ **engine Canvas tự viết** (đã chạy, có test) hay viết lại bằng **Phaser 3** như đặc tả? | **Giữ engine hiện tại** cho bản đồ; chỉ dùng Phaser (tải lười) nếu sau này có mini-game Arcade cần vật lý/hoạt ảnh phức tạp |
| **Q2** | Tên dự án và tên miền nội bộ cho email giả của HS (`mahs@[?].local`)? | Dự án **EDUVERSE**, email `mahs@hs.eduverse.local` |
| **Q3** | Phụ huynh đăng nhập bằng số điện thoại ngay từ đầu (cần chọn nhà cung cấp SMS) hay MVP chỉ email? | MVP **chỉ email**, số điện thoại để giai đoạn sau |
| **Q4** | Giữ **EduPoints** (tiền tệ ảo) và nút "Nhận thưởng" không? | **Bỏ EduPoints**, chỉ giữ XP + huy hiệu; trang phục mở theo cột mốc học tập (sửa lỗi, hoàn thành STEM), không mua bán |
| **Q5** | 5 mục điều hướng chính của học sinh? | **Bản đồ · Bài giao · Sửa lỗi · Thành tích · Cài đặt** (Thư viện/Arcade/STEM vào từ bản đồ; AI Tutor mở từ widget áo dài) |
| **Q6** | Khu giáo viên/quản trị có dùng shadcn/ui không (UI cũ không dùng)? | **Có**, chỉ cho khu dashboard; khu học sinh giữ style pixel hiện tại |
| **Q7** | Một trường hay **nhiều trường** (multi-tenant) ngay từ đầu? Ảnh hưởng toàn bộ thiết kế RLS | Thiết kế **nhiều trường** (`school_id` ở mọi bảng) ngay, dù triển khai thử 1 trường |
| **Q8** | Đồng hồ đếm ngược 15 s ở Arcade: giữ, bỏ, hay cho tắt? | Giữ cho chế độ "Thử thách", mặc định **chế độ không tính giờ** |
| **Q9** | Sprite nhân vật áo dài: tôi vẽ thủ tục bằng canvas giống `PixelAvatar` hay anh/chị có ảnh sprite? | Vẽ bằng code cùng phong cách `PixelAvatar` để đồng bộ và nhẹ |

---

## 8. Lộ trình gợi ý sau khi duyệt (để tham khảo, phạm vi từng bước do anh/chị giao)

1. Di chuyển sang Next.js + sửa lỗi mục 3.2-3.4 (không đổi giao diện).
2. Supabase: schema lõi, RLS, vai trò, đăng nhập HS/phụ huynh, khóa tạm, công tắc AI theo lớp.
3. Nối dữ liệu: bài học, câu hỏi (đáp án ẩn), chấm điểm + XP ở server, trạm sửa lỗi có lịch ôn.
4. Giáo viên: lớp, join code, ngân hàng câu hỏi, bài giao, chấm bài, báo cáo.
5. Phụ huynh + quản trị trường + admin.
6. AI Tutor + chatbot áo dài; phòng chung Realtime.
7. Thư viện 3D/PhET, STEM có quy trình; tối ưu máy yếu; triển khai Vercel.
