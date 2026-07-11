// Legal / consent constants shared by the legal pages, the login consent gate,
// and the ConsentGuard. Bump CONSENT_VERSION whenever the privacy policy or the
// terms of use change materially — every user will then be asked to re-accept.
// (Translating the existing policy into en/id is NOT a material change: same policy,
// more languages. Do not bump for that.)
export const CONSENT_VERSION = '1.1';

/**
 * Effective date of the current legal version, ISO.
 * The human-readable form is localised — see `effectiveDate` in messages/<locale>/legal.json.
 */
export const LEGAL_EFFECTIVE_DATE_ISO = '2026-06-12';

export const LEGAL_CONTACT_EMAIL = 'tao.isaman@gmail.com';

export const SERVICE_NAME = 'The Memory';
export const SERVICE_URL = 'https://memory.korat.tech';
