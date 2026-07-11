import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware drop-in replacements. Import Link/useRouter/usePathname from HERE,
// not from next/link or next/navigation, so links keep the active locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
