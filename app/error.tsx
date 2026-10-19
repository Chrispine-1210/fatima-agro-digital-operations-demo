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
      <span>Refresh this view and check your records before repeating an action. Your last request may have completed.</span>
      <Button onClick={reset}><RefreshCcw /> Try again</Button>
    </main>
  );
}
