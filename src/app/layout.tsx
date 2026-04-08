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
  openGraph: {
    title: "AI News Score — La Cassetta degli AI-trezzi",
    description: "Le news AI della settimana, valutate con un metodo. Vota se sei d'accordo.",
    type: "website",
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
