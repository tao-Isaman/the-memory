import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, isAdminEmail, requireUser } from '@/lib/supabase-server';
import { isSlipUrl } from '@/lib/referral-claims';

/**
 * GET /api/referral/claims/[claimId]/slip
 * The transfer slip of one claim, for its owner (or an admin). The Blob URL is never sent to the browser: the image is
 * read here and passed through, so only someone who may see it gets it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  const { claimId } = await params;
  const supabase = getSupabaseServiceClient();
  const { data: claim } = await supabase
    .from('referral_claims')
    .select('user_id, status, slip_url')
    .eq('id', claimId)
    .maybeSingle();

  const mayView = claim && (claim.user_id === userId || isAdminEmail(auth.user.email));
  if (!mayView || !claim.slip_url || (claim.status !== 'completed' && !isAdminEmail(auth.user.email))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 }); // same answer for "not yours" and "no slip"
  }

  if (!isSlipUrl(claim.slip_url)) {
    // Only our own Blob store, over https: a row changed in the DB must not make the server fetch anything else.
    console.error('Refusing a slip URL outside the Blob store for claim', claimId);
    return NextResponse.json({ error: 'Slip unavailable' }, { status: 502 });
  }
  const blob = await fetch(claim.slip_url, { cache: 'no-store', redirect: 'error' });
  if (!blob.ok || !blob.body) {
    return NextResponse.json({ error: 'Slip unavailable' }, { status: 502 });
  }
  return new NextResponse(blob.body, {
    headers: {
      'Content-Type': blob.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
