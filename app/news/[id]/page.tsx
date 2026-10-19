import { Storefront } from "@/components/storefront";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!["planning-your-inputs", "understanding-your-order", "checking-your-delivery"].includes(id)) notFound();
  return <Storefront view="guide" itemId={id} />;
}
