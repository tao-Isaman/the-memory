import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSupabaseServiceClient, requireAdmin } from '@/lib/supabase-server';
import { payoutKey, slipExtension, slipProblem } from '@/lib/referral-claims';

/**
 * POST /api/admin/referral-claims/transfer   (multipart form)
 *   ids   — one or more claim ids (repeat the field): one person's requests to one account
 *   slip  — optional transfer slip image (jpg/png/webp, ≤ 5 MB)
 * Pending rows become completed with one processed_at; with a slip, every row in the group points to it. Sending a
 * slip for rows that are already completed attaches it afterwards. Rows of different people or accounts are refused.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const form = await request.formData();
    const ids = [...new Set(form.getAll('ids').map(String).filter(Boolean))];
    const slip = form.get('slip');
    if (ids.length === 0 || ids.length > 200) {
      return NextResponse.json({ error: 'NO_IDS' }, { status: 400 });
    }
    if (slip !== null && !(slip instanceof File)) {
      return NextResponse.json({ error: 'SLIP_TYPE' }, { status: 400 });
    }
    if (slip) {
      const problem = slipProblem(slip);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: rows, error } = await supabase
      .from('referral_claims')
      .select('id, user_id, status, payment_method, payment_info, bank_name, account_name')
      .in('id', ids);
    if (error) throw error;
    if (!rows || rows.length !== ids.length) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (new Set(rows.map(payoutKey)).size !== 1) {
      return NextResponse.json({ error: 'MIXED_GROUP' }, { status: 400 }); // different people or accounts: pay apart
    }
    if (rows.some((r) => r.status === 'rejected')) {
      return NextResponse.json({ error: 'REJECTED_IN_GROUP' }, { status: 409 });
    }
    const pendingIds = rows.filter((r) => r.status === 'pending').map((r) => r.id);
    if (pendingIds.length === 0 && !slip) {
      return NextResponse.json({ error: 'NOTHING_TO_DO' }, { status: 400 });
    }

    let slipUrl: string | undefined;
    if (slip) {
      // Public Blob store: an unguessable name, and the URL stays server-side (customers see it via the slip API).
      const uploaded = await put(`referral-slips/${randomUUID()}.${slipExtension(slip.type)}`, slip, {
        access: 'public',
        addRandomSuffix: true,
        contentType: slip.type,
      });
      slipUrl = uploaded.url;
    }

    const now = new Date().toISOString();
    if (pendingIds.length > 0) {
      const { error: e1 } = await supabase
        .from('referral_claims')
        .update({ status: 'completed', processed_at: now, ...(slipUrl ? { slip_url: slipUrl } : {}) })
        .in('id', pendingIds)
        .eq('status', 'pending'); // a row rejected meanwhile stays rejected
      if (e1) throw e1;
    }
    const doneIds = ids.filter((id) => !pendingIds.includes(id));
    if (slipUrl && doneIds.length > 0) {
      const { error: e2 } = await supabase
        .from('referral_claims')
        .update({ slip_url: slipUrl })
        .in('id', doneIds)
        .eq('status', 'completed');
      if (e2) throw e2;
    }

    return NextResponse.json({ ok: true, completed: pendingIds.length, slip: Boolean(slipUrl) });
  } catch (error) {
    console.error('Error in POST /api/admin/referral-claims/transfer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
