/**
 * Greek tax identification number (ΑΦΜ): 9 digits, the last one is a
 * mod-11 checksum of the first eight weighted by powers of two.
 */
export function isValidGreekTaxId(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }
  const afm = String(value).replace(/^EL|^GR/i, '').trim();
  if (!/^\d{9}$/.test(afm) || /^0+$/.test(afm)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(afm[i]) * 2 ** (8 - i);
  }
  return (sum % 11) % 10 === Number(afm[8]);
}
