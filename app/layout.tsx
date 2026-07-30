import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Richard Burd's Homepage",
  description: "Welcome to Richard Burd's Homepage",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Richard Burd's Homepage",
    description: "Welcome to Richard Burd's Homepage",
    url: "https://richardburd.dev",
    images: [
      {
        url: "https://richard-burd-homepage.s3.us-east-1.amazonaws.com/open-graph-image.jpg",
        width: 1200,   // use your real dimensions
        height: 630,
        alt: "Richard Burd's Homepage",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
