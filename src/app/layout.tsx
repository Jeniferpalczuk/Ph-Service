import type { Metadata } from "next";
import "./globals.css";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PH Service - Gestão de Restaurante",
  description: "Sistema completo de gestão financeira e operacional para restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ProtectedLayout>
          {children}
        </ProtectedLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
