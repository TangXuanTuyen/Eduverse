import { getCurrentProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { StudentGameClient } from './StudentGameClient';

type Props = { params: Promise<{ sessionId: string }> };

export default async function StudentGamePage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const { sessionId } = await params;

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <StudentGameClient sessionId={sessionId} userId={profile.id} />
    </div>
  );
}
