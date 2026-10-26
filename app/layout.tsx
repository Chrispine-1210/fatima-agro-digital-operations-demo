import type { Metadata, Viewport } from "next";
import { FatimaAppProvider } from "@/components/fatima-app";
import "./globals.css";
import "@/components/storefront.css";
import "@/components/storefront-theme.css";
import "@/components/internal-portal.css";
import "@/components/inventory-tools.css";
import "@/components/receipt-tools.css";
import "@/components/executive-dashboard.css";
import "@/components/fatima-sign-in.css";
import "@/components/fatima-brand.css";
import "@/components/fatima-app.css";

export const metadata: Metadata = {
  title: "Fatima Agro | Farm Inputs and Customer Services",
  description: "Discover farm inputs, request an order and manage your Fatima Agro customer account. Presentation environment with sample catalogue data.",
  keywords: ["agro dealer demo", "digital operations prototype", "inventory controls", "sales workflow", "Lilongwe"],
  applicationName: "Fatima Agro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fatima Agro", statusBarStyle: "default" },
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
  icons: { icon: "/favicon.svg?v=fatima-fa", shortcut: "/favicon.svg?v=fatima-fa", apple: "/app-icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d8428" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><FatimaAppProvider>{children}</FatimaAppProvider></body>
    </html>
  );
}
