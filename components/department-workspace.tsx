"use client";

import { useEffect, useState, type RefObject } from "react";
import type { ModuleId, PortalSnapshot, SessionUser } from "@/lib/portal-types";

export const sectionId = (title: string) => `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
export const actionId = (action: string) => `action-${action.replace(/[^a-z0-9]+/g, "-")}`;

type Shortcut = { label: string; value: number; detail: string; target: string; attention?: boolean };

function jumpTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const heading = target.matches("form") ? target.querySelector("input, select, textarea, button") : target.querySelector("h2");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  if (heading instanceof HTMLElement) {
    if (heading.tagName === "H2") heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  history.replaceState(null, "", `#${id}`);
}

export function DepartmentOverview({ data, module, user }: { data: PortalSnapshot; module: ModuleId; user: SessionUser }) {
  const shortcuts: Shortcut[] = [];
  const add = (label: string, value: number, detail: string, title: string, attention = false) => shortcuts.push({ label, value, detail, target: sectionId(title), attention: attention && value > 0 });
  if (module === "finance") {
    add("Customer balances", (data.invoices ?? []).filter(item => item.total > item.paid + item.credited).length, "Invoices with an outstanding balance", "Customer invoices", true);
    add("Supplier balances", (data.bills ?? []).filter(item => item.total > item.paid).length, "Bills with an outstanding balance", "Supplier bills", true);
    add("Bank matching", (data.statementLines ?? []).filter(item => item.status === "Unmatched").length, "Statement lines awaiting a match", "Bank statement matching", true);
    add("Numbered receipts", data.receipts?.length ?? 0, "Recorded customer payment evidence", "Payments and numbered receipts");
  } else if (module === "hr") {
    add("Onboarding", (data.employees ?? []).filter(item => item.status === "Onboarding").length, "Employee records being prepared", "Onboarding", true);
    add("Leave decisions", (data.leaveRequests ?? []).filter(item => item.status === "Pending").length, "Requests awaiting an independent decision", "Leave requests", true);
    add("Employee register", data.employees?.length ?? 0, "Restricted records in your scope", "Employee records");
    add("Payroll preparations", data.payrollPreparations?.length ?? 0, "Prepared summaries; no pay is released", "Payroll preparation");
  } else if (module === "procurement") {
    add("Open orders", (data.orders ?? []).filter(item => !["Completed", "Cancelled"].includes(item.status)).length, "Customer requests still in progress", "Customer order fulfilment", true);
    if (user.role !== "sales") {
      add("Purchase review", (data.purchaseRequests ?? []).filter(item => item.status === "Pending").length, "Requests awaiting an independent decision", "Purchase requests", true);
      add("Stock attention", (data.products ?? []).filter(item => typeof item.reorderLevel === "number" && item.stock <= item.reorderLevel).length, "Products at or below their reorder level", "Stock availability", true);
    }
    if (data.capabilities?.includes("enquiry.respond") || data.capabilities?.includes("support.respond")) {
      add("Customer enquiries", (data.enquiries ?? []).filter(item => item.status === "Received").length, "Enquiries awaiting a recorded response", "Customer enquiries", true);
      if (user.role === "sales") add("Account support", (data.supportRequests ?? []).filter(item => item.status === "Open").length, "Customer questions awaiting a response", "Account support", true);
    }
  } else if (module === "admin") {
    add("Open tasks", (data.tasks ?? []).filter(item => item.status === "Open").length, "Work awaiting evidence from its owner", "Tasks and evidence", true);
    add("Evidence review", (data.tasks ?? []).filter(item => item.status === "Submitted").length, "Submitted tasks awaiting review", "Tasks and evidence", true);
    add("Unit setup", (data.units ?? []).filter(item => item.status === "Setup").length, "Proposed branches or depots", "Branches, depots and headquarters", true);
    add("Audit events", data.audit?.length ?? 0, "Time-stamped records in your scope", "Audit trail");
  } else if (module === "communications") {
    add("Campaign preparation", (data.campaigns ?? []).filter(item => item.status !== "Captured").length, "Drafts and scheduled demonstration captures", "Campaign status", true);
    add("Consented audience", (data.profiles ?? []).filter(item => item.marketingConsent && !item.unsubscribed).length, "Customers with recorded marketing consent", "Consent and unsubscribe");
    add("Review moderation", (data.reviews ?? []).filter(item => item.publicationConsent && item.status === "Pending moderation").length, "Consented feedback awaiting a decision", "Customer review moderation", true);
    add("Captured messages", data.capturedMessages?.length ?? 0, "Review evidence; no external email is sent", "Captured message evidence");
  }
  if (!shortcuts.length) return null;
  return <section className="ip-work-brief" aria-label="Department work summary"><div className="ip-work-brief-title"><div><span className="ip-eyebrow">Your next steps</span><h2>Work in focus</h2></div><p>{user.unitId === "HQ" ? "Headquarters" : user.unitId} · Your authorised records</p></div><div className="ip-work-shortcuts">{shortcuts.map(item => <a href={`#${item.target}`} key={item.label} className={item.attention ? "needs-attention" : ""} onClick={event => { event.preventDefault(); jumpTo(item.target); }}><div><span>{item.label}</span><strong>{item.value.toLocaleString("en-GB")}</strong></div><p>{item.detail}</p><span className="ip-shortcut-link">Review records <span aria-hidden="true">↗</span></span></a>)}</div></section>;
}

type Destination = { id: string; label: string; kind: "Section" | "Action" };

/** Indexes only the panels and permitted forms rendered in this workspace. This
 * also includes device tools without coupling their implementation to the shell. */
export function DepartmentNavigator({ workspaceRef, revision, module }: { workspaceRef: RefObject<HTMLDivElement | null>; revision: number; module: ModuleId }) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const root = workspaceRef.current;
    if (!root) return;
    function indexWorkspace() {
      if (!root) return;
      const items: Destination[] = [];
      const usedIds = new Set<string>();
      root.querySelectorAll<HTMLElement>("section.ip-panel, section.it-section, form.ip-form").forEach(element => {
        const isForm = element.matches("form");
        const label = isForm ? element.getAttribute("aria-label") : element.querySelector("h2")?.textContent;
        if (!label) return;
        const base = element.id || sectionId(label);
        let id = base;
        for (let index = 2; usedIds.has(id); index++) id = `${base}-${index}`;
        usedIds.add(id);
        element.id = id;
        items.push({ id, label, kind: isForm ? "Action" : "Section" });
      });
      setDestinations(current => JSON.stringify(current) === JSON.stringify(items) ? current : items);
    }
    indexWorkspace();
    // Some permitted actions are mounted after choosing a product or payment
    // kind. Keep the command index current without watching each keystroke.
    const observer = new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(node => node instanceof Element && (node.matches("form.ip-form, section.ip-panel, section.it-section") || node.querySelector("form.ip-form, section.ip-panel, section.it-section"))))) indexWorkspace();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [workspaceRef, revision, module]);
  const needle = query.trim().toLocaleLowerCase("en-GB");
  const matches = needle ? destinations.filter(item => item.label.toLocaleLowerCase("en-GB").includes(needle)) : destinations.filter(item => item.kind === "Section");
  const shown = needle || expanded ? matches : matches.slice(0, 6);
  if (!destinations.length) return null;
  return <nav className="ip-department-nav" aria-label="Department sections and actions"><div className="ip-department-nav-top"><div><strong>Jump to your work</strong><span>{destinations.filter(item => item.kind === "Section").length} sections · {destinations.filter(item => item.kind === "Action").length} permitted actions</span></div><label className="ip-command-search"><span className="ip-sr-only">Find a section or action</span><span aria-hidden="true">⌕</span><input type="search" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} placeholder="Find a section or action…" /></label></div><div className="ip-jump-links">{shown.map(item => <a key={item.id} href={`#${item.id}`} onClick={event => { event.preventDefault(); jumpTo(item.id); }}><span>{item.label}</span>{needle && <small>{item.kind}</small>}</a>)}{!shown.length && <p role="status">No sections or actions match. Try “invoice”, “stock” or “task”.</p>}{!needle && matches.length > 6 && <button className="ip-nav-expand" type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? "Show fewer sections" : `All ${matches.length} sections`} <span aria-hidden="true">{expanded ? "−" : "+"}</span></button>}</div></nav>;
}
