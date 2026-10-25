import type { Metadata, Viewport } from "next";
import { DotGothic16, Orbitron, Zen_Kaku_Gothic_New } from "next/font/google";

import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const dotGothic = DotGothic16({
  variable: "--font-dotgothic",
  subsets: ["latin"],
  weight: "400",
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "POP★STARS — 天球儀",
  description: "実際の星と88星座を3Dで眺める、ネオンカラーの天球儀",
};

export const viewport: Viewport = {
  themeColor: "#07021a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${orbitron.variable} ${dotGothic.variable} ${zenKaku.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
