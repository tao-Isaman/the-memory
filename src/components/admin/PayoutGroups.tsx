'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Coins, Upload } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { groupPendingClaims, slipProblem, SLIP_MAX_BYTES, type ClaimRow } from '@/lib/referral-claims';

const SLIP_ERRORS: Record<string, string> = {
  SLIP_TYPE: 'สลิปต้องเป็น jpg, png หรือ webp',
  SLIP_TOO_BIG: `สลิปต้องไม่เกิน ${SLIP_MAX_BYTES / 1024 / 1024} MB`,
  SLIP_EMPTY: 'ไฟล์สลิปว่าง',
  MIXED_GROUP: 'รายการในกลุ่มเป็นคนละคนหรือคนละบัญชี — รีเฟรชแล้วลองใหม่',
  REJECTED_IN_GROUP: 'มีรายการที่ถูกปฏิเสธไปแล้วในกลุ่ม — รีเฟรชแล้วลองใหม่',
};

/** Sends one payout (all ids of one person + account) as transferred, with an optional slip. */
export async function sendTransfer(ids: string[], slip: File | null): Promise<string | null> {
  const form = new FormData();
  ids.forEach((id) => form.append('ids', id));
  if (slip) form.append('slip', slip);
  const res = await authFetch('/api/admin/referral-claims/transfer', { method: 'POST', body: form });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return SLIP_ERRORS[data.error] || 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง';
}

/** Pending requests of one person to one account, shown as one payout: transfer once, mark all, attach the slip. */
export default function AdminPayoutGroups({ pendingRows, onDone, notify }: {
  pendingRows: ClaimRow[];
  onDone: () => void;
  notify: (text: string, kind: 'success' | 'error') => void;
}) {
  const groups = useMemo(() => groupPendingClaims(pendingRows), [pendingRows]);
  const [slips, setSlips] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (groups.length === 0) return null;

  const pickSlip = (key: string, file: File | null) => {
    const problem = file ? slipProblem(file) : null;
    if (problem) {
      notify(SLIP_ERRORS[problem], 'error');
      return;
    }
    setSlips((s) => ({ ...s, [key]: file }));
  };

  const transfer = async (key: string, ids: string[], total: number, email: string) => {
    if (busy) return;
    const slip = slips[key] || null;
    if (!confirm(`ยืนยันว่าโอน ฿${total} ให้ ${email} แล้ว (${ids.length} รายการ)${slip ? ' พร้อมแนบสลิป' : ' — ยังไม่แนบสลิป (แนบทีหลังได้)'}?`)) return;
    setBusy(key);
    const err = await sendTransfer(ids, slip);
    setBusy(null);
    if (err) return notify(err, 'error');
    notify(`บันทึกการโอน ฿${total} แล้ว`, 'success');
    onDone();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">รอโอน (รวมตามคนและบัญชี)</h2>
      <p className="text-sm text-gray-500 mb-4">
        {groups.length} ยอด · ฿{groups.reduce((s, g) => s + g.total, 0)} — โอนครั้งเดียวต่อแถว ปฏิเสธทีละรายการได้ในตารางด้านล่าง
      </p>
      <div className="divide-y divide-gray-100">
        {groups.map((g) => (
          <div key={g.key} className="py-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{g.userEmail}</div>
              <div className="text-sm text-gray-600">
                {g.paymentMethod === 'promptpay' ? `PromptPay ${g.paymentInfo}` : `${g.bankName} · ${g.accountName} · ${g.paymentInfo}`}
              </div>
              <div className="text-xs text-gray-400">{g.count} รายการ</div>
              {g.otherAccounts && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                  <AlertTriangle size={12} /> คนนี้มีคำขอไปอีกบัญชีหนึ่งด้วย — แยกโอนตามบัญชี และตรวจให้ดี
                </div>
              )}
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full self-start md:self-auto">
              <Coins size={14} className="text-green-600" />
              <span className="font-bold text-green-600">฿{g.total}</span>
            </div>
            <label className="inline-flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
              <Upload size={14} />
              <span className="max-w-40 truncate">{slips[g.key]?.name || 'แนบสลิป (ไม่บังคับ)'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => pickSlip(g.key, e.target.files?.[0] || null)} />
            </label>
            <button type="button" onClick={() => transfer(g.key, g.ids, g.total, g.userEmail)} disabled={busy !== null}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
              <CheckCircle size={14} /> {busy === g.key ? 'กำลังบันทึก...' : 'โอนแล้ว'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
