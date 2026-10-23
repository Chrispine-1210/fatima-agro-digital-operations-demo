"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ActionResponse, PortalSnapshot, Receipt } from "@/lib/portal-types";
import { BarcodeLabel } from "./barcode-label";
import { BarcodeScanner } from "./barcode-scanner";
import { ReceiptCapture } from "./receipt-capture";

const money = (amount: number) => `MWK ${amount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
const timestamp = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Africa/Blantyre", dateStyle: "medium", timeStyle: "short" });
type Props = { data: PortalSnapshot; onAction: (action: string, data: Record<string, unknown>) => Promise<ActionResponse> };

/** Receives only the caller's server-authorised snapshot. No receipt is fetched by arbitrary ID. */
export function ReceiptPrintButton({ receipt, data }: { receipt: Receipt; data: PortalSnapshot }) {
  const [open, setOpen] = useState(false);
  const [paper, setPaper] = useState("80");
  const [barcodeReady, setBarcodeReady] = useState(false);
  const [brandReady, setBrandReady] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const receiptDocument = data.receiptDocuments?.find(item => item.receipt.id === receipt.id && item.receipt.customerId === receipt.customerId);
  const invoice = receiptDocument?.invoice;
  const order = receiptDocument?.order;
  const profile = receiptDocument?.customer;
  const payment = receiptDocument?.payment;
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const items = [...document.querySelectorAll<HTMLElement>(".receipt-print-root button, .receipt-print-root select")];
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = oldOverflow; triggerRef.current?.focus(); };
  }, [open]);
  if (!invoice) return null;
  return <><button type="button" className="ip-button ip-secondary receipt-open" ref={triggerRef} onClick={() => { setBrandReady(false); setOpen(true); }}>Preview / print receipt</button>{open && createPortal(
    <div className="receipt-print-root" role="dialog" aria-modal="true" aria-label={`Receipt ${receipt.id}`}>
      <style>{`@media print { body > *:not(.receipt-print-root) { display: none !important; } } @page { size: auto; margin: 0; }`}</style>
      <div className="receipt-toolbar"><div><strong>Receipt preview</strong><p>Choose the matching printer paper in the print dialog. Printing does not create a payment.</p></div><label>Paper width<select value={paper} onChange={event => setPaper(event.target.value)}><option value="58">58 mm thermal</option><option value="80">80 mm thermal</option><option value="A4">A4</option></select></label><button type="button" className="ip-button" disabled={!barcodeReady || !brandReady} onClick={() => window.print()}>Open print dialog</button><button type="button" className="ip-button ip-secondary" ref={closeRef} onClick={() => setOpen(false)}>Close preview</button></div>
      <article className={`receipt-sheet receipt-paper-${paper}`}>
        <header><img className="receipt-logo" src="/brand/fatima-mark.svg" alt="" width="104" height="104" onLoad={() => setBrandReady(true)} onError={event => { event.currentTarget.hidden = true; setBrandReady(true); }} /><strong className="receipt-brand">FATIMA AGRO</strong><p>Dealers and General Suppliers</p><p>{[receiptDocument?.unit.address, receiptDocument?.unit.town, receiptDocument?.unit.country].filter(Boolean).join(", ") || receiptDocument?.unit.name}</p><h1>Payment record</h1><p className="receipt-demo">DEMONSTRATION · NOT A FISCAL RECEIPT</p></header>
        <dl><div><dt>Receipt</dt><dd>{receipt.id}</dd></div><div><dt>Recorded</dt><dd>{timestamp(receipt.createdAt)} CAT</dd></div><div><dt>Customer</dt><dd>{profile?.name ?? receipt.customerId}</dd></div><div><dt>Invoice</dt><dd>{invoice.id}</dd></div>{order && <div><dt>Order</dt><dd>{order.id}</dd></div>}<div><dt>Payment</dt><dd>{receipt.paymentId}</dd></div>{payment && <div><dt>Method</dt><dd>{payment.method}</dd></div>}</dl>
        {order && <table><caption>Original order items</caption><thead><tr><th>Item / quantity</th><th>MWK</th></tr></thead><tbody>{order.lines.map(item => <tr key={item.productId}><td>{item.name}<small>{item.quantity} × {money(item.unitPrice)}</small></td><td>{item.total.toLocaleString("en-GB")}</td></tr>)}</tbody></table>}
        <dl className="receipt-totals"><div><dt>This payment</dt><dd>{money(receipt.amount)}</dd></div><div><dt>Invoice total</dt><dd>{money(invoice.total)}</dd></div><div><dt>Total recorded paid</dt><dd>{money(invoice.paid)}</dd></div>{invoice.credited > 0 && <div><dt>Credits</dt><dd>{money(invoice.credited)}</dd></div>}<div><dt>Remaining balance</dt><dd>{money(Math.max(0, invoice.total - invoice.credited - invoice.paid))}</dd></div></dl>
        <BarcodeLabel value={receipt.id} caption="Receipt reference" showActions={false} showHelp={false} onReady={setBarcodeReady} />
        <footer><p>Thank you for choosing Fatima Agro.</p><p>Synthetic payment record. No bank settlement or MRA fiscalisation is represented. Keep this reference for account enquiries.</p></footer>
      </article>
    </div>, document.body)}</>;
}

export function ReceiptTools({ data, onAction }: Props) {
  const [query, setQuery] = useState("");
  const receipts = data.receipts ?? [];
  const matches = receipts.filter(item => !query || [item.id, item.invoiceId, item.paymentId].some(value => value.toUpperCase().includes(query.trim().toUpperCase())));
  const targets = [
    ...receipts.map(item => ({ id: item.id, label: `Payment receipt · ${item.id}`, targetType: "receipt" as const })),
    ...(data.goodsReceipts ?? []).map(item => ({ id: item.id, label: `Goods receipt · ${item.id}`, targetType: "goods-receipt" as const })),
    ...(data.expenses ?? []).map(item => ({ id: item.id, label: `Expense · ${item.id}`, targetType: "expense" as const })),
  ];
  return <section className="ip-panel receipt-workspace"><div className="ip-panel-heading"><h2>Receipts and document capture</h2><p>Find an existing record, prepare a thermal receipt or attach a reviewed camera reference.</p></div>{data.module === "finance" && <><BarcodeScanner label="Find a receipt or invoice reference" onScan={setQuery} /><label className="ip-field"><span>Filter receipt records</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Receipt, invoice or payment reference" /></label><div className="receipt-register">{matches.length ? matches.map(receipt => <div className="receipt-register-row" key={receipt.id}><div><strong>{receipt.id}</strong><p>{receipt.invoiceId} · {timestamp(receipt.createdAt)}</p></div><strong>{money(receipt.amount)}</strong><ReceiptPrintButton receipt={receipt} data={data} /></div>) : <p className="ip-empty">{query ? "No matching receipt in your authorised records. Check the reference." : "Record a customer payment to create a numbered receipt."}</p>}</div></>}
    {data.capabilities?.includes("finance.receiptCapture") && <ReceiptCapture targets={targets} onAction={onAction} />}
    {!!data.receiptCaptures?.length && <div className="receipt-capture-register"><h3>Reviewed capture references</h3>{data.receiptCaptures.map(item => <details key={item.id}><summary>{item.reference} · {item.targetId}</summary><p>{item.note}</p><small>{item.fileName || "Manual reference"} · {item.storage} · {timestamp(item.createdAt)}</small>{item.sha256 && <code>SHA-256: {item.sha256}</code>}</details>)}</div>}
  </section>;
}

