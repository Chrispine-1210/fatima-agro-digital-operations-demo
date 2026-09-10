import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state">
      <SearchX />
      <p>404 · FATIMA AGRO DIGITAL OPERATIONS DEMO</p>
      <h1>That demonstration route was not found.</h1>
      <span>Return to the public evidence prototype or choose a portal from its navigation.</span>
      <Link href="/#public">Return to the demo</Link>
    </main>
  );
}
