// Flat-rate delivery pricing by zone — the standard pattern for
// Bangladeshi courier pricing (Pathao/Sundarban/Steadfast-style).
// Override the defaults via .env without touching code.
export const DELIVERY_RATES = {
  'Inside Dhaka': Number(process.env.DELIVERY_RATE_INSIDE_DHAKA) || 70,
  'Outside Dhaka': Number(process.env.DELIVERY_RATE_OUTSIDE_DHAKA) || 130,
};

export function getDeliveryCharge(zone) {
  return DELIVERY_RATES[zone] ?? DELIVERY_RATES['Outside Dhaka'];
}
