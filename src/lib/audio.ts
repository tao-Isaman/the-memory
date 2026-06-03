// Cross-platform audio normalization for the 'voice' story type.
//
// THE PROBLEM this solves: desktop/Android Chrome's MediaRecorder produces Opus audio
// (e.g. 'audio/mp4;codecs=opus' or 'audio/webm;codecs=opus'). iOS/iPadOS WebKit — which
// powers EVERY browser on iPhone/iPad, Safari and Chrome alike — cannot decode Opus in any
// container. A gift recorded on a laptop then played on the recipient's iPhone shows
// "ไม่สามารถเล่นเสียงได้ในอุปกรณ์นี้". See VoicePlayer's onError fallback.
//
// THE FIX: before upload, if the recorded/uploaded blob is NOT a codec iOS can play
// (AAC / MP3 / WAV), decode it on the RECORDING browser (which can always decode what it
// just produced) and re-encode to mono 16-bit WAV (LPCM) — universally playable, iOS included.
// AAC/MP3/WAV inputs pass through untouched (no transcode cost, small files).

// Voice-friendly target rate. 24 kHz mono 16-bit ≈ 2.9 MB / 60s — well under the 10 MB cap,
// clear for speech, and a clean 2:1 downsample from the usual 48 kHz capture rate.
const WAV_TARGET_SAMPLE_RATE = 24000;

// Codecs iOS/iPadOS WebKit decodes in an <audio> element: AAC (in mp4/m4a), MP3, WAV/PCM.
// Opus (in webm OR mp4) and Vorbis are NOT decodable on iOS and must be transcoded.
function isIosPlayable(mimeType: string, fileName?: string): boolean {
  const lower = (mimeType || '').toLowerCase();
  // The exact trap: 'audio/mp4;codecs=opus' looks like an iOS-friendly m4a but is Opus inside.
  if (lower.includes('opus') || lower.includes('vorbis')) return false;

  const base = lower.split(';')[0].trim();
  const safeBases = [
    'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  ];
  if (safeBases.includes(base)) return true;

  // webm/ogg or an empty MIME (iOS often hands us file.type === '') → fall back to the
  // file extension. A .m4a/.mp3/.wav upload is safe even with no MIME; a bare webm/ogg is not.
  if (base === 'audio/webm' || base === 'audio/ogg' || base === '') {
    return /\.(m4a|aac|mp3|wav)$/i.test(fileName || '');
  }
  return false;
}

/**
 * Guarantee an iOS-playable audio blob. AAC/MP3/WAV pass through unchanged; anything Opus-ish
 * (or unknown webm/ogg) is decoded + re-encoded to mono 16-bit WAV. Never throws: if decoding
 * fails (corrupt/exotic container), the original blob is returned so saving the gift is never
 * blocked — the viewer still offers its download fallback for that rare miss.
 */
export async function ensureIosPlayableAudio(
  blob: Blob,
  mimeType: string,
  fileName?: string,
): Promise<{ blob: Blob; mimeType: string }> {
  if (isIosPlayable(mimeType, fileName)) {
    return { blob, mimeType: mimeType || blob.type };
  }
  try {
    const wav = await transcodeToWav(blob);
    console.info(`[voice] transcoded ${mimeType || blob.type || 'unknown'} → audio/wav for iOS compatibility`);
    return { blob: wav, mimeType: 'audio/wav' };
  } catch (err) {
    console.warn('[voice] WAV transcode failed; uploading original container', err);
    return { blob, mimeType: mimeType || blob.type };
  }
}

async function transcodeToWav(blob: Blob): Promise<Blob> {
  const AudioCtx: typeof AudioContext | undefined =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error('AudioContext unavailable');

  const arrayBuf = await blob.arrayBuffer();

  // decodeAudioData detaches its input on some engines → pass a copy. Decode at the source
  // rate using a throwaway context, then close it to avoid leaking AudioContext instances.
  const decodeCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
  } finally {
    decodeCtx.close().catch(() => {});
  }

  const targetRate = Math.min(WAV_TARGET_SAMPLE_RATE, decoded.sampleRate);
  let monoData: Float32Array;
  let outRate: number;
  try {
    // OfflineAudioContext does the downmix-to-mono + high-quality resample for us.
    const frames = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineAudioContext(1, frames, targetRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    monoData = rendered.getChannelData(0);
    outRate = rendered.sampleRate;
  } catch {
    // Some older engines reject non-standard OfflineAudioContext rates — downmix at native rate.
    monoData = downmixToMono(decoded);
    outRate = decoded.sampleRate;
  }

  return encodeWav(monoData, outRate);
}

function downmixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const out = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) out[i] += data[i] / channels;
  }
  return out;
}

// Minimal 44-byte-header PCM WAV (mono, 16-bit). No dependency.
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);                    // PCM fmt chunk size
  view.setUint16(20, 1, true);                     // audio format = PCM
  view.setUint16(22, 1, true);                     // channels = mono
  view.setUint32(24, sampleRate, true);            // sample rate
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate (mono)
  view.setUint16(32, bytesPerSample, true);        // block align (mono)
  view.setUint16(34, 8 * bytesPerSample, true);    // bits per sample = 16
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
