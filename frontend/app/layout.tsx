import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenRent - AI-Powered Flexible Rental Management',
  description: 'Democratize housing access through AI-powered flexible payment plans, daily micro-savings, and virtual viewing technology.',
  keywords: ['rental', 'property management', 'flexible payments', 'rent wallet', 'Kenya'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
