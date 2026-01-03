import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AppProvider } from "@/lib/store";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bob - Resource Manager",
  description: "Can we ship it? Yes, we can!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="corporate">
      <body className={inter.className}>
        <Providers>
          <AppProvider>
            <AppShell>{children}</AppShell>
          </AppProvider>
        </Providers>
      </body>
    </html>
  );
}
