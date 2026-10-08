'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import Joystick from './Joystick';
import { useRoom, type FloatItem, type RemotePlayer } from './useRoom';
import { crabSprite, getImage, loadImage, SPRITE_PX } from '@/lib/loykrathong/sprites';
import {
  LK_ACCESSORIES,
  LK_CHAT_MAX,
  LK_COLORS,
  LK_DESIGNS,
  LK_EVENT,
  LK_MAP_H,
  LK_MAP_W,
  LK_NAME_MAX,
  LK_SCENES,
  LK_TO_MAX,
  LK_WALK_SPEED,
  LK_WISH_MAX,
  SCENES,
  eventPhase,
  inRect,
  isSceneId,
  isWalkable,
  krathongSpriteUrl,
  type Accessory,
  type EventPhase,
  type KrathongDesign,
  type Point,
  type SceneConfig,
  type SceneExit,
  type SceneId,
  type ShellColor,
} from '@/lib/loykrathong/config';
import { isValidName, loadPlayer, savePlayer, type PlayerIdentity } from '@/lib/loykrathong/player';
import { cleanText, maskProfanity } from '@/lib/profanity';

type Modal = null | 'intro' | 'customize' | 'shop' | 'float' | 'done';
type Hotspot = null | 'shop' | 'pier';

interface MeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
}

interface FloatAnim {
  lane: number;
  x: number;
  y: number;
  phase: number;
  speed: number;
}

const FLOAT_LABELS = 14; // newest krathongs that show name/to under them
const BUBBLE_MS = 6000;
const CHAT_COOLDOWN_MS = 1500;
const KRATHONG_RIVER_PX = 56;
const MIN_ZOOM = 0.8;
const WALK_FRAME_MS = 140;
const EXIT_COOLDOWN_MS = 900;

function dir8(vx: number, vy: number): number {
  return Math.round(Math.atan2(vy, vx) / (Math.PI / 4));
}

/** Small canvas preview of a crab look (used in the intro/customize modal). */
function CrabPreview({ color, accessory }: { color: ShellColor; accessory: Accessory }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(crabSprite(color, accessory, 'happy', false, 0), 0, 0, c.width, c.height);
  }, [color, accessory]);
  return <canvas ref={ref} width={128} height={128} className="w-24 h-24 md:w-32 md:h-32" style={{ imageRendering: 'pixelated' }} />;
}

export default function LoyKrathongGame() {
  const t = useTranslations('loykrathong');
  const { user, session, signInWithGoogle } = useAuth();
  const params = useSearchParams();
  const preview = params.get('preview') === '1';
  const roomParam = Number(params.get('room')) || null;
  const sceneParam = params.get('scene');

  const [gate, setGate] = useState<EventPhase | null>(null);
  const [player, setPlayer] = useState<PlayerIdentity | null>(null);
  const [entered, setEntered] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [scene, setScene] = useState<SceneId>(() => (isSceneId(sceneParam) ? sceneParam : 'village'));
  const [fading, setFading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [krathong, setKrathong] = useState<KrathongDesign | null>(null);
  const [hotspot, setHotspot] = useState<Hotspot>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);

  // Look editor state (intro + customize)
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<ShellColor>('pink');
  const [draftAcc, setDraftAcc] = useState<Accessory>('none');
  const [nameError, setNameError] = useState<string | null>(null);

  // Float form
  const [wish, setWish] = useState('');
  const [toName, setToName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Chat
  const [chatText, setChatText] = useState('');
  const lastChatAt = useRef(0);

  const joy = useRef({ x: 0, y: 0 });
  const keys = useRef<Set<string>>(new Set());
  const me = useRef<MeState>({ x: 0, y: 0, vx: 0, vy: 0, moving: false });
  const myBubble = useRef<{ text: string; until: number } | null>(null);
  const krathongRef = useRef<KrathongDesign | null>(null);
  const modalRef = useRef<Modal>(null);
  const sceneRef = useRef<SceneConfig>(SCENES[scene]);
  const hotspotRef = useRef<Hotspot>(null);
  const exitLockUntil = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const floatsRef = useRef<FloatItem[]>([]);
  const floatAnims = useRef<Map<string, FloatAnim>>(new Map());

  const activePlayer = entered ? player : null;
  const room = useRoom(activePlayer, roomParam, scene);
  const { others, floats, sendMove, setMyState, announce, addFloat } = room;
  useEffect(() => {
    krathongRef.current = krathong;
  }, [krathong]);
  useEffect(() => {
    modalRef.current = modal;
  }, [modal]);
  useEffect(() => {
    floatsRef.current = floats;
  }, [floats]);

  // ---- boot --------------------------------------------------------------
  useEffect(() => {
    setGate(preview ? 'open' : eventPhase());
    const p = loadPlayer();
    setPlayer(p);
    setDraftName(p.name);
    setDraftColor(p.color);
    setDraftAcc(p.accessory);
    const forceTouch = process.env.NODE_ENV !== 'production' && params.get('touch') === '1';
    setIsTouch(forceTouch || window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    const start = sceneRef.current;
    me.current.x = start.spawn.x + (Math.random() * 80 - 40);
    me.current.y = start.spawn.y + (Math.random() * 40 - 20);
    Promise.all([loadImage(start.mapUrl), ...LK_DESIGNS.map((d) => loadImage(krathongSpriteUrl(d)))])
      .then(() => setAssetsReady(true))
      .catch(() => setAssetsReady(true));
    // Prefetch the other scenes in the background.
    for (const id of LK_SCENES) if (id !== start.id) void loadImage(SCENES[id].mapUrl).catch(() => {});
  }, [preview, params]);

  useEffect(() => {
    if (!player || gate !== 'open') return;
    if (isValidName(player.name)) setEntered(true);
    else setModal('intro');
  }, [player, gate]);

  useEffect(() => {
    if (!entered) return;
    const id = window.setTimeout(() => setShowHint(false), 9000);
    return () => window.clearTimeout(id);
  }, [entered, scene]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Presence must know about the krathong we carry (new arrivals read presence).
  useEffect(() => {
    if (!entered) return;
    setMyState({ ...me.current, krathong });
    announce();
  }, [krathong, entered, setMyState, announce]);

  // ---- keyboard -----------------------------------------------------------
  useEffect(() => {
    const map: Record<string, string> = {
      KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    };
    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      const d = map[e.code];
      if (!d || isTyping(e)) return;
      keys.current.add(d);
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const d = map[e.code];
      if (d) keys.current.delete(d);
    };
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // ---- scene change -------------------------------------------------------
  const switchScene = useCallback((to: SceneId, entry: Point) => {
    const next = SCENES[to];
    sceneRef.current = next;
    me.current.x = entry.x;
    me.current.y = entry.y;
    me.current.vx = 0;
    me.current.vy = 0;
    me.current.moving = false;
    exitLockUntil.current = performance.now() + EXIT_COOLDOWN_MS;
    floatAnims.current.clear(); // lanes differ per scene
    setFading(true);
    setScene(to);
    setShowHint(true);
    void loadImage(next.mapUrl).catch(() => {});
    window.setTimeout(() => setFading(false), 350);
  }, []);

  // ---- game loop ----------------------------------------------------------
  useEffect(() => {
    if (!entered || !assetsReady || !player) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    const lastSend = { dir: -99, moving: false, k: null as KrathongDesign | null, at: 0 };
    const playerLook = () => player;

    const ensureFloatAnim = (f: FloatItem, sc: SceneConfig, now: number): FloatAnim => {
      let a = floatAnims.current.get(f.id);
      if (a) return a;
      const ageMs = now - Date.parse(f.created_at);
      const fresh = Number.isFinite(ageMs) && ageMs < 15000;
      const laneIdx = fresh ? sc.dropLane : Math.floor(Math.random() * sc.lanes.length);
      const lane = sc.lanes[laneIdx];
      a = fresh
        ? {
            lane: laneIdx,
            x: sc.drop.x + (Math.random() * 30 - 15),
            y: sc.drop.y + (Math.random() * 16 - 8),
            phase: Math.random() * Math.PI * 2,
            speed: 11 + Math.random() * 6,
          }
        : {
            lane: laneIdx,
            x: lane.x + Math.random() * lane.w,
            y: lane.y + Math.random() * lane.h,
            phase: Math.random() * Math.PI * 2,
            speed: 11 + Math.random() * 6,
          };
      floatAnims.current.set(f.id, a);
      return a;
    };

    const update = (dt: number, now: number) => {
      const sc = sceneRef.current;
      // input
      let ix = 0;
      let iy = 0;
      if (!modalRef.current) {
        const k = keys.current;
        if (k.has('left')) ix -= 1;
        if (k.has('right')) ix += 1;
        if (k.has('up')) iy -= 1;
        if (k.has('down')) iy += 1;
        const j = joy.current;
        if (Math.hypot(j.x, j.y) > 0.12) {
          ix = j.x;
          iy = j.y;
        }
      }
      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      const m = me.current;
      const px = m.x;
      const py = m.y;
      if (len > 0.05) {
        const nx = m.x + ix * LK_WALK_SPEED * dt;
        if (isWalkable(sc, nx, m.y)) m.x = nx;
        const ny = m.y + iy * LK_WALK_SPEED * dt;
        if (isWalkable(sc, m.x, ny)) m.y = ny;
      }
      const dx = m.x - px;
      const dy = m.y - py;
      m.moving = Math.hypot(dx, dy) > 0.01;
      m.vx = m.moving ? dx / dt : 0;
      m.vy = m.moving ? dy / dt : 0;

      // scene exits
      if (now > exitLockUntil.current) {
        for (const ex of [sc.exits.left, sc.exits.right]) {
          if (inRect(ex.zone, m.x, m.y)) {
            switchScene(ex.to, ex.entry);
            return;
          }
        }
      }

      // hotspot
      const hs: Hotspot = sc.shop && inRect(sc.shop, m.x, m.y) ? 'shop' : inRect(sc.pier, m.x, m.y) ? 'pier' : null;
      if (hs !== hotspotRef.current) {
        hotspotRef.current = hs;
        setHotspot(hs);
      }

      // network (throttled): on direction/krathong change, on stop, and once a second while moving
      const d = m.moving ? dir8(m.vx, m.vy) : -1;
      const k = krathongRef.current;
      const state = { x: m.x, y: m.y, vx: m.vx, vy: m.vy, moving: m.moving, krathong: k };
      if (d !== lastSend.dir || m.moving !== lastSend.moving || k !== lastSend.k || (m.moving && now - lastSend.at > 1000)) {
        sendMove(state);
        lastSend.dir = d;
        lastSend.moving = m.moving;
        lastSend.k = k;
        lastSend.at = now;
      } else {
        setMyState(state);
      }

      // remote players: dead reckoning between updates
      for (const o of others.current.values()) {
        if (o.moving) {
          if (now - o.updatedAt > 1600) {
            o.moving = false;
          } else {
            o.x = Math.max(0, Math.min(LK_MAP_W, o.x + o.vx * dt));
            o.y = Math.max(0, Math.min(LK_MAP_H, o.y + o.vy * dt));
          }
        }
        if (o.bubble && o.bubble.until < now) o.bubble = null;
      }
      if (myBubble.current && myBubble.current.until < now) myBubble.current = null;

      // river
      for (const f of floatsRef.current) {
        const a = ensureFloatAnim(f, sc, Date.now());
        const lane = sc.lanes[a.lane] ?? sc.lanes[0];
        a.x -= a.speed * dt;
        if (a.x < lane.x) {
          a.x = lane.x + lane.w;
          a.y = lane.y + Math.random() * lane.h;
        }
      }
    };

    const drawTag = (text: string, x: number, y: number, font: string, fill: string, bg: string) => {
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const w = ctx.measureText(text).width + 12;
      const h = 18;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 9);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y + 1);
    };

    const drawBubble = (text: string, x: number, y: number) => {
      ctx.font = '13px Kanit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxW = 200;
      let label = text;
      while (ctx.measureText(label).width > maxW - 16 && label.length > 1) label = label.slice(0, -2) + '…';
      const w = ctx.measureText(label).width + 16;
      const h = 24;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h, w, h, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2b1b2e';
      ctx.fillText(label, x, y - h / 2 + 1);
    };

    const drawCrab = (
      x: number,
      y: number,
      color: ShellColor,
      accessory: Accessory,
      moving: boolean,
      k: KrathongDesign | null,
      name: string,
      bubble: { text: string; until: number } | null,
      now: number,
      isMe: boolean,
    ) => {
      // Walk cycle: legs alternate every WALK_FRAME_MS and the body bobs with them.
      const step = Math.floor(now / WALK_FRAME_MS) % 2;
      const frame: 0 | 1 = moving ? (step as 0 | 1) : now % 4000 < 150 ? 1 : 0;
      const bob = moving ? (step === 0 ? -3 : 0) : 0;
      const sprite = crabSprite(color, accessory, k ? 'happy' : 'idle', moving, frame);
      // soft shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(sprite, Math.round(x - SPRITE_PX / 2), Math.round(y - SPRITE_PX + bob), SPRITE_PX, SPRITE_PX);
      let top = y - SPRITE_PX + 6 + bob;
      if (k) {
        const img = getImage(krathongSpriteUrl(k));
        if (img) ctx.drawImage(img, Math.round(x - 16), Math.round(top - 34), 32, 32);
        top -= 34;
      }
      drawTag(name, x, top - 10, '13px Kanit, sans-serif', '#fff', isMe ? 'rgba(230,57,70,0.75)' : 'rgba(0,0,0,0.5)');
      if (bubble) drawBubble(bubble.text, x, top - 24);
    };

    const render = (now: number) => {
      const sc = sceneRef.current;
      const dpr = window.devicePixelRatio || 1;
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
      }
      // Cover the viewport (no letterbox); keep the crab readable on small phones.
      const zoom = Math.max(MIN_ZOOM, Math.max(W / LK_MAP_W, H / LK_MAP_H));
      const viewW = W / zoom;
      const viewH = H / zoom;
      const m = me.current;
      const camX = viewW >= LK_MAP_W ? (LK_MAP_W - viewW) / 2 : Math.max(0, Math.min(LK_MAP_W - viewW, m.x - viewW / 2));
      const camY = viewH >= LK_MAP_H ? (LK_MAP_H - viewH) / 2 : Math.max(0, Math.min(LK_MAP_H - viewH, m.y - viewH / 2));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0b1230';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, -camX * zoom * dpr, -camY * zoom * dpr);
      ctx.imageSmoothingEnabled = false;

      const map = getImage(sc.mapUrl);
      if (map) ctx.drawImage(map, 0, 0, LK_MAP_W, LK_MAP_H);

      // river krathongs (oldest first so the newest draw on top)
      const list = floatsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const f = list[i];
        const a = floatAnims.current.get(f.id);
        if (!a) continue;
        const bobW = Math.sin(now / 900 + a.phase) * 4;
        const img = getImage(krathongSpriteUrl(f.design));
        ctx.fillStyle = 'rgba(255, 190, 90, 0.18)';
        ctx.beginPath();
        ctx.ellipse(a.x, a.y + bobW + 6, 34, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        if (img) ctx.drawImage(img, a.x - KRATHONG_RIVER_PX / 2, a.y + bobW - KRATHONG_RIVER_PX / 2, KRATHONG_RIVER_PX, KRATHONG_RIVER_PX);
        if (i < FLOAT_LABELS) {
          const label = f.to_name ? `${f.display_name} → ${f.to_name}` : f.display_name;
          drawTag(label, a.x, a.y + bobW + KRATHONG_RIVER_PX / 2 + 4, '11px Kanit, sans-serif', '#fff', 'rgba(0,0,0,0.45)');
        }
      }

      // hotspot + exit markers
      const pulse = 1 + Math.sin(now / 400) * 0.12;
      const marker = (cx: number, cy: number, active: boolean) => {
        ctx.strokeStyle = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,220,120,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 26 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
      };
      if (sc.shop) marker(sc.shop.x + sc.shop.w / 2, sc.shop.y + sc.shop.h / 2 + 8, hotspotRef.current === 'shop');
      marker(sc.pier.x + sc.pier.w / 2, sc.pier.y + sc.pier.h / 2 + 20, hotspotRef.current === 'pier');
      const arrow = (ex: SceneExit, dir: -1 | 1) => {
        const cx = ex.zone.x + ex.zone.w / 2 + dir * 10;
        const cy = ex.zone.y + ex.zone.h / 2;
        const alpha = 0.55 + Math.sin(now / 350) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(cx + dir * 14, cy);
        ctx.lineTo(cx - dir * 6, cy - 12);
        ctx.lineTo(cx - dir * 6, cy + 12);
        ctx.closePath();
        ctx.fill();
      };
      arrow(sc.exits.left, -1);
      arrow(sc.exits.right, 1);

      // players, painter's order by feet y
      const look = playerLook();
      const entries: Array<{ y: number; draw: () => void }> = [];
      for (const o of others.current.values()) {
        const r: RemotePlayer = o;
        entries.push({ y: r.y, draw: () => drawCrab(r.x, r.y, r.color, r.accessory, r.moving, r.krathong, r.name, r.bubble, now, false) });
      }
      entries.push({ y: m.y, draw: () => drawCrab(m.x, m.y, look.color, look.accessory, m.moving, krathongRef.current, look.name, myBubble.current, now, true) });
      entries.sort((a, b) => a.y - b.y);
      for (const e of entries) e.draw();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const frame = (now: number) => {
      cancelAnimationFrame(raf);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (debug) debug.frames += 1;
      update(dt, now);
      render(now);
      raf = requestAnimationFrame(frame);
    };
    // Dev-only: lets a hidden tab (no rAF) be driven from the console for testing.
    const debug =
      process.env.NODE_ENV !== 'production'
        ? { frames: 0, me: me.current, keys: keys.current, modal: modalRef, scene: sceneRef, step: (ms: number) => frame(last + ms) }
        : null;
    if (debug) (window as unknown as { __lk?: unknown }).__lk = debug;
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [entered, assetsReady, player, others, sendMove, setMyState, switchScene]);

  // ---- actions ------------------------------------------------------------
  const saveLook = useCallback(
    (enter: boolean) => {
      if (!player) return;
      const name = cleanText(maskProfanity(draftName), LK_NAME_MAX);
      if (!isValidName(name)) {
        setNameError(t('errors.name'));
        return;
      }
      const next: PlayerIdentity = { ...player, name, color: draftColor, accessory: draftAcc };
      savePlayer(next);
      setPlayer(next);
      setNameError(null);
      setModal(null);
      if (enter) setEntered(true);
      else announce();
    },
    [player, draftName, draftColor, draftAcc, t, announce],
  );

  const submitFloat = useCallback(async () => {
    if (!player || !krathong) return;
    const w = cleanText(wish, LK_WISH_MAX);
    if (!w) {
      setFormError(t('errors.wish'));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch('/api/loykrathong/float', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          guestId: player.id,
          name: player.name,
          design: krathong,
          wish: w,
          toName: cleanText(toName, LK_TO_MAX),
          color: player.color,
          room: room.room,
          scene,
          preview,
        }),
      });
      const data = (await res.json()) as { float?: FloatItem; error?: string };
      if (!res.ok || !data.float) {
        const code = data.error ?? 'generic';
        setFormError(code === 'rate' ? t('errors.rate') : code === 'closed' ? t('errors.closed') : code === 'wish' ? t('errors.wish') : t('errors.generic'));
        return;
      }
      addFloat(data.float);
      setKrathong(null);
      setWish('');
      setToName('');
      setModal('done');
    } catch {
      setFormError(t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }, [player, krathong, wish, toName, session, room.room, scene, preview, addFloat, t]);

  const sendChatMessage = useCallback(() => {
    const text = cleanText(maskProfanity(chatText), LK_CHAT_MAX);
    if (!text) return;
    const now = Date.now();
    if (now - lastChatAt.current < CHAT_COOLDOWN_MS) return;
    lastChatAt.current = now;
    room.sendChat(text);
    myBubble.current = { text, until: now + BUBBLE_MS };
    setChatText('');
  }, [chatText, room]);

  const share = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.room}&scene=${scene}`;
    const text = t('done.shareText');
    try {
      if (navigator.share) {
        await navigator.share({ title: t('title'), text, url });
        return;
      }
    } catch {
      /* user cancelled */
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setToast(t('done.copied'));
    } catch {
      setToast(url);
    }
  }, [room.room, scene, t]);

  const loginForChat = useCallback(() => {
    void signInWithGoogle(`${window.location.pathname}${window.location.search}`);
  }, [signInWithGoogle]);

  const onJoystick = useCallback((v: { x: number; y: number }) => {
    joy.current = v;
  }, []);

  // ---- closed / countdown screen -----------------------------------------
  if (gate && gate !== 'open') {
    const msLeft = Math.max(0, LK_EVENT.opensAt - Date.now());
    const days = Math.floor(msLeft / 86400000);
    const hours = Math.floor((msLeft % 86400000) / 3600000);
    return (
      <div className="fixed inset-0 bg-[#0b1230] text-white flex items-center justify-center p-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${SCENES.village.mapUrl})`, imageRendering: 'pixelated' }}
        />
        <div className="relative max-w-md w-full text-center bg-black/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
          <p className="font-leckerli text-3xl mb-1 bg-gradient-to-r from-[#FF8FB3] to-[#FFD166] bg-clip-text text-transparent">{t('village')}</p>
          <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
          {gate === 'before' ? (
            <>
              <p className="text-white/85 mb-2">{t('closed.before', { date: t('closed.openDate') })}</p>
              <p className="text-3xl font-bold text-[#FFD166] mb-6">{t('closed.countdown', { days, hours })}</p>
            </>
          ) : (
            <>
              <p className="text-white/85 mb-2">{t('closed.after')}</p>
              <p className="text-3xl font-bold text-[#FFD166] mb-6">{t('closed.count', { count: room.floatCount })}</p>
            </>
          )}
          <Link href="/" className="btn-primary inline-block px-8 py-3">
            {t('closed.home')}
          </Link>
        </div>
      </div>
    );
  }

  const colorKeys = Object.keys(LK_COLORS) as ShellColor[];
  const sc = SCENES[scene];
  const actionLabel = hotspot === 'shop' ? t('hud.shop') : hotspot === 'pier' ? (krathong ? t('hud.float') : t('hud.needKrathong')) : null;
  const canAct = hotspot === 'shop' || (hotspot === 'pier' && !!krathong);
  const onAction = () => {
    if (hotspot === 'shop') setModal('shop');
    else if (hotspot === 'pier' && krathong) {
      setFormError(null);
      setModal('float');
    }
  };
  const hintText = krathong
    ? t('hud.goToPier')
    : scene === 'village'
      ? isTouch
        ? t('hud.moveHint')
        : t('hud.moveHintDesktop')
      : t('hud.needKrathongHere', { scene: t('scenes.village') });

  return (
    <div ref={wrapRef} className="fixed inset-0 bg-[#0b1230] overflow-hidden select-none" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Scene transition */}
      <div
        className="absolute inset-0 bg-[#0b1230] pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-3 flex items-start justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link href="/" className="h-9 px-3 rounded-full bg-black/45 text-white text-sm flex items-center gap-1 backdrop-blur-sm border border-white/10 whitespace-nowrap">
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">{t('hud.home')}</span>
          </Link>
          <div className="h-9 px-3 rounded-full bg-black/45 text-white text-sm flex items-center gap-2 backdrop-blur-sm border border-white/10 whitespace-nowrap">
            <span className="hidden sm:inline text-white/70">{t('title')}</span>
            <span className="hidden sm:inline text-white/40">·</span>
            <span className="font-medium">📍 {t(`scenes.${scene}`)}</span>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="h-9 px-3 rounded-full bg-black/45 text-white text-xs sm:text-sm flex items-center gap-2 sm:gap-3 backdrop-blur-sm border border-white/10 whitespace-nowrap">
            <span title={t('hud.online', { count: room.onlineCount })}>
              🦀 <span className="sm:hidden">{room.onlineCount}</span>
              <span className="hidden sm:inline">{t('hud.online', { count: room.onlineCount })}</span>
            </span>
            <span className="text-white/40">·</span>
            <span title={t('hud.floated', { count: room.floatCount })}>
              🪷 <span className="sm:hidden">{room.floatCount}</span>
              <span className="hidden sm:inline">{t('hud.floated', { count: room.floatCount })}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!player) return;
              setDraftName(player.name);
              setDraftColor(player.color);
              setDraftAcc(player.accessory);
              setModal('customize');
            }}
            className="h-9 px-3 rounded-full bg-white/90 text-[#4A1942] text-sm font-medium flex items-center gap-1 backdrop-blur-sm whitespace-nowrap"
            aria-label={t('hud.customize')}
          >
            <span aria-hidden="true">👒</span>
            <span className="hidden sm:inline">{t('hud.customize')}</span>
          </button>
        </div>
      </div>

      {/* Hint + neighbours */}
      {entered && showHint && !hotspot && (
        <div className="absolute top-16 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">{hintText}</div>
          <div className="bg-black/40 text-white/85 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            ← {t(`scenes.${sc.exits.left.to}`)} · {t(`scenes.${sc.exits.right.to}`)} →
          </div>
        </div>
      )}
      {entered && krathong && !hotspot && !showHint && (
        <div className="absolute top-16 inset-x-0 flex justify-center pointer-events-none">
          <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">{t('hud.goToPier')}</div>
        </div>
      )}

      {/* Action button */}
      {entered && actionLabel && (
        <div className={`absolute ${isTouch ? 'right-4 bottom-36' : 'inset-x-0 bottom-28 flex justify-center'} pointer-events-none`}>
          <button
            type="button"
            disabled={!canAct}
            onClick={onAction}
            className={`pointer-events-auto px-6 py-3 rounded-full text-base font-semibold shadow-2xl ${
              canAct ? 'btn-primary' : 'bg-black/55 text-white/80 border border-white/10'
            }`}
          >
            {actionLabel}
          </button>
        </div>
      )}

      {/* Joystick */}
      {entered && isTouch && (
        <div className="absolute left-4 bottom-24">
          <Joystick onChange={onJoystick} />
        </div>
      )}

      {/* Chat */}
      {entered && (
        <div className={`absolute bottom-0 inset-x-0 p-3 ${isTouch ? '' : 'sm:w-96'} pointer-events-none`}>
          <div className="pointer-events-auto flex flex-col gap-1 mb-2 max-h-28 overflow-hidden justify-end">
            {room.chat.slice(-5).map((m) => (
              <div key={m.id} className="text-[13px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate">
                <span className="font-semibold text-[#FFD166]">{m.name}:</span> {m.text}
              </div>
            ))}
          </div>
          {user ? (
            <form
              className="pointer-events-auto flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
            >
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value.slice(0, LK_CHAT_MAX))}
                placeholder={t('chat.placeholder')}
                className="flex-1 h-11 rounded-full bg-black/55 text-white placeholder:text-white/50 px-4 border border-white/15 backdrop-blur-sm outline-none focus:border-white/50"
              />
              <button type="submit" className="h-11 px-4 rounded-full bg-white/90 text-[#4A1942] font-medium">
                {t('chat.send')}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={loginForChat}
              className="pointer-events-auto h-11 w-full rounded-full bg-black/55 text-white border border-white/15 backdrop-blur-sm text-sm"
            >
              💬 {t('chat.login')}
            </button>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute top-28 inset-x-0 flex justify-center pointer-events-none">
          <div className="bg-white text-[#4A1942] text-sm px-4 py-2 rounded-full shadow-lg">{toast}</div>
        </div>
      )}

      {/* Loading */}
      {entered && !assetsReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">…</div>
      )}

      {/* Modals */}
      {(modal === 'intro' || modal === 'customize') && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FFFBF7] rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#4A1942] mb-1">{modal === 'intro' ? t('intro.heading') : t('hud.customize')}</h2>
            {modal === 'intro' && <p className="text-sm text-[#6B5E57] mb-4">{t('intro.sub')}</p>}
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-2xl bg-[#F5EDE4] p-2">
                <CrabPreview color={draftColor} accessory={draftAcc} />
              </div>
              <div className="flex-1">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value.slice(0, LK_NAME_MAX))}
                  placeholder={t('intro.namePlaceholder')}
                  maxLength={LK_NAME_MAX}
                  autoFocus={modal === 'intro'}
                  className="w-full h-11 rounded-xl border border-[#F5EDE4] bg-white px-3 text-[#4A1942] outline-none focus:border-[#E63946]"
                />
                {nameError && <p className="text-xs text-[#E63946] mt-1">{nameError}</p>}
              </div>
            </div>
            <p className="text-xs font-medium text-[#6B5E57] mb-2">{t('intro.color')}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {colorKeys.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setDraftColor(c)}
                  className={`w-9 h-9 rounded-full border-4 ${draftColor === c ? 'border-[#4A1942]' : 'border-white'} shadow`}
                  style={{ background: LK_COLORS[c] }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-[#6B5E57] mb-2">{t('intro.accessory')}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {LK_ACCESSORIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setDraftAcc(a)}
                  className={`px-3 h-9 rounded-full text-sm border ${
                    draftAcc === a ? 'bg-[#4A1942] text-white border-[#4A1942]' : 'bg-white text-[#4A1942] border-[#F5EDE4]'
                  }`}
                >
                  {t(`acc.${a}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {modal === 'customize' && (
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 py-3">
                  {t('shop.close')}
                </button>
              )}
              <button type="button" onClick={() => saveLook(modal === 'intro')} className="btn-primary flex-1 py-3">
                {modal === 'intro' ? t('intro.start') : t('intro.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'shop' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FFFBF7] rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#4A1942]">{t('shop.heading')}</h2>
            <p className="text-sm text-[#6B5E57] mb-4">{t('shop.sub')}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {LK_DESIGNS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setKrathong(d);
                    setModal(null);
                    setShowHint(true);
                  }}
                  className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 bg-white hover:border-[#E63946] transition ${
                    krathong === d ? 'border-[#E63946]' : 'border-[#F5EDE4]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={krathongSpriteUrl(d)} alt="" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
                  <span className="text-xs text-[#4A1942] text-center leading-tight">{t(`shop.designs.${d}`)}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary w-full py-3">
              {t('shop.close')}
            </button>
          </div>
        </div>
      )}

      {modal === 'float' && krathong && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            className="w-full max-w-md bg-[#FFFBF7] rounded-3xl p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              void submitFloat();
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={krathongSpriteUrl(krathong)} alt="" className="w-14 h-14" style={{ imageRendering: 'pixelated' }} />
              <div>
                <h2 className="text-xl font-bold text-[#4A1942]">{t('float.heading')}</h2>
                <p className="text-xs text-[#6B5E57]">📍 {t(`scenes.${scene}`)}</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-[#6B5E57] mb-1">{t('float.wish')}</label>
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value.slice(0, LK_WISH_MAX))}
              placeholder={t('float.wishPlaceholder')}
              rows={3}
              maxLength={LK_WISH_MAX}
              autoFocus
              className="w-full rounded-xl border border-[#F5EDE4] bg-white px-3 py-2 text-[#4A1942] outline-none focus:border-[#E63946] mb-3 resize-none"
            />
            <label className="block text-xs font-medium text-[#6B5E57] mb-1">{t('float.to')}</label>
            <input
              value={toName}
              onChange={(e) => setToName(e.target.value.slice(0, LK_TO_MAX))}
              placeholder={t('float.toPlaceholder')}
              maxLength={LK_TO_MAX}
              className="w-full h-11 rounded-xl border border-[#F5EDE4] bg-white px-3 text-[#4A1942] outline-none focus:border-[#E63946] mb-4"
            />
            {formError && <p className="text-sm text-[#E63946] mb-3">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 py-3" disabled={submitting}>
                {t('float.cancel')}
              </button>
              <button type="submit" className="btn-primary flex-1 py-3" disabled={submitting}>
                {submitting ? t('float.submitting') : t('float.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'done' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FFFBF7] rounded-3xl p-6 shadow-2xl text-center">
            <div className="text-5xl mb-2">🪷</div>
            <h2 className="text-xl font-bold text-[#4A1942] mb-1">{t('done.heading')}</h2>
            <p className="text-sm text-[#6B5E57] mb-5">{t('done.body')}</p>
            <button type="button" onClick={share} className="btn-primary w-full py-3 mb-2">
              {t('done.share')}
            </button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary w-full py-3">
              {t('done.again')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
