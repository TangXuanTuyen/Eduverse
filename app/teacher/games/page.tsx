import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherGames } from '@/services/games';
import { redirect } from 'next/navigation';
import { GameList } from './GameList';
import { CreateGameButton } from './CreateGameButton';
import { MeCungCard } from './MeCungCard';

export default async function TeacherGamesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const games = await getTeacherGames(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Xưởng trò chơi</h1>
          <p className="text-sm text-slate-400 mt-1">{games.length} trò chơi</p>
        </div>
        <CreateGameButton />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Trò chơi đặc biệt</h2>
        <MeCungCard />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Trò chơi đã tạo</h2>
        <GameList games={games} />
      </div>
    </div>
  );
}
