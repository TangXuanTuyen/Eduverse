# Bảng phân quyền EDUVERSE

## Quy tắc chung

- **Vai trò** đọc từ `public.profiles.role` (server-side), KHÔNG từ JWT metadata
- **Ghi** luôn qua `service_role` (API routes), không qua client
- **RLS** bật cho mọi bảng; `anon` không có quyền gì
- **Đáp án** (`question_answers`) học sinh không đọc được

## Ma trận quyền theo bảng

| Bảng | admin | teacher | student | parent | anon |
|------|-------|---------|---------|--------|------|
| profiles | R/W | R own | R own | R own | ✗ |
| schools | R/W | R own | ✗ | ✗ | ✗ |
| rooms | R/W | R/W own | R member | ✗ | ✗ |
| room_members | R/W | R/W own room | R own | ✗ | ✗ |
| questions | R | R/W own | ✗ | ✗ | ✗ |
| question_answers | R | R/W own | ✗ | ✗ | ✗ |
| assignments | R | R/W own room | R member | ✗ | ✗ |
| submissions | R | R own room | R/W own | ✗ | ✗ |
| question_attempts | R | R own room | R own | ✗ | ✗ |
| games | R | R/W own | R member | ✗ | ✗ |
| game_sessions | R | R/W own | R member | ✗ | ✗ |
| lessons | R | R/W own | R assigned | ✗ | ✗ |
| experiments | R | R/W own | R assigned | ✗ | ✗ |
| xp_transactions | R | R own room | R own | ✗ | ✗ |
| student_stats | R | R own room | R own | R child | ✗ |
| badges | R | R | R | R | ✗ |
| badge_awards | R | R own room | R own | R child | ✗ |
| review_queue | R | R own room | R own | ✗ | ✗ |
| ai_conversations | R | R own room | R own | ✗ | ✗ |
| ai_messages | R | R own room | R own | ✗ | ✗ |
| ai_usage_limits | R | R own room | R own | ✗ | ✗ |
| ai_room_settings | R | R/W own room | R member | ✗ | ✗ |
| audit_logs | R | ✗ | ✗ | ✗ | ✗ |
| weekly_summaries | R | R own room | ✗ | R child | ✗ |

**Chú thích**: R = SELECT, W = INSERT/UPDATE (qua server), own = sở hữu, member = thành viên phòng, child = con em (qua parent_links)

## Luồng dữ liệu học tập

```
┌─────────────┐     giao bài      ┌──────────────┐
│  Giáo viên  │ ──────────────── │  assignments  │
│  (teacher)  │                  │  + questions  │
└──────┬──────┘                  └───────┬───────┘
       │                                 │
       │  xem báo cáo                    │  học sinh nhận
       ▼                                 ▼
┌──────────────┐                 ┌──────────────┐
│ weekly_      │                 │   Học sinh   │
│ summaries    │◄────────────────│  (student)   │
│ + audit_logs │    nộp bài      │              │
└──────┬───────┘                 └──────┬───────┘
       │                                │
       │                    ┌───────────┼───────────┐
       │                    │           │           │
       │                    ▼           ▼           ▼
       │              submissions  xp_trans    ai_messages
       │              (chấm server) (server)   (AI tutor)
       │                    │           │           │
       │                    └───────────┼───────────┘
       │                                │
       ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│  Phụ huynh   │◄────────────────│ student_stats│
│  (parent)    │  xem tóm tắt   │ + badges     │
└──────────────┘                 └──────────────┘
```

## Quy tắc bất biến

1. Điểm, XP, vai trò chỉ ghi ở server — client không tin
2. Học sinh không sửa: `score`, `graded_by`, `graded_at`, `teacher_feedback`, XP
3. XP qua server với `idempotency_key`, giới hạn XP/ngày
4. AI không chấm điểm cuối, không gắn nhãn HS, không làm bài hộ
5. Không chat tự do giữa HS — chỉ biểu cảm/câu chọn sẵn
6. Không bảng xếp hạng công khai, hộp quà ngẫu nhiên, "mất chuỗi ngày"
