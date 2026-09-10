import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fatima-agro-operations-demo.peterschrispine.chatgpt.site"),
  title: "Fatima Agro Digital Operations Demo",
  description: "A synthetic-data interactive concept and evidence prototype for farm-input enquiries, sales, inventory, finance and administration in Kanengo, Lilongwe.",
  keywords: ["agro dealer demo", "digital operations prototype", "inventory controls", "sales workflow", "Lilongwe"],
  applicationName: "Fatima Agro Digital Operations Demo",
  authors: [{ name: "Aothothe Technologies" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Fatima Agro Digital Operations Demo",
    description: "Synthetic evidence prototype · Kanengo, Lilongwe",
    siteName: "Fatima Agro Digital Operations Demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fatima Agro Digital Operations Demo",
    description: "Synthetic evidence prototype · Kanengo, Lilongwe",
  },
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
