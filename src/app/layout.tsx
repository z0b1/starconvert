import React from 'react';
import './globals.css';

export const metadata = {
  icons: {
    icon: '/hero.png',
  },
  title: 'StarConvert',
  description: 'WASM Client-Side File Transformer',
};

function generateStars(count: number) {
  const stars = [];
  let seed = 0xdeadbeef;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < count; i++) {
    const x = rand() * 100;
    const y = rand() * 100;
    const size = rand() * 2 + 0.5;
    const opacity = rand() * 0.7 + 0.3;
    const duration = rand() * 4 + 2;
    const delay = rand() * 6;
    stars.push({ x, y, size, opacity, duration, delay });
  }
  return stars;
}

const SMALL_STARS = generateStars(180);
const MEDIUM_STARS = generateStars(60);
const LARGE_STARS = generateStars(20);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const commitMsg =
    process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local development staging';

  return (
    <html lang="en" data-commit={commitMsg} style={{ margin: 0, padding: 0 }}>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#04050f' }}>
        <div className="starfield" aria-hidden="true">
          {SMALL_STARS.map((s, i) => (
            <span
              key={`s${i}`}
              className="star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                '--star-opacity': s.opacity,
                '--twinkle-duration': `${s.duration}s`,
                '--twinkle-delay': `${s.delay}s`,
              } as React.CSSProperties}
            />
          ))}
          {MEDIUM_STARS.map((s, i) => (
            <span
              key={`m${i}`}
              className="star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size + 1}px`,
                height: `${s.size + 1}px`,
                '--star-opacity': s.opacity,
                '--twinkle-duration': `${s.duration}s`,
                '--twinkle-delay': `${s.delay}s`,
                boxShadow: `0 0 ${s.size + 1}px rgba(255,255,255,${s.opacity * 0.5})`,
              } as React.CSSProperties}
            />
          ))}
          {LARGE_STARS.map((s, i) => (
            <span
              key={`l${i}`}
              className="star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size + 2}px`,
                height: `${s.size + 2}px`,
                '--star-opacity': s.opacity,
                '--twinkle-duration': `${s.duration}s`,
                '--twinkle-delay': `${s.delay}s`,
                boxShadow: `0 0 ${(s.size + 2) * 2}px rgba(255,255,255,${s.opacity * 0.6}), 0 0 ${(s.size + 2) * 4}px rgba(180,200,255,${s.opacity * 0.2})`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {children}
      </body>
    </html>
  );
}