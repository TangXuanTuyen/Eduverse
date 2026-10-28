'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X, CheckCircle2, XCircle, TrendingUp, Users, BookOpen,
  AlertTriangle, ChevronRight, ArrowLeft, BarChart3, Trophy,
  Clock, Target, Zap, Send, FileSpreadsheet, Filter,
  GraduationCap, Activity, Award, Mail, Phone, FlaskConical,
  BookOpenCheck, Eye,
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
  pending_assignments: number;
};

type TimeSaved = {
  auto_graded_count: number;
  total_submissions: number;
};

type StemRow = {
  assignment_id: string;
  title: string;
  assignment_type: 'lesson' | 'experiment';
  room_name: string;
  total_students: number;
  completed_count: number;
  completion_rate: number;
};

type ErrorRow = {
  skill: string;
  wrong_count: number;
  total_count: number;
  error_rate: number;
  sample_questions: string[];
};

type TrendRow = {
  week_label: string;
  week_start: string;
  submissions_count: number;
  graded_count: number;
  avg_score: number;
  completion_rate: number;
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

type AssignmentOption = {
  id: string;
  title: string;
  assignment_type: string;
  due_at: string | null;
};

type AssignmentInsightsData = {
  assignment_id: string;
  source: 'ai' | 'rules';
  overview: string;
  issues: Array<{ question: number; problem: string; action: string }>;
  suggestions: string[];
};

type AssignmentDetailData = {
  assignment_id: string;
  title: string;
  totalStudents: number;
  submittedCount: number;
  avgScore: number;
  passRate: number;
  maxScore: number;
  scoreBuckets: { label: string; count: number }[];
  questions: Array<{
    id: string;
    sort_order: number;
    content: string;
    type: string;
    points: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    correctRate: number;
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

function AnimatedBar({ value, color, delay = 0, height = 'h-2.5' }: { value: number; color: string; delay?: number; height?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className={`flex-1 bg-slate-800/80 rounded-full ${height} overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ScoreBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : value >= 40 ? 'text-orange-400' : 'text-red-400';
  const bg = value >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : value >= 60 ? 'bg-amber-500/10 border-amber-500/20' : value >= 40 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20';
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-xl px-4 py-1.5' : 'text-base px-3 py-1';
  return <span className={`font-bold rounded-lg border ${color} ${bg} ${sz}`}>{value}%</span>;
}

function DonutChart({ value, total, size = 120 }: { value: number; total: number; size?: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          className="transition-all duration-700"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white" fontSize={size > 100 ? 28 : 22} fontWeight="bold">{pct}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" fontSize={11}>{value}/{total}</text>
      </svg>
    </div>
  );
}

function VerticalBarChart({ data }: { data: { label: string; value: number; color: string; pct: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-center gap-6 h-48">
      {data.map((d) => {
        const barH = Math.max((d.value / maxVal) * 140, d.value > 0 ? 8 : 0);
        return (
          <div key={d.label} className="flex flex-col items-center gap-2 flex-1 max-w-20">
            <span className="text-xs font-bold text-white">{d.value}</span>
            <span className="text-[10px] text-slate-500">{d.pct}%</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-700 ${d.color}`}
              style={{ height: `${barH}px`, minWidth: '32px' }}
            />
            <span className="text-[11px] text-slate-400 text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ value, label, sublabel, color, icon: Icon }: {
  value: string | number; label: string; sublabel?: string;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles = {
    blue: 'from-blue-600/15 to-blue-900/10 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-600/15 to-emerald-900/10 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-600/15 to-amber-900/10 border-amber-500/20 text-amber-400',
    red: 'from-red-600/15 to-red-900/10 border-red-500/20 text-red-400',
    purple: 'from-purple-600/15 to-purple-900/10 border-purple-500/20 text-purple-400',
    cyan: 'from-cyan-600/15 to-cyan-900/10 border-cyan-500/20 text-cyan-400',
  };
  const s = styles[color];
  return (
    <div className={`bg-gradient-to-br ${s.split(' ').slice(0, 2).join(' ')} border ${s.split(' ')[2]} rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${s.split(' ').slice(-1)[0]}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sublabel && <div className="text-[11px] text-slate-500 mt-1">{sublabel}</div>}
    </div>
  );
}

function DistributionBar({ dist }: { dist: { excellent: number; good: number; average: number; weak: number } }) {
  const total = dist.excellent + dist.good + dist.average + dist.weak;
  if (total === 0) return <div className="h-5 bg-slate-800/80 rounded-full" />;
  return (
    <div className="flex h-5 rounded-full overflow-hidden gap-px bg-slate-800/40">
      {dist.excellent > 0 && <div className="bg-emerald-500 transition-all duration-500 rounded-l-full first:rounded-l-full" style={{ width: `${(dist.excellent / total) * 100}%` }} title={`Giỏi: ${dist.excellent}`} />}
      {dist.good > 0 && <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(dist.good / total) * 100}%` }} title={`Khá: ${dist.good}`} />}
      {dist.average > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(dist.average / total) * 100}%` }} title={`TB: ${dist.average}`} />}
      {dist.weak > 0 && <div className="bg-red-500 transition-all duration-500 last:rounded-r-full" style={{ width: `${(dist.weak / total) * 100}%` }} title={`Yếu: ${dist.weak}`} />}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, subtitle, gradient, iconColor }: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  subtitle?: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div className={`${gradient} rounded-2xl p-4 group hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-300 mt-0.5">{label}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconColor = 'text-blue-400' }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center">
        <BarChart3 className="w-7 h-7 text-slate-600" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { key: 'rooms', label: 'Theo lớp', icon: Users },
  { key: 'students', label: 'Theo học sinh', icon: GraduationCap },
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
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [showInactiveDetail, setShowInactiveDetail] = useState(false);
  const [stemData, setStemData] = useState<StemRow[]>([]);
  const [errorData, setErrorData] = useState<ErrorRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionRow[]>([]);
  const [ovRoomId, setOvRoomId] = useState<string | null>(null);
  const [ovAssignments, setOvAssignments] = useState<AssignmentOption[]>([]);
  const [ovAssignmentId, setOvAssignmentId] = useState<string | null>(null);
  const [ovDetail, setOvDetail] = useState<AssignmentDetailData | null>(null);
  const [ovLoading, setOvLoading] = useState(false);
  const [ovInsights, setOvInsights] = useState<AssignmentInsightsData | null>(null);
  const [ovInsightsLoading, setOvInsightsLoading] = useState(false);

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
    fetch('/api/teacher/reports?tab=trends').then((r) => r.json()).then((d) => setTrends(d));
    fetch('/api/teacher/reports?tab=stem').then((r) => r.json()).then((d) => setStemData(d));
    fetch('/api/teacher/reports?tab=errors').then((r) => r.json()).then((d) => setErrorData(d));
    fetch('/api/teacher/reports?tab=students').then((r) => r.json()).then((d) => setAllStudents(d));
    fetch('/api/teacher/reports?tab=questions').then((r) => r.json()).then((d) => setAllQuestions(d));
  }, []);

  // Re-fetch trends when room filter changes
  useEffect(() => {
    const params = new URLSearchParams({ tab: 'trends' });
    if (roomFilter) params.set('room', roomFilter);
    fetch(`/api/teacher/reports?${params}`).then((r) => r.json()).then((d) => setTrends(d));
    const stemParams = new URLSearchParams({ tab: 'stem' });
    if (roomFilter) stemParams.set('room', roomFilter);
    fetch(`/api/teacher/reports?${stemParams}`).then((r) => r.json()).then((d) => setStemData(d));
    const errorParams = new URLSearchParams({ tab: 'errors' });
    if (roomFilter) errorParams.set('room', roomFilter);
    fetch(`/api/teacher/reports?${errorParams}`).then((r) => r.json()).then((d) => setErrorData(d));
    const studParams = new URLSearchParams({ tab: 'students' });
    if (roomFilter) studParams.set('room', roomFilter);
    fetch(`/api/teacher/reports?${studParams}`).then((r) => r.json()).then((d) => setAllStudents(d));
    const qParams = new URLSearchParams({ tab: 'questions' });
    if (roomFilter) qParams.set('room', roomFilter);
    fetch(`/api/teacher/reports?${qParams}`).then((r) => r.json()).then((d) => setAllQuestions(d));
  }, [roomFilter]);

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

  const filteredRooms = roomFilter ? rooms.filter((r) => r.room_id === roomFilter) : rooms;
  const filteredInactive = roomFilter ? inactive.filter((s) => {
    const room = rooms.find((r) => r.room_name === s.room_name);
    return room && room.room_id === roomFilter;
  }) : inactive;

  const totalStudents = filteredRooms.reduce((s, r) => s + r.member_count, 0);
  const totalAssignments = filteredRooms.reduce((s, r) => s + r.assignment_count, 0);
  const totalGraded = filteredRooms.reduce((s, r) => s + r.submissions_graded, 0);
  const totalSubmissions = filteredRooms.reduce((s, r) => s + r.submissions_total, 0);
  // Weighted average: rooms with more graded submissions count more
  const weightedSum = filteredRooms.reduce((s, r) => s + r.avg_accuracy * r.submissions_graded, 0);
  const overallAvg = totalGraded > 0 ? Math.round(weightedSum / totalGraded) : -1;
  const hasGradedData = totalGraded > 0;

  // ── Room Detail View ──
  if (selectedRoom) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedRoom(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 transition-all hover:border-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{selectedRoom.room_name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {selectedRoom.grade ? `Khối ${selectedRoom.grade} · ` : ''}{selectedRoom.member_count} học sinh · {selectedRoom.assignment_count} bài giao
            </p>
          </div>
        </div>

        {/* Room overview cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={CheckCircle2}
            value={selectedRoom.submissions_total > 0 ? `${selectedRoom.submissions_graded}/${selectedRoom.submissions_total}` : '—'}
            label="Đã chấm / đã nộp"
            subtitle={selectedRoom.submissions_total === 0 ? 'Chưa có bài nộp' : undefined}
            gradient="bg-gradient-to-br from-blue-600/15 to-blue-900/10 border border-blue-500/20"
            iconColor="bg-blue-500/20"
          />
          <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 text-center flex flex-col items-center justify-center">
            {selectedRoom.submissions_graded > 0 ? (
              <ScoreBadge value={selectedRoom.avg_accuracy} size="lg" />
            ) : (
              <div className="text-2xl font-bold text-slate-500">—</div>
            )}
            <div className="text-xs text-emerald-300 mt-2">Điểm trung bình</div>
            {selectedRoom.submissions_graded === 0 && (
              <div className="text-[10px] text-slate-500 mt-0.5">Chưa có bài được chấm</div>
            )}
          </div>
          <StatCard
            icon={Users} value={selectedRoom.member_count}
            label="Học sinh" gradient="bg-gradient-to-br from-purple-600/15 to-purple-900/10 border border-purple-500/20"
            iconColor="bg-purple-500/20"
          />
        </div>

        {roomDetailsLoading ? (
          <LoadingState />
        ) : roomDetails.length === 0 ? (
          <EmptyState message="Chưa có bài giao nào." />
        ) : (
          <div className="space-y-4">
            <SectionHeader icon={BookOpen} title="Từng bài giao" subtitle={`${roomDetails.length} bài`} iconColor="text-purple-400" />
            {roomDetails.map((a) => {
              const typeLabel = a.assignment_type === 'lesson' ? 'Bài học' : a.assignment_type === 'experiment' ? 'Thí nghiệm' : a.assignment_type === 'model3d' ? 'Mô hình 3D' : a.assignment_type === 'stem' ? 'STEM' : 'Trắc nghiệm';
              const typeColor = a.assignment_type === 'lesson' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : a.assignment_type === 'experiment' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
              const completionRate = a.total_students > 0 ? Math.round((a.submitted_count / a.total_students) * 100) : 0;
              const avgPct = a.max_score > 0 ? Math.round((a.avg_score / a.max_score) * 100) : 0;

              return (
                <div key={a.assignment_id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeColor}`}>{typeLabel}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{a.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        {a.due_at && ` · Hạn: ${new Date(a.due_at).toLocaleDateString('vi-VN')}`}
                      </p>
                    </div>
                    {a.max_score > 0 && <ScoreBadge value={avgPct} />}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-400">Tiến độ nộp bài</span>
                        <span className="text-white font-medium">{a.submitted_count}/{a.total_students}</span>
                      </div>
                      <AnimatedBar value={completionRate} color="bg-blue-500" />
                    </div>
                    {a.max_score > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-400">Điểm trung bình</span>
                          <span className="text-white font-medium">{a.avg_score}/{a.max_score}</span>
                        </div>
                        <AnimatedBar value={avgPct} color={avgPct >= 70 ? 'bg-emerald-500' : avgPct >= 50 ? 'bg-amber-500' : 'bg-red-500'} delay={100} />
                      </div>
                    )}
                  </div>

                  {a.max_score > 0 && a.graded_count > 0 && (() => {
                    const dt = a.score_distribution.excellent + a.score_distribution.good + a.score_distribution.average + a.score_distribution.weak;
                    return dt > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-2">Phân bố điểm</div>
                        <div className="flex items-end gap-3 h-24">
                          {([
                            { l: 'Giỏi', v: a.score_distribution.excellent, c: 'bg-emerald-500' },
                            { l: 'Khá', v: a.score_distribution.good, c: 'bg-blue-500' },
                            { l: 'TB', v: a.score_distribution.average, c: 'bg-amber-500' },
                            { l: 'Yếu', v: a.score_distribution.weak, c: 'bg-red-500' },
                          ]).map(d => {
                            const maxV = Math.max(a.score_distribution.excellent, a.score_distribution.good, a.score_distribution.average, a.score_distribution.weak, 1);
                            const h = Math.max((d.v / maxV) * 72, d.v > 0 ? 4 : 0);
                            return (
                              <div key={d.l} className="flex flex-col items-center gap-1 flex-1">
                                <span className="text-[10px] text-white font-bold">{d.v}</span>
                                <div className={`w-full rounded-t-md ${d.c}`} style={{ height: `${h}px` }} />
                                <span className="text-[9px] text-slate-500">{d.l}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <DonutChart value={a.submitted_count} total={a.total_students} size={90} />
                        <div className="text-[10px] text-slate-400 mt-1">Đã nộp</div>
                      </div>
                    </div>
                    ) : null;
                  })()}

                  {a.hard_questions.length > 0 && (
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        Câu sai nhiều — cần giảng lại
                      </div>
                      {a.hard_questions.map((q) => (
                        <div key={q.question_id} className="flex items-start justify-between gap-3 py-1">
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

        <AuthorFooter />
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Báo cáo & Phân tích
          </h1>
          <p className="text-sm text-slate-300/80 mt-1">Theo dõi tiến độ học tập của học sinh</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 text-sm bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-xl min-h-[44px] flex items-center gap-2 transition-all hover:border-slate-600"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams({ tab: 'all' });
              if (roomFilter) params.set('room', roomFilter);
              window.open(`/api/teacher/reports/export?${params}`, '_blank');
            }}
            className="px-3 py-2.5 text-sm bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/30 rounded-xl min-h-[44px] flex items-center gap-2 transition-all hover:border-emerald-600/40 text-emerald-400"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Tổng hợp</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-sm font-medium min-h-[44px] min-w-[44px] transition-all duration-200 whitespace-nowrap ${
              tab === t.key
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-[13px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Room filter */}
      {rooms.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-xl bg-slate-800/80 border border-slate-700/50 px-3 py-2 text-sm text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          >
            <option value="">Tất cả lớp</option>
            {rooms.map((r) => (
              <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Overview Tab — Decision Dashboard */}
      {tab === 'overview' && (() => {
        const handleRoomChange = async (rid: string) => {
          setOvRoomId(rid);
          setOvAssignmentId(null);
          setOvDetail(null);
          if (!rid) { setOvAssignments([]); return; }
          const res = await fetch(`/api/teacher/reports?tab=room-assignments&room=${rid}`);
          const list = await res.json();
          setOvAssignments(list);
        };
        const handleAssignmentChange = async (aid: string) => {
          setOvAssignmentId(aid);
          setOvInsights(null);
          if (!aid) { setOvDetail(null); return; }
          setOvLoading(true);
          setOvInsightsLoading(true);
          fetch(`/api/teacher/reports/insights?assignment=${aid}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setOvInsights(d))
            .finally(() => setOvInsightsLoading(false));
          const res = await fetch(`/api/teacher/reports?tab=assignment-detail&assignment=${aid}`);
          const d = await res.json();
          setOvDetail(d);
          setOvLoading(false);
        };

        return (
        <div className="space-y-6">
          {/* ── Chọn lớp & bài ── */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">Phân tích theo bài tập</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Chọn lớp</label>
                <select
                  value={ovRoomId ?? ''}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer"
                >
                  <option value="">— Chọn lớp —</option>
                  {rooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>{r.room_name} ({r.member_count} HS)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Chọn bài kiểm tra</label>
                <select
                  value={ovAssignmentId ?? ''}
                  onChange={(e) => handleAssignmentChange(e.target.value)}
                  disabled={!ovRoomId}
                  className="w-full min-h-[44px] bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer disabled:opacity-40"
                >
                  <option value="">— Chọn bài —</option>
                  {ovAssignments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}{a.due_at ? ` · hạn ${new Date(a.due_at).toLocaleDateString('vi')}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Prompt when nothing selected */}
          {!ovAssignmentId && !ovLoading && (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{!ovRoomId ? 'Chọn lớp để bắt đầu phân tích' : 'Chọn bài kiểm tra để xem kết quả'}</p>
            </div>
          )}

          {ovLoading && <LoadingState />}

          {ovDetail && !ovLoading && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users} value={ovDetail.totalStudents} label="Tổng học sinh" color="blue" />
                <KpiCard icon={CheckCircle2} value={`${ovDetail.submittedCount}/${ovDetail.totalStudents}`} label="Đã nộp bài" sublabel={ovDetail.totalStudents > 0 ? `${Math.round((ovDetail.submittedCount / ovDetail.totalStudents) * 100)}%` : undefined} color="emerald" />
                <KpiCard icon={Target} value={ovDetail.avgScore >= 0 ? `${ovDetail.avgScore}%` : '—'} label="Điểm trung bình" color={ovDetail.avgScore >= 60 ? 'cyan' : 'amber'} />
                <KpiCard icon={Trophy} value={ovDetail.passRate >= 0 ? `${ovDetail.passRate}%` : '—'} label="Tỷ lệ đạt (≥50%)" color={ovDetail.passRate >= 70 ? 'emerald' : ovDetail.passRate >= 50 ? 'amber' : 'red'} />
              </div>

              {/* Score Histogram */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <SectionHeader icon={BarChart3} title="Phân bố điểm số" subtitle={`${ovDetail.submittedCount} bài nộp`} iconColor="text-indigo-400" />
                <ScoreHistogram buckets={ovDetail.scoreBuckets} />
              </div>

              {/* Per-question counts */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <SectionHeader icon={BarChart3} title="Phân bố kết quả theo câu" subtitle="Số học sinh đúng và sai mỗi câu" iconColor="text-cyan-400" />
                <QuestionColumnChart questions={ovDetail.questions} />
              </div>

              {/* Per-question breakdown */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <SectionHeader icon={BookOpen} title="Chi tiết từng câu" subtitle={`${ovDetail.questions.length} câu hỏi`} iconColor="text-cyan-400" />
                <QuestionBreakdown questions={ovDetail.questions} />
              </div>

              {(() => {
                const ready = ovInsights && ovInsights.assignment_id === ovAssignmentId ? ovInsights : null;
                return (
                  <>
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                      <SectionHeader
                        icon={Eye}
                        title="Phân tích tổng quan"
                        subtitle={ready ? (ready.source === 'ai' ? 'Phân tích bởi AI, cần giáo viên xác nhận' : 'Tự động theo số liệu (AI tạm không khả dụng)') : undefined}
                        iconColor="text-indigo-400"
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4">
                          {ready ? (
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{ready.overview}</p>
                          ) : (
                            <p className="text-sm text-slate-400">{ovInsightsLoading ? 'AI đang phân tích bài làm...' : 'Chưa có phân tích.'}</p>
                          )}
                        </div>
                        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-red-300 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Vấn đề cần cải thiện</h4>
                          {ready && ready.issues.length > 0 ? (
                            <ul className="space-y-3 text-sm text-slate-300">
                              {ready.issues.map((it, i) => (
                                <li key={i} className="leading-relaxed">
                                  <span className="text-red-300 font-semibold">{it.question > 0 ? `Câu ${it.question}: ` : ''}</span>
                                  {it.problem}
                                  {it.action && <div className="text-xs text-slate-500 mt-0.5">→ {it.action}</div>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">{ovInsightsLoading ? 'Đang tải...' : 'Chưa phát hiện điểm yếu nổi bật.'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5">
                      <SectionHeader icon={Zap} title="Đề xuất cho giáo viên" iconColor="text-indigo-300" />
                      {ready && ready.suggestions.length > 0 ? (
                        <ol className="space-y-2.5 text-sm text-slate-200">
                          {ready.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-3 leading-relaxed">
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-600/25 text-indigo-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-slate-400">{ovInsightsLoading ? 'Đang tải...' : 'Chưa đủ bài nộp để đưa ra đề xuất.'}</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {(() => {
            const studentsWithScore = allStudents.filter(s => s.avg_score >= 0);
            const excellent = studentsWithScore.filter(s => s.avg_score >= 80).length;
            const good = studentsWithScore.filter(s => s.avg_score >= 60 && s.avg_score < 80).length;
            const average = studentsWithScore.filter(s => s.avg_score >= 40 && s.avg_score < 60).length;
            const weak = studentsWithScore.filter(s => s.avg_score < 40).length;
            const distTotal = excellent + good + average + weak;
            const needsSupport = allStudents.filter(s => s.needs_attention).length;
            const hardQuestions = [...allQuestions].sort((a, b) => a.accuracy - b.accuracy).filter(q => q.accuracy < 60).slice(0, 5);
            const completionPct = totalStudents > 0 && totalAssignments > 0 ? Math.round((totalSubmissions / (totalStudents * totalAssignments)) * 100) : -1;
            return (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">Tổng quan học tập</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={Users} value={totalStudents} label="Học sinh đang theo dõi" sublabel={`${filteredRooms.length} lớp`} color="blue" />
                    <KpiCard
                      icon={CheckCircle2}
                      value={completionPct >= 0 ? `${completionPct}%` : '—'}
                      label="Tỷ lệ hoàn thành"
                      sublabel={completionPct >= 0 ? `${totalSubmissions} / ${totalStudents * totalAssignments} lượt nộp` : 'Chưa giao bài'}
                      color={completionPct >= 70 ? 'emerald' : completionPct >= 40 ? 'amber' : 'cyan'}
                    />
                    <button
                      type="button" onClick={() => setTab('students')}
                      className="text-left bg-gradient-to-br from-red-600/15 to-red-900/10 border border-red-500/20 rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-400">Cần hỗ trợ học tập</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{needsSupport}</div>
                      <div className="text-[11px] text-slate-500 mt-1 group-hover:text-red-400 transition-colors">Điểm thấp hoặc thiếu bài →</div>
                    </button>
                    <button
                      type="button" onClick={() => setShowInactiveDetail(true)}
                      className="text-left bg-gradient-to-br from-amber-600/15 to-amber-900/10 border border-amber-500/20 rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-400">Chưa hoạt động ≥7 ngày</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{filteredInactive.length}</div>
                      <div className="text-[11px] text-slate-500 mt-1 group-hover:text-amber-400 transition-colors">Bấm để xem danh sách →</div>
                    </button>
                  </div>
                </div>

                {(needsSupport > 0 || hardQuestions.length > 0 || filteredInactive.length > 0) && (
                  <div className="bg-gradient-to-r from-indigo-950/30 to-blue-950/20 border border-indigo-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Việc cần làm trước
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {needsSupport > 0 && (
                        <button type="button" onClick={() => setTab('students')}
                          className="text-left bg-red-950/20 border border-red-900/25 rounded-xl p-4 hover:border-red-700/40 transition-all cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-white">Học sinh cần hỗ trợ</span>
                          </div>
                          <p className="text-xs text-slate-400">{needsSupport} em có điểm thấp hoặc thiếu bài. Xem danh sách, lý do và bài tập còn thiếu.</p>
                          <span className="text-[11px] text-red-400 mt-2 inline-block group-hover:underline">Xem danh sách →</span>
                        </button>
                      )}
                      {hardQuestions.length > 0 && (
                        <button type="button" onClick={() => setTab('questions')}
                          className="text-left bg-amber-950/20 border border-amber-900/25 rounded-xl p-4 hover:border-amber-700/40 transition-all cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">Kiến thức cần dạy lại</span>
                          </div>
                          <p className="text-xs text-slate-400">{hardQuestions.length} câu có tỷ lệ đúng dưới 60%. Đi đến kỹ năng và câu hỏi có tỷ lệ đúng thấp.</p>
                          <span className="text-[11px] text-amber-400 mt-2 inline-block group-hover:underline">Xem phân tích →</span>
                        </button>
                      )}
                      {filteredInactive.length > 0 && (
                        <button type="button" onClick={() => setShowInactiveDetail(true)}
                          className="text-left bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/50 transition-all cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-white">Học sinh chưa hoạt động</span>
                          </div>
                          <p className="text-xs text-slate-400">{filteredInactive.length} em chưa hoạt động ≥7 ngày. Kiểm tra lý do và liên hệ phụ huynh.</p>
                          <span className="text-[11px] text-slate-400 mt-2 inline-block group-hover:underline">Xem danh sách →</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                    <SectionHeader icon={BarChart3} title="Phân bố kết quả" subtitle={distTotal > 0 ? `${distTotal} học sinh có điểm` : undefined} iconColor="text-indigo-400" />
                    {distTotal > 0 ? (
                      <VerticalBarChart data={[
                        { label: 'Giỏi', value: excellent, color: 'bg-emerald-500', pct: Math.round((excellent / distTotal) * 100) },
                        { label: 'Khá', value: good, color: 'bg-blue-500', pct: Math.round((good / distTotal) * 100) },
                        { label: 'TB', value: average, color: 'bg-amber-500', pct: Math.round((average / distTotal) * 100) },
                        { label: 'Yếu', value: weak, color: 'bg-red-500', pct: Math.round((weak / distTotal) * 100) },
                      ]} />
                    ) : (
                      <EmptyState message="Chưa có dữ liệu điểm" />
                    )}
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                    <SectionHeader icon={Eye} title="Tỷ lệ hoàn thành bài" iconColor="text-blue-400" />
                    {totalAssignments > 0 ? (
                      <>
                        <div className="flex items-center justify-center py-4">
                          <DonutChart value={totalSubmissions} total={totalStudents * totalAssignments} size={140} />
                        </div>
                        <div className="flex justify-center gap-6 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã nộp</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Chưa nộp</span>
                        </div>
                      </>
                    ) : (
                      <EmptyState message="Chưa giao bài tập" />
                    )}
                  </div>
                </div>

                {hardQuestions.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                    <SectionHeader icon={AlertTriangle} title="Cần dạy lại ngay" subtitle={`Top ${hardQuestions.length} câu có tỷ lệ đúng thấp nhất`} iconColor="text-red-400" />
                    <div className="space-y-3">
                      {hardQuestions.map((q, i) => {
                        const wrongPct = 100 - q.accuracy;
                        const priority = q.accuracy < 30 ? 'Ưu tiên cao' : q.accuracy < 50 ? 'Ưu tiên' : 'Nên ôn';
                        const prColor = q.accuracy < 30 ? 'bg-red-500/15 text-red-400' : q.accuracy < 50 ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400';
                        return (
                          <div key={`${q.question_id}-${i}`} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:border-red-900/40 transition-colors">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <p className="text-sm text-white flex-1 line-clamp-2">{q.content}</p>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${prColor}`}>{priority}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-lg font-bold text-red-400">{q.accuracy}%</span>
                                  <span className="text-xs text-slate-500">trả lời đúng</span>
                                </div>
                                <AnimatedBar value={q.accuracy} color={q.accuracy < 30 ? 'bg-red-500' : q.accuracy < 50 ? 'bg-amber-500' : 'bg-blue-500'} delay={i * 80} />
                              </div>
                              <div className="text-right text-[11px] text-slate-500 shrink-0">
                                <div>{q.total_attempts} lượt</div>
                                <div className="text-red-400 font-medium">{wrongPct}% sai</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <TrendChart data={trends} />

                {errorData.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                    <SectionHeader icon={XCircle} title="Kiến thức cần dạy lại" subtitle="Xếp hạng theo tỷ lệ sai" iconColor="text-red-400" />
                    <div className="space-y-2.5">
                      {errorData.slice(0, 6).map((e, i) => (
                        <div key={e.skill} className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${e.error_rate >= 50 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{skillLabel(e.skill)}</div>
                            <div className="text-[10px] text-slate-500 truncate">{e.sample_questions[0]}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`text-sm font-bold ${e.error_rate >= 50 ? 'text-red-400' : 'text-amber-400'}`}>{e.error_rate}%</div>
                            <div className="text-[10px] text-slate-500">sai</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stemData.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                    <SectionHeader icon={FlaskConical} title="Hoạt động STEM" subtitle={`${stemData.length} nhiệm vụ`} iconColor="text-teal-400" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {stemData.map((s) => (
                        <div key={s.assignment_id} className="bg-slate-800/30 rounded-xl p-3.5 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.assignment_type === 'experiment' ? 'bg-teal-600/15 text-teal-400' : 'bg-violet-600/15 text-violet-400'}`}>
                            {s.assignment_type === 'experiment' ? <FlaskConical className="w-4 h-4" /> : <BookOpenCheck className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{s.title}</div>
                            <div className="text-[11px] text-slate-500">{s.room_name} · {s.completed_count}/{s.total_students}</div>
                          </div>
                          <div className={`text-sm font-bold shrink-0 ${s.completion_rate >= 70 ? 'text-emerald-400' : s.completion_rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {s.completion_rate}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <SectionHeader icon={Users} title="Tình hình các lớp" subtitle={`${filteredRooms.length} lớp`} />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRooms.map((r) => (
                      <button key={r.room_id} type="button" onClick={() => openRoomDetail(r)}
                        className="w-full text-left bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-indigo-500/30 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                              {r.grade ?? <BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white text-sm truncate">{r.room_name}</div>
                              <div className="text-[10px] text-slate-500">{r.member_count} HS · {r.assignment_count} bài</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {r.submissions_graded > 0 ? <ScoreBadge value={r.avg_accuracy} size="sm" /> : <span className="text-xs text-slate-500">—</span>}
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                        <AnimatedBar value={r.submissions_total > 0 ? Math.round((r.submissions_graded / r.submissions_total) * 100) : 0} color="bg-blue-500" />
                        <div className="text-[10px] text-slate-500 text-right mt-1">{r.submissions_graded}/{r.submissions_total} chấm</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {/* Inactive detail modal */}
      {showInactiveDetail && filteredInactive.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Học sinh chưa hoạt động ≥7 ngày</h3>
                  <p className="text-xs text-slate-500">{filteredInactive.length} em — không đồng nghĩa với học sinh yếu</p>
                </div>
              </div>
              <button onClick={() => setShowInactiveDetail(false)} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-1">
              {filteredInactive.map((s) => (
                <button key={s.student_id} type="button" onClick={() => { setShowInactiveDetail(false); setDetailStudentId(s.student_id); }}
                  className="w-full flex items-center gap-3 text-sm py-3 px-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    {(s.display_name ?? '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white truncate block">{s.display_name}</span>
                    <span className="text-[10px] text-slate-500">{s.room_name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${s.pending_assignments > 0 ? 'bg-red-500/10 text-red-400' : 'text-slate-500'}`}>
                    {s.pending_assignments > 0 ? `${s.pending_assignments} bài thiếu` : '—'}
                  </span>
                  <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
                    {s.days_inactive >= 999 ? 'Chưa từng' : `${s.days_inactive} ngày`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      {loading && tab !== 'overview' ? (
        <LoadingState />
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

      <AuthorFooter />
    </div>
  );
}

// ── Trend Chart (SVG) ──

function TrendChart({ data }: { data: TrendRow[] }) {
  const [range, setRange] = useState<4 | 8 | 20>(8);
  if (!data || data.length === 0) return null;

  const filtered = data.slice(-range);
  const hasScores = filtered.some((d) => d.avg_score >= 0);
  const hasSubs = filtered.some((d) => d.submissions_count > 0);
  if (!hasScores && !hasSubs) return null;

  const W = 600;
  const H = 200;
  const PL = 40;
  const PR = 16;
  const PT = 20;
  const PB = 32;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxSubs = Math.max(...filtered.map((d) => d.submissions_count), 1);
  const step = chartW / Math.max(filtered.length - 1, 1);

  const scorePts = filtered.map((d, i) => ({
    x: PL + i * step,
    y: d.avg_score >= 0 ? PT + chartH - (d.avg_score / 100) * chartH : -1,
    hasData: d.submissions_count > 0,
  }));

  // Build line segments — break at weeks with no data
  const scoreSegments: string[] = [];
  let current = '';
  for (const p of scorePts) {
    if (p.y < 0 || !p.hasData) {
      if (current) { scoreSegments.push(current); current = ''; }
    } else {
      current += `${current ? 'L' : 'M'}${p.x},${p.y} `;
    }
  }
  if (current) scoreSegments.push(current);

  const rangeLabel = range === 4 ? '4 tuần' : range === 8 ? '8 tuần' : 'Học kỳ';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader icon={TrendingUp} title="Xu hướng học tập" subtitle={`${rangeLabel} gần nhất`} iconColor="text-cyan-400" />
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-0.5">
          {([4, 8, 20] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs rounded-md min-h-[36px] transition-colors ${range === r ? 'bg-cyan-600/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}>
              {r === 4 ? '4 tuần' : r === 8 ? '8 tuần' : 'Học kỳ'}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ xu hướng">
          {[0, 25, 50, 75, 100].map((v) => {
            const y = PT + chartH - (v / 100) * chartH;
            return (
              <g key={v}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(148,163,184,0.1)" strokeDasharray="4 4" />
                <text x={PL - 6} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize={10}>{v}%</text>
              </g>
            );
          })}

          {filtered.map((d, i) => {
            if (d.submissions_count === 0) return null;
            const barH = (d.submissions_count / maxSubs) * chartH;
            const barW = Math.min(step * 0.5, 32);
            const x = PL + i * step - barW / 2;
            return (
              <rect key={`bar-${i}`} x={x} y={PT + chartH - barH} width={barW} height={barH} rx={4} className="fill-blue-500/20">
                <title>{d.week_label}: {d.submissions_count} lượt nộp</title>
              </rect>
            );
          })}

          {/* Empty week markers */}
          {filtered.map((d, i) => d.submissions_count === 0 ? (
            <text key={`empty-${i}`} x={PL + i * step} y={PT + chartH / 2} textAnchor="middle" className="fill-slate-600" fontSize={9}>
              —
            </text>
          ) : null)}

          {/* Score lines — broken at gaps */}
          {scoreSegments.map((seg, i) => (
            <path key={`seg-${i}`} d={seg} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {scorePts.map((p, i) => p.y >= 0 && p.hasData && (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} className="fill-emerald-500 stroke-slate-900" strokeWidth={2}>
              <title>{filtered[i].week_label}: {filtered[i].avg_score}% TB</title>
            </circle>
          ))}

          {filtered.map((d, i) => (
            <text key={`label-${i}`} x={PL + i * step} y={H - 6} textAnchor="middle" className="fill-slate-500" fontSize={10}>
              {d.week_label}
            </text>
          ))}
        </svg>

        <div className="flex gap-5 mt-3 text-[11px] text-slate-400 justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Điểm TB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/30 inline-block" /> Lượt nộp
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Score Histogram (SVG) ──

const BUCKET_COLORS = [
  'fill-red-500', 'fill-red-400', 'fill-orange-500', 'fill-amber-500', 'fill-amber-400',
  'fill-yellow-400', 'fill-lime-400', 'fill-emerald-400', 'fill-emerald-500', 'fill-emerald-600',
];

function ScoreHistogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (total === 0) return <EmptyState message="Chưa có bài nộp" />;

  const W = 600;
  const H = 280;
  const PL = 40;
  const PR = 16;
  const PT = 24;
  const PB = 44;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const barW = chartW / buckets.length;
  const gap = barW * 0.2;

  const yLines = Array.from({ length: 5 }, (_, i) => Math.ceil((maxCount / 4) * i));
  if (!yLines.includes(maxCount)) yLines.push(maxCount);
  const uniqueY = [...new Set(yLines)].sort((a, b) => a - b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ phân bố điểm">
      {uniqueY.map((v) => {
        const y = PT + chartH - (v / maxCount) * chartH;
        return (
          <g key={v}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 4" />
            <text x={PL - 6} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize={10}>{v}</text>
          </g>
        );
      })}
      {buckets.map((b, i) => {
        const barH = maxCount > 0 ? (b.count / maxCount) * chartH : 0;
        const x = PL + i * barW + gap / 2;
        const w = barW - gap;
        const y = PT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH} rx={4} className={`${BUCKET_COLORS[i]} opacity-85`}>
              <title>{b.label}%: {b.count} học sinh</title>
            </rect>
            {b.count > 0 && (
              <text x={x + w / 2} y={y - 6} textAnchor="middle" className="fill-white font-semibold" fontSize={11}>{b.count}</text>
            )}
            <text x={x + w / 2} y={H - 8} textAnchor="middle" className="fill-slate-400" fontSize={9}>{b.label}</text>
          </g>
        );
      })}
      <text x={W / 2} y={H} textAnchor="middle" className="fill-slate-600" fontSize={9}>Khoảng điểm (%)</text>
    </svg>
  );
}

// ── Question Column Chart (SVG) ──

function QuestionColumnChart({ questions }: { questions: AssignmentDetailData['questions'] }) {
  if (!questions || questions.length === 0) return <EmptyState message="Không có câu hỏi" />;

  const W = 600;
  const H = 280;
  const PL = 40;
  const PR = 16;
  const PT = 24;
  const PB = 36;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxY = Math.max(1, ...questions.map((q) => Math.max(q.correctCount, q.incorrectCount)));
  const groupW = chartW / questions.length;
  const barW = Math.min(groupW * 0.35, 28);
  const yTicks = Array.from(new Set([0, Math.round(maxY / 4), Math.round(maxY / 2), Math.round((3 * maxY) / 4), maxY])).sort((a, b) => a - b);
  const yOf = (v: number) => PT + chartH - (v / maxY) * chartH;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Số học sinh đúng và sai theo từng câu">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 4" />
            <text x={PL - 6} y={yOf(v) + 4} textAnchor="end" className="fill-slate-500" fontSize={10}>{v}</text>
          </g>
        ))}
        {questions.map((q, i) => {
          const cx = PL + i * groupW + groupW / 2;
          const xCorrect = cx - barW - 2;
          const xIncorrect = cx + 2;
          return (
            <g key={q.sort_order}>
              <rect x={xCorrect} y={yOf(q.correctCount)} width={barW} height={PT + chartH - yOf(q.correctCount)} rx={4} className="fill-emerald-500">
                <title>Câu {q.sort_order}: {q.correctCount} HS đúng</title>
              </rect>
              <rect x={xIncorrect} y={yOf(q.incorrectCount)} width={barW} height={PT + chartH - yOf(q.incorrectCount)} rx={4} className="fill-red-500">
                <title>Câu {q.sort_order}: {q.incorrectCount} HS sai</title>
              </rect>
              {q.correctCount > 0 && (
                <text x={xCorrect + barW / 2} y={yOf(q.correctCount) - 5} textAnchor="middle" className="fill-emerald-300" fontSize={10} fontWeight={600}>{q.correctCount}</text>
              )}
              {q.incorrectCount > 0 && (
                <text x={xIncorrect + barW / 2} y={yOf(q.incorrectCount) - 5} textAnchor="middle" className="fill-red-300" fontSize={10} fontWeight={600}>{q.incorrectCount}</text>
              )}
              <text x={cx} y={H - 12} textAnchor="middle" className="fill-slate-300" fontSize={11} fontWeight={600}>Câu {q.sort_order}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-5 mt-2 text-[11px] text-slate-400 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Số HS đúng</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Số HS sai</span>
      </div>
    </div>
  );
}

// ── Question Breakdown ──

function QuestionBreakdown({ questions }: { questions: AssignmentDetailData['questions'] }) {
  if (!questions || questions.length === 0) return <EmptyState message="Không có câu hỏi" />;
  return (
    <div className="space-y-3">
      {questions.map((q, i) => {
        const total = q.correctCount + q.incorrectCount + q.unansweredCount;
        const correctPct = total > 0 ? (q.correctCount / total) * 100 : 0;
        const incorrectPct = total > 0 ? (q.incorrectCount / total) * 100 : 0;
        const unansweredPct = total > 0 ? (q.unansweredCount / total) * 100 : 0;
        return (
          <div key={q.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:border-slate-600/50 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400">{q.sort_order}</span>
                <p className="text-sm text-white line-clamp-2 pt-0.5">{q.content}</p>
              </div>
              <ScoreBadge value={q.correctRate} size="sm" />
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-800/80">
              {correctPct > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${correctPct}%` }} />}
              {incorrectPct > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${incorrectPct}%` }} />}
              {unansweredPct > 0 && <div className="bg-slate-600 transition-all duration-500" style={{ width: `${unansweredPct}%` }} />}
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Đúng: {q.correctCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Sai: {q.incorrectCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600" /> Chưa TL: {q.unansweredCount}</span>
              <span className="ml-auto">{q.points} điểm</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Needs Attention Section ──

function NeedsAttentionSection({
  inactive,
  rooms,
  onDetail,
}: {
  inactive: InactiveRow[];
  rooms: RoomRow[];
  onDetail: (id: string) => void;
}) {
  // Students needing attention: inactive ≥14 days or have pending assignments
  const critical = inactive.filter((s) => s.days_inactive >= 14 || s.pending_assignments >= 2);
  if (critical.length === 0) return null;

  return (
    <div>
      <SectionHeader
        icon={AlertTriangle}
        title="Học sinh cần hỗ trợ"
        subtitle={`${critical.length} em cần quan tâm`}
        iconColor="text-red-400"
      />
      <div className="space-y-2">
        {critical.slice(0, 10).map((s) => (
          <button
            key={s.student_id}
            type="button"
            onClick={() => onDetail(s.student_id)}
            className="w-full text-left bg-red-950/10 border border-red-900/20 rounded-xl p-4 hover:border-red-800/40 transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
              {(s.display_name ?? '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm truncate">{s.display_name}</span>
                <span className="text-[10px] text-slate-500">({s.room_name})</span>
              </div>
              <div className="flex gap-3 mt-1 text-[11px] text-slate-500">
                {s.days_inactive >= 14 && (
                  <span className="text-amber-400">
                    {s.days_inactive >= 999 ? 'Chưa từng hoạt động' : `${s.days_inactive} ngày không HĐ`}
                  </span>
                )}
                {s.pending_assignments > 0 && (
                  <span className="text-red-400">{s.pending_assignments} bài chưa nộp</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 shrink-0 transition-colors" />
          </button>
        ))}
        {critical.length > 10 && (
          <p className="text-xs text-slate-500 text-center py-2">
            Và {critical.length - 10} em khác — xem tab &ldquo;Theo học sinh&rdquo; để biết chi tiết.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-views ──

function RoomsGrid({ data, onSelect }: { data: RoomRow[]; onSelect: (r: RoomRow) => void }) {
  if (!data || data.length === 0) return <EmptyState message="Chưa có lớp nào." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((r) => (
        <button
          key={r.room_id}
          type="button"
          onClick={() => onSelect(r)}
          className="text-left bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-indigo-500/30 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                {r.grade ?? <BookOpen className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm truncate">{r.room_name}</div>
                <div className="text-[10px] text-slate-500">{r.member_count} HS · {r.assignment_count} bài</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {r.submissions_graded > 0 ? (
                <ScoreBadge value={r.avg_accuracy} size="sm" />
              ) : (
                <span className="text-xs text-slate-500">—</span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
          <AnimatedBar
            value={r.submissions_total > 0 ? Math.round((r.submissions_graded / r.submissions_total) * 100) : 0}
            color="bg-blue-500"
          />
          <div className="text-[10px] text-slate-500 text-right mt-1">{r.submissions_graded}/{r.submissions_total} chấm</div>
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

  if (!data || data.length === 0) return <EmptyState message="Chưa có dữ liệu." />;
  return (
    <div className="space-y-2">
      {data.map((s, i) => (
        <button
          key={s.student_id}
          type="button"
          onClick={() => onDetail(s.student_id)}
          className="w-full text-left bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
            s.needs_attention ? 'bg-amber-600/15 text-amber-400 border border-amber-500/20' : 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
          }`}>
            {(s.display_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm truncate">{s.display_name}</span>
              {s.needs_attention && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </div>
            <div className="flex gap-3 mt-1.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> {s.total_xp} XP</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {s.assignments_completed} bài</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {s.days_inactive >= 999 ? 'Chưa HĐ' : s.days_inactive === 0 ? 'Hôm nay' : `${s.days_inactive}d trước`}
              </span>
            </div>
          </div>
          <div className="shrink-0 w-28">
            <AnimatedBar
              value={s.avg_score}
              color={s.avg_score >= 70 ? 'bg-emerald-500' : s.avg_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}
              delay={i * 50}
            />
            <div className="text-[11px] text-slate-500 text-right mt-0.5">{s.avg_score}%</div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => handleSend(e, s.student_id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(e as unknown as React.MouseEvent, s.student_id); }}
            className={`shrink-0 min-w-10 min-h-10 flex items-center justify-center rounded-xl transition-all ${
              sentIds.has(s.student_id)
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                : sendingId === s.student_id
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10 border border-slate-700/50 hover:border-blue-500/30'
            }`}
            title="Gửi báo cáo về PH"
          >
            {sentIds.has(s.student_id) ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  );
}

function SkillsView({ data }: { data: SkillRow[] }) {
  if (!data || data.length === 0) return <EmptyState message="Chưa có dữ liệu kỹ năng." />;
  const sorted = [...data].sort((a, b) => a.accuracy - b.accuracy);
  return (
    <div className="space-y-3">
      {sorted.map((s, i) => (
        <div key={s.skill} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-white">{skillLabel(s.skill)}</span>
            <div className="flex items-center gap-2.5">
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
            <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1.5 bg-red-500/5 rounded-lg px-2 py-1">
              <AlertTriangle className="w-3 h-3" /> Kỹ năng cần giảng lại
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionsView({ data }: { data: QuestionRow[] }) {
  if (!data || data.length === 0) return <EmptyState message="Chưa có dữ liệu câu hỏi." />;
  const sorted = [...data].sort((a, b) => a.accuracy - b.accuracy);
  return (
    <div className="space-y-3">
      {sorted.map((q, i) => (
        <div key={`${q.question_id}-${i}`} className={`bg-slate-900/60 border rounded-xl p-4 transition-colors ${q.accuracy < 50 ? 'border-red-900/40 hover:border-red-800/50' : 'border-slate-800/80 hover:border-slate-700/80'}`}>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <p className="text-sm text-white flex-1">{q.content}</p>
            <ScoreBadge value={q.accuracy} size="sm" />
          </div>
          <AnimatedBar
            value={q.accuracy}
            color={q.accuracy >= 70 ? 'bg-emerald-500' : q.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            delay={i * 30}
          />
          <div className="flex gap-4 mt-2 text-[11px] text-slate-500">
            <span>{q.total_attempts} lượt trả lời</span>
            <span>{q.correct_count} đúng</span>
            {q.avg_time_seconds != null && <span>TB {q.avg_time_seconds}s</span>}
            {q.accuracy < 40 && <span className="text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Cần giảng lại</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers: skill tag → tiếng Việt có dấu ──

const SKILL_LABELS: Record<string, string> = {
  'luc': 'Lực',
  'don-vi': 'Đơn vị đo',
  'trong-luc': 'Trọng lực',
  'ma-sat': 'Ma sát',
  'chuyen-dong': 'Chuyển động',
  'deu': 'Chuyển động đều',
  'khong-deu': 'Chuyển động không đều',
  'dan-hoi': 'Đàn hồi',
  'toc-do': 'Tốc độ',
  'phan-luc': 'Phản lực',
  'can-bang': 'Cân bằng lực',
  'phuong-chieu': 'Phương và chiều',
  'tinh-toan': 'Tính toán',
  'cong-thuc': 'Công thức',
  'so-sanh': 'So sánh',
  'doi-don-vi': 'Đổi đơn vị',
  'phan-loai': 'Phân loại',
  'ung-dung': 'Ứng dụng',
  'dung-cu': 'Dụng cụ',
  'khai-niem': 'Khái niệm',
  'roi-tu-do': 'Rơi tự do',
  'giam-ma-sat': 'Giảm ma sát',
  'yeu-to': 'Yếu tố ảnh hưởng',
  'ti-le': 'Tỉ lệ',
  'vat-lieu-dan-dien': 'Vật liệu dẫn điện',
  'vat-lieu-cach-dien': 'Vật liệu cách điện',
  'thong-hieu': 'Thông hiểu',
  'nhan-biet': 'Nhận biết',
  'van-dung': 'Vận dụng',
  'mach-dien': 'Mạch điện',
  'mach-dien-kin': 'Mạch điện kín',
  'mach-dien-noi-tiep': 'Mạch điện nối tiếp',
  'mach-dien-song-song': 'Mạch điện song song',
  'nguon-dien': 'Nguồn điện',
  'thi-nghiem-vat-ly': 'Thí nghiệm vật lý',
  'dong-dien': 'Dòng điện',
  'hieu-dien-the': 'Hiệu điện thế',
  'dien-tro': 'Điện trở',
  'cong-suat': 'Công suất',
  'nang-luong': 'Năng lượng',
  'nhiet-do': 'Nhiệt độ',
  'nhiet-luong': 'Nhiệt lượng',
  'bay-hoi': 'Bay hơi',
  'ngung-tu': 'Ngưng tụ',
  'nong-chay': 'Nóng chảy',
  'dong-dac': 'Đông đặc',
  'soi': 'Sôi',
  'anh-sang': 'Ánh sáng',
  'phan-xa': 'Phản xạ',
  'khuc-xa': 'Khúc xạ',
  'thau-kinh': 'Thấu kính',
  'am-thanh': 'Âm thanh',
};

function skillLabel(slug: string | undefined | null): string {
  if (!slug) return 'Chung';
  return SKILL_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Helpers: auto-generate comments ──

function generateComments(report: DetailReport) {
  const strengths: string[] = [];
  const improvements: string[] = [];

  const goodSkills = report.skill_breakdown.filter((s) => s.accuracy >= 80);
  const weakSkills = report.skill_breakdown.filter((s) => s.accuracy < 50);

  if (goodSkills.length > 0) {
    strengths.push(`Nắm vững: ${goodSkills.map((s) => skillLabel(s.skill)).join(', ')}`);
  }
  if (weakSkills.length > 0) {
    improvements.push(`Cần ôn lại: ${weakSkills.map((s) => skillLabel(s.skill)).join(', ')}`);
  }

  const scored = report.submissions.filter((s) => s.total_score != null && s.max_score);
  if (scored.length > 0) {
    const avgPct = Math.round(scored.reduce((sum, s) => sum + (Number(s.total_score) / Number(s.max_score)) * 100, 0) / scored.length);
    if (avgPct >= 80) strengths.push(`Điểm trung bình cao (${avgPct}%)`);
    else if (avgPct < 50) improvements.push(`Điểm trung bình còn thấp (${avgPct}%), cần cố gắng hơn`);
  }

  const completed = report.submissions.filter((s) => s.status === 'graded' || s.status === 'published');
  const drafts = report.submissions.filter((s) => s.status === 'draft');
  if (completed.length > 0 && drafts.length === 0) {
    strengths.push('Hoàn thành đầy đủ bài tập được giao');
  }
  if (drafts.length > 0) {
    improvements.push(`Còn ${drafts.length} bài chưa nộp`);
  }

  const totalQ = report.question_details.length;
  const correctQ = report.question_details.filter((q) => q.is_correct).length;
  if (totalQ > 0) {
    const rate = Math.round((correctQ / totalQ) * 100);
    if (rate >= 90) strengths.push('Tỷ lệ trả lời đúng rất tốt');
    else if (rate < 40) improvements.push('Cần luyện tập thêm, tỷ lệ đúng còn thấp');
  }

  if (report.total_xp >= 200) strengths.push('Tích cực tham gia học tập trên hệ thống');
  if (report.total_xp === 0) improvements.push('Chưa tích lũy được XP, cần tham gia nhiều hơn');

  if (strengths.length === 0) strengths.push('Đã bắt đầu sử dụng hệ thống');
  if (improvements.length === 0) improvements.push('Tiếp tục duy trì phong độ');

  return { strengths, improvements };
}

function getWeekOptions() {
  const weeks: { label: string; start: string; end: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - i * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    weeks.push({
      label: i === 0 ? 'Tuần này' : i === 1 ? 'Tuần trước' : `${monday.toLocaleDateString('vi-VN')} – ${sunday.toLocaleDateString('vi-VN')}`,
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10),
    });
  }
  return weeks;
}

// ── Send Report Modal ──

function SendReportModal({ report, studentId, onClose }: { report: DetailReport; studentId: string; onClose: () => void }) {
  const { strengths, improvements } = generateComments(report);
  const weekOptions = getWeekOptions();

  const [selectedWeek, setSelectedWeek] = useState('all');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [strengthsText, setStrengthsText] = useState(strengths.map((s) => `• ${s}`).join('\n'));
  const [improvementsText, setImprovementsText] = useState(improvements.map((s) => `• ${s}`).join('\n'));
  const [teacherNote, setTeacherNote] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: boolean; parent_names: string[]; error?: string } | null>(null);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const body = {
      student_id: studentId,
      week: selectedWeek === 'all' ? null : selectedWeek,
      phone_number: phoneNumber.trim() || null,
      strengths: strengthsText,
      improvements: improvementsText,
      teacher_note: teacherNote.trim() || null,
    };
    const res = await fetch('/api/teacher/reports/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
  };

  const inputClass = "w-full rounded-xl bg-slate-800/80 border border-slate-700/50 px-4 py-2.5 text-sm text-white min-h-[44px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh] text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gửi báo cáo</h3>
              <p className="text-xs text-slate-500">{report.display_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Khoảng thời gian</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={inputClass}>
              <option value="all">Toàn bộ (tất cả thời gian)</option>
              {weekOptions.map((w) => (
                <option key={w.start} value={w.start}>{w.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-500" />
              SĐT phụ huynh <span className="text-slate-500 font-normal">(không bắt buộc)</span>
            </label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="VD: 0912 345 678" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-400 block mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Điểm tốt
            </label>
            <textarea value={strengthsText} onChange={(e) => setStrengthsText(e.target.value)} rows={3}
              className="w-full rounded-xl bg-emerald-950/15 border border-emerald-900/25 px-4 py-2.5 text-sm text-emerald-100 min-h-[44px] resize-none placeholder:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              placeholder="Nhập điểm tốt của học sinh..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-400 block mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Cần cải thiện
            </label>
            <textarea value={improvementsText} onChange={(e) => setImprovementsText(e.target.value)} rows={3}
              className="w-full rounded-xl bg-amber-950/15 border border-amber-900/25 px-4 py-2.5 text-sm text-amber-100 min-h-[44px] resize-none placeholder:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
              placeholder="Nhập điểm cần cải thiện..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-slate-500" />
              Lời nhắn từ GV <span className="text-slate-500 font-normal">(không bắt buộc)</span>
            </label>
            <textarea value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="VD: Phụ huynh cho con ôn thêm phần mạch điện nhé..." />
          </div>

          {/* Preview */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Xem trước nội dung gửi
            </h4>
            <div className="text-sm text-slate-200 space-y-1.5">
              <p><strong>{report.display_name}</strong> — Cấp {report.level}, {report.total_xp} XP</p>
              <p className="text-slate-400">{report.submissions.length} bài ({report.question_details.filter((q) => q.is_correct).length}/{report.question_details.length} câu đúng)</p>
              {strengthsText && <p className="text-emerald-300 whitespace-pre-line text-xs">{strengthsText}</p>}
              {improvementsText && <p className="text-amber-300 whitespace-pre-line text-xs">{improvementsText}</p>}
              {teacherNote && <p className="text-blue-300 italic text-xs">{teacherNote}</p>}
            </div>
          </div>

          {result && (
            <div className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 ${
              result.sent ? 'bg-emerald-950/20 border border-emerald-800/30 text-emerald-300' : 'bg-red-950/20 border border-red-800/30 text-red-300'
            }`}>
              {result.sent ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {result.sent ? `Đã gửi báo cáo đến: ${result.parent_names.join(', ')}` : result.error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white min-h-[44px] rounded-xl transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !!result?.sent}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl min-h-[44px] flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Đang gửi...' : result?.sent ? 'Đã gửi' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student Detail Modal ──

function StudentDetailModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [report, setReport] = useState<DetailReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    fetch(`/api/teacher/reports/student?student_id=${studentId}`)
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setReport(d); })
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh] text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {report && (
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                {(report.display_name ?? '?').charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {loading ? 'Đang tải...' : report ? report.display_name : 'Không tìm thấy'}
              </h3>
              {report && <p className="text-xs text-slate-500">Cấp {report.level} · {report.total_xp} XP</p>}
            </div>
            {report && (
              <button
                onClick={() => setShowSendModal(true)}
                className="ml-2 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg min-h-[36px] flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10"
              >
                <Send className="w-3.5 h-3.5" /> Gửi báo cáo
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <LoadingState />
        ) : report ? (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={Zap} value={report.total_xp} label="Tổng XP"
                gradient="bg-gradient-to-br from-amber-600/15 to-amber-900/10 border border-amber-500/20"
                iconColor="bg-amber-500/20"
              />
              <StatCard
                icon={Award} value={`Cấp ${report.level}`} label="Cấp độ"
                gradient="bg-gradient-to-br from-indigo-600/15 to-indigo-900/10 border border-indigo-500/20"
                iconColor="bg-indigo-500/20"
              />
              <StatCard
                icon={Target}
                value={`${report.question_details.filter((q) => q.is_correct).length}/${report.question_details.length}`}
                label="Câu đúng"
                gradient="bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 border border-emerald-500/20"
                iconColor="bg-emerald-500/20"
              />
            </div>

            {/* Auto comments */}
            {(() => {
              const c = generateComments(report);
              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-950/15 border border-emerald-900/25 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Điểm tốt
                    </h4>
                    <ul className="text-xs text-emerald-200 space-y-1.5">
                      {c.strengths.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 mt-px">•</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-amber-950/15 border border-amber-900/25 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Cần cải thiện
                    </h4>
                    <ul className="text-xs text-amber-200 space-y-1.5">
                      {c.improvements.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-500 mt-px">•</span> {s}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Skill breakdown */}
            {report.skill_breakdown.length > 0 && (
              <div>
                <SectionHeader icon={TrendingUp} title="Phân tích kỹ năng" iconColor="text-blue-400" />
                <div className="space-y-2.5">
                  {report.skill_breakdown.map((s, i) => (
                    <div key={s.skill} className="flex items-center gap-3">
                      <span className="text-xs w-32 truncate text-slate-300">{skillLabel(s.skill)}</span>
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
                <SectionHeader icon={BookOpen} title="Bài nộp" subtitle={`${report.submissions.length} bài`} iconColor="text-purple-400" />
                <div className="space-y-2">
                  {report.submissions.map((s, i) => {
                    const pct = s.total_score != null && s.max_score ? Math.round((s.total_score / s.max_score) * 100) : null;
                    return (
                      <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-white">{s.assignment_title}</span>
                          {s.submitted_at && (
                            <span className="text-[11px] text-slate-500 ml-2">
                              {new Date(s.submitted_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        {pct != null ? (
                          <ScoreBadge value={pct} size="sm" />
                        ) : (
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800/80 border border-slate-700/30 rounded-lg">{s.status}</span>
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
                <SectionHeader icon={Target} title="Chi tiết câu hỏi" subtitle={`${report.question_details.length} câu`} iconColor="text-cyan-400" />
                <div className="space-y-2">
                  {report.question_details.map((q, i) => (
                    <div key={i} className={`rounded-xl p-3.5 flex items-start gap-2.5 border ${
                      q.is_correct ? 'bg-emerald-950/15 border-emerald-900/25' :
                      q.is_correct === false ? 'bg-red-950/15 border-red-900/25' :
                      'bg-slate-800/40 border-slate-700/30'
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
                        <p className="text-[11px] text-slate-500 mt-0.5">{q.assignment_title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
    {showSendModal && report && (
      <SendReportModal report={report} studentId={studentId} onClose={() => setShowSendModal(false)} />
    )}
    </>
  );
}

// ── Author Footer ──

function AuthorFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-slate-800/40">
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">Vina-Eduverse</p>
        <p>
          Tác giả: Tăng Thị Xuân Tuyền | SĐT: 0964022270 | Email:{' '}
          <a href="mailto:xuantuyen96@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            xuantuyen96@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
