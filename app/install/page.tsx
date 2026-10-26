import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, Check, Download, Monitor, PackageCheck, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { FatimaBrand } from "@/components/fatima-brand";
import { FatimaInstallControls } from "@/components/fatima-app";
import { androidRelease } from "@/lib/fatima-app-release";

export const metadata = {
  title: "Install the Fatima Agro app",
  description: "Install Fatima Agro on your phone or computer and use your existing Fatima account.",
};

export default function InstallPage() {
  return <div className="fa-app-page">
    <a className="fa-app-skip" href="#main-content">Skip to installation</a>
    <header className="fa-app-header">
      <Link href="/" aria-label="Fatima Agro home"><FatimaBrand/></Link>
      <Link className="fa-app-back" href="/"><ArrowLeft aria-hidden="true"/>Back to website</Link>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="fa-app-hero">
        <div>
          <p className="fa-app-eyebrow">FATIMA AGRO ON YOUR DEVICE</p>
          <h1>Your account.<br/>One tap away.</h1>
          <p className="fa-app-intro">Keep Fatima Agro on your home screen or desktop. Browse products, follow orders and open your assigned workspace with the Fatima account you already use.</p>
          <FatimaInstallControls/>
          {androidRelease && <a className="fa-app-android-link" href="#android-app">Get the Android app<ArrowRight aria-hidden="true"/></a>}
          <p className="fa-app-connection"><Wifi aria-hidden="true"/>Internet connection required for accounts and transactions.</p>
        </div>
        <div className="fa-app-preview" aria-label="Fatima Agro app icon preview">
          <div className="fa-app-icon"><img src="/app-icons/icon-512.png" alt="Fatima Agro app" width="184" height="184"/></div>
          <strong>Fatima Agro</strong>
          <span>Growing Together Feeding Tomorrow</span>
          <div className="fa-app-preview-pills"><span><Check aria-hidden="true"/>Your existing account</span><span><Check aria-hidden="true"/>Your assigned portal</span></div>
        </div>
      </section>

      <section className="fa-app-section" id="installation-options" aria-labelledby="installation-title">
        <div className="fa-app-section-heading"><p className="fa-app-eyebrow">CHOOSE YOUR DEVICE</p><h2 id="installation-title">Install from your browser</h2><p>Open this website in your device's browser. Installation options depend on the browser and device.</p></div>
        <div className="fa-app-device-grid">
          <article className="fa-app-device"><Smartphone aria-hidden="true"/><h3>Android phone or tablet</h3><ol><li>Open Fatima Agro in Chrome or Edge.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong> from the browser menu.</li><li>Confirm, then open Fatima Agro from its app icon.</li></ol></article>
          <article className="fa-app-device"><Smartphone aria-hidden="true"/><h3>iPhone or iPad</h3><ol><li>Open Fatima Agro in Safari.</li><li>Open <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</li><li>Confirm <strong>Add</strong>, then open the Fatima Agro icon.</li></ol></article>
          <article className="fa-app-device"><Monitor aria-hidden="true"/><h3>Computer</h3><ol><li>Open Fatima Agro in Chrome or Edge.</li><li>Select the install icon in the address bar, or <strong>Install this site as an app</strong> from the browser menu.</li><li>Open Fatima Agro from your desktop or apps menu.</li></ol></article>
        </div>
      </section>

      {androidRelease && <section id="android-app" className="fa-app-android fa-app-section" aria-labelledby="android-title">
        <div><p className="fa-app-eyebrow">ANDROID PACKAGE</p><h2 id="android-title">Install the Android app</h2><p>Download the signed Fatima Agro package, open the downloaded file and follow Android's installation prompts.</p><p className="fa-app-release">Version {androidRelease.version} · {(androidRelease.bytes / 1048576).toFixed(1)} MB · Android 7 or newer with a compatible browser.</p><a className="fa-app-button" href={androidRelease.url} download><Download aria-hidden="true"/>Download Android app</a></div>
        <details><summary>Check the download</summary><p>SHA-256</p><code>{androidRelease.sha256}</code></details>
      </section>}

      <section className="fa-app-section fa-app-work" aria-labelledby="app-work-title">
        <div className="fa-app-section-heading"><p className="fa-app-eyebrow">FAMILIAR WORK, EASIER ACCESS</p><h2 id="app-work-title">The same Fatima system</h2></div>
        <div className="fa-app-feature-grid">
          <article><ShieldCheck aria-hidden="true"/><h3>Your Fatima sign-in</h3><p>Use your issued username and password. Your role and assigned operating unit determine the records and actions you can access.</p></article>
          <article><Camera aria-hidden="true"/><h3>Tools on your device</h3><p>Use supported camera capture and scanning in your workspace. Receipt printing follows your device's printer setup.</p></article>
          <article><PackageCheck aria-hidden="true"/><h3>Connected records</h3><p>Orders and department records use the same system. Reconnect before submitting work; transactions are not queued offline.</p></article>
        </div>
        <div className="fa-app-signin"><div><h3>Ready to begin?</h3><p>Open your account and continue to your permitted workspace.</p></div><Link className="fa-app-button" href="/account">Sign in to Fatima<ArrowRight aria-hidden="true"/></Link></div>
      </section>
    </main>
    <footer className="fa-app-footer"><span>Fatima Agro Dealers and General Suppliers · Kanengo, Lilongwe</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div><small>Presentation environment · Sample records · No live payments</small></footer>
  </div>;
}
