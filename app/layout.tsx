import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PR Guard",
  description: "AI-powered GitHub pull request and repository reviewer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
