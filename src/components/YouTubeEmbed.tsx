'use client';

interface YouTubeEmbedProps {
  url: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        URL YouTube ไม่ถูกต้อง
      </div>
    );
  }

  return (
    // Fill the space left under the title and center the video. aspect-video
    // keeps 16:9; max-h-full lets it shrink to fit short viewports (instead of
    // pushing the card past the screen and clipping the title above it).
    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
      <div className="relative w-full max-h-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
