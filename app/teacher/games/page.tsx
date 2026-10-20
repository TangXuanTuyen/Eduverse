import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherGames } from '@/services/games';
import { redirect } from 'next/navigation';
import { GameList } from './GameList';
import { CreateGameButton } from './CreateGameButton';

export default async function TeacherGamesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const games = await getTeacherGames(profile.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Xưởng trò chơi</h1>
        <CreateGameButton />
      </div>
      <GameList games={games} />
    </div>
  );
}
