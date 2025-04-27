import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientOnlyLayout from "@/components/client-layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Musical Match",
  description: "Conecta con músicos para tus eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <ClientOnlyLayout>
          {children}
        </ClientOnlyLayout>
      </body>
    </html>
  );
}
