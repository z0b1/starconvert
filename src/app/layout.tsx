import React from 'react';

export const metadata = {
  icons: {
    icon: '/hero.png',
  },
  title: 'StarConvert',
  description: 'WASM Client-Side File Transformer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side code safely captures Vercel variables on compilation
  const commitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local development staging';

  return (
    <html lang="en" data-commit={commitMsg} style={{ margin: 0, padding: 0 }}>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#04050f' }}>
        {children}
      </body>
    </html>
  );
}