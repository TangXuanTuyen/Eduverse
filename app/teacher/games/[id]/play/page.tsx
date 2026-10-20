import { getCurrentProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { GameControlPanel } from './GameControlPanel';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GamePlayPage({ params, searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const { id } = await params;
  const sp = await searchParams;
  const sessionId = typeof sp.session === 'string' ? sp.session : '';
  if (!sessionId) redirect(`/teacher/games/${id}`);

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <GameControlPanel gameId={id} sessionId={sessionId} />
    </div>
  );
}
