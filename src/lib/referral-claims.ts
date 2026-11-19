// Referral payouts (pure: no I/O, so it is shared by the routes, the admin page and its test).
// Every paid referral is one right worth CLAIM_UNIT_THB. A request now claims every right left in one row
// (amount = 50 × N); rights used = sum(amount) / 50, so the old one-row-per-50-baht requests still count right.

export const CLAIM_UNIT_THB = 50;

export interface ClaimAmountRow {
  amount: number;
}

export function claimedUnits(rows: ClaimAmountRow[]): number {
  return Math.floor(rows.reduce((sum, r) => sum + (r.amount || 0), 0) / CLAIM_UNIT_THB);
}

export function remainingUnits(paidCount: number, rows: ClaimAmountRow[]): number {
  return Math.max(0, paidCount - claimedUnits(rows));
}

/** Checked after the insert: two requests at once may both pass the first check; the one that finds too much backs out. */
export function overClaimed(paidCount: number, rows: ClaimAmountRow[]): boolean {
  return claimedUnits(rows) > paidCount;
}

export interface ClaimRow {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_info: string;
  bank_name: string | null;
  account_name: string | null;
  created_at: string | null;
}

export interface PayoutGroup {
  key: string;
  userId: string;
  userEmail: string;
  ids: string[];
  count: number;
  total: number;
  paymentMethod: string;
  paymentInfo: string;
  bankName: string | null;
  accountName: string | null;
  firstCreatedAt: string | null;
  /** The same person also has pending requests to another account: pay them separately, and check. */
  otherAccounts: boolean;
}

const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/[\s-]/g, '');

export function payoutKey(r: Pick<ClaimRow, 'user_id' | 'payment_method' | 'payment_info' | 'bank_name' | 'account_name'>): string {
  return [r.user_id, r.payment_method, norm(r.payment_info), norm(r.bank_name), norm(r.account_name)].join('|');
}

/** Pending rows of one person to one account -> one payout, oldest request first. */
export function groupPendingClaims(rows: ClaimRow[]): PayoutGroup[] {
  const byKey = new Map<string, PayoutGroup>();
  const pending = rows
    .filter((r) => r.status === 'pending')
    .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  for (const r of pending) {
    const key = payoutKey(r);
    const g = byKey.get(key);
    if (g) {
      g.ids.push(r.id);
      g.count += 1;
      g.total += r.amount;
    } else {
      byKey.set(key, {
        key, userId: r.user_id, userEmail: r.user_email, ids: [r.id], count: 1, total: r.amount,
        paymentMethod: r.payment_method, paymentInfo: r.payment_info, bankName: r.bank_name, accountName: r.account_name,
        firstCreatedAt: r.created_at, otherAccounts: false,
      });
    }
  }
  const groups = [...byKey.values()];
  const perUser = new Map<string, number>();
  for (const g of groups) perUser.set(g.userId, (perUser.get(g.userId) || 0) + 1);
  for (const g of groups) g.otherAccounts = (perUser.get(g.userId) || 0) > 1;
  return groups;
}

export const SLIP_MAX_BYTES = 5 * 1024 * 1024;
const SLIP_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function slipProblem(f: { type: string; size: number }): null | 'SLIP_EMPTY' | 'SLIP_TYPE' | 'SLIP_TOO_BIG' {
  if (!f.size) return 'SLIP_EMPTY';
  if (!SLIP_TYPES[f.type]) return 'SLIP_TYPE';
  if (f.size > SLIP_MAX_BYTES) return 'SLIP_TOO_BIG';
  return null;
}

export function slipExtension(type: string): string {
  return SLIP_TYPES[type] || 'bin';
}

/** True only for an https URL on our Vercel Blob store — what the slip route may fetch (no SSRF via a changed row). */
export function isSlipUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port
      && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
