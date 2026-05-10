import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "UInventory",
  description: "Inventory management for UMass clubs",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="ULight" suppressHydrationWarning>
      <body className={`${lora.className} ${geistSans.variable} ${lora.variable} antialiased`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="ULight"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
