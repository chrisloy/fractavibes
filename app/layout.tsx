import React from 'react';
import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>fractavibes</title>
        <meta name="description" content="Generative art algorithms" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
} 