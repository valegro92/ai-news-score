import type { Metadata } from "next";
import { Spectral, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AI News Score — La Cassetta degli AI-trezzi",
  description:
    "Il radar settimanale delle news AI che contano davvero. Curato da Valentino Grossi per chi porta l'AI dentro i processi reali.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "AI News Score — La Cassetta degli AI-trezzi",
    description: "Le news AI della settimana, valutate con un metodo. Vota se sei d'accordo.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI News Score - La Cassetta degli AI-trezzi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI News Score — La Cassetta degli AI-trezzi",
    description: "Le news AI della settimana, valutate con un metodo.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${spectral.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
