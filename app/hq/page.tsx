import InternalPortal from "@/components/internal-portal";
import { requirePortalPage } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace | Fatima Agro", robots: { index: false, follow: false } };

export default async function HeadquartersPage() {
  const user = await requirePortalPage("notifications");
  return <InternalPortal key="notifications" module="notifications" initialUser={user} />;
}
