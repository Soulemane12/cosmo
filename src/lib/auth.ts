// Simple password hashing utility
// In production, you should use a proper hashing library like bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}; 