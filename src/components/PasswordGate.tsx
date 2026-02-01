'use client';

import { useState, useRef, useEffect } from 'react';
import HeartIcon from './HeartIcon';

interface PasswordGateProps {
  correctPassword: string;
  title?: string;
  onUnlock: () => void;
}

export default function PasswordGate({ correctPassword, title, onUnlock }: PasswordGateProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '');
    if (numValue.length > 1) return;

    const newPin = [...pin];
    newPin[index] = numValue;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (numValue && index === 5) {
      const enteredPin = newPin.join('');
      if (enteredPin.length === 6) {
        setTimeout(() => checkPin(enteredPin), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
      } else {
        // Clear current input
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
      setError(false);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === correctPassword) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pin.join('');
    if (enteredPin.length === 6) {
      checkPin(enteredPin);
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
        <p className="text-gray-600 mb-2">
          ใส่รหัส PIN 6 หลักเพื่อปลดล็อค
        </p>
        {title && (
          <p className="text-gray-400 mb-6 italic text-sm">
            {title}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={pin[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                  ${error
                    ? 'border-red-500 bg-red-50'
                    : pin[index]
                      ? 'border-[#FF6B9D] bg-pink-50'
                      : 'border-gray-200 bg-white focus:border-[#FF6B9D] focus:bg-pink-50'
                  }`}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm animate-fade-in">
              รหัส PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            ปลดล็อคความทรงจำ
          </button>
        </form>

        {/* Number pad for mobile */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (num === 'del') {
                  // Find last filled input and clear it
                  const lastFilledIndex = pin.findLastIndex(p => p !== '');
                  if (lastFilledIndex >= 0) {
                    const newPin = [...pin];
                    newPin[lastFilledIndex] = '';
                    setPin(newPin);
                    inputRefs.current[lastFilledIndex]?.focus();
                  }
                } else if (num !== null) {
                  // Find first empty input and fill it
                  const firstEmptyIndex = pin.findIndex(p => p === '');
                  if (firstEmptyIndex >= 0) {
                    handleChange(firstEmptyIndex, num.toString());
                  }
                }
                setError(false);
              }}
              className={`h-12 rounded-lg text-xl font-semibold transition-all
                ${num === null
                  ? 'invisible'
                  : num === 'del'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-pink-50 text-[#E63946] hover:bg-pink-100 active:scale-95'
                }`}
            >
              {num === 'del' ? '⌫' : num}
            </button>
          ))}
        </div>
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
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
