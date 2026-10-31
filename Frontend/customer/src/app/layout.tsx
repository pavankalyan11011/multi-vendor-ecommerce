import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} ${BRAND.product}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.support,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
