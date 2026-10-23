"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogProduct, Order } from "@/lib/portal-types";

type Filters = { query: string; category: string; sort: string; available: boolean };
const defaults: Filters = { query: "", category: "All products", sort: "name", available: false };
const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Filters are shareable and survive a refresh without storing customer data. */
export function useCatalogueFilters(enabled: boolean) {
  const [filters, setFilters] = useState<Filters>(defaults);
  useEffect(() => {
    if (!enabled) return;
    function read() {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        query: (params.get("q") ?? "").slice(0, 100),
        category: params.get("category") || defaults.category,
        sort: ["low", "high", "stock"].includes(params.get("sort") ?? "") ? params.get("sort")! : "name",
        available: params.get("available") === "1",
      });
    }
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [enabled]);
  function persist(next: Filters) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({ q: next.query || null, category: next.category === "All products" ? null : next.category, sort: next.sort === "name" ? null : next.sort, available: next.available ? "1" : null })) {
      if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }
  function update(patch: Partial<Filters>) { const next = { ...filters, ...patch }; setFilters(next); persist(next); }
  function clear() { setFilters({ ...defaults }); persist(defaults); }
  return { filters, update, clear };
}

export function matchingProducts(products: CatalogProduct[], filters: Filters) {
  const words = normalize(filters.query.trim()).split(/\s+/).filter(Boolean);
  return products.filter(product => {
    const content = normalize(`${product.name} ${product.pack} ${product.category} ${product.description} ${product.id}`);
    return (filters.category === "All products" || product.category === filters.category)
      && (!filters.available || product.stock > 0)
      && words.every(word => content.includes(word));
  }).sort((a, b) => {
    const primary = filters.sort === "low" ? a.price - b.price : filters.sort === "high" ? b.price - a.price : filters.sort === "stock" ? b.stock - a.stock : 0;
    return primary || a.name.localeCompare(b.name);
  });
}

export function CatalogueControls({ products, filters, update, clear, count, loading }: {
  products: CatalogProduct[]; filters: Filters; update: (patch: Partial<Filters>) => void; clear: () => void; count: number; loading: boolean;
}) {
  const categories = [...new Set(products.map(product => product.category))].sort();
  const active = Boolean(filters.query || filters.category !== "All products" || filters.available || filters.sort !== "name");
  return <section className="sf-discovery" aria-label="Find and filter products">
    <div className="sf-filterbar">
      <label className="sf-search"><span className="sf-control-label">Find a product</span><Search aria-hidden="true"/><input type="search" aria-label="Search products" placeholder="Product, category or pack size" maxLength={100} value={filters.query} onChange={event => update({ query: event.target.value })}/>{filters.query && <button type="button" className="sf-clear-search" aria-label="Clear search" onClick={() => update({ query: "" })}><X aria-hidden="true"/></button>}</label>
      <label>Category<select value={filters.category} onChange={event => update({ category: event.target.value })}><option>All products</option>{!categories.includes(filters.category) && filters.category !== "All products" && <option>{filters.category}</option>}{categories.map(category => <option key={category}>{category}</option>)}</select></label>
      <label>Sort<select value={filters.sort} onChange={event => update({ sort: event.target.value })}><option value="name">Product name</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="stock">Most sample stock</option></select></label>
    </div>
    <div className="sf-category-chips" role="group" aria-label="Quick product categories">{["All products", ...categories].map(category => <button key={category} type="button" aria-pressed={filters.category === category} onClick={() => update({ category })}>{category}<span>{category === "All products" ? products.length : products.filter(product => product.category === category).length}</span></button>)}</div>
    <div className="sf-results-toolbar"><p aria-live="polite" aria-atomic="true">{loading ? "Loading products…" : <><strong>{count}</strong> {count === 1 ? "product" : "products"}{products.length !== count && <> of {products.length}</>}{filters.query.trim() && <> for “{filters.query.trim()}”</>}</>}</p><div><label className="sf-stock-toggle"><input type="checkbox" checked={filters.available} onChange={event => update({ available: event.target.checked })}/>Sample stock available</label>{active && <button type="button" className="sf-reset-filters" onClick={clear}><SlidersHorizontal aria-hidden="true"/>Reset filters</button>}</div></div>
  </section>;
}

/** Editing multiple digits is local; only an explicit update changes the saved cart. */
export function CartQuantity({ name, quantity, max, busy, onCommit, onDirtyChange }: { name: string; quantity: number; max: number; busy: boolean; onCommit: (quantity: number) => Promise<unknown>; onDirtyChange: (dirty: boolean) => void }) {
  const [draft, setDraft] = useState(String(quantity));
  useEffect(() => setDraft(String(quantity)), [quantity]);
  const parsed = Number(draft);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= max;
  useEffect(() => { onDirtyChange(draft !== String(quantity)); }, [draft, quantity, onDirtyChange]);
  return <form className="sf-cart-quantity" onSubmit={async event => { event.preventDefault(); if (valid && parsed !== quantity) await onCommit(parsed); }}>
    <label htmlFor={`quantity-${name.replace(/[^a-z0-9]/gi, "-")}`}>Quantity</label>
    <div className="sf-quantity-stepper"><button type="button" aria-label={`Decrease quantity for ${name}`} disabled={busy || quantity <= 1} onClick={() => onCommit(quantity - 1)}><Minus aria-hidden="true"/></button><input id={`quantity-${name.replace(/[^a-z0-9]/gi, "-")}`} aria-label={`Quantity for ${name}`} aria-invalid={!valid} type="number" min="1" max={max} step="1" required value={draft} disabled={busy} onChange={event => setDraft(event.target.value)}/><button type="button" aria-label={`Increase quantity for ${name}`} disabled={busy || quantity >= max} onClick={() => onCommit(quantity + 1)}><Plus aria-hidden="true"/></button></div>
    <button className="sf-quantity-save" type="submit" disabled={busy || !valid || parsed === quantity}>Update quantity</button>
    {!valid && <small className="sf-quantity-error">{max < 1 ? "No sample stock available. Remove this item or ask customer care." : `Enter 1–${max} packs.`}</small>}
  </form>;
}

export const orderNextStep = (order: Order) => ({
  "Awaiting confirmation": "Your request is being reviewed. Wait for stock, price and fulfilment confirmation before making arrangements.",
  "Confirmed": order.fulfilment === "delivery" ? "Your request is confirmed. Follow this account for the dispatch update and agreed delivery arrangements." : "Your request is confirmed. Wait for the ready-for-collection update before travelling to Kanengo.",
  "Ready for collection": "Keep your order reference with you and confirm a collection time with the Fatima team before visiting Kanengo, Lilongwe.",
  "Dispatched": "Follow the agreed delivery arrangements. Check product identity, quantities and packaging when the goods arrive.",
  "Completed": "Keep your order summary and original product labels. Your account support form is available if you need help.",
  "Cancelled": "This request is closed. Browse the catalogue to prepare another request or ask customer care for help.",
}[order.status]);

export function OrderNextStep({ order }: { order: Order }) {
  return <aside className="sf-next-step" aria-label="Your next order step"><CheckCircle2 aria-hidden="true"/><div><h2>Your next step</h2><p>{orderNextStep(order)}</p><Link className="sf-text-link" href="/account#support">Ask about this order<ArrowRight aria-hidden="true"/></Link></div></aside>;
}

export function CustomerTabs({ selected, onSelect, unread }: { selected: string; onSelect: (tab: string) => void; unread: number }) {
  const tabs = ["orders", "profile", "notifications", "support"];
  function keydown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onSelect(tabs[next]);
    document.getElementById(`customer-tab-${tabs[next]}`)?.focus();
  }
  return <div className="sf-tabs" role="tablist" aria-label="Customer account sections">{tabs.map((tab, index) => <button key={tab} id={`customer-tab-${tab}`} role="tab" aria-selected={selected === tab} aria-controls="customer-tab-panel" tabIndex={selected === tab ? 0 : -1} onClick={() => onSelect(tab)} onKeyDown={event => keydown(event, index)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}{tab === "notifications" && unread > 0 && <span className="sf-unread-count" aria-label={`${unread} unread`}>{unread}</span>}</button>)}</div>;
}

export function CustomerOrders({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const statuses = [...new Set(orders.map(order => order.status))];
  const visible = orders.filter(order => (status === "All statuses" || order.status === status) && normalize(`${order.id} ${order.lines.map(line => line.name).join(" ")}`).includes(normalize(query.trim()))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <><div className="sf-order-filters"><label className="sf-field">Find an order<input type="search" aria-label="Search your orders" placeholder="Order reference or product" maxLength={100} value={query} onChange={event => setQuery(event.target.value)}/></label><label className="sf-field">Order status<select value={status} onChange={event => setStatus(event.target.value)}><option>All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label></div><p className="sf-muted" aria-live="polite">{visible.length} of {orders.length} order requests</p>{visible.map(order => <Link className="sf-order-row" href={`/account/orders/${order.id}`} key={order.id}><div><b>{order.id}</b><small>{new Date(order.createdAt).toLocaleDateString("en-GB", { timeZone: "Africa/Blantyre", dateStyle: "medium" })} · {order.lines.reduce((sum, line) => sum + line.quantity, 0)} packs</small></div><span className="sf-badge">{order.status}</span><b>{new Intl.NumberFormat("en-MW", { style: "currency", currency: "MWK", maximumFractionDigits: 0 }).format(order.total)}</b><ArrowRight aria-hidden="true"/></Link>)}{!visible.length && <div className="sf-order-no-results"><h3>No matching orders</h3><p>Try another reference or show all statuses.</p><button className="sf-btn sf-secondary" onClick={() => { setQuery(""); setStatus("All statuses"); }}>Clear order filters</button></div>}</>;
}
