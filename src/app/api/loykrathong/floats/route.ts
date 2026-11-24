import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { LK_EVENT } from '@/lib/loykrathong/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LATEST = 60;

/**
 * GET /api/loykrathong/floats — total count for this year + the latest krathongs
 * (what a player sees on the river when they arrive; later ones come via Realtime).
 */
export async function GET() {
  try {
    // Public-read table (RLS SELECT policy for anon), so the anon key is enough here.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
    if (!url || !key) throw new Error('Missing Supabase public credentials');
    const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
    const latest = (cols: string) =>
      supabase
        .from('krathong_floats')
        .select(cols)
        .eq('year', LK_EVENT.year)
        .order('created_at', { ascending: false })
        .limit(LATEST);
    const [{ count }, latestRes] = await Promise.all([
      supabase
        .from('krathong_floats')
        .select('id', { count: 'exact', head: true })
        .eq('year', LK_EVENT.year),
      latest('id, display_name, design, kind, wish, to_name, color, created_at'),
    ]);
    // Tolerate the `kind` column not being there yet (migration not applied): retry
    // without it and let the client treat those rows as krathongs.
    let data = latestRes.data;
    if (latestRes.error && /\bkind\b/i.test(latestRes.error.message ?? '')) {
      data = (await latest('id, display_name, design, wish, to_name, color, created_at')).data;
    }
    return NextResponse.json(
      { count: count ?? 0, items: data ?? [] },
      { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' } },
    );
  } catch (e) {
    console.error('[loykrathong] floats failed', e);
    return NextResponse.json({ count: 0, items: [] }, { status: 200 });
  }
}
