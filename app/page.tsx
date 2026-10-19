import { Storefront } from "@/components/storefront";
export default function Home() {
  return <><link rel="preload" as="image" href="/images/farm-field.jpg" fetchPriority="high" /><Storefront view="home" /></>;
}
