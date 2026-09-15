// bKash Tokenized Checkout integration.
//
// Real 3-call flow per bKash's own docs (developer.bka.sh):
//   1. Grant Token   POST /tokenized/checkout/token/grant
//   2. Create Payment POST /tokenized/checkout/create
//   3. Execute Payment POST /tokenized/checkout/execute
//
// You need a merchant account with bKash to get real credentials —
// sandbox first, then production. Until BKASH_APP_KEY etc. are set in
// .env, isConfigured() returns false and the checkout route falls back
// to a clear error instead of silently pretending to charge anyone.
//
// Docs: https://developer.bka.sh/docs/tokenized-checkout-overview

const BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

const creds = () => ({
  username: process.env.BKASH_USERNAME,
  password: process.env.BKASH_PASSWORD,
  appKey: process.env.BKASH_APP_KEY,
  appSecret: process.env.BKASH_APP_SECRET,
});

export function isConfigured() {
  const c = creds();
  return Boolean(c.username && c.password && c.appKey && c.appSecret);
}

async function grantToken() {
  const c = creds();
  const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: c.username,
      password: c.password,
    },
    body: JSON.stringify({ app_key: c.appKey, app_secret: c.appSecret }),
  });
  const data = await res.json();
  if (!res.ok || !data.id_token) {
    throw new Error(data.statusMessage || 'bKash grant token failed.');
  }
  return data.id_token;
}

/**
 * Starts a bKash checkout session for an order. Returns the bKash-hosted
 * checkout URL the customer is redirected to — actual money movement
 * happens on bKash's side, confirmed via executePayment() below.
 */
export async function createPayment({ amount, orderNumber, callbackURL }) {
  if (!isConfigured()) {
    throw new Error('bKash is not configured yet — add BKASH_* values to server/.env.');
  }
  const c = creds();
  const idToken = await grantToken();

  const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: idToken,
      'x-app-key': c.appKey,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: orderNumber,
      callbackURL,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderNumber,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.paymentID) {
    throw new Error(data.statusMessage || 'bKash create payment failed.');
  }
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

/** Confirms a payment after the customer approves it in the bKash app/USSD flow. */
export async function executePayment(paymentID) {
  if (!isConfigured()) {
    throw new Error('bKash is not configured yet — add BKASH_* values to server/.env.');
  }
  const c = creds();
  const idToken = await grantToken();

  const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: idToken,
      'x-app-key': c.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });
  const data = await res.json();
  if (!res.ok || data.transactionStatus !== 'Completed') {
    throw new Error(data.statusMessage || 'bKash payment was not completed.');
  }
  return { transactionId: data.trxID, paymentID: data.paymentID };
}
