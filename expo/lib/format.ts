/** Format a US phone number to (XXX) XXX-XXXX. Tolerates partial input. */
export function formatPhone(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Strip to digits only, useful for tel: links. */
export function phoneDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}
