import InternalPortal from "@/components/internal-portal";
import { redirect } from "next/navigation";
import { requirePortalPage } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace | Fatima Agro", robots: { index: false, follow: false } };

export default async function HeadquartersPage() {
  const user = await requirePortalPage("notifications");
  if (user.role === "ceo") redirect("/hq/executive");
  return <InternalPortal key="notifications" module="notifications" initialUser={user} />;
}
