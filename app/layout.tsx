import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Yalniz istifade edeceyimiz Inter sriftini saxlayiriq
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dynamic Bar Chart',
  description: 'Pure SVG dynamic bar chart built with Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}