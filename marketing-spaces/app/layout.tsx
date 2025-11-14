import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marketing Spaces - App Marketing Platform',
  description: 'Complete marketing solution for your apps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
