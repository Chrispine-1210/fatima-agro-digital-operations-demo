import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { localDemoEnabled } from "@/lib/server/auth";
import Rehearsal from "@/components/rehearsal";
export const dynamic = "force-dynamic";
export const metadata = { title: "Local rehearsal | Fatima Agro", robots: { index: false, follow: false } };
export default async function Page() {
 const h = await headers(); const host = h.get("host") ?? "invalid";
 if (!localDemoEnabled(new Request(`http://${host}/rehearsal`))) notFound();
 return <Rehearsal />;
}
