import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherGames } from '@/services/games';
import { redirect } from 'next/navigation';
import { GameList } from './GameList';
import { CreateGameButton } from './CreateGameButton';
import { MeCungCard } from './MeCungCard';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export default async function TeacherGamesPage() {
  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const games = await getTeacherGames(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{tr('gm.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{games.length} {tr('gm.unit')}</p>
        </div>
        <CreateGameButton />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">{tr('gm.special')}</h2>
        <MeCungCard />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">{tr('gm.created')}</h2>
        <GameList games={games} />
      </div>
    </div>
  );
}
