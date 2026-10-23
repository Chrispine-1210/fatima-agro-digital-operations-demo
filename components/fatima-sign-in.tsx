"use client";

import { useState, type FormEvent } from "react";
import { FatimaBrand } from "./fatima-brand";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function FatimaSignIn({ returnTo = "/account" }: { returnTo?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [visible, setVisible] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, fields = new FormData(form);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", username: fields.get("username"), password: fields.get("password"), returnTo }) });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(result.error ?? "Your sign-in could not be completed. Please try again.");
      const target = result.redirectTo ?? "/account";
      window.location.assign(target.startsWith("/") && !target.startsWith("//") && !target.includes("\\") ? target : "/account");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your sign-in could not be completed. Please try again."); }
    finally { const field = form.elements.namedItem("password") as HTMLInputElement | null; if (field) field.value = ""; setBusy(false); }
  }
  return <section className="fa-login" aria-labelledby="fatima-sign-in-title"><FatimaBrand variant="sign-in" /><h2 id="fatima-sign-in-title">Sign in to your Fatima account.</h2><p>Use the username and password issued for your account.</p><form onSubmit={signIn} aria-label="Fatima account sign-in" aria-busy={busy}><label>Username<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={64} disabled={busy} /></label><label>Password<div className="fa-password"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={128} disabled={busy} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p className="fa-login-error" role="alert">{error}</p>}<button className="fa-login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<ArrowRight size={18} aria-hidden="true" /></button></form><div className="fa-login-help"><ShieldCheck size={18} aria-hidden="true" /><p>Accounts are issued and managed by the authorised developer under Fatima management direction. Contact your Fatima representative for account assistance.</p></div></section>;
}
