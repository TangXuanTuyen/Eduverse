'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Send } from 'lucide-react';
import { assignLessonAction } from './actions';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Lesson = { id: string; title: string; description: string; subject: string; grade_level: number; chapter: string; thumbnail_url: string | null };
type Room = { id: string; name: string };

export function LessonCatalog({ lessons }: { lessons: Lesson[] }) {
  const { t } = useLocale();
  const SUBJECT_LABELS: Record<string, string> = {
    vat_ly: t('lab.subjPhysics'),
    hoa_hoc: t('lab.subjChem'),
    sinh_hoc: t('lab.subjBio'),
    khtn_chung: t('lab.subjGeneral'),
  };
  const [filter, setFilter] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/teacher/rooms')
      .then((r) => r.json())
      .then((d) => setRooms(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = filter === 'all' ? lessons : lessons.filter((l) => l.subject === filter);

  async function handleAssign(lessonId: string) {
    if (!selectedRoom) return;
    setAssigning(true);
    setMessage('');
    const result = await assignLessonAction(lessonId, selectedRoom);
    setAssigning(false);
    if ('error' in result && result.error) {
      setMessage(result.error);
    } else {
      setMessage(t('cat.assigned'));
      setAssigningId(null);
      setSelectedRoom('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: t('lab.all') },
          { key: 'sinh_hoc', label: t('lab.subjBio') },
          { key: 'vat_ly', label: t('lab.subjPhysics') },
          { key: 'hoa_hoc', label: t('lab.subjChem') },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] ${
              filter === f.key ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('lesson.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition">
              {l.thumbnail_url ? (
                <img src={l.thumbnail_url} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-cyan-900/30 to-sky-900/30 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-cyan-500/50" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="text-white font-medium text-sm">{l.title}</h3>
                {l.description && <p className="text-xs text-slate-400 line-clamp-2">{l.description}</p>}
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{SUBJECT_LABELS[l.subject]}</span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{t('ai.gradeWord')} {l.grade_level}</span>
                  {l.chapter && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{l.chapter}</span>}
                </div>

                {assigningId === l.id ? (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white min-h-[36px]"
                    >
                      <option value="">{t('gm.chooseRoom')}</option>
                      {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => handleAssign(l.id)} disabled={!selectedRoom || assigning} className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs text-white disabled:opacity-50 min-h-[36px]">
                        {assigning ? '...' : t('gm.give')}
                      </button>
                      <button onClick={() => { setAssigningId(null); setMessage(''); }} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 min-h-[36px]">{t('cs.cancel')}</button>
                    </div>
                    {message && <p className="text-xs text-green-400">{message}</p>}
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningId(l.id)}
                    className="w-full rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 px-3 py-2 text-xs text-cyan-300 flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Send size={12} /> {t('lab.assignToClass')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
