/*
 * Barcodes (GTINs) in one spelling, so the same product can be found at
 * every store. Shared by the data tools and the app's scanner.
 *
 *   canonicalGtin('012000055775') → '0012000055775'   (UPC-A gains a 0: 13 digits)
 *   pandaGtin('6281007074750')    → '6281007074759'   (Panda writes 0 for the check digit)
 */

/* The GS1 check digit for the digits before it: weights 3, 1, 3… from the right. */
export function checkDigit(body) {
  let sum = 0;
  Array.from(body).reverse().forEach((digit, i) => { sum += Number(digit) * (i % 2 === 0 ? 3 : 1); });
  return String((10 - (sum % 10)) % 10);
}

export const validGtin = code => /^(\d{8}|\d{12,14})$/.test(code) && checkDigit(code.slice(0, -1)) === code.slice(-1);

/* A valid GTIN as 13 digits (or 14 for a case code), or null. Codes in the
   2… range (02… for UPC) are a store's own, such as weighed produce, and say
   nothing about another store's shelf. */
export function canonicalGtin(raw) {
  const code = String(raw || '').replace(/\D/g, '');
  if (!validGtin(code)) return null;
  let gtin = code.padStart(14, '0');
  if (gtin[0] === '0') gtin = gtin.slice(1);
  if (gtin.length === 13 && /^0?2/.test(gtin)) return null;
  return gtin;
}

/* Panda's catalogue drops the check digit and writes 0 in its place (9,631
   of its 9,632 thirteen-digit codes end in 0; only 970 check out). The
   digit is restored before the code is used. */
export function pandaGtin(raw) {
  const code = String(raw || '').replace(/\D/g, '');
  if (validGtin(code)) return canonicalGtin(code);
  if (/^(\d{8}|\d{12,13})$/.test(code) && code.endsWith('0')) {
    const body = code.slice(0, -1);
    return canonicalGtin(body + checkDigit(body));
  }
  return null;
}

/* A UPC-E code (8 digits, small packs) written out as the UPC-A it stands
   for, so it meets the same product's 12/13-digit code elsewhere. */
export function upcEtoA(raw) {
  const code = String(raw || '').replace(/\D/g, '');
  if (!/^[01]\d{7}$/.test(code)) return null;
  const [ns, d1, d2, d3, d4, d5, d6, check] = code;
  let body;
  if ('012'.includes(d6)) body = ns + d1 + d2 + d6 + '0000' + d3 + d4 + d5;
  else if (d6 === '3') body = ns + d1 + d2 + d3 + '00000' + d4 + d5;
  else if (d6 === '4') body = ns + d1 + d2 + d3 + d4 + '00000' + d5;
  else body = ns + d1 + d2 + d3 + d4 + d5 + '0000' + d6;
  const upcA = body + check;
  return validGtin(upcA) ? upcA : null;
}

/* What a camera or a typed number gives, in the spelling the data uses. */
export function scannedGtin(raw, format) {
  const code = String(raw || '').replace(/\D/g, '');
  if (format === 'upc_e' || (code.length === 8 && !validGtin(code) && upcEtoA(code))) return canonicalGtin(upcEtoA(code));
  return canonicalGtin(code);
}
