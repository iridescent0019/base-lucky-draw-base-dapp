import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: ["Base", "Base builder", "onchain", "dApp", "wallet"],
  metadataBase: new URL("https://base-lucky-draw.vercel.app"),
  title: "Base Lucky Draw",
  // Base builder identity: project-level proof uses Build ID, Builder Wallet, Vercel Live Demo, and GitHub repository.
  description:
    "Create a one-winner draw on Base, let wallets join once, and reveal the winner with a clear onchain result.",
};

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? "6a0408642be96789d34cefd1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
