'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  LK_ROOM_COUNT,
  LK_ROOM_MAX,
  type Accessory,
  type KrathongDesign,
  type SceneId,
  type ShellColor,
} from '@/lib/loykrathong/config';
import { isAccessory, isShellColor, type PlayerIdentity } from '@/lib/loykrathong/player';

export interface RemotePlayer {
  id: string;
  name: string;
  color: ShellColor;
  accessory: Accessory;
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
  krathong: KrathongDesign | null;
  bubble: { text: string; until: number } | null;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  from: string;
  name: string;
  text: string;
  at: number;
}

export interface FloatItem {
  id: string;
  display_name: string;
  design: KrathongDesign;
  wish: string;
  to_name: string | null;
  color: string | null;
  created_at: string;
}

interface PresenceMeta {
  name: string;
  color: ShellColor;
  accessory: Accessory;
  x: number;
  y: number;
  krathong: KrathongDesign | null;
  joinedAt: number;
}

interface MovePayload {
  i: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  m: boolean;
  k: KrathongDesign | null;
}

interface ChatPayload {
  i: string;
  n: string;
  t: string;
}

export interface MyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
  krathong: KrathongDesign | null;
}

const CHAT_LOG_MAX = 50;
const BUBBLE_MS = 6000;

/**
 * Multiplayer via Supabase Realtime, no game server:
 * - Presence (per room): who is here + their look + last known position. Also used to
 *   overflow into the next room when a room is over LK_ROOM_MAX.
 * - Broadcast `mv`: throttled movement (the game loop decides when to call sendMove).
 * - Broadcast `chat`: free text (login enforced by the UI).
 * - postgres_changes on `krathong_floats`: every room shares one river.
 */
export function useRoom(me: PlayerIdentity | null, initialRoom: number | null, scene: SceneId) {
  const supabase = typeof window !== 'undefined' ? getSupabaseBrowserClient() : null;
  const [room, setRoom] = useState<number>(() =>
    initialRoom && initialRoom >= 1 && initialRoom <= LK_ROOM_COUNT ? initialRoom : 1,
  );
  const [onlineCount, setOnlineCount] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [floatCount, setFloatCount] = useState(0);
  const others = useRef<Map<string, RemotePlayer>>(new Map());
  const channel = useRef<RealtimeChannel | null>(null);
  const myState = useRef<MyState>({ x: 0, y: 0, vx: 0, vy: 0, moving: false, krathong: null });
  const joinedAt = useRef<number>(0);
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // Initial river: total count + latest krathongs.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/loykrathong/floats')
      .then((r) => r.json())
      .then((d: { count: number; items: FloatItem[] }) => {
        if (cancelled) return;
        setFloatCount(d.count ?? 0);
        setFloats(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const addFloat = useCallback((f: FloatItem) => {
    setFloats((prev) => {
      if (prev.some((p) => p.id === f.id)) return prev;
      return [f, ...prev].slice(0, 80);
    });
    setFloatCount((c) => c + 1);
  }, []);

  // One shared river for all rooms.
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('lk-floats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'krathong_floats' },
        (payload) => {
          const row = payload.new as FloatItem;
          if (row && row.id) addFloat(row);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, addFloat]);

  // Room channel: presence + broadcast.
  useEffect(() => {
    if (!supabase || !me) return;
    const name = `lk-${scene}-room-${room}`;
    const ch = supabase.channel(name, {
      config: { presence: { key: me.id }, broadcast: { self: false, ack: false } },
    });
    channel.current = ch;
    others.current.clear();
    joinedAt.current = Date.now();

    const presenceMeta = (): PresenceMeta => {
      const p = meRef.current!;
      const s = myState.current;
      return {
        name: p.name,
        color: p.color,
        accessory: p.accessory,
        x: s.x,
        y: s.y,
        krathong: s.krathong,
        joinedAt: joinedAt.current,
      };
    };

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<PresenceMeta>();
      const ids = Object.keys(state);
      setOnlineCount(ids.length);

      // Overflow: if the room is over capacity, the newest arrivals move on.
      const overflow = ids.length - LK_ROOM_MAX;
      if (overflow > 0 && room < LK_ROOM_COUNT) {
        const mine = joinedAt.current;
        const newer = ids.filter((id) => {
          const meta = state[id]?.[0];
          return meta && meta.joinedAt > mine;
        }).length;
        if (newer < overflow) {
          setRoom(room + 1);
          return;
        }
      }

      const seen = new Set<string>();
      for (const id of ids) {
        if (id === me.id) continue;
        const meta = state[id]?.[0];
        if (!meta) continue;
        seen.add(id);
        const existing = others.current.get(id);
        if (existing) {
          existing.name = meta.name;
          existing.color = isShellColor(meta.color) ? meta.color : 'pink';
          existing.accessory = isAccessory(meta.accessory) ? meta.accessory : 'none';
          existing.krathong = meta.krathong ?? null;
        } else {
          others.current.set(id, {
            id,
            name: meta.name,
            color: isShellColor(meta.color) ? meta.color : 'pink',
            accessory: isAccessory(meta.accessory) ? meta.accessory : 'none',
            x: meta.x,
            y: meta.y,
            vx: 0,
            vy: 0,
            moving: false,
            krathong: meta.krathong ?? null,
            bubble: null,
            updatedAt: Date.now(),
          });
        }
      }
      for (const id of Array.from(others.current.keys())) {
        if (!seen.has(id)) others.current.delete(id);
      }
    });

    // Someone new arrived: tell them where we are (presence position may be stale).
    ch.on('presence', { event: 'join' }, ({ key }) => {
      if (key === me.id) return;
      const delay = 100 + Math.random() * 600;
      window.setTimeout(() => {
        const s = myState.current;
        if (channel.current !== ch) return;
        ch.send({
          type: 'broadcast',
          event: 'mv',
          payload: { i: me.id, x: s.x, y: s.y, vx: 0, vy: 0, m: false, k: s.krathong } satisfies MovePayload,
        });
      }, delay);
    });

    ch.on('broadcast', { event: 'mv' }, ({ payload }) => {
      const p = payload as MovePayload;
      const o = others.current.get(p.i);
      if (!o) return;
      o.x = p.x;
      o.y = p.y;
      o.vx = p.vx;
      o.vy = p.vy;
      o.moving = p.m;
      o.krathong = p.k ?? null;
      o.updatedAt = Date.now();
    });

    ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
      const p = payload as ChatPayload;
      if (!p || typeof p.t !== 'string') return;
      const text = p.t.slice(0, 200);
      const msg: ChatMessage = { id: `${p.i}-${Date.now()}`, from: p.i, name: p.n ?? '', text, at: Date.now() };
      setChat((prev) => [...prev, msg].slice(-CHAT_LOG_MAX));
      const o = others.current.get(p.i);
      if (o) o.bubble = { text, until: Date.now() + BUBBLE_MS };
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track(presenceMeta());
      }
    });

    return () => {
      channel.current = null;
      supabase.removeChannel(ch);
    };
  }, [supabase, me, room, scene]);

  /** Game loop calls this (already throttled) with the current state. */
  const sendMove = useCallback(
    (s: MyState) => {
      myState.current = s;
      const ch = channel.current;
      if (!ch || !me) return;
      ch.send({
        type: 'broadcast',
        event: 'mv',
        payload: {
          i: me.id,
          x: Math.round(s.x),
          y: Math.round(s.y),
          vx: Math.round(s.vx),
          vy: Math.round(s.vy),
          m: s.moving,
          k: s.krathong,
        } satisfies MovePayload,
      });
    },
    [me],
  );

  /** Keep the latest state for presence without broadcasting. */
  const setMyState = useCallback((s: MyState) => {
    myState.current = s;
  }, []);

  /** Re-track presence (look or krathong changed) so new arrivals see it. */
  const announce = useCallback(() => {
    const ch = channel.current;
    const p = meRef.current;
    if (!ch || !p) return;
    const s = myState.current;
    void ch.track({
      name: p.name,
      color: p.color,
      accessory: p.accessory,
      x: s.x,
      y: s.y,
      krathong: s.krathong,
      joinedAt: joinedAt.current,
    } satisfies PresenceMeta);
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      const ch = channel.current;
      if (!ch || !me) return;
      const msg: ChatMessage = { id: `${me.id}-${Date.now()}`, from: me.id, name: me.name, text, at: Date.now() };
      setChat((prev) => [...prev, msg].slice(-CHAT_LOG_MAX));
      ch.send({ type: 'broadcast', event: 'chat', payload: { i: me.id, n: me.name, t: text } satisfies ChatPayload });
    },
    [me],
  );

  return { room, onlineCount, others, chat, floats, floatCount, addFloat, sendMove, setMyState, announce, sendChat };
}
