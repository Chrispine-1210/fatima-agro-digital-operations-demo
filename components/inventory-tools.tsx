"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ActionResponse, PortalSnapshot, Unit } from "@/lib/portal-types";
import { BarcodeScanner } from "./barcode-scanner";
import { BarcodeLabel } from "./barcode-label";

type ToolProps = { data: PortalSnapshot; onAction: (action: string, data: Record<string, unknown>) => Promise<ActionResponse> };
type ManagedProduct = NonNullable<PortalSnapshot["products"]>[number];
type StockAdjustment = NonNullable<PortalSnapshot["stockAdjustments"]>[number];
type StockTransfer = NonNullable<PortalSnapshot["stockTransfers"]>[number];
const quantity = (value: number) => value.toLocaleString("en-GB");
const recordedAt = (value: string) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Blantyre" });
const fieldValue = (form: HTMLFormElement, name: string) => String(new FormData(form).get(name) ?? "").trim();

function useToolAction(onAction: ToolProps["onAction"]) {
  const pending = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function run(action: string, payload: Record<string, unknown>, idempotent = false) {
    if (pending.current) return false;
    const fingerprint = JSON.stringify([action, payload]);
    if (idempotent) {
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      payload = { ...payload, idempotencyKey: attempt.current.key };
    }
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await onAction(action, payload);
      setMessage(response.message);
      attempt.current = null;
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved. Review the fields and try again.");
      return false;
    } finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, message, run };
}

function ActionFeedback({ action }: { action: ReturnType<typeof useToolAction> }) {
  return <>{action.error && <p className="it-alert it-error" role="alert">{action.error}</p>}{action.message && <p className="it-alert it-success" role="status">{action.message}</p>}</>;
}

function ToolSection({ title, description, children, id }: { title: string; description?: string; children: ReactNode; id?: string }) {
  return <section className="it-section" id={id}><header><h2>{title}</h2>{description && <p>{description}</p>}</header>{children}</section>;
}

function StockTable({ data, productId }: { data: PortalSnapshot; productId?: string }) {
  const products = data.products ?? [];
  const units = data.units ?? [];
  const rows = (data.stockBalances ?? []).filter(row => !productId || row.productId === productId);
  if (!rows.length) return <p className="it-empty">No stock balance is available for this selection.</p>;
  return <div className="it-table-wrap" tabIndex={0} aria-label="Stock balances, scroll to see all columns"><table><caption>Available stock by operating unit</caption><thead><tr><th scope="col">Operating unit</th>{!productId && <th scope="col">Product / SKU</th>}<th scope="col">Available units</th></tr></thead><tbody>{rows.map(row => { const product = products.find(item => item.id === row.productId); return <tr key={`${row.unitId}-${row.productId}`}><td>{units.find(item => item.id === row.unitId)?.name ?? row.unitId}<small>{row.unitId}</small></td>{!productId && <td>{product?.name ?? row.productId}<small>{product?.sku ?? row.productId}</small></td>}<td className="it-number">{quantity(row.quantity)}</td></tr>; })}</tbody></table></div>;
}

function ProductIdentity({ product, onAction }: { product: ManagedProduct; onAction: ToolProps["onAction"] }) {
  const action = useToolAction(onAction);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await action.run("inventory.identify", { productId: product.id, sku: fieldValue(form, "sku").toUpperCase(), barcode: fieldValue(form, "barcode").toUpperCase() });
  }
  return <form className="it-form" aria-label="Product SKU and barcode" onSubmit={submit} aria-busy={action.busy}><h3>Product identifiers</h3><p>Use a unique internal SKU and barcode for this product and pack size.</p><div className="it-fields"><label>SKU<input name="sku" defaultValue={product.sku ?? ""} required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}" autoCapitalize="characters" spellCheck={false} /><small>3–32 letters, numbers, dots, underscores or hyphens.</small></label><label>Barcode value<input name="barcode" defaultValue={product.barcode ?? ""} required maxLength={48} pattern="[A-Za-z0-9][A-Za-z0-9._\-]{0,47}" autoCapitalize="characters" spellCheck={false} /><small>Internal Code 128; this does not allocate a GS1 product number.</small></label></div><button className="it-button" disabled={action.busy} type="submit">{action.busy ? "Saving identifiers…" : "Save identifiers"}</button><ActionFeedback action={action} /></form>;
}

function CountRequest({ data, product, onAction }: ToolProps & { product: ManagedProduct }) {
  const balances = (data.stockBalances ?? []).filter(row => row.productId === product.id && data.units?.some(unit => unit.id === row.unitId && unit.status === "Active" && unit.functions.includes("Inventory")));
  const [unitId, setUnitId] = useState(balances[0]?.unitId ?? "");
  const current = balances.find(row => row.unitId === unitId);
  const [count, setCount] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState<number | null>(null);
  const stale = count !== "" && expectedQuantity !== null && current?.quantity !== expectedQuantity;
  const action = useToolAction(onAction);
  function clearCount() { setCount(""); setExpectedQuantity(null); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current || expectedQuantity === null || stale) return;
    const form = event.currentTarget;
    const saved = await action.run("inventory.adjustmentRequest", { productId: product.id, unitId, expectedQuantity, countedQuantity: Number(count), reason: fieldValue(form, "reason"), evidence: fieldValue(form, "evidence") }, true);
    if (saved) { form.reset(); clearCount(); }
  }
  return <form className="it-form" onSubmit={submit} aria-label="Request a stock count adjustment" aria-busy={action.busy}><h3>Record a stock count</h3><p>Count available units after excluding stock reserved for open orders. A separate operations director reviews any proposed change before stock moves.</p><div className="it-fields"><label>Operating unit<select value={unitId} onChange={event => { setUnitId(event.target.value); clearCount(); }} required><option value="">Choose a unit</option>{balances.map(row => <option key={row.unitId} value={row.unitId}>{data.units?.find(unit => unit.id === row.unitId)?.name ?? row.unitId}</option>)}</select></label><label>Counted available units<input name="count" type="number" min={0} max={1000000} step={1} value={count} onChange={event => { if (event.target.value === "") clearCount(); else { if (expectedQuantity === null && current) setExpectedQuantity(current.quantity); setCount(event.target.value); } }} required /></label><label>Reason<input name="reason" required maxLength={300} placeholder="Explain the difference or count check" /></label><label>Evidence reference<input name="evidence" required maxLength={300} placeholder="Count sheet or verified document reference" /></label></div>{current && <p className="it-calculation">Recorded balance: <strong>{quantity(current.quantity)}</strong>{count !== "" && !stale && <> · Proposed change: <strong>{Number(count) - (expectedQuantity ?? current.quantity) > 0 ? "+" : ""}{quantity(Number(count) - (expectedQuantity ?? current.quantity))}</strong></>}</p>}{stale && <div className="it-alert it-error it-stale-count" role="alert"><p>Recorded balance changed while this count was being entered. Clear the count and recount available units before submitting.</p><button className="it-button it-secondary" type="button" onClick={clearCount}>Recorded balance changed; clear and recount</button></div>}<button className="it-button" type="submit" disabled={action.busy || !current || count === "" || stale}>{action.busy ? "Submitting count…" : "Request count adjustment"}</button><ActionFeedback action={action} /></form>;
}

function TransferRequest({ data, product, onAction }: ToolProps & { product: ManagedProduct }) {
  const balances = (data.stockBalances ?? []).filter(row => row.productId === product.id && data.units?.some(unit => unit.id === row.unitId && unit.status === "Active" && unit.functions.includes("Inventory")));
  const [fromUnitId, setFromUnitId] = useState(balances.find(row => row.quantity > 0)?.unitId ?? balances[0]?.unitId ?? "");
  const source = balances.find(row => row.unitId === fromUnitId);
  const destinations = (data.transferDestinations ?? []).filter(unit => unit.id !== fromUnitId);
  const action = useToolAction(onAction);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const saved = await action.run("inventory.transferRequest", { productId: product.id, fromUnitId, toUnitId: fieldValue(form, "toUnitId"), quantity: Number(fieldValue(form, "quantity")), reason: fieldValue(form, "reason"), evidence: fieldValue(form, "evidence") }, true);
    if (saved) form.reset();
  }
  return <form className="it-form" onSubmit={submit} aria-label="Request an inventory transfer" aria-busy={action.busy}><h3>Transfer between units</h3><p>Approval records the stock transfer in the demonstration ledger. Record physical handover evidence in the reference.</p><div className="it-fields"><label>From unit<select value={fromUnitId} onChange={event => setFromUnitId(event.target.value)} required><option value="">Choose a source</option>{balances.map(row => <option key={row.unitId} value={row.unitId}>{data.units?.find(unit => unit.id === row.unitId)?.name ?? row.unitId}</option>)}</select></label><label>To unit<select name="toUnitId" required defaultValue="" key={fromUnitId}><option value="">Choose a destination</option>{destinations.map(unit => <option key={unit.id} value={unit.id}>{unit.name} · {unit.kind}</option>)}</select></label><label>Quantity<input name="quantity" type="number" min={1} max={Math.min(source?.quantity ?? 0, 1000000)} step={1} required /></label><label>Reason<input name="reason" maxLength={300} required placeholder="Reason for moving this stock" /></label><label className="it-wide">Handover / evidence reference<input name="evidence" maxLength={300} required placeholder="Transfer sheet or planned handover reference" /></label></div><p className="it-calculation">Available at source: <strong>{quantity(source?.quantity ?? 0)}</strong></p><button className="it-button" type="submit" disabled={action.busy || !source?.quantity || !destinations.length}>{action.busy ? "Submitting transfer…" : "Request stock transfer"}</button>{!destinations.length && <p className="it-help">An approved active destination unit is required.</p>}<ActionFeedback action={action} /></form>;
}

function Decision({ id, actionName, onAction }: { id: string; actionName: "inventory.adjustmentDecision" | "inventory.transferDecision"; onAction: ToolProps["onAction"] }) {
  const action = useToolAction(onAction);
  const [confirmed, setConfirmed] = useState(false);
  return <div className="it-decision"><label className="it-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I checked the evidence and did not request this change.</label><div className="it-actions"><button className="it-button" disabled={action.busy || !confirmed} onClick={() => action.run(actionName, { [actionName === "inventory.adjustmentDecision" ? "adjustmentId" : "transferId"]: id, decision: "Approved" }, true)} type="button">Approve</button><button className="it-button it-secondary" disabled={action.busy} onClick={() => action.run(actionName, { [actionName === "inventory.adjustmentDecision" ? "adjustmentId" : "transferId"]: id, decision: "Declined" }, true)} type="button">Decline</button></div><ActionFeedback action={action} /></div>;
}

function InventoryRequests({ data, onAction }: ToolProps) {
  const adjustments = data.stockAdjustments ?? [];
  const transfers = data.stockTransfers ?? [];
  const unitName = (id: string) => data.units?.find(unit => unit.id === id)?.name ?? data.transferDestinations?.find(unit => unit.id === id)?.name ?? id;
  const productName = (id: string) => data.products?.find(product => product.id === id)?.name ?? id;
  const canDecideCounts = data.capabilities?.includes("inventory.adjustmentDecision");
  const canDecideTransfers = data.capabilities?.includes("inventory.transferDecision");
  function requestDetail(item: StockAdjustment | StockTransfer, kind: "count" | "transfer") {
    const count = kind === "count" ? item as StockAdjustment : null;
    const transfer = kind === "transfer" ? item as StockTransfer : null;
    return <article className="it-request" key={item.id}><div className="it-request-heading"><div><small>{item.id}</small><h3>{productName(item.productId)}</h3></div><span className={`it-status it-status-${item.status.toLowerCase()}`}>{item.status}</span></div><dl className="it-facts">{count && <><div><dt>Unit</dt><dd>{unitName(count.unitId)}</dd></div><div><dt>Recorded → counted</dt><dd>{quantity(count.expectedQuantity)} → {quantity(count.countedQuantity)} ({count.quantityChange > 0 ? "+" : ""}{quantity(count.quantityChange)})</dd></div></>}{transfer && <><div><dt>Route</dt><dd>{unitName(transfer.fromUnitId)} → {unitName(transfer.toUnitId)}</dd></div><div><dt>Quantity</dt><dd>{quantity(transfer.quantity)}</dd></div></>}<div><dt>Reason</dt><dd>{item.reason}</dd></div><div><dt>Evidence</dt><dd>{item.evidence}</dd></div><div><dt>Requested by</dt><dd>{item.requestedBy} · {recordedAt(item.createdAt)}</dd></div>{item.decidedBy && <div><dt>Decision by</dt><dd>{item.decidedBy}{item.decidedAt && ` · ${recordedAt(item.decidedAt)}`}</dd></div>}</dl>{item.status === "Pending" && ((kind === "count" && canDecideCounts) || (kind === "transfer" && canDecideTransfers)) && <Decision id={item.id} actionName={kind === "count" ? "inventory.adjustmentDecision" : "inventory.transferDecision"} onAction={onAction} />}</article>;
  }
  return <ToolSection title="Stock control requests" description="Counts and transfers keep the request, evidence and independent decision together."><div className="it-columns"><div><h3 className="it-column-title">Count adjustments</h3>{!adjustments.length && <p className="it-empty">No count adjustments have been requested.</p>}{[...adjustments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => requestDetail(item, "count"))}</div><div><h3 className="it-column-title">Unit transfers</h3>{!transfers.length && <p className="it-empty">No stock transfers have been requested.</p>}{[...transfers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => requestDetail(item, "transfer"))}</div></div></ToolSection>;
}

export function InventoryTools({ data, onAction }: ToolProps) {
  const products = data.products ?? [];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const selected = products.find(product => product.id === selectedId);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter(product => !term || [product.id, product.sku, product.barcode, product.name, product.pack].some(value => value?.toLowerCase().includes(term)));
  }, [products, query]);
  function scanned(value: string) {
    const term = value.trim().toUpperCase();
    const product = products.find(item => [item.id, item.sku, item.barcode].some(identifier => identifier?.toUpperCase() === term));
    setQuery(value); setSelectedId(product?.id ?? "");
    setScanMessage(product ? `Selected ${product.name}, ${product.pack}.` : `No product matches “${value}”. Check the code or search by product name.`);
  }
  return <div className="it-tools"><ToolSection title="Inventory tools" description="Find products with a phone camera, USB scanner, SKU or barcode. Stock is controlled by operating unit."><div className="it-lookup-layout"><div className="it-lookup"><BarcodeScanner onScan={scanned} label="Scan or enter a product SKU / barcode" /><label className="it-search">Search the product register<input value={query} onChange={event => { setQuery(event.target.value); setScanMessage(""); }} placeholder="Product name, SKU, barcode or ID" type="search" maxLength={160} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (matches.length === 1) { setSelectedId(matches[0].id); setScanMessage(`Selected ${matches[0].name}.`); } else scanned(query); } }} /></label><p className="it-scan-status" role="status">{scanMessage || `${matches.length} product${matches.length === 1 ? "" : "s"} found`}</p><div className="it-product-results" aria-label="Matching products">{!matches.length && <p className="it-empty">No matching product. Try a different name or identifier.</p>}{matches.map(product => <button type="button" key={product.id} className={selectedId === product.id ? "it-product is-selected" : "it-product"} onClick={() => { setSelectedId(product.id); setScanMessage(""); }} aria-pressed={selectedId === product.id}><span><strong>{product.name}</strong><small>{product.pack}</small></span><code>{product.sku ?? product.id}</code></button>)}</div></div><div className="it-product-detail">{selected ? <><div className="it-product-summary"><span className="it-eyebrow">Selected product</span><h3>{selected.name}</h3><p>{selected.pack} · {selected.category}</p><dl className="it-facts"><div><dt>Product ID</dt><dd>{selected.id}</dd></div><div><dt>SKU</dt><dd><code>{selected.sku ?? "Not assigned"}</code></dd></div><div><dt>Barcode</dt><dd><code>{selected.barcode ?? "Not assigned"}</code></dd></div><div><dt>Recorded available stock</dt><dd>{quantity(selected.stock)} available units</dd></div></dl></div>{selected.barcode ? <div className="it-label-preview"><BarcodeLabel value={selected.barcode} caption={`${selected.name} · ${selected.pack} · ${selected.sku ?? selected.id}`} /><p className="it-help">Internal Code 128 labels. Check label width, printer settings and a sample scan before batch use.</p></div> : <p className="it-empty">Assign a barcode to create a printable label.</p>}<StockTable data={data} productId={selected.id} /></> : <div className="it-selection-empty"><strong>Select a product to begin</strong><p>Scan a label or choose a product to check its identifiers, print a label and manage its stock.</p></div>}</div></div>{selected && data.capabilities?.includes("inventory.identify") && <ProductIdentity key={`${selected.id}-${selected.sku}-${selected.barcode}`} product={selected} onAction={onAction} />}</ToolSection>{selected && (data.capabilities?.includes("inventory.adjustmentRequest") || data.capabilities?.includes("inventory.transferRequest")) && <ToolSection title="Count and move stock" description={`Working with ${selected.name} · ${selected.pack}. Requests do not move stock until an independent approval is recorded.`}><div className="it-columns">{data.capabilities?.includes("inventory.adjustmentRequest") && <CountRequest key={`count-${selected.id}`} data={data} product={selected} onAction={onAction} />}{data.capabilities?.includes("inventory.transferRequest") && <TransferRequest key={`transfer-${selected.id}`} data={data} product={selected} onAction={onAction} />}</div></ToolSection>}<InventoryRequests data={data} onAction={onAction} /><details className="it-all-stock"><summary>View all available stock by unit</summary><StockTable data={data} /></details></div>;
}

function locationLink(unit: Unit) {
  if (Number.isFinite(unit.latitude) && Number.isFinite(unit.longitude)) return `https://www.openstreetmap.org/?mlat=${unit.latitude}&mlon=${unit.longitude}#map=16/${unit.latitude}/${unit.longitude}`;
  const address = [unit.address, unit.town, unit.country].filter(Boolean).join(", ");
  return address ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}` : "";
}

function UnitLocationForm({ unit, onAction }: { unit: Unit; onAction: ToolProps["onAction"] }) {
  const [latitude, setLatitude] = useState(unit.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(unit.longitude?.toString() ?? "");
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const action = useToolAction(onAction);
  function captureLocation() {
    setLocationError(""); setLocationMessage("");
    if (!navigator.geolocation) { setLocationError("This browser cannot provide a location. Enter verified coordinates manually."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setLatitude(position.coords.latitude.toFixed(6)); setLongitude(position.coords.longitude.toFixed(6)); setLocating(false);
      setLocationMessage(`Device position captured, reported accuracy ±${Math.round(position.coords.accuracy)} metres. Confirm you are at ${unit.name} before saving.`);
    }, error => {
      setLocating(false);
      setLocationError(error.code === 1 ? "Location permission was declined. You can enter verified coordinates manually." : "The device location could not be obtained. Move to a clearer location or enter verified coordinates manually.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((latitude === "") !== (longitude === "")) { setLocationError("Enter both latitude and longitude, or leave both blank."); return; }
    setLocationError("");
    const form = event.currentTarget;
    await action.run("admin.unitLocation", { unitId: unit.id, address: fieldValue(form, "address"), town: fieldValue(form, "town"), country: fieldValue(form, "country"), latitude: latitude === "" ? null : Number(latitude), longitude: longitude === "" ? null : Number(longitude), locationNote: fieldValue(form, "locationNote") });
  }
  return <form className="it-form it-location-form" onSubmit={submit} aria-label={`Location for ${unit.name}`} aria-busy={action.busy}><h3>Location for {unit.name}</h3><div className="it-fields"><label className="it-wide">Street, area and collection instructions<textarea name="address" defaultValue={unit.address ?? ""} required maxLength={300} rows={2} placeholder="Verified street, area, building or landmark" /></label><label>Town / city<input name="town" defaultValue={unit.town ?? ""} required maxLength={100} /></label><label>Country<input name="country" defaultValue={unit.country ?? "Malawi"} required maxLength={100} /></label><label>Latitude (optional)<input name="latitude" type="number" value={latitude} onChange={event => setLatitude(event.target.value)} min={-90} max={90} step="any" /></label><label>Longitude (optional)<input name="longitude" type="number" value={longitude} onChange={event => setLongitude(event.target.value)} min={-180} max={180} step="any" /></label><label className="it-wide">Verification / location note<textarea name="locationNote" defaultValue={unit.locationNote ?? ""} maxLength={300} rows={2} placeholder="Who confirmed the address or how the position was checked" required /></label></div><div className="it-actions"><button className="it-button it-secondary" onClick={captureLocation} type="button" disabled={locating || action.busy}>{locating ? "Finding device location…" : "Use this device’s location"}</button>{(latitude || longitude) && <button className="it-text-button" type="button" onClick={() => { setLatitude(""); setLongitude(""); setLocationMessage(""); }}>Clear coordinates</button>}</div><p className="it-help">Capture a position only while at this operating unit. Coordinates are saved only when you select Save location.</p>{locationMessage && <p className="it-alert it-success" role="status">{locationMessage}</p>}{locationError && <p className="it-alert it-error" role="alert">{locationError}</p>}<button className="it-button" type="submit" disabled={action.busy || locating}>{action.busy ? "Saving location…" : "Save location"}</button><ActionFeedback action={action} /></form>;
}

export function UnitLocationTools({ data, onAction }: ToolProps) {
  const units = data.units ?? [];
  const [selectedId, setSelectedId] = useState(units[0]?.id ?? "");
  const selected = units.find(unit => unit.id === selectedId);
  const canEdit = data.capabilities?.includes("admin.unitLocation");
  return <div className="it-tools"><ToolSection title="Branch and depot locations" description="Keep verified addresses and optional map positions against the operating unit. These internal records do not change public delivery coverage."><div className="it-location-layout"><div className="it-unit-list">{!units.length && <p className="it-empty">No operating units are available in your scope.</p>}{units.map(unit => { const link = locationLink(unit); return <article className={selectedId === unit.id ? "it-unit is-selected" : "it-unit"} key={unit.id}><div className="it-request-heading"><h3>{unit.name}</h3><span className="it-status">{unit.kind}</span></div><p>{unit.address || "Address awaiting confirmation"}<br />{[unit.town, unit.country].filter(Boolean).join(", ")}</p>{Number.isFinite(unit.latitude) && Number.isFinite(unit.longitude) && <p className="it-coordinates">{unit.latitude}, {unit.longitude}</p>}{unit.locationNote && <p className="it-help">{unit.locationNote}</p>}<div className="it-actions">{canEdit && <button className="it-button it-secondary" type="button" onClick={() => setSelectedId(unit.id)} aria-pressed={selectedId === unit.id}>Edit location</button>}{link && <a className="it-map-link" href={link} target="_blank" rel="noopener noreferrer">Open map <span aria-hidden="true">↗</span><span className="it-sr-only"> in a new tab</span></a>}</div>{unit.locationUpdatedAt && <small>Updated {recordedAt(unit.locationUpdatedAt)}{unit.locationUpdatedBy ? ` · ${unit.locationUpdatedBy}` : ""}</small>}</article>; })}</div>{canEdit && selected && <UnitLocationForm key={selected.id} unit={selected} onAction={onAction} />}</div></ToolSection></div>;
}
