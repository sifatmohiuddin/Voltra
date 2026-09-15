import { MessageCircle } from 'lucide-react';
import { whatsapp } from '../content/siteContent';

export default function WhatsAppButton() {
  const href = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.defaultMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-pop hover:scale-105 transition-transform"
    >
      <MessageCircle className="w-6 h-6" fill="currentColor" />
    </a>
  );
}
