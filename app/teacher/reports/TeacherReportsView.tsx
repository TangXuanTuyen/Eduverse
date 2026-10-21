'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X, CheckCircle2, XCircle, TrendingUp, Users, BookOpen,
  AlertTriangle, ChevronRight, ArrowLeft, BarChart3, Trophy,
  Clock, Target, Zap, Send,
} from 'lucide-react';

// ── Types ──

type Tab = 'overview' | 'rooms' | 'students' | 'skills' | 'questions';

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

type RoomAssignmentDetail = {
  assignment_id: string;
  title: string;
  assignment_type: string;
  created_at: string;
  due_at: string | null;
  total_students: number;
  submitted_count: number;
  graded_count: number;
  avg_score: number;
  max_score: number;
  score_distribution: { excellent: number; good: number; average: number; weak: number };
  hard_questions: Array<{
    question_id: string;
    content: string;
    correct_rate: number;
    total_attempts: number;
  }>;
};

type DetailReport = {
  display_name: string;
  total_xp: number;
  level: number;
  submissions: Array<{
    assignment_title: string;
    status: string;
    total_score: number | null;
    max_score: number | null;
    submitted_at: string | null;
  }>;
  question_details: Array<{
    question_content: string;
    question_type: string;
    is_correct: boolean | null;
    assignment_title: string;
  }>;
  skill_breakdown: Array<{
    skill: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
};

// ── Helpers ──

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="flex-1 bg-slate-800/60 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ScoreBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : value >= 40 ? 'text-orange-400' : 'text-red-400';
  const bg = value >= 80 ? 'bg-emerald-500/10' : value >= 60 ? 'bg-amber-500/10' : value >= 40 ? 'bg-orange-500/10' : 'bg-red-500/10';
  const sz = size === 'sm' ? 'text-sm px-2 py-0.5' : 'text-lg px-3 py-1';
  return <span className={`font-bold rounded-lg ${color} ${bg} ${sz}`}>{value}%</span>;
}

function DistributionBar({ dist }: { dist: { excellent: number; good: number; average: number; weak: number } }) {
  const total = dist.excellent + dist.good + dist.average + dist.weak;
  if (total === 0) return <div className="h-4 bg-slate-800 rounded-full" />;
  return (
    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
      {dist.excellent > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(dist.excellent / total) * 100}%` }} title={`Giỏi: ${dist.excellent}`} />}
      {dist.good > 0 && <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(dist.good / total) * 100}%` }} title={`Khá: ${dist.good}`} />}
      {dist.average > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(dist.average / total) * 100}%` }} title={`TB: ${dist.average}`} />}
      {dist.weak > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${(dist.weak / total) * 100}%` }} title={`Yếu: ${dist.weak}`} />}
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { key: 'rooms', label: 'Theo lớp', icon: Users },
  { key: 'students', label: 'Theo học sinh', icon: Target },
  { key: 'skills', label: 'Kỹ năng', icon: TrendingUp },
  { key: 'questions', label: 'Câu hỏi', icon: BookOpen },
];

// ── Main Component ──

export function TeacherReportsView() {
  const [tab, setTab] = useState<Tab>('overview');
  const [roomFilter, setRoomFilter] = useState('');
  const [data, setData] = useState<unknown>(null);
  const [inactive, setInactive] = useState<InactiveRow[]>([]);
  const [timeSaved, setTimeSaved] = useState<TimeSaved | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomAssignmentDetail[]>([]);
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const fetchTab = useCallback(async (t: string, room?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ tab: t });
    if (room) params.set('room', room);
    const res = await fetch(`/api/teacher/reports?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    const apiTab = tab === 'overview' ? 'rooms' : tab;
    fetchTab(apiTab, roomFilter || undefined);
  }, [tab, roomFilter, fetchTab]);

  useEffect(() => {
    fetch('/api/teacher/reports?tab=rooms').then((r) => r.json()).then((d) => setRooms(d));
    fetch('/api/teacher/reports?tab=inactive').then((r) => r.json()).then((d) => setInactive(d));
    fetch('/api/teacher/reports?tab=time-saved').then((r) => r.json()).then((d) => setTimeSaved(d));
  }, []);

  const openRoomDetail = async (room: RoomRow) => {
    setSelectedRoom(room);
    setRoomDetailsLoading(true);
    const res = await fetch(`/api/teacher/reports?tab=room-detail&room=${room.room_id}`);
    const d = await res.json();
    setRoomDetails(d);
    setRoomDetailsLoading(false);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ tab: tab === 'overview' ? 'rooms' : tab });
    if (roomFilter) params.set('room', roomFilter);
    window.open(`/api/teacher/reports/export?${params}`, '_blank');
  };

  // ── Room Detail View ──
  if (selectedRoom) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedRoom(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{selectedRoom.room_name}</h1>
            <p className="text-xs text-slate-400">
              {selectedRoom.grade ? `Khối ${selectedRoom.grade} · ` : ''}{selectedRoom.member_count} học sinh · {selectedRoom.assignment_count} bài giao
            </p>
          </div>
        </div>

        {/* Room overview cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{selectedRoom.submissions_graded}/{selectedRoom.submissions_total}</div>
            <div className="text-xs text-blue-300 mt-1">Đã chấm</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <ScoreBadge value={selectedRoom.avg_accuracy} />
            <div className="text-xs text-emerald-300 mt-2">Điểm TB</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{selectedRoom.member_count}</div>
            <div className="text-xs text-purple-300 mt-1">Học sinh</div>
          </div>
        </div>

        {roomDetailsLoading ? (
          <div className="text-center py-12 text-slate-400">Đang tải dữ liệu...</div>
        ) : roomDetails.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Chưa có bài giao nào.</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Từng bài giao</h2>
            {roomDetails.map((a) => {
              const typeIcon = a.assignment_type === 'lesson' ? '📖' : a.assignment_type === 'experiment' ? '🔬' : a.assignment_type === 'model3d' ? '🌐' : a.assignment_type === 'stem' ? '🧪' : '📝';
              const completionRate = a.total_students > 0 ? Math.round((a.submitted_count / a.total_students) * 100) : 0;
              const avgPct = a.max_score > 0 ? Math.round((a.avg_score / a.max_score) * 100) : 0;

              return (
                <div key={a.assignment_id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{typeIcon} {a.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        {a.due_at && ` · Hạn: ${new Date(a.due_at).toLocaleDateString('vi-VN')}`}
                      </p>
                    </div>
                    {a.max_score > 0 && <ScoreBadge value={avgPct} />}
                  </div>

                  {/* Completion + Score bars */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Tiến độ nộp bài</span>
                        <span className="text-white font-medium">{a.submitted_count}/{a.total_students}</span>
                      </div>
                      <AnimatedBar value={completionRate} color="bg-blue-500" />
                    </div>
                    {a.max_score > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Điểm TB</span>
                          <span className="text-white font-medium">{a.avg_score}/{a.max_score}</span>
                        </div>
                        <AnimatedBar value={avgPct} color={avgPct >= 70 ? 'bg-emerald-500' : avgPct >= 50 ? 'bg-amber-500' : 'bg-red-500'} delay={100} />
                      </div>
                    )}
                  </div>

                  {/* Score distribution */}
                  {a.max_score > 0 && a.graded_count > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Phân bố điểm</span>
                        <div className="flex gap-3 text-[10px]">
                          <span className="text-emerald-400">● Giỏi {a.score_distribution.excellent}</span>
                          <span className="text-blue-400">● Khá {a.score_distribution.good}</span>
                          <span className="text-amber-400">● TB {a.score_distribution.average}</span>
                          <span className="text-red-400">● Yếu {a.score_distribution.weak}</span>
                        </div>
                      </div>
                      <DistributionBar dist={a.score_distribution} />
                    </div>
                  )}

                  {/* Hard questions */}
                  {a.hard_questions.length > 0 && (
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Câu sai nhiều — cần giảng lại
                      </div>
                      {a.hard_questions.map((q) => (
                        <div key={q.question_id} className="flex items-start justify-between gap-3">
                          <p className="text-xs text-slate-300 flex-1 line-clamp-2">{q.content}</p>
                          <div className="shrink-0 text-right">
                            <span className={`text-xs font-bold ${q.correct_rate < 40 ? 'text-red-400' : 'text-amber-400'}`}>
                              {q.correct_rate}% đúng
                            </span>
                            <p className="text-[10px] text-slate-500">{q.total_attempts} lượt</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Báo cáo & Phân tích
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi tiến độ học tập của học sinh</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl min-h-[44px] flex items-center gap-2 transition"
        >
          📊 Xuất Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 rounded-2xl p-4">
              <Users className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-white">{rooms.length}</div>
              <div className="text-xs text-blue-300">Lớp học</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{timeSaved?.total_submissions ?? 0}</div>
              <div className="text-xs text-emerald-300">Bài đã nộp</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 rounded-2xl p-4">
              <Zap className="w-5 h-5 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{timeSaved?.auto_graded_count ?? 0}</div>
              <div className="text-xs text-purple-300">Tự chấm điểm</div>
            </div>
            {inactive.length > 0 && (
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-900/10 border border-amber-500/20 rounded-2xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-amber-400">{inactive.length}</div>
                <div className="text-xs text-amber-300">Cần chú ý</div>
              </div>
            )}
          </div>

          {/* Inactive students alert */}
          {inactive.length > 0 && (
            <details className="bg-amber-950/20 border border-amber-900/30 rounded-2xl overflow-hidden">
              <summary className="px-5 py-3 text-sm font-semibold cursor-pointer min-h-[44px] flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                Học sinh không hoạt động ≥7 ngày ({inactive.length})
              </summary>
              <div className="px-5 pb-4 space-y-2">
                {inactive.map((s) => (
                  <div key={s.student_id} className="flex items-center justify-between text-sm py-1.5 border-b border-amber-900/20 last:border-0">
                    <span className="text-white">{s.display_name} <span className="text-slate-500 text-xs">({s.room_name})</span></span>
                    <span className="text-amber-400 text-xs font-medium">
                      {s.days_inactive >= 999 ? 'Chưa hoạt động' : `${s.days_inactive} ngày`}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Rooms overview with click-to-detail */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Tình hình các lớp</h2>
            {rooms.map((r) => (
              <button
                key={r.room_id}
                type="button"
                onClick={() => openRoomDetail(r)}
                className="w-full text-left bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/30 hover:bg-slate-900 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {r.grade ? `${r.grade}` : '📚'}
                    </div>
                    <div>
                      <span className="font-semibold text-white">{r.room_name}</span>
                      <p className="text-xs text-slate-500">{r.member_count} HS · {r.assignment_count} bài</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreBadge value={r.avg_accuracy} size="sm" />
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Tiến độ chấm</span>
                      <span>{r.submissions_graded}/{r.submissions_total}</span>
                    </div>
                    <AnimatedBar
                      value={r.submissions_total > 0 ? Math.round((r.submissions_graded / r.submissions_total) * 100) : 0}
                      color="bg-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Điểm TB</span>
                      <span>{r.avg_accuracy}%</span>
                    </div>
                    <AnimatedBar
                      value={r.avg_accuracy}
                      color={r.avg_accuracy >= 70 ? 'bg-emerald-500' : r.avg_accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                      delay={100}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room filter for non-overview tabs */}
      {tab !== 'overview' && rooms.length > 0 && (
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">Tất cả lớp</option>
          {rooms.map((r) => (
            <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
          ))}
        </select>
      )}

      {/* Tab content */}
      {loading && tab !== 'overview' ? (
        <div className="text-center py-12 text-slate-400">Đang tải...</div>
      ) : (
        <>
          {tab === 'rooms' && <RoomsGrid data={data as RoomRow[]} onSelect={openRoomDetail} />}
          {tab === 'students' && <StudentsView data={data as StudentRow[]} onDetail={setDetailStudentId} />}
          {tab === 'skills' && <SkillsView data={data as SkillRow[]} />}
          {tab === 'questions' && <QuestionsView data={data as QuestionRow[]} />}
        </>
      )}

      {detailStudentId && (
        <StudentDetailModal studentId={detailStudentId} onClose={() => setDetailStudentId(null)} />
      )}
    </div>
  );
}

// ── Sub-views ──

function RoomsGrid({ data, onSelect }: { data: RoomRow[]; onSelect: (r: RoomRow) => void }) {
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có lớp nào.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in duration-300">
      {data.map((r) => (
        <button
          key={r.room_id}
          type="button"
          onClick={() => onSelect(r)}
          className="text-left bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all group cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-base">{r.room_name}</span>
              {r.grade && <span className="text-xs text-slate-500 ml-2">Khối {r.grade}</span>}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">{r.member_count}</div>
              <div className="text-[10px] text-slate-500">Học sinh</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">{r.assignment_count}</div>
              <div className="text-[10px] text-slate-500">Bài giao</div>
            </div>
            <div>
              <ScoreBadge value={r.avg_accuracy} size="sm" />
              <div className="text-[10px] text-slate-500 mt-1">Điểm TB</div>
            </div>
          </div>
          <AnimatedBar
            value={r.submissions_total > 0 ? Math.round((r.submissions_graded / r.submissions_total) * 100) : 0}
            color="bg-blue-500"
          />
          <div className="text-[10px] text-slate-500 text-right">{r.submissions_graded}/{r.submissions_total} đã chấm</div>
        </button>
      ))}
    </div>
  );
}

function StudentsView({ data, onDetail }: { data: StudentRow[]; onDetail: (id: string) => void }) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSend = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    setSendingId(studentId);
    const res = await fetch(`/api/teacher/reports?tab=send-to-parent&student=${studentId}`);
    const result = await res.json();
    if (result.sent) setSentIds((prev) => new Set(prev).add(studentId));
    setSendingId(null);
  };

  if (!data || data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      {data.map((s, i) => (
        <button
          key={s.student_id}
          type="button"
          onClick={() => onDetail(s.student_id)}
          className="w-full text-left bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            s.needs_attention ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {(s.display_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm truncate">{s.display_name}</span>
              {s.needs_attention && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> {s.total_xp} XP</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {s.assignments_completed} bài</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {s.days_inactive >= 999 ? 'Chưa HĐ' : s.days_inactive === 0 ? 'Hôm nay' : `${s.days_inactive}d trước`}
              </span>
            </div>
          </div>
          <div className="shrink-0 w-24">
            <AnimatedBar
              value={s.avg_score}
              color={s.avg_score >= 70 ? 'bg-emerald-500' : s.avg_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}
              delay={i * 50}
            />
            <div className="text-[10px] text-slate-500 text-right mt-0.5">{s.avg_score}%</div>
          </div>
          {/* Send to parent button */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => handleSend(e, s.student_id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(e as unknown as React.MouseEvent, s.student_id); }}
            className={`shrink-0 min-w-9 min-h-9 flex items-center justify-center rounded-lg transition ${
              sentIds.has(s.student_id)
                ? 'bg-emerald-600/20 text-emerald-400'
                : sendingId === s.student_id
                  ? 'bg-blue-600/20 text-blue-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10'
            }`}
            title="Gửi báo cáo về PH"
          >
            {sentIds.has(s.student_id) ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function SkillsView({ data }: { data: SkillRow[] }) {
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  const sorted = [...data].sort((a, b) => a.accuracy - b.accuracy);
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      {sorted.map((s, i) => (
        <div key={s.skill} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">{s.skill}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{s.total_attempts} lượt</span>
              <ScoreBadge value={s.accuracy} size="sm" />
            </div>
          </div>
          <AnimatedBar
            value={s.accuracy}
            color={s.accuracy >= 70 ? 'bg-emerald-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            delay={i * 30}
          />
          {s.accuracy < 50 && (
            <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Kỹ năng cần giảng lại
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionsView({ data }: { data: QuestionRow[] }) {
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>;
  const sorted = [...data].sort((a, b) => a.accuracy - b.accuracy);
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      {sorted.map((q, i) => (
        <div key={q.question_id} className={`bg-slate-900/80 border rounded-xl p-4 ${q.accuracy < 50 ? 'border-red-900/40' : 'border-slate-800'}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm text-white flex-1">{q.content}</p>
            <ScoreBadge value={q.accuracy} size="sm" />
          </div>
          <AnimatedBar
            value={q.accuracy}
            color={q.accuracy >= 70 ? 'bg-emerald-500' : q.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            delay={i * 30}
          />
          <div className="flex gap-3 mt-1.5 text-[10px] text-slate-500">
            <span>{q.total_attempts} lượt trả lời</span>
            <span>{q.correct_count} đúng</span>
            {q.avg_time_seconds != null && <span>TB {q.avg_time_seconds}s</span>}
            {q.accuracy < 40 && <span className="text-red-400 font-medium">⚠ Cần giảng lại</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Student Detail Modal ──

function StudentDetailModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [report, setReport] = useState<DetailReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: boolean; parent_names: string[]; error?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/teacher/reports/student?student_id=${studentId}`)
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setReport(d); })
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleSendToParent = async () => {
    setSending(true);
    setSendResult(null);
    const res = await fetch(`/api/teacher/reports?tab=send-to-parent&student=${studentId}`);
    const result = await res.json();
    setSendResult(result);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold">
              {loading ? 'Đang tải...' : report ? report.display_name : 'Không tìm thấy'}
            </h3>
            {report && (
              <button
                onClick={handleSendToParent}
                disabled={sending}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg min-h-[36px] flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {sending ? '⏳ Đang gửi...' : '📨 Gửi báo cáo về PH'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Send result notification */}
        {sendResult && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-sm ${
            sendResult.sent
              ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-300'
              : 'bg-red-950/30 border border-red-800/40 text-red-300'
          }`}>
            {sendResult.sent
              ? `✅ Đã gửi báo cáo đến PH: ${sendResult.parent_names.join(', ')}`
              : `❌ ${sendResult.error}`}
          </div>
        )}

        {report && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-900/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-amber-400">{report.total_xp}</div>
                <div className="text-xs text-amber-300">Tổng XP</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                <Trophy className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-indigo-400">Cấp {report.level}</div>
                <div className="text-xs text-indigo-300">Cấp độ</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-white">
                  {report.question_details.filter((q) => q.is_correct).length}/
                  {report.question_details.length}
                </div>
                <div className="text-xs text-emerald-300">Câu đúng</div>
              </div>
            </div>

            {/* Skill breakdown */}
            {report.skill_breakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Phân tích kỹ năng
                </h4>
                <div className="space-y-2">
                  {report.skill_breakdown.map((s, i) => (
                    <div key={s.skill} className="flex items-center gap-3">
                      <span className="text-xs w-28 truncate text-slate-300">{s.skill}</span>
                      <AnimatedBar
                        value={s.accuracy}
                        color={s.accuracy >= 70 ? 'bg-emerald-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                        delay={i * 50}
                      />
                      <span className="text-xs text-slate-400 w-14 text-right">{s.correct}/{s.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions */}
            {report.submissions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Bài nộp
                </h4>
                <div className="space-y-2">
                  {report.submissions.map((s, i) => {
                    const pct = s.total_score != null && s.max_score ? Math.round((s.total_score / s.max_score) * 100) : null;
                    return (
                      <div key={i} className="bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-white">{s.assignment_title}</span>
                          {s.submitted_at && (
                            <span className="text-[10px] text-slate-500 ml-2">
                              {new Date(s.submitted_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        {pct != null ? (
                          <ScoreBadge value={pct} size="sm" />
                        ) : (
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded">{s.status}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question details */}
            {report.question_details.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-3">Chi tiết câu hỏi</h4>
                <div className="space-y-1.5">
                  {report.question_details.map((q, i) => (
                    <div key={i} className={`rounded-xl p-3 flex items-start gap-2 ${
                      q.is_correct ? 'bg-emerald-950/20 border border-emerald-900/30' :
                      q.is_correct === false ? 'bg-red-950/20 border border-red-900/30' :
                      'bg-slate-800/60 border border-slate-800'
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {q.is_correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : q.is_correct === false ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <span className="w-4 h-4 block rounded-full bg-slate-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-2">{q.question_content}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{q.assignment_title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
