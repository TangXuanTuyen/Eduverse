'use client';

import { useActionState, useState, useEffect } from 'react';
import { createTaskAction, type AssignmentActionState } from './actions';
import { LESSON_CATALOG, EXPERIMENT_CATALOG, MODEL3D_CATALOG, STEM_CATALOG } from '@/lib/resources-catalog';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Room = { id: string; name: string };

export function CreateTaskButton({ teacherId }: { teacherId: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AssignmentActionState, FormData>(createTaskAction, {});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [taskType, setTaskType] = useState<'lesson' | 'experiment' | 'model3d' | 'stem'>('lesson');
  const [selectedResource, setSelectedResource] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/teacher/rooms').then((r) => r.json()).then((d) => setRooms(d.rooms ?? [])).catch(() => {});
  }, [open]);

  if (state.success && open) {
    setTimeout(() => { setOpen(false); setSelectedResource(''); }, 0);
  }

  const catalog = taskType === 'lesson' ? LESSON_CATALOG : taskType === 'experiment' ? EXPERIMENT_CATALOG : taskType === 'model3d' ? MODEL3D_CATALOG : STEM_CATALOG;
  const selected = catalog.find((r) => r.id === selectedResource);
  const chooseWord = taskType === 'lesson' ? t('as.wordLesson') : taskType === 'experiment' ? t('as.wordExperiment') : taskType === 'model3d' ? t('as.wordModel') : t('as.wordStem');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
      >
        {t('as.task')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form action={formAction} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white">{t('as.task')}</h3>
        <p className="text-xs text-slate-400">{t('as.taskDesc')}</p>

        {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

        <label className="block">
          <span className="text-xs text-slate-400">{t('as.room')}</span>
          <select name="room_id" required className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
            <option value="">{t('as.chooseRoom')}</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>

        <div>
          <span className="text-xs text-slate-400">{t('as.taskType')}</span>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => { setTaskType('lesson'); setSelectedResource(''); }}
              className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${taskType === 'lesson' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {t('as.taskLesson')}
            </button>
            <button
              type="button"
              onClick={() => { setTaskType('experiment'); setSelectedResource(''); }}
              className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${taskType === 'experiment' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {t('as.taskExperiment')}
            </button>
            <button
              type="button"
              onClick={() => { setTaskType('model3d'); setSelectedResource(''); }}
              className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${taskType === 'model3d' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {t('as.taskModel')}
            </button>
            <button
              type="button"
              onClick={() => { setTaskType('stem'); setSelectedResource(''); }}
              className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${taskType === 'stem' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {t('as.taskStem')}
            </button>
          </div>
          <input type="hidden" name="assignment_type" value={taskType} />
        </div>

        <div>
          <span className="text-xs text-slate-400">{t('as.choose')} {chooseWord}</span>
          <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
            {catalog.map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selectedResource === r.id ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="resource_id"
                  value={r.id}
                  checked={selectedResource === r.id}
                  onChange={() => setSelectedResource(r.id)}
                  className="accent-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{r.title}</p>
                  <p className="text-xs text-slate-400">{'grade' in r && 'subject' in r ? `${t('rooms.gradeWord')} ${(r as { grade: number }).grade} · ${(r as { subject: string }).subject}` : 'grade' in r ? `${t('rooms.gradeWord')} ${(r as { grade: number }).grade}` : 'subject' in r ? (r as { subject: string }).subject : ''}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <input type="hidden" name="resource_title" value={selected?.title ?? ''} />

        <label className="block">
          <span className="text-xs text-slate-400">{t('as.taskTitle')}</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={selected ? `${taskType === 'lesson' ? t('as.readPrefix') : t('as.viewPrefix')}: ${'title' in selected ? selected.title : ''}` : ''}
            key={selectedResource}
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">{t('as.desc')}</span>
          <textarea name="description" rows={2} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y" />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">{t('as.dueOptional')}</span>
          <input name="due_at" type="datetime-local" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={pending || !selectedResource} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]">
            {pending ? t('as.assigning') : t('as.assignTask')}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
            {t('cs.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
