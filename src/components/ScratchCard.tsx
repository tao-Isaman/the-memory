'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ThemeColors } from '@/lib/themes';

interface ScratchCardProps {
    imageUrl: string;
    themeColors?: ThemeColors;
    onComplete?: () => void;
    revealThreshold?: number;
}

const defaultColors: ThemeColors = {
    primary: '#FF6B9D',
    dark: '#E63946',
    accent: '#FFB6C1',
    background: '#FFF0F5',
};

export default function ScratchCard({
    imageUrl,
    themeColors = defaultColors,
    onComplete,
    revealThreshold = 50,
}: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isScratching, setIsScratching] = useState(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // Draw cloud pattern overlay
    const drawCloudOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, themeColors.accent);
        gradient.addColorStop(0.5, themeColors.primary);
        gradient.addColorStop(1, themeColors.accent);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw fluffy cloud shapes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        const cloudPositions = [
            { x: width * 0.1, y: height * 0.2, size: 40 },
            { x: width * 0.3, y: height * 0.1, size: 50 },
            { x: width * 0.5, y: height * 0.25, size: 45 },
            { x: width * 0.7, y: height * 0.15, size: 55 },
            { x: width * 0.9, y: height * 0.2, size: 40 },
            { x: width * 0.2, y: height * 0.5, size: 48 },
            { x: width * 0.4, y: height * 0.45, size: 52 },
            { x: width * 0.6, y: height * 0.55, size: 45 },
            { x: width * 0.8, y: height * 0.5, size: 50 },
            { x: width * 0.15, y: height * 0.75, size: 42 },
            { x: width * 0.35, y: height * 0.8, size: 55 },
            { x: width * 0.55, y: height * 0.7, size: 48 },
            { x: width * 0.75, y: height * 0.85, size: 45 },
            { x: width * 0.95, y: height * 0.75, size: 40 },
        ];

        cloudPositions.forEach(cloud => {
            // Draw multiple circles for each cloud
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * cloud.size;
                const offsetY = (Math.random() - 0.5) * cloud.size * 0.5;
                const radius = cloud.size * (0.5 + Math.random() * 0.5);

                ctx.beginPath();
                ctx.arc(cloud.x + offsetX, cloud.y + offsetY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }, [themeColors]);

    // Initialize canvas with cloud overlay
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Set canvas size to match image aspect ratio
            const maxWidth = container.clientWidth;
            const aspectRatio = img.height / img.width;
            const width = Math.min(maxWidth, 500);
            const height = width * aspectRatio;

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw cloud overlay
            drawCloudOverlay(ctx, width, height);
            setIsLoaded(true);
        };
        img.src = imageUrl;
    }, [imageUrl, drawCloudOverlay]);

    // Calculate scratch percentage
    const calculateScratchPercentage = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;

        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        const totalPixels = pixels.length / 4;
        return (transparentPixels / totalPixels) * 100;
    }, []);

    // Scratch at position
    const scratch = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas || isRevealed) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = 'destination-out';

        // Draw scratch line
        if (lastPointRef.current) {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(x, y);
            ctx.lineWidth = 40;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // Draw circle at current position
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        lastPointRef.current = { x, y };

        // Check if should reveal
        const percentage = calculateScratchPercentage();
        if (percentage >= revealThreshold && !isRevealed) {
            setIsRevealed(true);
            onComplete?.();
        }
    }, [isRevealed, calculateScratchPercentage, revealThreshold, onComplete]);

    // Get position from event
    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }
    };

    // Event handlers
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsScratching(true);
        lastPointRef.current = null;
        const pos = getPosition(e);
        if (pos) scratch(pos.x, pos.y);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isScratching) return;
        e.preventDefault();
        const pos = getPosition(e);
        if (pos) scratch(pos.x, pos.y);
    };

    const handleEnd = () => {
        setIsScratching(false);
        lastPointRef.current = null;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Hidden image underneath */}
            <div
                className={`relative overflow-hidden rounded-lg shadow-lg transition-opacity duration-500 ${isRevealed ? 'opacity-100' : 'opacity-100'
                    }`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="ความลับของเรา"
                    className="w-full h-auto max-h-[500px] object-contain"
                    style={{ display: isLoaded ? 'block' : 'none' }}
                />

                {/* Canvas overlay */}
                <canvas
                    ref={canvasRef}
                    className={`absolute top-0 left-0 w-full h-full cursor-pointer transition-opacity duration-700 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                    style={{ touchAction: 'none' }}
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                />

                {/* Loading placeholder */}
                {!isLoaded && (
                    <div
                        className="w-full h-64 animate-shimmer rounded-lg"
                        style={{
                            background: `linear-gradient(90deg, ${themeColors.background} 0%, ${themeColors.accent} 50%, ${themeColors.background} 100%)`,
                            backgroundSize: '200% 100%',
                        }}
                    />
                )}
            </div>


            {/* Hint text */}
            {!isRevealed && isLoaded && (
                <p
                    className="text-center text-sm mt-3 animate-pulse"
                    style={{ color: themeColors.primary }}
                >
                    👆 แตะแล้วลากเพื่อขูดเปิดความลับ
                </p>
            )}
        </div>
    );
}
