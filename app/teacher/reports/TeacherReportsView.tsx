'use client';

import { useCallback, useEffect, useState } from 'react';

type Tab = 'rooms' | 'students' | 'skills' | 'questions';

const TABS: { key: Tab; label: string }[] = [
  { key: 'rooms', label: 'Theo phòng' },
  { key: 'students', label: 'Theo học sinh' },
  { key: 'skills', label: 'Theo kỹ năng' },
  { key: 'questions', label: 'Theo câu hỏi' },
];

type RoomRow = {
  room_id: string;
  room_name: string;
  grade: number | null;
  member_count: number;
  assignment_count: number;
  avg_accuracy: number;
  submissions_graded: number;
  submissions_total: number;
};

type StudentRow = {
  student_id: string;
  display_name: string;
  grade: number | null;
  total_xp: number;
  assignments_completed: number;
  avg_score: number;
  last_active_date: string | null;
  days_inactive: number;
  needs_attention: boolean;
};

type SkillRow = {
  skill: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
};

type QuestionRow = {
  question_id: string;
  content: string;
  type: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
  avg_time_seconds: number | null;
};

type InactiveRow = {
  student_id: string;
  display_name: string;
  room_name: string;
  last_active_date: string | null;
  days_inactive: number;
};

type TimeSaved = {
  auto_graded_count: number;
  total_submissions: number;
};

function AccuracyBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono w-10 text-right">{value}%</span>
    </div>
  );
}

export function TeacherReportsView() {
  const [tab, setTab] = useState<Tab>('rooms');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [data, setData] = useState<unknown>(null);
  const [inactive, setInactive] = useState<InactiveRow[]>([]);
  const [timeSaved, setTimeSaved] = useState<TimeSaved | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const fetchData = useCallback(async (t: Tab, room?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ tab: t });
    if (room) params.set('room', room);
    const res = await fetch(`/api/teacher/reports?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(tab, roomFilter || undefined);
  }, [tab, roomFilter, fetchData]);

  useEffect(() => {
    fetch('/api/teacher/reports?tab=rooms')
      .then((r) => r.json())
      .then((d) => setRooms(d));
    fetch('/api/teacher/reports?tab=inactive')
      .then((r) => r.json())
      .then((d) => setInactive(d));
    fetch('/api/teacher/reports?tab=time-saved')
      .then((r) => r.json())
      .then((d) => setTimeSaved(d));
  }, []);

  const handleExport = () => {
    const params = new URLSearchParams({ tab });
    if (roomFilter) params.set('room', roomFilter);
    window.open(`/api/teacher/reports/export?${params}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Báo cáo</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg min-h-[44px]"
        >
          Xuất Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {inactive.length > 0 && (
          <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{inactive.length}</div>
            <div className="text-xs text-amber-300">HS không HĐ ≥7 ngày</div>
          </div>
        )}
        {timeSaved && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold">{timeSaved.auto_graded_count}</div>
              <div className="text-xs text-slate-400">Câu tự chấm</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold">{timeSaved.total_submissions}</div>
              <div className="text-xs text-slate-400">Bài đã nộp</div>
            </div>
          </>
        )}
      </div>

      {/* Inactive alert */}
      {inactive.length > 0 && (
        <details className="bg-slate-900 border border-slate-800 rounded-xl">
          <summary className="px-4 py-3 text-sm font-semibold cursor-pointer min-h-[44px] flex items-center">
            Học sinh cần chú ý ({inactive.length})
          </summary>
          <div className="px-4 pb-4 space-y-2">
            {inactive.map((s) => (
              <div key={s.student_id} className="flex items-center justify-between text-sm">
                <span>{s.display_name} <span className="text-slate-500">({s.room_name})</span></span>
                <span className="text-amber-400 text-xs">
                  {s.days_inactive >= 999 ? 'Chưa HĐ' : `${s.days_inactive} ngày`}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm min-h-[44px] border-b-2 transition-colors ${
              tab === t.key
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Room filter (for students/skills/questions tabs) */}
      {tab !== 'rooms' && rooms.length > 0 && (
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">Tất cả phòng</option>
          {rooms.map((r) => (
            <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
          ))}
        </select>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-slate-400 text-sm text-center py-8">Đang tải...</p>
      ) : (
        <>
          {tab === 'rooms' && <RoomsTable data={data as RoomRow[]} />}
          {tab === 'students' && <StudentsTable data={data as StudentRow[]} />}
          {tab === 'skills' && <SkillsTable data={data as SkillRow[]} />}
          {tab === 'questions' && <QuestionsTable data={data as QuestionRow[]} />}
        </>
      )}
    </div>
  );
}

function RoomsTable({ data }: { data: RoomRow[] }) {
  if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có phòng nào.</p>;
  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.room_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-semibold">{r.room_name}</span>
              {r.grade && <span className="text-xs text-slate-400 ml-2">Khối {r.grade}</span>}
            </div>
            <span className="text-xs text-slate-400">{r.member_count} thành viên</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="font-bold">{r.assignment_count}</div>
              <div className="text-xs text-slate-400">Bài giao</div>
            </div>
            <div>
              <div className="font-bold">{r.submissions_graded}/{r.submissions_total}</div>
              <div className="text-xs text-slate-400">Đã chấm</div>
            </div>
            <div>
              <div className="font-bold">{r.avg_accuracy}%</div>
              <div className="text-xs text-slate-400">Điểm TB</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentsTable({ data }: { data: StudentRow[] }) {
  if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-800">
            <th className="pb-2 pr-3">Họ tên</th>
            <th className="pb-2 pr-3 text-right">XP</th>
            <th className="pb-2 pr-3 text-right">Bài xong</th>
            <th className="pb-2 pr-3 w-40">Điểm TB</th>
            <th className="pb-2 text-right">Không HĐ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr
              key={s.student_id}
              className={`border-b border-slate-800/50 ${s.needs_attention ? 'text-amber-300' : ''}`}
            >
              <td className="py-2 pr-3">
                {s.display_name}
                {s.needs_attention && <span className="ml-1 text-xs">⚠</span>}
              </td>
              <td className="py-2 pr-3 text-right font-mono">{s.total_xp}</td>
              <td className="py-2 pr-3 text-right">{s.assignments_completed}</td>
              <td className="py-2 pr-3"><AccuracyBar value={s.avg_score} /></td>
              <td className="py-2 text-right text-xs">
                {s.days_inactive >= 999 ? 'Chưa HĐ' : s.days_inactive > 0 ? `${s.days_inactive}d` : 'Hôm nay'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkillsTable({ data }: { data: SkillRow[] }) {
  if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {data.map((s) => (
        <div key={s.skill} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{s.skill}</span>
            <span className="text-xs text-slate-400">{s.total_attempts} lượt</span>
          </div>
          <AccuracyBar value={s.accuracy} />
        </div>
      ))}
    </div>
  );
}

function QuestionsTable({ data }: { data: QuestionRow[] }) {
  if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {data.map((q) => (
        <div key={q.question_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm flex-1 mr-3">{q.content}</p>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {q.total_attempts} lượt
              {q.avg_time_seconds != null && ` · ${q.avg_time_seconds}s`}
            </span>
          </div>
          <AccuracyBar value={q.accuracy} />
        </div>
      ))}
    </div>
  );
}
