'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Send, Bell, Users, User as UserIcon } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState<'all' | 'user'>('all');
  const [email, setEmail] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError('กรุณากรอกหัวข้อและข้อความ');
      return;
    }
    if (target === 'user' && !email.trim()) {
      setError('กรุณาระบุอีเมลผู้รับ');
      return;
    }
    setSending(true);
    try {
      const client = getSupabaseBrowserClient();
      const sess = await client?.auth.getSession();
      const token = sess?.data.session?.access_token;
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
          target,
          email: email.trim() || undefined,
          sendPush,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'ส่งไม่สำเร็จ');
      } else {
        const pushMsg = !sendPush
          ? ''
          : json.pushConfigured
            ? ` · push: ส่งสำเร็จ ${json.pushSent}${json.pushFailed ? `, ล้มเหลว ${json.pushFailed}` : ''}`
            : ' · (ยังไม่ได้ตั้งค่า VAPID — ข้ามการส่ง push)';
        setResult(
          `ส่งการแจ้งเตือนสำเร็จ (${json.target === 'all' ? 'ทุกคน' : 'รายบุคคล'})${pushMsg}`,
        );
        setTitle('');
        setBody('');
        setUrl('');
      }
    } catch {
      setError('เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-pink-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">ส่งการแจ้งเตือน</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ส่งถึง</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTarget('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${target === 'all' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600'}`}
            >
              <Users size={16} /> ทุกคน
            </button>
            <button
              onClick={() => setTarget('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${target === 'user' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600'}`}
            >
              <UserIcon size={16} /> รายบุคคล
            </button>
          </div>
        </div>

        {target === 'user' && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมลผู้รับ"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-pink-400 focus:outline-none"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="เช่น มีฟีเจอร์ใหม่!"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-pink-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความ</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="รายละเอียด..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:border-pink-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์ (ไม่บังคับ)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/dashboard หรือ https://..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-pink-400 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={sendPush}
            onChange={(e) => setSendPush(e.target.checked)}
            className="rounded"
          />
          ส่ง push notification ไปยังอุปกรณ์ของผู้ใช้ด้วย
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {result && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{result}</p>}

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} /> {sending ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        การแจ้งเตือนจะแสดงในกระดิ่งของผู้ใช้ทันที · push จะส่งถึงเฉพาะผู้ที่เปิดการแจ้งเตือนบนอุปกรณ์ไว้
      </p>
    </div>
  );
}
