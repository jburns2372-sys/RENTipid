import type { Metadata, Viewport } from "next";

export const dynamic = 'force-dynamic';
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on inputs in mobile
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "https://www.rentipid.com.ph"),
  title: "RENTipid | Why buy it? RENTipid.",
  description: "A verified rental marketplace for tools, equipment, spaces, properties, and legally rentable assets.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RENTipid",
  },
  openGraph: {
    title: "RENTipid | Why buy it? RENTipid.",
    description: "A verified rental marketplace for tools, equipment, spaces, properties, and legally rentable assets.",
    url: "https://rentipid.com",
    siteName: "RENTipid",
    images: [
      {
        url: "https://rentipid.com/brand/rentipid-logo-full.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RENTipid",
    description: "A verified rental marketplace for tools, equipment, spaces, properties, and legally rentable assets.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold text-center py-1.5 px-4 shadow-sm z-50 relative">
          RENTipid Private Beta | Mock Payments Active | Real financial transactions are disabled.
        </div>
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
