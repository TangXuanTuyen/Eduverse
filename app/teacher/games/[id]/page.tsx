import { getCurrentProfile } from '@/lib/auth/session';
import { getGameForEdit } from '@/services/games';
import { redirect } from 'next/navigation';
import { GameDetail } from './GameDetail';

type Props = { params: Promise<{ id: string }> };

export default async function GameDetailPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const { id } = await params;
  const { game, questions } = await getGameForEdit(id, profile.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <GameDetail game={game} questions={questions} />
    </div>
  );
}
