import { supabase } from './supabase'

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.85;

/**
 * Process image: resize if needed and convert to webp
 */
async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to webp
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to webp'));
          }
        },
        'image/webp',
        QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL from file and load
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  // Process the image (resize + convert to webp)
  const processedBlob = await processImage(file);

  // Generate unique filename with webp extension
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`
  const filePath = `images/${fileName}`

  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, processedBlob, {
      contentType: 'image/webp',
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Upload an audio blob (voice message) to the `audio` bucket.
 * Stores the recorded/uploaded container verbatim — NO transcoding, NO image processing.
 * Editor enforces the real 60s/10MB gate; this size check is defense in depth.
 */
export async function uploadAudio(blob: Blob, mimeType: string, fileName?: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  if (blob.size > 10 * 1024 * 1024) {
    throw new Error('AUDIO_TOO_LARGE')
  }

  // Strip ;codecs=... so the contentType matches a plain mime (avoids bucket-allowlist rejection)
  const baseMime = (mimeType || blob.type || '').split(';')[0]
  const extByMime: Record<string, string> = {
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  }
  const mimeByExt: Record<string, string> = {
    m4a: 'audio/mp4',
    aac: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
  }
  // Prefer the real MIME; fall back to the source filename's extension (iOS often gives empty file.type).
  const srcExt = fileName?.toLowerCase().match(/\.(m4a|aac|mp3|wav|ogg|webm)$/)?.[1]
  const ext = extByMime[baseMime] || srcExt || 'webm'

  const contentType = baseMime || mimeByExt[ext] || 'audio/webm'

  // Generate unique filename in the `voices/` folder (matches the bucket INSERT RLS policy)
  const storedFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
  const filePath = `voices/${storedFileName}`

  const { error } = await supabase.storage
    .from('audio')
    .upload(filePath, blob, {
      contentType,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage
    .from('audio')
    .getPublicUrl(filePath)

  return data.publicUrl
}
