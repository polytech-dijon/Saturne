import '@/app/globals.css';
import React from 'react';
import { inter } from '@/lib/fonts';
import { Toaster } from 'sonner';

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
    <body className={`${inter.className}`}>
    {children}
    <Toaster richColors position="top-center"/>
    </body>
    </html>
  );
}
