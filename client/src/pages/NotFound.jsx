import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="font-display font-bold text-5xl text-ink">404</h1>
      <p className="mt-3 text-ink-muted">That page doesn&rsquo;t exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-volt text-white px-6 py-3 font-medium hover:bg-volt-dim transition-colors">
        Back to shop
      </Link>
    </div>
  );
}
