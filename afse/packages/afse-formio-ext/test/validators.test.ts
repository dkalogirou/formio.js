import { formatIban, isValidAmka, isValidGreekTaxId, isValidIban, normalizeIban } from '../src';

describe('isValidIban', () => {
  it.each(['GR16 0110 1250 0000 0001 2300 695', 'DE89370400440532013000', 'cy17002001280000001200527600'])(
    'accepts %s',
    (iban) => expect(isValidIban(iban)).toBe(true),
  );

  it.each(['GR16 0110 1250 0000 0001 2300 696', 'GR1601101250', 'XX00123', '', 'not an iban'])('rejects %s', (iban) =>
    expect(isValidIban(iban)).toBe(false),
  );

  it('rejects non-string input', () => {
    expect(isValidIban(undefined)).toBe(false);
    expect(isValidIban(12345)).toBe(false);
  });

  it('restricts to allowed countries', () => {
    expect(isValidIban('DE89370400440532013000', ['GR', 'CY'])).toBe(false);
    expect(isValidIban('GR1601101250000000012300695', ['GR', 'CY'])).toBe(true);
  });

  it('normalizes and formats', () => {
    expect(normalizeIban(' gr16 0110 1250 0000 0001 2300 695 ')).toBe('GR1601101250000000012300695');
    expect(formatIban('GR1601101250000000012300695')).toBe('GR16 0110 1250 0000 0001 2300 695');
  });
});

describe('isValidGreekTaxId', () => {
  it.each(['094014201', '090000045', 'EL094014201'])('accepts %s', (afm) =>
    expect(isValidGreekTaxId(afm)).toBe(true),
  );

  it.each(['123456789', '000000000', '09401420', '0940142011', 'abcdefghi'])('rejects %s', (afm) =>
    expect(isValidGreekTaxId(afm)).toBe(false),
  );
});

describe('isValidAmka', () => {
  it('accepts a valid ΑΜΚΑ', () => expect(isValidAmka('01018012342')).toBe(true));

  it.each(['01018012343', '32018012342', '01138012342', '0101801234', 'abc'])('rejects %s', (amka) =>
    expect(isValidAmka(amka)).toBe(false),
  );
});
