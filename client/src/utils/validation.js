export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_RE = /^[\p{L}\p{M}' .-]+$/u;

export function validateName(name) {
  const v = name.trim();
  if (v.length < 2 || v.length > 80) return 'Name must be 2–80 characters.';
  if (!NAME_RE.test(v)) return 'Name can only contain letters, spaces, apostrophes, dots and hyphens.';
  return null;
}

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(pw) {
  if (!pw) return 'Password is required.';
  if (pw.length < 8 || pw.length > 128) return 'Password must be 8–128 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/\d/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

/** Only allow same-site relative redirects (prevents open-redirect abuse). */
export function safeRedirect(value, fallback = '/dashboard') {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
