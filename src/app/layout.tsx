import type { Metadata } from "next";
import "./globals.css"; // We will make this next!

export const metadata: Metadata = {
  title: "StarConvert.wasm",
  description: "In-browser WebAssembly converter",
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
