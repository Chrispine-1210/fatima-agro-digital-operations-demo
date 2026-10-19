import { Storefront } from "@/components/storefront";
import { notFound } from "next/navigation";
import { readState } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = (await readState()).products.find(item => item.id === id);
  if (!product) notFound();
  return <><link rel="preload" as="image" href={product.image} /><Storefront view="product" itemId={id} /></>;
}
