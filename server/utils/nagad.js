// Nagad Payment Gateway integration.
//
// Nagad's flow is meaningfully more involved than bKash's: it requires
// an RSA key pair (yours), Nagad's own RSA public key, signature
// generation (SHA1withRSA) on each request, and AES session-key
// encryption of sensitive fields — not just a bearer token. Getting
// crypto code like that right without a real sandbox account to test
// against isn't something to guess at, so this file is intentionally
// a clean interface stub rather than a full implementation.
//
// To finish this integration:
//   1. Register as a Nagad merchant and get your Merchant ID + sandbox access.
//   2. Generate an RSA key pair, upload your public key via Nagad's portal.
//   3. Follow the Initialize → Complete Checkout flow in Nagad's own guide.
//   4. Implement the two functions below to match.
//
// Docs (merchant portal access required): https://developer.mynagad.com

export function isConfigured() {
  return Boolean(process.env.NAGAD_MERCHANT_ID && process.env.NAGAD_PRIVATE_KEY);
}

export async function createPayment(/* { amount, orderNumber, callbackURL } */) {
  if (!isConfigured()) {
    throw new Error('Nagad is not configured yet — see server/utils/nagad.js for setup steps.');
  }
  throw new Error(
    'Nagad integration not yet implemented — this needs your RSA keys wired up per Nagad\u2019s docs.'
  );
}

export async function verifyPayment(/* paymentRefId */) {
  if (!isConfigured()) {
    throw new Error('Nagad is not configured yet — see server/utils/nagad.js for setup steps.');
  }
  throw new Error('Nagad integration not yet implemented.');
}
