import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TimerProvider } from "../contexts/TimerContext";
import StructuredData from "../components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krushi - Harness the Power of Daily Effort",
  description: "Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.",
  keywords: ["krushi", "daily effort", "minimalist", "productivity", "consistent progress", "focus", "habits", "task manager", "progress tracking"],
  authors: [{ name: "Krushi" }],
  creator: "Krushi",
  publisher: "Krushi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://krushi.example.com'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Krushi - Harness the Power of Daily Effort",
    description: "Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.",
    url: 'https://krushi.example.com', // Replace with your actual domain
    siteName: 'Krushi',
    images: [
      {
        url: '/og-image.png', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: 'Krushi - Harness the Power of Daily Effort',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Krushi - Harness the Power of Daily Effort",
    description: "Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.",
    images: ['/og-image.png'], // You'll need to add this image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TimerProvider>
            {children}
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
