import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchange error', error.message);
    return NextResponse.redirect(new URL('/login', origin));
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const destination = profile.role ? homeForRole(profile.role) : '/onboarding';
  return NextResponse.redirect(new URL(next !== '/' ? next : destination, origin));
}
