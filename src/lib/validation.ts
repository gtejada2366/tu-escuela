export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone.trim()) return true; // Optional
  return /^\+?\d[\d\s-]{7,}$/.test(phone.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (!/\d/.test(password)) return "La contraseña debe contener al menos un número";
  return null;
}
