import {
  LK_ACCESSORIES,
  LK_COLORS,
  LK_NAME_MAX,
  LK_NAME_MIN,
  type Accessory,
  type ShellColor,
} from './config';

/** Per-device identity + look. Guests get a random id; the look is editable any time. */
export interface PlayerIdentity {
  id: string;
  name: string;
  color: ShellColor;
  accessory: Accessory;
}

const KEY = 'lk_player_v1';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isShellColor(v: unknown): v is ShellColor {
  return typeof v === 'string' && v in LK_COLORS;
}

export function isAccessory(v: unknown): v is Accessory {
  return typeof v === 'string' && (LK_ACCESSORIES as readonly string[]).includes(v);
}

export function isValidName(name: string): boolean {
  const n = name.trim();
  return n.length >= LK_NAME_MIN && n.length <= LK_NAME_MAX;
}

/** Load the saved identity, or a fresh one with an empty name (caller shows the intro). */
export function loadPlayer(): PlayerIdentity {
  const fresh: PlayerIdentity = { id: randomId(), name: '', color: 'pink', accessory: 'none' };
  if (typeof window === 'undefined') return fresh;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<PlayerIdentity>;
    return {
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : fresh.id,
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, LK_NAME_MAX) : '',
      color: isShellColor(parsed.color) ? parsed.color : 'pink',
      accessory: isAccessory(parsed.accessory) ? parsed.accessory : 'none',
    };
  } catch {
    return fresh;
  }
}

export function savePlayer(p: PlayerIdentity): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // private mode etc. — the game still works for this visit
  }
}
