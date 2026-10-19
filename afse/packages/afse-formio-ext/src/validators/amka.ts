/**
 * Greek social security number (ΑΜΚΑ): 11 digits, the first six are the
 * birth date (DDMMYY) and the whole number passes the Luhn checksum.
 */
export function isValidAmka(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }
  const amka = String(value).trim();
  if (!/^\d{11}$/.test(amka)) {
    return false;
  }
  const day = Number(amka.slice(0, 2));
  const month = Number(amka.slice(2, 4));
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < amka.length; i++) {
    let digit = Number(amka[amka.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
