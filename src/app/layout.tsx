import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Schedule Tracker",
  description: "Track today's schedule locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
