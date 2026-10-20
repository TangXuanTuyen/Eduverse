import { redirect } from 'next/navigation';

export default function NoAccessPage() {
  redirect('/onboarding');
}
