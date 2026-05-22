import type { Metadata } from "next";
import "./globals.css";
import GlobalAIChat from "@/components/common/GlobalAIChat";

export const metadata: Metadata = {
  title: "FabricaAI Studio — Textile Design & Production",
  description: "Professional dobby design, peg plan, and fabric specification tool for the Surat textile ecosystem. By Solerix Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GlobalAIChat />
        {children}
      </body>
    </html>
  );
}
