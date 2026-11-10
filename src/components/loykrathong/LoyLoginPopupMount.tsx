'use client';

import { useAuth } from '@/hooks/useAuth';
import LoyLoginPopup from './LoyLoginPopup';

/** Renders the popup only once the signed-in user is known (see LoyLoginPopup). */
export default function LoyLoginPopupMount() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return <LoyLoginPopup key={user.id} userId={user.id} />;
}
