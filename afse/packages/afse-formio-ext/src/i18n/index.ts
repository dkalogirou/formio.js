/**
 * Translations for the AFSE components, in the Form.io i18n format
 * (`{ [language]: { [key]: text } }`). They are registered as defaults with
 * the extension, so form-level `i18n` options still take precedence.
 */
export const afseTranslations = {
  en: {
    afseInvalidIban: '{{field}} must be a valid IBAN.',
    afseInvalidTaxId: '{{field}} must be a valid Greek tax ID (ΑΦΜ).',
    afseInvalidAmka: '{{field}} must be a valid ΑΜΚΑ.',
  },
  el: {
    afseInvalidIban: 'Το πεδίο {{field}} πρέπει να είναι έγκυρο IBAN.',
    afseInvalidTaxId: 'Το πεδίο {{field}} πρέπει να είναι έγκυρος ΑΦΜ.',
    afseInvalidAmka: 'Το πεδίο {{field}} πρέπει να είναι έγκυρος ΑΜΚΑ.',
    required: 'Το πεδίο {{field}} είναι υποχρεωτικό',
    invalid_email: 'Το πεδίο {{field}} πρέπει να είναι έγκυρο email.',
    minLength: 'Το πεδίο {{field}} πρέπει να έχει τουλάχιστον {{length}} χαρακτήρες.',
    maxLength: 'Το πεδίο {{field}} πρέπει να έχει το πολύ {{length}} χαρακτήρες.',
    min: 'Το πεδίο {{field}} δεν μπορεί να είναι μικρότερο από {{min}}.',
    max: 'Το πεδίο {{field}} δεν μπορεί να είναι μεγαλύτερο από {{max}}.',
    error: 'Διορθώστε τα παρακάτω σφάλματα πριν την υποβολή.',
    submitError: 'Ελέγξτε τη φόρμα και διορθώστε όλα τα σφάλματα πριν την υποβολή.',
    complete: 'Η υποβολή ολοκληρώθηκε',
    submit: 'Υποβολή',
    next: 'Επόμενο',
    previous: 'Προηγούμενο',
    cancel: 'Ακύρωση',
    yes: 'Ναι',
    no: 'Όχι',
  },
} as const;

export type AfseLanguage = keyof typeof afseTranslations;
