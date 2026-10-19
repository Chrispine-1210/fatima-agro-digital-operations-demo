import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state">
      <SearchX />
      <p>404 · FATIMA AGRO DIGITAL OPERATIONS DEMO</p>
      <h1>That demonstration route was not found.</h1>
      <span>Return to the home page or browse the product catalogue.</span>
      <Link href="/">Return to Fatima Agro</Link>
    </main>
  );
}
