export const brand = {
  name: 'Voltra',
  tagline: 'Audio, wearables & smart accessories.',
};

export const whatsapp = {
  number: '8801000000000', // no + or spaces — replace with your real business number
  defaultMessage: "Hi Voltra, I have a question about a product.",
};

export const footer = {
  description: 'Genuine electronics and gadgets, delivered across Bangladesh with Cash on Delivery.',
  columns: [
    {
      title: 'Shop',
      links: [
        { label: 'All products', href: '/products' },
        { label: 'Track your order', href: '/track' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'WhatsApp us', href: `https://wa.me/${whatsapp.number}` },
        { label: 'Contact', href: 'mailto:hello@voltra.test' },
      ],
    },
  ],
  social: [
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'Instagram', href: 'https://instagram.com' },
  ],
  copyright: `\u00A9 ${new Date().getFullYear()} Voltra. All rights reserved.`,
};

export function formatPrice(amount) {
  return `\u09F3${Number(amount).toLocaleString('en-BD')}`;
}
