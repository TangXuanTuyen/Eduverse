'use client';

import { useState, useEffect } from 'react';
import { Box, Send } from 'lucide-react';
import type { Model3DRow } from '@/services/models-3d';
import { assignModelAction } from './actions';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Room = { id: string; name: string };

export function ModelCatalog({ models }: { models: Model3DRow[] }) {
  const { t } = useLocale();
  const SUBJECT_LABELS: Record<string, string> = {
    vat_ly: t('lab.subjPhysics'),
    hoa_hoc: t('lab.subjChem'),
    sinh_hoc: t('lab.subjBio'),
    khtn_chung: t('lab.subjGeneral'),
  };
  const CATEGORY_LABELS: Record<string, string> = {
    te_bao: t('cat.cell'),
    phan_tu: t('cat.molecule'),
    co_quan: t('cat.organ'),
    thiet_bi: t('cat.device'),
    sinh_vat: t('cat.organism'),
    khac: t('cat.other'),
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

  const filtered = filter === 'all'
    ? models
    : models.filter((m) => m.subject === filter);

  async function handleAssign(modelId: string) {
    if (!selectedRoom) return;
    setAssigning(true);
    setMessage('');
    const result = await assignModelAction(modelId, selectedRoom);
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
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: t('lab.all') },
          { key: 'sinh_hoc', label: t('lab.subjBio') },
          { key: 'hoa_hoc', label: t('lab.subjChem') },
          { key: 'vat_ly', label: t('lab.subjPhysics') },
          { key: 'khtn_chung', label: t('lab.subjGeneral') },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] ${
              filter === f.key ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('model.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
            >
              <button
                onClick={() => window.open(m.embed_url, '_blank')}
                className="w-full text-left"
              >
                {m.thumbnail_url ? (
                  <img src={m.thumbnail_url} alt="" className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 flex items-center justify-center">
                    <Box className="w-12 h-12 text-purple-500/50" />
                  </div>
                )}
              </button>
              <div className="p-4 space-y-2">
                <h3 className="text-white font-medium text-sm">{m.title}</h3>
                {m.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>
                )}
                <div className="flex gap-2 flex-wrap text-[10px]">
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {SUBJECT_LABELS[m.subject]}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {t('ai.gradeWord')} {m.grade_level}
                  </span>
                  <span className="bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">
                    {CATEGORY_LABELS[m.category]}
                  </span>
                </div>

                {assigningId === m.id ? (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white min-h-[36px]"
                    >
                      <option value="">{t('gm.chooseRoom')}</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssign(m.id)}
                        disabled={!selectedRoom || assigning}
                        className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs text-white disabled:opacity-50 min-h-[36px]"
                      >
                        {assigning ? '...' : t('gm.give')}
                      </button>
                      <button
                        onClick={() => { setAssigningId(null); setMessage(''); }}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 min-h-[36px]"
                      >
                        {t('cs.cancel')}
                      </button>
                    </div>
                    {message && <p className="text-xs text-green-400">{message}</p>}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(m.embed_url, '_blank')}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-white flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Box size={12} /> {t('cat.view3d')}
                    </button>
                    <button
                      onClick={() => setAssigningId(m.id)}
                      className="rounded-lg bg-purple-600/20 hover:bg-purple-600/30 px-3 py-2 text-xs text-purple-300 flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Send size={12} /> {t('gm.give')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
