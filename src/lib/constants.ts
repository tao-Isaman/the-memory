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

// Character limits for text inputs in stories.
// Tuned for how each field renders in the viewer (mobile-first, ~40 Thai chars/line).
export const STORY_TEXT_LIMITS = {
    title: 100,        // Optional story label shown in the list
    text: 2000,       // 'text' story — full heartfelt message, highest allowance
    textImage: 200,   // 'text-image' story — short caption beside the image (~3-4 lines)
    caption: 100,      // 'image' / 'scratch' caption (~1-2 lines)
    question: 2000,    // 'question' prompt (~1-3 lines)
    choice: 100,       // 'question' answer choice (~1 line)
} as const;
