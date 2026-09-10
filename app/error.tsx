"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Synthetic demo boundary captured an error", error);
  }, [error]);

  return (
    <main className="route-state">
      <AlertTriangle />
      <p>FATIMA AGRO DIGITAL OPERATIONS DEMO</p>
      <h1>This demonstration view could not load.</h1>
      <span>No customer, banking or production data was affected.</span>
      <Button onClick={reset}><RefreshCcw /> Try again</Button>
    </main>
  );
}
