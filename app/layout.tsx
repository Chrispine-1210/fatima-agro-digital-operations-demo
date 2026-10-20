import type { Metadata } from "next";
import "./globals.css";
import "@/components/storefront.css";
import "@/components/storefront-theme.css";
import "@/components/internal-portal.css";

export const metadata: Metadata = {
  title: "Fatima Agro | Farm Inputs and Customer Services",
  description: "Discover farm inputs, request an order and manage your Fatima Agro customer account. Presentation environment with sample catalogue data.",
  keywords: ["agro dealer demo", "digital operations prototype", "inventory controls", "sales workflow", "Lilongwe"],
  applicationName: "Fatima Agro",
  authors: [{ name: "Aothothe Technologies" }],
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: "Fatima Agro | Farm Inputs and Customer Services",
    description: "Product catalogue, customer enquiries and role-based operations portal concept. Synthetic demonstration data only.",
    siteName: "Fatima Agro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fatima Agro | Farm Inputs and Customer Services",
    description: "Product catalogue, customer enquiries and role-based operations portal concept. Synthetic demonstration data only.",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
