export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone.trim()) return true; // Optional
  return /^\+?\d[\d\s-]{7,}$/.test(phone.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[a-z]/.test(password)) return "La contraseña debe contener al menos una letra minúscula";
  if (!/[A-Z]/.test(password)) return "La contraseña debe contener al menos una letra mayúscula";
  if (!/\d/.test(password)) return "La contraseña debe contener al menos un número";
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) return "La contraseña debe contener al menos un carácter especial";
  return null;
}
