import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side Supabase client with service role (bypasses RLS)
export function getSupabaseServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify a request's `Authorization: Bearer <jwt>` and return the Supabase user,
 * or null. Use this to protect API routes server-side (the client-side AdminLayout
 * guard does NOT protect API endpoints).
 */
export async function getBearerUser(request: Request) {
  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/** True if the email is in NEXT_PUBLIC_ADMIN_EMAIL (comma-separated). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return list.includes(email);
}

type GuardResult = { user: User; response?: never } | { user?: never; response: NextResponse };

/**
 * The signed-in caller, from `Authorization: Bearer <jwt>`. Every API route that
 * reads or changes one user's data must take the user id from here, never from
 * the request body or query string.
 *
 *   const auth = await requireUser(request);
 *   if (auth.response) return auth.response;
 *   const userId = auth.user.id;
 */
export async function requireUser(request: Request): Promise<GuardResult> {
  const user = await getBearerUser(request);
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { user };
}

/** Like requireUser, but the caller must also be in NEXT_PUBLIC_ADMIN_EMAIL. Every /api/admin route starts with this. */
export async function requireAdmin(request: Request): Promise<GuardResult> {
  const auth = await requireUser(request);
  if (auth.response) return auth;
  if (!isAdminEmail(auth.user.email)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return auth;
}
