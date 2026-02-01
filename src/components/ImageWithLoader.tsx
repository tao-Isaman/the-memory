'use client';

import { useState } from 'react';
import HeartIcon from './HeartIcon';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ImageWithLoader({ src, alt, className = '', style }: ImageWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract maxHeight from style for consistent sizing
  const containerStyle = {
    minHeight: '200px',
    ...style,
  };

  return (
    <div className="relative" style={containerStyle}>
      {/* Loading State - shows while image is loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-pink-50 to-pink-100 rounded-lg">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 animate-ping">
              <HeartIcon size={48} className="text-pink-200" />
            </div>
            {/* Main heart */}
            <HeartIcon size={48} className="text-[#FF6B9D] animate-pulse-heart relative z-10" />
          </div>
          <p className="mt-4 text-sm text-[#FF6B9D] font-medium animate-pulse">
            กำลังโหลดรูปภาพ...
          </p>
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      )}

      {/* Error State - shows when image fails to load */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 rounded-lg">
          <HeartIcon size={48} className="text-gray-300 mb-4" />
          <p className="text-sm text-gray-400">ไม่สามารถโหลดรูปภาพได้</p>
        </div>
      )}

      {/* Actual Image - always in DOM to maintain size, hidden on error */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
        style={{ ...style, minHeight: '200px' }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
