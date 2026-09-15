import Counter from '../models/Counter.js';

export async function generateOrderNumber(session) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;
  const counterKey = `order-${datePart}`;

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { sequence: 1 } },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

  const sequence = String(counter.sequence).padStart(4, '0');

  return `VOL-${datePart}-${sequence}`;
}