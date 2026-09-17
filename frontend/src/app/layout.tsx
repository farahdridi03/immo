import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestimo — Gestion des immobilisations",
  description: "Plateforme de gestion et suivi des immobilisations",
};

export const viewport: Viewport = {
  themeColor: "#F7F4EC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" className={inter.variable}>
      <body className="font-sans antialiased bg-[#F7F4EC] text-[#1C1917] min-h-screen">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
