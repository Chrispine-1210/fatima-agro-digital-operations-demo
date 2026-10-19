import { notFound } from "next/navigation";
import InternalPortal from "@/components/internal-portal";
import { requirePortalPage } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Internal workspace | Fatima Agro", robots: { index: false, follow: false } };
const modules = ["finance", "hr", "procurement", "admin", "communications", "notifications"] as const;

export default async function InternalModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!modules.includes(module as typeof modules[number])) notFound();
  const selected = module as typeof modules[number];
  const user = await requirePortalPage(selected);
  return <InternalPortal key={selected} module={selected} initialUser={user} />;
}
