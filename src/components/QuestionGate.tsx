'use client';

import { useState, useCallback, memo } from 'react';
import { ThemeColors } from '@/lib/themes';
import HeartIcon from './HeartIcon';
import { HelpCircle, Check } from 'lucide-react';

interface QuestionGateProps {
    question: string;
    choices: string[];
    correctIndex: number;
    title?: string;
    onUnlock: () => void;
    themeColors?: ThemeColors;
}

const defaultColors: ThemeColors = {
    primary: '#FF6B9D',
    dark: '#E63946',
    accent: '#FFB6C1',
    background: '#FFF0F5',
};

const QuestionGate = memo(function QuestionGate({
    question,
    choices,
    correctIndex,
    title,
    onUnlock,
    themeColors = defaultColors,
}: QuestionGateProps) {
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleChoiceClick = useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        // If already answered correctly, ignore click
        if (isCorrect) return;

        if (index === correctIndex) {
            // Correct answer - show green mark then proceed
            setIsCorrect(true);
            setError(false);
            setTimeout(() => {
                onUnlock();
            }, 800); // Small delay to show the green mark
        } else {
            // Wrong answer - shake entire screen
            setError(true);
            setShake(true);

            // Reset shake animation after it completes
            setTimeout(() => {
                setShake(false);
            }, 600);
        }
    }, [correctIndex, onUnlock, isCorrect]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in-up">
            <div className={`w-full flex flex-col items-center ${shake ? 'animate-shake' : ''}`}>
                <div className="memory-card p-8 max-w-md w-full text-center">
                    <div className="mb-6">
                        <HelpCircle size={64} className="mx-auto animate-pulse-heart" style={{ color: themeColors.primary }} />
                    </div>

                    <h2 className="font-kanit text-2xl font-bold mb-2" style={{ color: themeColors.dark }}>
                        คำถาม
                    </h2>

                    {title && (
                        <p className="text-gray-400 mb-4 italic text-sm">
                            {title}
                        </p>
                    )}

                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                        {question}
                    </p>

                    <div className="space-y-3">
                        {choices.map((choice, index) => {
                            const isCorrectChoice = isCorrect && index === correctIndex;

                            return (
                                <div
                                    key={index}
                                    role="button"
                                    onClick={(e) => handleChoiceClick(e, index)}
                                    className={`w-full px-6 py-4 rounded-xl text-left font-medium transition-all cursor-pointer select-none ${!isCorrect ? 'hover:scale-[1.02] hover:shadow-md' : ''
                                        }`}
                                    style={{
                                        backgroundColor: isCorrectChoice ? '#22c55e' : themeColors.background,
                                        color: isCorrectChoice ? 'white' : themeColors.dark,
                                        border: isCorrectChoice ? '2px solid #16a34a' : `2px solid ${themeColors.accent}`,
                                        pointerEvents: isCorrect ? 'none' : 'auto',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                            style={{
                                                background: isCorrectChoice
                                                    ? '#16a34a'
                                                    : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                                            }}
                                        >
                                            {isCorrectChoice ? (
                                                <Check size={18} />
                                            ) : (
                                                String.fromCharCode(65 + index)
                                            )}
                                        </span>
                                        <span>{choice}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {error && !isCorrect && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-red-500 animate-fade-in">
                            <HeartIcon size={16} className="fill-current" />
                            <p className="text-sm font-medium">
                                คำตอบไม่ถูกต้อง ลองใหม่อีกครั้ง
                            </p>
                        </div>
                    )}

                    {isCorrect && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-green-500 animate-fade-in">
                            <Check size={20} />
                            <p className="text-sm font-medium">
                                ถูกต้อง!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(1px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
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
});

export default QuestionGate;
