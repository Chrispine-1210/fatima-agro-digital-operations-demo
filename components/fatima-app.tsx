"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import Link from "next/link";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
type AppState = {
  installed: boolean;
  prompt: InstallPrompt | null;
  clearPrompt(): void;
};
const AppContext = createContext<AppState>({ installed: false, prompt: null, clearPrompt() {} });

/** A single listener survives client navigation; no records or credentials enter app storage. */
export function FatimaAppProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => setInstalled(display.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const afterInstall = () => { setInstalled(true); setPrompt(null); };
    checkInstalled();
    display.addEventListener("change", checkInstalled);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    if (process.env.NODE_ENV === "production" && window.isSecureContext && "serviceWorker" in navigator) {
      // Updates wait for existing windows to close. Never reload unsaved department forms.
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Browser installation still works without the optional offline screen.
      });
    }
    return () => {
      display.removeEventListener("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
    };
  }, []);
  return <AppContext.Provider value={{ installed, prompt, clearPrompt: () => setPrompt(null) }}>{children}</AppContext.Provider>;
}

export function FatimaInstallControls() {
  const { installed, prompt, clearPrompt } = useContext(AppContext);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setNotice(choice.outcome === "accepted"
        ? "Installation accepted. Follow your device's prompts to finish."
        : "You can install later from your browser's menu.");
    } catch {
      setNotice("Use the installation steps below to add Fatima Agro from your browser.");
    } finally {
      clearPrompt();
      setBusy(false);
    }
  }
  return <div className="fa-app-actions">
    {installed ? <p className="fa-app-installed" role="status"><CheckCircle2 aria-hidden="true"/>Fatima Agro is installed on this device.</p>
      : prompt ? <button className="fa-app-button" onClick={install} disabled={busy} type="button"><Download aria-hidden="true"/>{busy ? "Opening installation..." : "Install Fatima Agro"}</button>
      : <a className="fa-app-button" href="#installation-options"><Download aria-hidden="true"/>View installation steps</a>}
    <Link className="fa-app-button fa-app-button-secondary" href="/account">Open your account<ArrowRight aria-hidden="true"/></Link>
    {notice && <p className="fa-app-notice" role="status">{notice}</p>}
  </div>;
}
