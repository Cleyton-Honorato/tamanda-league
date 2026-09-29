import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Barlow } from "next/font/google";
import "./globals.css";

// Condensada e sempre em caixa alta — é a letra dos pôsteres do campeonato.
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005",
  ),
  title: {
    default: "Tamanda League 3X3",
    template: "%s · Tamanda League 3X3",
  },
  description:
    "Campeonato de basquete 3x3 do bairro: jogos, classificação, chaveamento e galeria.",
  // O cartaz oficial vira o preview do link no WhatsApp e afins.
  openGraph: {
    title: "Tamanda League 3X3",
    description:
      "Campeonato de basquete 3x3 do bairro: jogos, classificação, chaveamento e galeria.",
    images: ["/brand/cartaz.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#090D0C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bebas.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
