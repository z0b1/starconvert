import type { Metadata } from "next";
import "./globals.css"; // We will make this next!

export const metadata: Metadata = {
  title: "starconverter",
  description: "In-browser WebAssembly converter",
  icons: "/hero.png",
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
