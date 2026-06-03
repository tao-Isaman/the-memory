// Job options for user profiles
export const JOB_OPTIONS = [
    'นักเรียน',
    'นักศึกษา',
    'นักศึกษาปริญญาตรี',
    'เจ้าของธุรกิจ',
    'พนักงานบริษัท',
    'ข้าราชการ',
    'รัฐวิสาหกิจ',
    'ค้าขาย',
    'รับจ้างทั่วไป',
    'โปรแกรมเมอร์',
    'ไอที',
    'วิศวกร',
    'แพทย์',
    'พยาบาล',
    'ครู',
    'อาจารย์',
    'การตลาด',
    'โฆษณา',
    'บัญชี',
    'การเงิน',
    'ศิลปิน',
    'นักออกแบบ',
    'เกษตรกร',
    'แม่บ้าน',
    'พ่อบ้าน',
    'ว่างงาน',
    'อื่นๆ',
];

export const PROFILE_COMPLETION_CREDITS = 10;
export const CARTOON_CREDIT_COST = 10;
export const NOTIFICATION_CREDITS = 10; // one-time bonus for enabling push notifications

// Limits for the 'voice' story type — a recorded/uploaded audio message.
// Enforced editor-side BEFORE upload (the real gate); the bucket file_size_limit is defense in depth.
export const VOICE_MAX_DURATION_SEC = 60;                 // hard cap on message length
export const VOICE_MAX_SIZE_BYTES = 10 * 1024 * 1024;     // 10 MB upload ceiling
export const VOICE_ACCEPTED_EXT = /\.(mp3|m4a|wav|aac|ogg|webm)$/i; // extension fallback (iOS often gives empty file.type)

// Limits for the 'slideshow' story type — 2-5 images played as a Ken Burns slideshow.
// A single-image slideshow is steered to the simpler 'image' type, so MIN is 2.
export const SLIDESHOW_MIN_IMAGES = 2;
export const SLIDESHOW_MAX_IMAGES = 5;
export const SLIDESHOW_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per slide image

// Character limits for text inputs in stories.
// Tuned for how each field renders in the viewer (mobile-first, ~40 Thai chars/line).
export const STORY_TEXT_LIMITS = {
    title: 80,        // Optional story label shown in the list
    text: 800,       // 'text' story — full heartfelt message, highest allowance
    textImage: 400,   // 'text-image' story — short caption beside the image (~3-4 lines)
    caption: 80,      // 'image' / 'scratch' caption (~1-2 lines)
    question: 150,    // 'question' prompt (~1-3 lines)
    choice: 80,       // 'question' answer choice (~1 line)
} as const;
