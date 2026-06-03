'use client';

import { useState, useEffect, useRef } from 'react';
import { StoryType, MemoryStory } from '@/types/memory';
import { ThemeColors } from '@/lib/themes';
import { generateId } from '@/lib/storage';
import { uploadImage, uploadAudio } from '@/lib/upload';
import { useToast } from '@/hooks/useToast';
import VoicePlayer from './VoicePlayer';
import {
  STORY_TEXT_LIMITS,
  VOICE_MAX_DURATION_SEC,
  VOICE_MAX_SIZE_BYTES,
  VOICE_ACCEPTED_EXT,
  SLIDESHOW_MIN_IMAGES,
  SLIDESHOW_MAX_IMAGES,
  SLIDESHOW_IMAGE_MAX_BYTES,
} from '@/lib/constants';
import {
  Lock,
  MessageCircleHeart,
  Camera,
  ImagePlus,
  Music,
  Sparkles,
  HelpCircle,
  Mic,
  Images,
  ChevronLeft,
  ChevronRight,
  X,
  Square,
  LucideIcon,
} from 'lucide-react';

interface StoryEditorProps {
  onSave: (story: MemoryStory) => void;
  onCancel: () => void;
  editingStory?: MemoryStory;
  initialType?: StoryType;
  noCard?: boolean;
  themeColors?: ThemeColors;
}

// Default theme colors (love theme)
const defaultColors: ThemeColors = {
  primary: '#FF6B9D',
  dark: '#E63946',
  accent: '#FFB6C1',
  background: '#FFF0F5',
};

export const storyTypeLabels: Record<StoryType, string> = {
  password: 'รหัส PIN',
  text: 'ข้อความ',
  image: 'รูปภาพ',
  'text-image': 'ข้อความ + รูปภาพ',
  youtube: 'วิดีโอ YouTube',
  scratch: 'ความลับของเรา',
  question: 'คำถาม',
  voice: 'ข้อความเสียง',
  slideshow: 'อัลบั้มภาพ',
};

const storyTypeDescriptions: Record<StoryType, string> = {
  password: 'เพิ่มรหัส PIN 6 หลักเพื่อปกป้องเนื้อหา',
  text: 'เพิ่มข้อความจากใจ',
  image: 'เพิ่มรูปภาพพิเศษ',
  'text-image': 'รวมข้อความกับรูปภาพ',
  youtube: 'เพิ่มเพลงหรือวิดีโอที่มีความหมาย',
  scratch: 'ซ่อนรูปภาพไว้ในเมฆให้คนพิเศษขูดเปิดดู',
  question: 'สร้างคำถามให้คนพิเศษตอบ พร้อม 4 ตัวเลือก',
  voice: 'บันทึกเสียงหรืออัปโหลดไฟล์เสียง สูงสุด 1 นาที',
  slideshow: 'รวมรูป 2-5 รูป เล่นเป็นสไลด์โชว์พร้อมเอฟเฟกต์ซูม',
};

export const storyTypeIcons: Record<StoryType, LucideIcon> = {
  password: Lock,
  text: MessageCircleHeart,
  image: Camera,
  'text-image': ImagePlus,
  youtube: Music,
  scratch: Sparkles,
  question: HelpCircle,
  voice: Mic,
  slideshow: Images,
};

// Recorder state machine for the voice story type. 'unsupported' = device/webview
// can't record (old iOS, LINE/FB in-app browsers) → only the upload path is offered.
type RecMode = 'idle' | 'requesting' | 'recording' | 'recorded' | 'denied' | 'unsupported';

// One slide in the slideshow editor — the unified ordered source of truth.
// `uploadedUrl` is cached on success so a partial upload failure only re-uploads the
// failed slides (never a half-list to the DB).
type SlideItem = {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
};

// MediaRecorder mime preference — iOS Safari yields audio/mp4(AAC), Chrome/Android
// audio/webm;opus. We still store the ACTUAL blob.type after stop, never this string.
function pickAudioMime(): string {
  const PREFS = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mpeg', 'audio/ogg;codecs=opus'];
  for (const t of PREFS) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return ''; // '' => let the browser default rather than throw in the constructor
}

// Accept a file as audio if its MIME says so OR its extension matches — the extension
// fallback is MANDATORY because iOS often hands us an empty file.type.
function isAcceptableAudio(file: File): boolean {
  return file.type.startsWith('audio/') || VOICE_ACCEPTED_EXT.test(file.name);
}

// Live 'M:SS' label for the recording timer / hint.
function formatRecTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StoryEditor({
  onSave,
  onCancel,
  editingStory,
  initialType,
  noCard,
  themeColors = defaultColors,
}: StoryEditorProps) {
  const { showToast } = useToast();
  const isEditing = !!editingStory;

  // Initialize state from editing story if provided
  const getInitialType = (): StoryType => {
    if (editingStory) return editingStory.type;
    if (initialType) return initialType;
    return 'text';
  };

  const getInitialText = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'text') return editingStory.content.text;
    if (editingStory.type === 'text-image') return editingStory.content.text;
    return '';
  };

  const getInitialImageUrl = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'image') return editingStory.content.imageUrl;
    if (editingStory.type === 'text-image') return editingStory.content.imageUrl;
    if (editingStory.type === 'scratch') return editingStory.content.imageUrl;
    return '';
  };

  const getInitialCaption = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'image') return editingStory.content.caption || '';
    if (editingStory.type === 'scratch') return editingStory.content.caption || '';
    return '';
  };

  const getInitialPassword = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'password') return editingStory.content.password;
    return '';
  };

  const getInitialYoutubeUrl = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'youtube') return editingStory.content.youtubeUrl;
    return '';
  };

  const getInitialQuestion = () => {
    if (!editingStory) return { question: '', choices: ['', '', '', ''], correctIndex: 0 };
    if (editingStory.type === 'question') {
      return {
        question: editingStory.content.question,
        choices: editingStory.content.choices,
        correctIndex: editingStory.content.correctIndex,
      };
    }
    return { question: '', choices: ['', '', '', ''], correctIndex: 0 };
  };

  // --- Voice initializers (mirror getInitialImageUrl/getInitialCaption) ---
  const getInitialAudioUrl = (): string => {
    if (editingStory?.type === 'voice') return editingStory.content.audioUrl;
    return '';
  };

  const getInitialVoiceCaption = (): string => {
    if (editingStory?.type === 'voice') return editingStory.content.caption || '';
    return '';
  };

  const getInitialAudioDuration = (): number => {
    if (editingStory?.type === 'voice') return editingStory.content.durationSec;
    return 0;
  };

  const getInitialAudioMime = (): string => {
    if (editingStory?.type === 'voice') return editingStory.content.mimeType;
    return '';
  };

  // --- Slideshow initializers ---
  const getInitialSlides = (): SlideItem[] => {
    if (editingStory?.type === 'slideshow') {
      return editingStory.content.imageUrls.map((url) => ({
        id: generateId(),
        previewUrl: url,
        uploadedUrl: url,
        status: 'done' as const,
      }));
    }
    return [];
  };

  const getInitialSlideshowCaption = (): string => {
    if (editingStory?.type === 'slideshow') return editingStory.content.caption || '';
    return '';
  };

  const [type, setType] = useState<StoryType>(getInitialType());
  const [title, setTitle] = useState(editingStory?.title || '');
  const [text, setText] = useState(getInitialText());
  const [imageUrl, setImageUrl] = useState(getInitialImageUrl());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(getInitialImageUrl());
  const [caption, setCaption] = useState(getInitialCaption());
  const [password, setPassword] = useState(getInitialPassword());
  const [youtubeUrl, setYoutubeUrl] = useState(getInitialYoutubeUrl());
  const [uploading, setUploading] = useState(false);
  // Question story state
  const [questionText, setQuestionText] = useState(getInitialQuestion().question);
  const [choices, setChoices] = useState(getInitialQuestion().choices);
  const [correctIndex, setCorrectIndex] = useState(getInitialQuestion().correctIndex);

  // Voice story state
  const [audioUrl, setAudioUrl] = useState(getInitialAudioUrl());
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState(getInitialAudioDuration());
  const [audioMime, setAudioMime] = useState(getInitialAudioMime());
  const [audioSource, setAudioSource] = useState<'record' | 'upload'>('record');
  const [voiceCaption, setVoiceCaption] = useState(getInitialVoiceCaption());
  const [recMode, setRecMode] = useState<RecMode>('idle');
  const [recSeconds, setRecSeconds] = useState(0);

  // Slideshow story state
  const [slides, setSlides] = useState<SlideItem[]>(getInitialSlides());
  const [slideCaption, setSlideCaption] = useState(getInitialSlideshowCaption());
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  // Track Object URL for cleanup to prevent memory leaks
  const objectUrlRef = useRef<string | null>(null);
  // Voice recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioObjectUrlRef = useRef<string | null>(null);
  // Every slideshow preview object URL ever created — revoked on unmount / remove
  const slideObjectUrlsRef = useRef<Set<string>>(new Set());

  // Capability detection: hide the record orb on devices/webviews that can't record
  // (old iOS AND LINE/Facebook/Messenger in-app browsers). The upload path works everywhere.
  useEffect(() => {
    if (type !== 'voice') return;
    const canRecord =
      typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    if (!canRecord) {
      setRecMode((prev) => (prev === 'idle' ? 'unsupported' : prev));
    }
  }, [type]);

  // Reset per-type transient state when the user switches story type (create flow only;
  // `type` is locked while editing so this is a no-op there). Prevents a HOT MIC: leaving
  // 'voice' mid-record must release the stream — the unmount cleanup does NOT fire on a switch.
  useEffect(() => {
    if (type !== 'voice') {
      // Detach onstop FIRST so the (async) stop can't re-set recMode='recorded'/audioBlob.
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
        mediaRecorderRef.current = null;
      }
      chunksRef.current = [];
      teardownRecording();   // stops mic tracks + clears the 200ms interval (idempotent)
      resetVoice();          // revokes audioObjectUrlRef + clears blob/preview/duration/mime/url
      setRecMode('idle');
      setRecSeconds(0);
    }
    if (type !== 'slideshow' && slides.length > 0) {
      slideObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      slideObjectUrlsRef.current.clear();
      setSlides([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Cleanup on unmount: revoke all object URLs, release the mic, clear the rec timer.
  useEffect(() => {
    const slideUrls = slideObjectUrlsRef.current;
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
      }
      slideUrls.forEach((url) => URL.revokeObjectURL(url));
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous Object URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      objectUrlRef.current = previewUrl;
      setImagePreview(previewUrl);
    }
  };

  // ===================== VOICE RECORDER =====================

  // Release the mic and clear the live timer (called after stop / on error).
  const teardownRecording = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  };

  // Stop the active recorder (manual tap or 60s hard cap). onstop builds the blob.
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    setRecMode('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const picked = pickAudioMime();
      const recorder = new MediaRecorder(stream, picked ? { mimeType: picked } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Read blob.type AFTER stop — Safari emits audio/mp4 regardless of the requested type.
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || picked || 'audio/webm',
        });
        // Wall-clock duration — DO NOT trust audioEl.duration for webm (Chrome → Infinity).
        const durationSec = Math.min(
          VOICE_MAX_DURATION_SEC,
          Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        );

        if (audioObjectUrlRef.current) {
          URL.revokeObjectURL(audioObjectUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(blob);
        audioObjectUrlRef.current = previewUrl;

        setAudioBlob(blob);
        setAudioMime(blob.type);
        setAudioSource('record');
        setAudioPreviewUrl(previewUrl);
        setAudioDuration(durationSec);
        setRecMode('recorded');
        teardownRecording();
      };

      startTimeRef.current = Date.now();
      recorder.start(1000); // 1s timeslice → chunks arrive even if the tab backgrounds
      setRecMode('recording');
      setRecSeconds(0);

      recTimerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setRecSeconds(elapsed);
        if (elapsed >= VOICE_MAX_DURATION_SEC) {
          if (recTimerRef.current) {
            clearInterval(recTimerRef.current);
            recTimerRef.current = null;
          }
          stopRecording();
          showToast('อัดเสียงได้สูงสุด 1 นาที', 'info');
        }
      }, 200);
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setRecMode('denied');
      } else if (name === 'NotFoundError') {
        showToast('ไม่พบไมโครโฟน', 'error');
        setRecMode('idle');
      } else {
        showToast('ไม่สามารถเข้าถึงไมโครโฟนได้', 'error');
        setRecMode('idle');
      }
    }
  };

  // Upload-file path (always available, even on 'unsupported' devices).
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    if (file.size > VOICE_MAX_SIZE_BYTES) {
      showToast('ไฟล์เสียงใหญ่เกินไป (สูงสุด 10MB)', 'error');
      return;
    }
    if (!isAcceptableAudio(file)) {
      showToast('ไฟล์นี้ไม่ใช่ไฟล์เสียง', 'error');
      return;
    }

    // Probe duration via a throwaway <audio> element.
    const probeUrl = URL.createObjectURL(file);
    const probe = new Audio(probeUrl);
    let settled = false;
    const accept = (durationSec: number) => {
      if (settled) return; settled = true;
      clearTimeout(timer);
      if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = probeUrl;
      setAudioBlob(file); setAudioMime(file.type || ''); setAudioSource('upload');
      setAudioPreviewUrl(probeUrl); setAudioDuration(durationSec); setRecMode('recorded');
    };
    const reject = (msgKey: string) => {
      if (settled) return; settled = true;
      clearTimeout(timer); URL.revokeObjectURL(probeUrl); showToast(msgKey, 'error');
    };
    const timer = setTimeout(() => {
      // No metadata after 4s (corrupt/edge/stalled): accept with provisional, but
      // store 0 so the viewer treats the total as UNKNOWN (see B), never a fake 1:00.
      accept(0);
    }, 4000);
    probe.addEventListener('loadedmetadata', () => {
      const d = probe.duration;
      if (Number.isFinite(d) && d > VOICE_MAX_DURATION_SEC + 1) {
        reject('เสียงยาวเกิน 1 นาที กรุณาเลือกไฟล์สั้นกว่านี้'); return;
      }
      // Non-finite (rare malformed/streamed upload) → store 0 = "unknown", NOT 60.
      accept(Number.isFinite(d) && d > 0 ? Math.min(VOICE_MAX_DURATION_SEC, Math.max(1, Math.round(d))) : 0);
    });
    probe.addEventListener('error', () => reject('ไฟล์นี้ไม่ใช่ไฟล์เสียง'));
  };

  // Discard the current take and return to the record/upload chooser.
  const resetVoice = () => {
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
    setAudioBlob(null);
    setAudioPreviewUrl('');
    setAudioDuration(0);
    setAudioMime('');
    // When editing existing audio with no new blob, also clear audioUrl so submit re-validates.
    setAudioUrl('');
    setRecMode('idle');
  };

  // ===================== SLIDESHOW =====================

  const handleSlidesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    e.target.value = ''; // allow re-picking the same file
    if (!picked || picked.length === 0) return;

    const incoming = Array.from(picked);
    const remaining = SLIDESHOW_MAX_IMAGES - slides.length;
    if (incoming.length > remaining) {
      showToast('เลือกรูปได้สูงสุด 5 รูป', 'info');
    }
    const toAdd = incoming.slice(0, Math.max(0, remaining));

    const accepted: SlideItem[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > SLIDESHOW_IMAGE_MAX_BYTES) {
        showToast('รูปภาพใหญ่เกินไป (สูงสุด 10MB)', 'error');
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      slideObjectUrlsRef.current.add(previewUrl);
      accepted.push({ id: generateId(), file, previewUrl, status: 'pending' });
    }
    if (accepted.length > 0) {
      setSlides((prev) => [...prev, ...accepted]);
    }
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => {
      const target = prev.find((s) => s.id === id);
      // Only revoke file-backed previews (existing saved URLs are not object URLs).
      if (target?.file && slideObjectUrlsRef.current.has(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
        slideObjectUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((s) => s.id !== id);
    });
  };

  const moveSlideLeft = (index: number) => {
    if (index === 0) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveSlideRight = (index: number) => {
    setSlides((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const baseStory = {
      id: editingStory?.id || generateId(),
      priority: editingStory?.priority || 0,
      title: title.trim() || undefined,
      createdAt: editingStory?.createdAt || new Date().toISOString(),
    };

    let story: MemoryStory;
    let uploadedImageUrl = imageUrl;

    // Upload image if there's a file
    if ((type === 'image' || type === 'text-image' || type === 'scratch') && imageFile) {
      try {
        setUploading(true);
        uploadedImageUrl = await uploadImage(imageFile);
      } catch (error) {
        showToast('อัพโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    switch (type) {
      case 'password':
        if (password.length !== 6 || !/^\d{6}$/.test(password)) {
          showToast('กรุณาใส่รหัส PIN 6 หลัก', 'error');
          return;
        }
        story = { ...baseStory, type: 'password', content: { password: password } };
        break;
      case 'text':
        if (!text.trim()) return;
        story = { ...baseStory, type: 'text', content: { text: text.trim() } };
        break;
      case 'image':
        if (!uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'image',
          content: { imageUrl: uploadedImageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'text-image':
        if (!text.trim() || !uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'text-image',
          content: { text: text.trim(), imageUrl: uploadedImageUrl.trim() },
        };
        break;
      case 'youtube':
        if (!youtubeUrl.trim()) return;
        story = { ...baseStory, type: 'youtube', content: { youtubeUrl: youtubeUrl.trim() } };
        break;
      case 'scratch':
        if (!uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'scratch',
          content: { imageUrl: uploadedImageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'question':
        if (!questionText.trim()) {
          showToast('กรุณาใส่คำถาม', 'error');
          return;
        }
        if (choices.some(c => !c.trim())) {
          showToast('กรุณาใส่ตัวเลือกทั้ง 4 ข้อ', 'error');
          return;
        }
        story = {
          ...baseStory,
          type: 'question',
          content: {
            question: questionText.trim(),
            choices: choices.map(c => c.trim()),
            correctIndex,
          },
        };
        break;
      case 'voice': {
        if (!audioBlob && !audioUrl) {
          showToast('กรุณาอัดเสียงหรืออัปโหลดไฟล์เสียงก่อน', 'error');
          return;
        }
        let finalAudioUrl = audioUrl;
        if (audioBlob) {
          try {
            setUploading(true);
            finalAudioUrl = await uploadAudio(audioBlob, audioMime, audioBlob instanceof File ? audioBlob.name : undefined);
          } catch {
            showToast('อัปโหลดเสียงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        }
        const durationSec = audioDuration > 0 ? Math.min(VOICE_MAX_DURATION_SEC, Math.round(audioDuration)) : 0;
        story = {
          ...baseStory,
          type: 'voice',
          content: {
            audioUrl: finalAudioUrl,
            durationSec,
            mimeType: audioMime,
            source: audioSource,
            caption: voiceCaption.trim() || undefined,
          },
        };
        break;
      }
      case 'slideshow': {
        if (slides.length < SLIDESHOW_MIN_IMAGES) {
          showToast('กรุณาเพิ่มรูปอย่างน้อย 2 รูป', 'error');
          return;
        }
        if (slides.length > SLIDESHOW_MAX_IMAGES) {
          showToast('เลือกรูปได้สูงสุด 5 รูป', 'error');
          return;
        }

        // Snapshot of the slides to upload. uploadedUrl is cached per slide so a
        // partial failure only re-uploads the failed ones (never a half-list to the DB).
        const working = slides.map((s) => ({ ...s }));
        const pending = working.filter((s) => !s.uploadedUrl && s.file);
        let failed = false;

        if (pending.length > 0) {
          setUploading(true);
          setUploadProgress({ done: 0, total: pending.length });
          let doneCount = 0;
          let cursor = 0;

          // Bounded-concurrency(2) promise pool — survives slow Thai mobile networks
          // better than 5-parallel, while uploading each only once.
          const worker = async () => {
            while (cursor < pending.length) {
              const slide = pending[cursor];
              cursor += 1;
              try {
                const url = await uploadImage(slide.file!);
                slide.uploadedUrl = url;
                slide.status = 'done';
                doneCount += 1;
                setUploadProgress({ done: doneCount, total: pending.length });
              } catch {
                slide.status = 'error';
                failed = true;
              }
            }
          };
          await Promise.all([worker(), worker()]);

          // Reflect upload results back into the visible slides (cache successes for retry).
          setSlides((prev) =>
            prev.map((s) => {
              const updated = working.find((w) => w.id === s.id);
              return updated
                ? { ...s, uploadedUrl: updated.uploadedUrl, status: updated.status }
                : s;
            })
          );
          setUploading(false);
          setUploadProgress(null);
        }

        if (failed || working.some((s) => !s.uploadedUrl)) {
          showToast('อัปโหลดบางรูปไม่สำเร็จ แตะรูปที่มีปัญหาเพื่อลองใหม่', 'error');
          return;
        }

        const imageUrls = working.map((s) => s.uploadedUrl!);
        story = {
          ...baseStory,
          type: 'slideshow',
          content: {
            imageUrls,
            caption: slideCaption.trim() || undefined,
          },
        };
        break;
      }
      default:
        return;
    }

    onSave(story);
  };

  // The shared text field serves both 'text' (long message) and 'text-image' (short caption)
  const textMaxLength = type === 'text-image' ? STORY_TEXT_LIMITS.textImage : STORY_TEXT_LIMITS.text;

  // Small right-aligned counter shown beneath a text field; turns red as the limit is reached
  const CharCount = ({ value, max }: { value: string; max: number }) => (
    <p
      className="text-xs mt-1 text-right"
      style={{ color: value.length >= max ? '#dc2626' : '#9ca3af' }}
    >
      {value.length}/{max}
    </p>
  );

  // CSS variables for themed inputs
  const cssVariables = {
    '--theme-primary': themeColors.primary,
    '--theme-dark': themeColors.dark,
    '--theme-accent': themeColors.accent,
    '--theme-background': themeColors.background,
    '--theme-focus-shadow': `${themeColors.primary}33`,
  } as React.CSSProperties;

  return (
    <div className={noCard ? '' : 'memory-card p-6'} style={cssVariables}>
      <h3 className="font-kanit text-xl font-bold mb-4" style={{ color: themeColors.dark }}>
        {isEditing ? 'แก้ไขเรื่องราว' : 'เพิ่มเรื่องราวความทรงจำใหม่'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Story Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทความทรงจำ
          </label>
          {isEditing ? (
            // Show current type only when editing (can't change type)
            <div
              className="p-3 rounded-lg border-2 inline-flex items-center gap-2"
              style={{
                borderColor: themeColors.primary,
                backgroundColor: `${themeColors.accent}33`,
              }}
            >
              {(() => {
                const IconComponent = storyTypeIcons[type];
                return <IconComponent size={18} style={{ color: themeColors.dark }} />;
              })()}
              <span className="font-medium text-sm">{storyTypeLabels[type]}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(storyTypeLabels) as StoryType[]).map((t) => {
                const IconComponent = storyTypeIcons[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="p-3 rounded-lg border-2 text-left transition-all"
                    style={{
                      borderColor: isSelected ? themeColors.primary : '#e5e7eb',
                      backgroundColor: isSelected ? `${themeColors.accent}33` : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent size={18} style={{ color: isSelected ? themeColors.dark : '#6b7280' }} />
                      <span className="font-medium text-sm">{storyTypeLabels[t]}</span>
                    </div>
                    <span className="block text-xs text-gray-500">
                      {storyTypeDescriptions[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Story Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อเรื่องราว (ไม่จำเป็น)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ตั้งชื่อให้จดจำง่าย เช่น 'วันแรกที่เจอกัน'"
            className="input-valentine"
            maxLength={STORY_TEXT_LIMITS.title}
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-500 mt-1">
              ชื่อนี้จะแสดงแทนประเภทเรื่องราวในรายการ
            </p>
            <CharCount value={title} max={STORY_TEXT_LIMITS.title} />
          </div>
        </div>

        {/* Dynamic Fields based on type */}
        {type === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัส PIN (6 หลัก)
            </label>
            <div className="flex justify-center gap-2" id="pin-inputs">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="none"
                  maxLength={1}
                  value={password[index] || ''}
                  readOnly
                  onKeyDown={(e) => {
                    // Handle number keys (for desktop keyboard)
                    if (/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                      const newPin = password.split('');
                      newPin[index] = e.key;
                      setPassword(newPin.join(''));
                      // Auto-focus next input
                      if (index < 5) {
                        const nextInput = (e.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
                        nextInput?.focus();
                      }
                      return;
                    }
                    // Handle backspace to go to previous input
                    if (e.key === 'Backspace') {
                      if (!password[index] && index > 0) {
                        const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                        prevInput?.focus();
                        const newPin = password.split('');
                        newPin[index - 1] = '';
                        setPassword(newPin.join(''));
                      } else {
                        const newPin = password.split('');
                        newPin[index] = '';
                        setPassword(newPin.join(''));
                      }
                    } else if (e.key === 'ArrowLeft' && index > 0) {
                      const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                      prevInput?.focus();
                    } else if (e.key === 'ArrowRight' && index < 5) {
                      const nextInput = (e.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                  className="w-11 h-12 text-center text-xl font-bold input-valentine"
                  required={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              ใส่ตัวเลข 6 หลักเพื่อปกป้องเนื้อหาถัดไป
            </p>
            {/* Number pad for mobile */}
            <div className="mt-4 grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (num === 'del') {
                      // Find last filled input and clear it
                      const lastFilledIndex = password.split('').findLastIndex(p => p !== '');
                      if (lastFilledIndex >= 0) {
                        const newPin = password.split('');
                        newPin[lastFilledIndex] = '';
                        setPassword(newPin.join(''));
                        // Focus that input
                        const container = document.getElementById('pin-inputs');
                        const input = container?.children[lastFilledIndex] as HTMLInputElement;
                        input?.focus();
                      }
                    } else if (num !== null) {
                      // Find first empty input and fill it
                      const firstEmptyIndex = password.split('').findIndex((p, i) => i < 6 && (p === '' || p === undefined));
                      const targetIndex = firstEmptyIndex === -1 ? (password.length < 6 ? password.length : -1) : firstEmptyIndex;
                      if (targetIndex >= 0 && targetIndex < 6) {
                        const newPin = password.split('');
                        while (newPin.length < 6) newPin.push('');
                        newPin[targetIndex] = num.toString();
                        setPassword(newPin.join(''));
                        // Focus next input
                        const container = document.getElementById('pin-inputs');
                        const nextInput = container?.children[Math.min(targetIndex + 1, 5)] as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }
                  }}
                  className={`h-12 rounded-lg text-xl font-semibold transition-all ${num === null ? 'invisible' : ''}`}
                  style={
                    num === null
                      ? {}
                      : num === 'del'
                        ? { backgroundColor: '#f3f4f6', color: '#4b5563' }
                        : { backgroundColor: `${themeColors.accent}33`, color: themeColors.dark }
                  }
                >
                  {num === 'del' ? '⌫' : num}
                </button>
              ))}
            </div>
          </div>
        )}

        {(type === 'text' || type === 'text-image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ข้อความของคุณ
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="เขียนอะไรบางอย่างจากใจ..."
              className="input-valentine min-h-[120px] resize-y"
              maxLength={textMaxLength}
              required
            />
            {type === 'text-image' && (
              <p className="text-xs text-gray-500 mt-1">
                ข้อความสั้นๆ ประกอบรูปภาพ (ประมาณ 3-4 บรรทัด)
              </p>
            )}
            <CharCount value={text} max={textMaxLength} />
          </div>
        )}

        {(type === 'image' || type === 'text-image' || type === 'scratch') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {imageUrl && !imageFile ? 'เปลี่ยนรูปภาพ (ไม่จำเป็น)' : 'อัพโหลดรูปภาพ'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-valentine file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:transition-opacity"
              required={!imageUrl && !imageFile}
            />
            {imagePreview && (
              <div className="mt-2 p-2 border rounded-lg bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="ตัวอย่าง"
                  className="max-h-40 mx-auto rounded"
                />
              </div>
            )}
          </div>
        )}

        {(type === 'image' || type === 'scratch') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำบรรยาย (ไม่จำเป็น)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เพิ่มคำบรรยายน่ารักๆ..."
              className="input-valentine"
              maxLength={STORY_TEXT_LIMITS.caption}
            />
            <CharCount value={caption} max={STORY_TEXT_LIMITS.caption} />
          </div>
        )}

        {type === 'youtube' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL YouTube
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input-valentine"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              วางลิงก์ YouTube เพื่อแชร์เพลงหรือวิดีโอที่มีความหมาย
            </p>
          </div>
        )}

        {type === 'question' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำถาม
              </label>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="เช่น: เราเจอกันครั้งแรกที่ไหน?"
                className="input-valentine"
                maxLength={STORY_TEXT_LIMITS.question}
                required
              />
              <CharCount value={questionText} max={STORY_TEXT_LIMITS.question} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตัวเลือก (4 ข้อ)
              </label>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="text"
                      value={choices[index] || ''}
                      onChange={(e) => {
                        const newChoices = [...choices];
                        newChoices[index] = e.target.value;
                        setChoices(newChoices);
                      }}
                      placeholder={`ตัวเลือก ${String.fromCharCode(65 + index)}`}
                      className="input-valentine flex-1"
                      maxLength={STORY_TEXT_LIMITS.choice}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำตอบที่ถูกต้อง
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCorrectIndex(index)}
                    className="px-4 py-2 rounded-full font-semibold transition-all"
                    style={{
                      backgroundColor: correctIndex === index ? themeColors.primary : themeColors.background,
                      color: correctIndex === index ? 'white' : themeColors.dark,
                      border: `2px solid ${themeColors.primary}`,
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                เลือกตัวเลือกที่เป็นคำตอบที่ถูกต้อง
              </p>
            </div>
          </div>
        )}

        {/* Voice story */}
        {type === 'voice' && (() => {
          // Preview the SHARED VoicePlayer whenever we have a fresh take ('recorded')
          // OR an existing saved audioUrl that's not mid-record/request. When previewing,
          // the record/upload chooser blocks are hidden (the 'อัดใหม่' button re-opens them).
          const voiceShowPreview =
            recMode === 'recorded' ||
            (!!audioUrl && recMode !== 'recording' && recMode !== 'requesting');
          return (
          <div className="space-y-4">
            {/* a11y live region for recorder status changes */}
            <span className="sr-only" aria-live="polite">
              {recMode === 'recording'
                ? 'กำลังอัดเสียง'
                : recMode === 'recorded'
                  ? 'อัดเสียงเสร็จแล้ว'
                  : ''}
            </span>

            {/* idle / requesting — show the glowing record orb (only if recording is supported) */}
            {!voiceShowPreview && (recMode === 'idle' || recMode === 'requesting') && (
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={recMode === 'requesting'}
                  aria-label="อัดเสียง"
                  className="relative flex items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 animate-pulse-heart disabled:opacity-70"
                  style={{
                    width: '88px',
                    height: '88px',
                    background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                    boxShadow: `0 8px 24px ${themeColors.dark}4D`,
                  }}
                >
                  <Mic size={36} />
                </button>
                <p className="text-sm text-gray-500">
                  {recMode === 'requesting' ? 'กำลังขอสิทธิ์ไมโครโฟน...' : 'แตะเพื่อเริ่มอัดเสียง'}
                </p>
                {/* secondary: upload a file instead */}
                <label
                  className="text-sm font-semibold cursor-pointer underline"
                  style={{ color: themeColors.dark }}
                >
                  หรืออัปโหลดไฟล์เสียง
                  <input
                    type="file"
                    accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm"
                    onChange={handleAudioFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* recording — orb morphs into a red stop square with a running timer */}
            {recMode === 'recording' && (
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={stopRecording}
                  aria-label="หยุด"
                  className="flex items-center justify-center rounded-full text-white transition-transform active:scale-95"
                  style={{
                    width: '88px',
                    height: '88px',
                    backgroundColor: '#dc2626',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  <Square size={32} className="fill-current" />
                </button>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: themeColors.dark }}
                  aria-live="polite"
                >
                  {formatRecTime(recSeconds)} / {formatRecTime(VOICE_MAX_DURATION_SEC)}
                </span>
                {/* thin progress bar toward 60s */}
                <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.accent}66` }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{
                      width: `${Math.min(100, (recSeconds / VOICE_MAX_DURATION_SEC) * 100)}%`,
                      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">แตะเพื่อหยุดอัดเสียง</p>
              </div>
            )}

            {/* denied — never a dead-end: offer retry + upload */}
            {!voiceShowPreview && recMode === 'denied' && (
              <div
                className="p-4 rounded-lg border-2 space-y-3"
                style={{ borderColor: themeColors.primary, backgroundColor: `${themeColors.accent}1A` }}
              >
                <p className="text-sm text-gray-700">
                  คุณปิดการเข้าถึงไมโครโฟนไว้ — เปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์แล้วลองใหม่ หรืออัปโหลดไฟล์เสียงแทน
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                    }}
                  >
                    ลองอีกครั้ง
                  </button>
                  <label
                    className="text-sm font-semibold cursor-pointer underline"
                    style={{ color: themeColors.dark }}
                  >
                    อัปโหลดไฟล์เสียง
                    <input
                      type="file"
                      accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* unsupported — hide the orb, only allow upload */}
            {!voiceShowPreview && recMode === 'unsupported' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  อุปกรณ์นี้ไม่รองรับการอัดเสียง กรุณาอัปโหลดไฟล์เสียงแทน
                </p>
                <input
                  type="file"
                  accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm"
                  onChange={handleAudioFileChange}
                  className="input-valentine file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:transition-opacity"
                />
              </div>
            )}

            {/* recorded / editing existing audio — preview via the SHARED VoicePlayer (WYSIWYG) */}
            {voiceShowPreview && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.accent}1A` }}>
                  <VoicePlayer
                    audioUrl={audioPreviewUrl || audioUrl}
                    durationSec={audioDuration}
                    mimeType={audioMime}
                    caption={voiceCaption}
                    themeColors={themeColors}
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={resetVoice}
                    className="px-4 py-2 rounded-full font-semibold text-sm transition-all border-2"
                    style={{ borderColor: themeColors.primary, color: themeColors.dark }}
                  >
                    {audioSource === 'upload' ? 'เลือกไฟล์ใหม่' : 'อัดใหม่'}
                  </button>
                </div>

                {/* caption — same block as the image caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำบรรยาย (ไม่จำเป็น)
                  </label>
                  <input
                    type="text"
                    value={voiceCaption}
                    onChange={(e) => setVoiceCaption(e.target.value)}
                    placeholder='เช่น "ฟังเสียงนี้นะ..."'
                    className="input-valentine"
                    maxLength={STORY_TEXT_LIMITS.caption}
                  />
                  <CharCount value={voiceCaption} max={STORY_TEXT_LIMITS.caption} />
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* Slideshow story */}
        {type === 'slideshow' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพ (2-5 รูป)
              </label>

              {slides.length === 0 ? (
                // Empty state — the dashed add tile fills the grid
                <label
                  className="flex flex-col items-center justify-center gap-2 aspect-[3/1] rounded-lg border-2 border-dashed cursor-pointer transition-colors"
                  style={{ borderColor: themeColors.primary, backgroundColor: `${themeColors.accent}1A` }}
                >
                  <ImagePlus size={28} style={{ color: themeColors.dark }} />
                  <span className="text-sm" style={{ color: themeColors.dark }}>
                    ยังไม่มีรูปภาพ เพิ่มรูปแรกของคุณ
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSlidesAdd}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="relative aspect-square rounded-lg overflow-hidden"
                      style={{
                        boxShadow:
                          slide.status === 'error'
                            ? '0 0 0 2px #dc2626'
                            : `0 0 0 2px ${themeColors.accent}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.previewUrl}
                        alt={`รูปที่ ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* index badge — reuse the StoryList gradient priority chip */}
                      <span
                        className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                        }}
                      >
                        {index + 1}
                      </span>

                      {/* remove button */}
                      <button
                        type="button"
                        onClick={() => removeSlide(slide.id)}
                        aria-label="ลบรูป"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center border-2"
                        style={{ borderColor: themeColors.dark, color: themeColors.dark }}
                      >
                        <X size={14} />
                      </button>

                      {/* reorder chevrons */}
                      <div className="absolute bottom-1 inset-x-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => moveSlideLeft(index)}
                          disabled={index === 0}
                          aria-label="ย้ายไปทางซ้าย"
                          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-30"
                          style={{ color: themeColors.dark }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlideRight(index)}
                          disabled={index === slides.length - 1}
                          aria-label="ย้ายไปทางขวา"
                          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-30"
                          style={{ color: themeColors.dark }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {slide.status === 'error' && (
                        <span className="absolute inset-x-0 bottom-0 text-[10px] text-center text-white bg-red-600/80 py-0.5">
                          อัปโหลดไม่สำเร็จ
                        </span>
                      )}
                    </div>
                  ))}

                  {/* add tile as the last cell while under the max */}
                  {slides.length < SLIDESHOW_MAX_IMAGES && (
                    <label
                      className="flex flex-col items-center justify-center gap-1 aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-colors"
                      style={{ borderColor: themeColors.primary, backgroundColor: `${themeColors.accent}1A` }}
                    >
                      <ImagePlus size={22} style={{ color: themeColors.dark }} />
                      <span className="text-xs" style={{ color: themeColors.dark }}>
                        เพิ่มรูป
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSlidesAdd}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {slides.length >= SLIDESHOW_MAX_IMAGES && (
                <p className="text-xs text-gray-500 mt-2">ครบ 5 รูปแล้ว</p>
              )}
            </div>

            {/* caption — same block as the image caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำบรรยาย (ไม่จำเป็น)
              </label>
              <input
                type="text"
                value={slideCaption}
                onChange={(e) => setSlideCaption(e.target.value)}
                placeholder="คำบรรยายสำหรับทั้งอัลบั้ม..."
                className="input-valentine"
                maxLength={STORY_TEXT_LIMITS.caption}
              />
              <CharCount value={slideCaption} max={STORY_TEXT_LIMITS.caption} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-semibold py-3 px-6 rounded-full transition-all border-2"
            style={{
              borderColor: themeColors.primary,
              color: themeColors.dark,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex-1 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
              boxShadow: `0 4px 15px ${themeColors.dark}4D`,
            }}
            disabled={uploading}
          >
            {uploading
              ? uploadProgress
                ? `กำลังอัปโหลด ${uploadProgress.done}/${uploadProgress.total}...`
                : 'กำลังอัพโหลด...'
              : isEditing
                ? 'บันทึก'
                : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  );
}
