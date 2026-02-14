import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  let userId: string | null = null;

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      userId = data?.session?.user?.id ?? null;
    }
  }

  // Check if new user (no profile exists)
  if (userId) {
    try {
      const serviceClient = getSupabaseServiceClient();
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    } catch {
      // Fallback to dashboard if check fails
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(`${origin}/dashboard`);
}
