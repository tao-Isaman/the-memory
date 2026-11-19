'use client';

import { useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

/** Opens a claim's transfer slip. The image comes through the API (it checks who asks), never from a public link. */
export default function SlipButton({ claimId, label, loadingLabel, errorLabel, className = '' }: {
  claimId: string;
  label: string;
  loadingLabel: string;
  errorLabel: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const open = async () => {
    // Open the tab inside the click (popup blockers), then point it at the image once it has arrived.
    const tab = window.open('', '_blank');
    setState('loading');
    try {
      const res = await authFetch(`/api/referral/claims/${encodeURIComponent(claimId)}/slip`);
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setState('idle');
    } catch {
      tab?.close();
      setState('error');
    }
  };

  return (
    <button type="button" onClick={open} disabled={state === 'loading'}
      className={`inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline disabled:opacity-60 ${className}`}>
      {state === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Receipt size={12} />}
      {state === 'loading' ? loadingLabel : state === 'error' ? errorLabel : label}
    </button>
  );
}
