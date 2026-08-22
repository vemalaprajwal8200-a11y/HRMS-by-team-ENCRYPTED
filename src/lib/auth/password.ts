export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password) && /[A-Z]/.test(password);
}