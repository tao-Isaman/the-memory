'use client';

import { useState } from 'react';
import HeartIcon from './HeartIcon';

interface PasswordGateProps {
  correctPassword: string;
  title?: string;
  onUnlock: () => void;
}

export default function PasswordGate({ correctPassword, title, onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in-up">
      <div className={`memory-card p-8 max-w-md w-full text-center ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-6">
          <HeartIcon size={64} className="mx-auto animate-pulse-heart" />
        </div>
        <h2 className="font-kanit text-2xl font-bold text-[#E63946] mb-2">
          ความทรงจำถูกล็อค
        </h2>
        <p className="text-gray-600 mb-6">
          ใส่รหัสผ่านเพื่อปลดล็อคช่วงเวลาพิเศษนี้
        </p>
        <p className="text-gray-400 mb-6 italic">
          {title}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="ใส่รหัสผ่าน..."
              className={`input-valentine ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">
                รหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง!
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary w-full">
            ปลดล็อคความทรงจำ
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
