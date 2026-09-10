"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  Globe2,
  HeartHandshake,
  History,
  KeyRound,
  LockKeyhole,
  Newspaper,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Truck,
  UserRound,
  UserRoundCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { advanceShift, canAdvanceShift, type DemoRole, type ShiftStage } from "@/lib/demo-workflows";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScreenId =
  | "public"
  | "dashboard"
  | "catalogue"
  | "product"
  | "enquiries"
  | "quote"
  | "order"
  | "inventory"
  | "goods"
  | "reconciliation"
  | "customers"
  | "customer"
  | "procurement"
  | "compliance"
  | "delivery"
  | "contracts"
  | "finance"
  | "content-admin"
  | "worker-portal"
  | "customer-portal"
  | "service-management"
  | "system-admin"
  | "agent-portal"
  | "public-info"
  | "journeys"
  | "report"
  | "mobile-enquiry"
  | "mobile-quote";

type NavItem = { id: ScreenId; label: string; icon: LucideIcon };

type PublicPage = "about" | "how" | "stories" | "contact" | "privacy" | "terms";

const demoRoles: { id: DemoRole; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "seller", label: "Seller" },
  { id: "storekeeper", label: "Storekeeper" },
  { id: "editor", label: "Content editor" },
  { id: "finance", label: "Finance officer" },
  { id: "supervisor", label: "Supervisor" },
  { id: "manager", label: "Manager" },
  { id: "administrator", label: "System administrator" },
  { id: "agent", label: "Agent / dealer" },
];

const allScreens: ScreenId[] = ["public", "dashboard", "catalogue", "product", "enquiries", "quote", "order", "inventory", "goods", "reconciliation", "customers", "customer", "procurement", "compliance", "delivery", "contracts", "finance", "content-admin", "worker-portal", "customer-portal", "service-management", "system-admin", "agent-portal", "public-info", "journeys", "report", "mobile-enquiry", "mobile-quote"];

const roleScreens: Record<DemoRole, ScreenId[]> = {
  customer: ["public", "catalogue", "product", "customer-portal", "public-info", "mobile-enquiry", "mobile-quote"],
  seller: ["public", "catalogue", "product", "worker-portal", "customer", "mobile-enquiry", "mobile-quote"],
  storekeeper: ["public", "catalogue", "product", "inventory", "goods", "reconciliation", "procurement", "compliance", "worker-portal"],
  editor: ["public", "catalogue", "product", "content-admin", "public-info", "report"],
  finance: ["public", "finance", "worker-portal", "report", "dashboard"],
  supervisor: allScreens.filter((screen) => screen !== "system-admin"),
  manager: allScreens.filter((screen) => screen !== "system-admin"),
  administrator: allScreens,
  agent: ["public", "catalogue", "product", "agent-portal", "public-info"],
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "public", label: "Public website", icon: Building2 },
      { id: "dashboard", label: "Executive dashboard", icon: LayoutDashboard },
      { id: "report", label: "Management report", icon: FileText },
      { id: "journeys", label: "Connected journeys", icon: History },
      { id: "delivery", label: "Project delivery", icon: CalendarDays },
      { id: "content-admin", label: "Content administration", icon: Newspaper },
    ],
  },
  {
    label: "Sales",
    items: [
      { id: "catalogue", label: "Product catalogue", icon: ShoppingBasket },
      { id: "enquiries", label: "Enquiry inbox", icon: Mail },
      { id: "quote", label: "Quotation builder", icon: Banknote },
      { id: "order", label: "Orders", icon: ClipboardCheck },
      { id: "service-management", label: "Service & sales management", icon: HeartHandshake },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "inventory", label: "Inventory overview", icon: Boxes },
      { id: "goods", label: "Goods received", icon: Truck },
      { id: "reconciliation", label: "Stock reconciliation", icon: RefreshCcw },
      { id: "customers", label: "Customers & CRM", icon: UsersRound },
      { id: "contracts", label: "Contracts & tasks", icon: FileCheck2 },
      { id: "finance", label: "Finance control", icon: Banknote },
      { id: "worker-portal", label: "Worker / seller portal", icon: UserRound },
      { id: "customer-portal", label: "Customer portal", icon: UsersRound },
      { id: "agent-portal", label: "Agent / dealer expansion", icon: Globe2 },
      { id: "system-admin", label: "System administration", icon: Settings },
    ],
  },
  {
    label: "Procurement",
    items: [
      { id: "procurement", label: "MANePS pipeline", icon: ClipboardList },
      { id: "compliance", label: "Compliance register", icon: FileCheck2 },
    ],
  },
  {
    label: "Mobile demo",
    items: [
      { id: "mobile-enquiry", label: "Customer enquiry", icon: Smartphone },
      { id: "mobile-quote", label: "Quote & order", icon: PackageCheck },
    ],
  },
];

const products = [
  { name: "NPK 23:21:0+4S", category: "Fertilizer", pack: "50 kg", price: 98500, stock: 184, status: "In stock" },
  { name: "Urea 46% N", category: "Fertilizer", pack: "50 kg", price: 102000, stock: 76, status: "Low stock" },
  { name: "DK 8031 Maize Seed", category: "Seed", pack: "10 kg", price: 68500, stock: 142, status: "In stock" },
  { name: "Groundnut CG7 Seed", category: "Seed", pack: "20 kg", price: 74000, stock: 61, status: "Low stock" },
  { name: "Glyphosate 480 SL", category: "Agrochemical", pack: "5 L", price: 42500, stock: 95, status: "In stock" },
  { name: "Knapsack Sprayer", category: "Equipment", pack: "16 L", price: 89500, stock: 27, status: "Reorder" },
];

const screenTitles: Record<ScreenId, { title: string; description: string }> = {
  public: { title: "Public branded website", description: "Customer-facing product discovery, trust information and enquiry capture." },
  dashboard: { title: "Executive dashboard", description: "Current sales, stock, customer and tender position." },
  catalogue: { title: "Product catalogue", description: "Search available farm inputs and current indicative prices." },
  product: { title: "Product detail", description: "Commercial and stock information for a selected product." },
  enquiries: { title: "Enquiry inbox", description: "Capture and progress customer demand into quotations." },
  quote: { title: "Quotation builder", description: "Prepare a priced quotation from a confirmed enquiry." },
  order: { title: "Order confirmation", description: "Confirm allocation, collection and payment conditions." },
  inventory: { title: "Inventory overview", description: "Monitor stock by item, location and replenishment status." },
  goods: { title: "Goods received", description: "Record a supplier delivery and update available stock." },
  reconciliation: { title: "Stock reconciliation", description: "Compare system balance with the physical count." },
  customers: { title: "Customers & CRM", description: "Review customer value, activity and next action." },
  customer: { title: "Customer profile", description: "Account history, contacts, orders and open actions." },
  procurement: { title: "MANePS procurement pipeline", description: "Track public procurement opportunities and submissions." },
  compliance: { title: "Compliance register", description: "Control document validity and bid readiness." },
  delivery: { title: "Project delivery & readiness", description: "Three-worker execution plan, approval gates and readiness evidence." },
  contracts: { title: "Contracts & assigned work", description: "Track agreements, obligations, owners, deadlines, tasks and evidence." },
  finance: { title: "Finance & bank reconciliation", description: "Connect physical cash, receipts, deposits, bank evidence and management totals." },
  "content-admin": { title: "Website content administration", description: "Draft, approve, publish, correct and archive public pages, stories and product notices." },
  "worker-portal": { title: "Worker & seller portal", description: "Daily sales, receipts, till close, assigned work, evidence and Excel-compatible exports." },
  "customer-portal": { title: "Customer self-service portal", description: "Enquiries, quotations, orders, receipts, statements, support and consent controls." },
  "service-management": { title: "Customer service & sales management", description: "Assignment, response-time control, quotation approvals, reservations, CRM and conversion." },
  "system-admin": { title: "System administration & security", description: "Role controls, sessions, audit evidence, privacy operations, resilience and release health." },
  "agent-portal": { title: "Agent & dealer expansion", description: "Future-capability onboarding, territory, ordering, readiness, performance and approval." },
  "public-info": { title: "Public information centre", description: "Business concept, buying procedure, farming stories, contact, privacy and terms." },
  journeys: { title: "Connected demonstration journeys", description: "Auditable hand-offs across customer, sales, inventory, finance, content and administration." },
  report: { title: "Management report", description: "Consolidated commercial and operating indicators." },
  "mobile-enquiry": { title: "Mobile customer enquiry", description: "Customer-facing request flow for phone or WhatsApp follow-up." },
  "mobile-quote": { title: "Mobile quote & order", description: "Customer review and acceptance of a prepared quote." },
};

const money = (value: number) => `MWK ${value.toLocaleString("en-MW")}`;

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "danger" | "blue" }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Metric({ label, value, note, tone = "navy" }: { label: string; value: string; note: string; tone?: "navy" | "green" | "gold" | "red" }) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function FlowSteps({ current }: { current: number }) {
  const steps = ["Enquiry", "Quotation", "Order"];
  return (
    <div className="flow-steps" aria-label="Sales process">
      {steps.map((step, index) => (
        <div className={`flow-step ${index <= current ? "flow-active" : ""}`} key={step}>
          <span>{index + 1}</span>
          <b>{step}</b>
        </div>
      ))}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <Table>
        <TableHeader>
          <TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<ScreenId>("dashboard");
  const [role, setRole] = useState<DemoRole>("administrator");
  const [publicPage, setPublicPage] = useState<PublicPage>("about");
  const [mobileNav, setMobileNav] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [goodsPosted, setGoodsPosted] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [complianceReady, setComplianceReady] = useState(false);
  const [readinessEvidence, setReadinessEvidence] = useState(false);
  const [bankReconciled, setBankReconciled] = useState(false);
  const [contentPublished, setContentPublished] = useState(false);
  const [cookiePreference, setCookiePreference] = useState<"essential" | "all" | null>(null);
  const [shiftStage, setShiftStage] = useState<ShiftStage>("open");
  const [taskApproved, setTaskApproved] = useState(false);
  const [privacyRequest, setPrivacyRequest] = useState(false);
  const [supportRequest, setSupportRequest] = useState(false);
  const [agentStage, setAgentStage] = useState<"draft" | "review" | "approved">("draft");
  const [notice, setNotice] = useState("Demo state is stored only for this browser session.");

  useEffect(() => {
    const hash = window.location.hash.slice(1) as ScreenId;
    if (allScreens.includes(hash)) setActive(hash);
    const storedRole = window.sessionStorage.getItem("fatima-demo-role") as DemoRole | null;
    if (storedRole && demoRoles.some((item) => item.id === storedRole)) setRole(storedRole);
    const handleHash = () => {
      const next = window.location.hash.slice(1) as ScreenId;
      if (allScreens.includes(next)) setActive(next);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem("fatima-demo-role", role);
  }, [role]);

  const downloadDemoFile = (filename: string, content: string, type = "text/csv") => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice(`${filename} generated from synthetic demonstration data.`);
  };

  const exportDailySales = () => {
    const csv = "Receipt,Time,Customer,Method,Amount,Status\nRCPT-DEMO-0184,08:41,Walk-in,Cash,98500,Posted\nRCPT-DEMO-0185,09:16,Customer DEMO-C02,Transfer,179000,Verified\nRCPT-DEMO-0186,10:05,Customer DEMO-C01,Cash,197000,Posted\n";
    downloadDemoFile("fatima-daily-sales-demo.csv", csv);
  };

  const go = (screen: ScreenId) => {
    setActive(screen);
    setMobileNav(false);
    window.history.replaceState(null, "", `#${screen}`);
    window.scrollTo({ top: 0 });
  };

  const openPublicPage = (page: PublicPage) => {
    setPublicPage(page);
    go("public-info");
  };

  const changeRole = (nextRole: DemoRole) => {
    setRole(nextRole);
    const landing: Partial<Record<DemoRole, ScreenId>> = { customer: "customer-portal", seller: "worker-portal", storekeeper: "inventory", editor: "content-admin", finance: "finance", agent: "agent-portal" };
    go(landing[nextRole] ?? "dashboard");
    setNotice(`Role switched to ${demoRoles.find((item) => item.id === nextRole)?.label}. No real authentication occurred.`);
  };

  const resetDemo = () => {
    window.sessionStorage.removeItem("fatima-demo-role");
    setRole("administrator");
    setQuantity(20);
    setGoodsPosted(false);
    setEnquirySent(false);
    setQuoteAccepted(false);
    setComplianceReady(false);
    setReadinessEvidence(false);
    setBankReconciled(false);
    setContentPublished(false);
    setCookiePreference(null);
    setShiftStage("open");
    setTaskApproved(false);
    setPrivacyRequest(false);
    setSupportRequest(false);
    setAgentStage("draft");
    setNotice("Temporary demonstration state reset safely.");
    go("dashboard");
  };

  const canAccess = roleScreens[role].includes(active);

  const title = screenTitles[active];
  const filteredProducts = useMemo(
    () => products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(catalogueSearch.toLowerCase())),
    [catalogueSearch],
  );

  const renderPublic = () => (
    <div className="public-site">
      <header className="public-nav">
        <div className="public-brand"><span>FA</span><div><b>Fatima Agro Dealers</b><small>and General Suppliers</small></div></div>
        <nav aria-label="Public website"><button onClick={() => go("catalogue")}>Products</button><button onClick={() => openPublicPage("how")}>How to buy</button><button onClick={() => openPublicPage("about")}>About</button><button onClick={() => openPublicPage("contact")}>Contact</button></nav>
        <Button onClick={() => go("mobile-enquiry")}>Request a quotation</Button>
      </header>
      <section className="public-hero">
        <div>
          <span className="eyebrow">FARM INPUTS · KANENGO, LILONGWE</span>
          <h2>Farm inputs, pricing support and reliable order coordination.</h2>
          <p>Explore fertilizer, seed, agricultural chemicals and equipment, then send an enquiry for confirmed availability and a formal quotation.</p>
          <div className="public-actions"><Button onClick={() => go("catalogue")}>View product catalogue</Button><Button variant="outline" onClick={() => go("mobile-enquiry")}>Send an enquiry</Button></div>
        </div>
        <div className="availability-card">
          <span>HOW THE PLATFORM WORKS</span>
          <ol><li><b>1</b><div><strong>Search products</strong><small>Review input categories and indicative pricing.</small></div></li><li><b>2</b><div><strong>Submit requirements</strong><small>Enter product, quantity and contact details.</small></div></li><li><b>3</b><div><strong>Receive confirmation</strong><small>Staff verify stock, price and collection terms.</small></div></li></ol>
        </div>
      </section>
      <section className="public-section">
        <div className="public-section-head"><div><span>PRODUCT CATEGORIES</span><h3>Core farm input range</h3></div><button onClick={() => go("catalogue")}>Browse all products <ChevronRight /></button></div>
        <div className="public-category-grid">
          <button onClick={() => go("catalogue")}><div>FERT</div><b>Fertilizer</b><span>Basal and top-dressing options.</span></button>
          <button onClick={() => go("catalogue")}><div>SEED</div><b>Certified seed</b><span>Maize and selected field crops.</span></button>
          <button onClick={() => go("catalogue")}><div>CHEM</div><b>Agricultural chemicals</b><span>Crop protection and weed control.</span></button>
          <button onClick={() => go("catalogue")}><div>TOOLS</div><b>Farm equipment</b><span>Sprayers and operating essentials.</span></button>
        </div>
      </section>
      <section className="public-trust">
        <div><span>DEALER LOCATION</span><h3>Kanengo, Lilongwe</h3><p>The proposed platform supports location details, operating hours, map directions and direct enquiry routing.</p></div>
        <div><span>TRANSPARENT PROCESS</span><h3>Enquiry before commitment</h3><p>Customers receive confirmed availability, pricing and collection conditions before an order is accepted.</p></div>
        <div><span>BUSINESS CONTROL</span><h3>Connected operations</h3><p>Public enquiries flow into the internal quotation, order, stock and customer-management system.</p></div>
      </section>
      <section className="public-cta"><div><span>START AN ENQUIRY</span><h3>Tell us what inputs you need.</h3><p>This demonstration uses synthetic data and does not create a binding order.</p></div><Button onClick={() => go("mobile-enquiry")}>Open enquiry form <ChevronRight /></Button></section>
      <footer className="public-footer"><div className="public-brand"><span>FA</span><div><b>Fatima Agro Dealers</b><small>and General Suppliers</small></div></div><div className="footer-links"><button onClick={() => openPublicPage("stories")}>Farming stories</button><button onClick={() => openPublicPage("privacy")}>Privacy</button><button onClick={() => openPublicPage("terms")}>Terms</button></div><p>Interactive Prototype — Not Production Software</p></footer>
      {!cookiePreference && <div className="cookie-banner" role="region" aria-label="Cookie preferences"><div><b>Privacy choices</b><span>This demo uses session storage for role and workflow state. No advertising cookies are required.</span></div><Button size="sm" variant="outline" onClick={() => setCookiePreference("essential")}>Essential only</Button><Button size="sm" onClick={() => setCookiePreference("all")}>Allow optional</Button></div>}
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="metrics-grid">
        <Metric label="Synthetic revenue" value="MWK 18.6m" note="Demonstration period only" tone="green" />
        <Metric label="Open quotations" value="14" note="MWK 9.2m potential" />
        <Metric label="Low-stock items" value="6" note="2 require action" tone="red" />
        <Metric label="Tracked opportunities" value="4" note="All references synthetic" tone="gold" />
      </div>
      <Panel title="Management control position"><div className="control-grid">{[["Sales conversion", "64%", "9 of 14 quotes"],["Enquiry response", "6.4h", "within proposed 8h target"],["Stock accuracy", "98.4%", "pilot target ≥ 98%"],["Stock variances", "1", "assigned for review"],["Cash closes", shiftStage === "approved" || shiftStage === "deposited" || shiftStage === "reconciled" ? "100%" : "67%", "signed synthetic shifts"],["Reconciliation", bankReconciled ? "0" : "2", "open exceptions"],["Contracts", "4", "controlled records"],["Obligations", "1 overdue", "escalated"],["Worker assignments", "45", "across 3 delivery roles"],["Procurement readiness", complianceReady ? "100%" : "80%", "synthetic evidence"],["Customer activity", "6", "open enquiries"],["Content approval", contentPublished ? "0" : "1", "awaiting publication"],["Training", "100%", "nominated demo users"],["Operational risks", "3", "owners assigned"]].map(([label,value,note]) => <article key={label}><span>{label}</span><b>{value}</b><small>{note}</small></article>)}</div></Panel>
      <div className="two-col wide-left">
        <Panel title="Sales and order position" action={<Button size="sm" variant="outline" onClick={() => go("report")}>Open report</Button>}>
          <div className="bars">
            {[64, 78, 55, 84, 72, 92].map((height, index) => (
              <div className="bar-column" key={index}>
                <div className="bar-track"><div className="bar-fill" style={{ height: `${height}%` }} /></div>
                <span>{["Mar", "Apr", "May", "Jun", "Jul", "Aug"][index]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Priority actions">
          <div className="task-list">
            <button onClick={() => go("enquiries")}><AlertTriangle /><span><b>5 enquiries need quotations</b><small>Oldest waiting 18 hours</small></span><ChevronRight /></button>
            <button onClick={() => go("inventory")}><Boxes /><span><b>2 items below reorder level</b><small>Urea and sprayers</small></span><ChevronRight /></button>
            <button onClick={() => go("procurement")}><CalendarDays /><span><b>MANePS tender closes soon</b><small>Submission due 04 Sep</small></span><ChevronRight /></button>
          </div>
        </Panel>
      </div>
      <Panel title="Core demo journeys">
        <div className="journey-grid">
          <button onClick={() => go("enquiries")}><Mail /><b>Enquiry to order</b><span>Capture demand, price it and confirm allocation.</span></button>
          <button onClick={() => go("goods")}><Truck /><b>Receipt to reconciliation</b><span>Post a delivery and verify stock movement.</span></button>
          <button onClick={() => go("procurement")}><ClipboardList /><b>Tender to submission</b><span>Track opportunity, compliance and deadline.</span></button>
        </div>
      </Panel>
    </>
  );

  const renderCatalogue = () => (
    <>
      <Panel>
        <div className="toolbar">
          <div className="search-box"><Search /><Input value={catalogueSearch} onChange={(event) => setCatalogueSearch(event.target.value)} placeholder="Search product or category" /></div>
          <Button onClick={() => setNotice("A synthetic product draft was opened; no catalogue record was saved.")}><Plus /> Add product</Button>
        </div>
      </Panel>
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <button className="product-card" key={product.name} onClick={() => go("product")}>
            <div className="product-code">{product.category === "Fertilizer" ? "FERT" : product.category === "Seed" ? "SEED" : "INPUT"}</div>
            <div className="product-card-body">
              <Status tone={product.status === "In stock" ? "good" : product.status === "Low stock" ? "warn" : "danger"}>Demo {product.status.toLowerCase()}</Status>
              <h3>{product.name}</h3>
              <p>{product.category} · {product.pack}</p>
              <div><strong>Indicative {money(product.price)}</strong><span>{product.stock} synthetic units</span></div>
            </div>
          </button>
        ))}
      </div>
      {filteredProducts.length === 0 && <div className="empty-state"><Search /><h2>No demonstration products found</h2><p>Try fertilizer, seed, agrochemical or equipment.</p><Button variant="outline" onClick={() => setCatalogueSearch("")}>Clear search</Button></div>}
    </>
  );

  const renderProduct = () => (
    <>
      <Button variant="ghost" onClick={() => go("catalogue")}><ArrowLeft /> Back to catalogue</Button>
      <div className="two-col product-layout">
        <div className="product-summary">
          <span>Fertilizer · FERT-001</span>
          <Sprout />
          <h2>NPK 23:21:0+4S</h2>
          <p>50 kg bag · indicative dealer price</p>
        </div>
        <Panel title="Commercial information">
          <dl className="details-list">
            <div><dt>Selling price</dt><dd>MWK 98,500 / bag</dd></div>
            <div><dt>Available stock</dt><dd>184 bags</dd></div>
            <div><dt>Reorder level</dt><dd>60 bags</dd></div>
            <div><dt>Warehouse</dt><dd>Kanengo main store</dd></div>
          </dl>
          <Button className="full-button" onClick={() => go("quote")}>Add to quotation <ChevronRight /></Button>
        </Panel>
      </div>
      <Panel title="Handling and sales notes">
        <DataTable headers={["Area", "Information"]} rows={[
          ["Typical use", "Basal application for maize and other field crops"],
          ["Storage", "Keep dry, covered and off the warehouse floor"],
          ["Pricing note", "Indicative demo price; final quote subject to availability"],
        ]} />
      </Panel>
    </>
  );

  const renderEnquiries = () => (
    <>
      <FlowSteps current={0} />
      <Panel title="Incoming enquiries" action={<Button size="sm" onClick={() => go("mobile-enquiry")}><Plus /> New enquiry</Button>}>
        <DataTable headers={["Reference", "Customer", "Request", "Received", "Status", "Action"]} rows={[
          ["ENQ-DEMO-1048", "Customer DEMO-C01", "20 × NPK, 10 × Urea", "Today, 08:40", <Status key="status" tone="warn">Needs quote</Status>, <Button key="action" size="sm" onClick={() => go("quote")}>Prepare quote</Button>],
          ["ENQ-DEMO-1047", "Customer DEMO-C02", "40 × Maize seed", "Yesterday", <Status key="status" tone="blue">Pricing</Status>, <Button key="action" size="sm" variant="outline" onClick={() => go("quote")}>Open</Button>],
          ["ENQ-DEMO-1046", "Customer DEMO-C03", "2 × Knapsack sprayer", "Yesterday", <Status key="status" tone="good">Quoted</Status>, <Button key="action" size="sm" variant="outline" onClick={() => go("order")}>View</Button>],
          ["ENQ-DEMO-1045", "Customer DEMO-C04", "5 × Glyphosate", "27 Aug", <Status key="status">Closed</Status>, <Button key="action" size="sm" variant="ghost" onClick={() => setNotice("Closed synthetic enquiry ENQ-DEMO-1045 selected.")}>Details</Button>],
        ]} />
      </Panel>
    </>
  );

  const renderQuote = () => {
    const subtotal = quantity * 98500;
    const transport = 75000;
    return (
      <>
        <FlowSteps current={1} />
        <div className="two-col wide-left">
          <Panel title="Quotation Q-2026-081">
            <div className="form-grid">
              <label>Customer<Input value="Customer DEMO-C01" readOnly /></label>
              <label>Valid until<Input value="05 September 2026" readOnly /></label>
              <label className="span-2">Delivery / collection<Input value="Customer collection — Kanengo" readOnly /></label>
            </div>
            <div className="quote-line">
              <div><b>NPK 23:21:0+4S</b><span>50 kg bag · MWK 98,500 each</span></div>
              <label>Quantity<Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /></label>
              <strong>{money(subtotal)}</strong>
            </div>
            <Button variant="outline" onClick={() => setNotice("A blank synthetic quotation line was added for demonstration.")}><Plus /> Add another item</Button>
          </Panel>
          <Panel title="Quote summary">
            <dl className="totals">
              <div><dt>Items</dt><dd>{money(subtotal)}</dd></div>
              <div><dt>Transport</dt><dd>{money(transport)}</dd></div>
              <div><dt>Tax treatment</dt><dd>As applicable</dd></div>
              <div className="total-line"><dt>Total</dt><dd>{money(subtotal + transport)}</dd></div>
            </dl>
            <Button className="full-button" onClick={() => go("order")}><Send /> Issue quotation</Button>
            <p className="form-note">Demo only. Price and availability require staff confirmation.</p>
          </Panel>
        </div>
      </>
    );
  };

  const renderOrder = () => (
    <>
      <FlowSteps current={2} />
      <div className="confirmation">
        <CheckCircle2 />
        <div><span>ORDER CONFIRMED · SYNTHETIC</span><h2>Order SO-DEMO-0034</h2><p>Created from quotation Q-DEMO-0081 for Customer DEMO-C01.</p></div>
        <Button variant="outline" onClick={() => downloadDemoFile("order-summary-demo.txt", "SYNTHETIC ORDER SUMMARY\nORDER-DEMO-1051\nNot binding\n", "text/plain")}><Download /> Download summary</Button>
      </div>
      <div className="two-col">
        <Panel title="Order allocation">
          <DataTable headers={["Item", "Qty", "Unit price", "Allocated"]} rows={[
            ["NPK 23:21:0+4S · 50 kg", String(quantity), "MWK 98,500", <Status key="allocated" tone="good">Yes</Status>],
          ]} />
        </Panel>
        <Panel title="Collection and payment">
          <dl className="details-list">
            <div><dt>Collection</dt><dd>31 Aug, Kanengo</dd></div>
            <div><dt>Contact</dt><dd>Collection contact DEMO-P02 · details withheld</dd></div>
            <div><dt>Payment</dt><dd>Bank transfer before release</dd></div>
            <div><dt>Amount</dt><dd>{money(quantity * 98500 + 75000)}</dd></div>
          </dl>
        </Panel>
      </div>
    </>
  );

  const renderInventory = () => (
    <>
      <div className="metrics-grid compact">
        <Metric label="Stock value" value="MWK 42.8m" note="Kanengo warehouse" />
        <Metric label="Available units" value="585" note="Across 6 demo items" tone="green" />
        <Metric label="Below reorder" value="2" note="Action required" tone="red" />
        <Metric label="Pending receipt" value="180" note="Due 30 Aug" tone="gold" />
      </div>
      <Panel title="Stock position" action={<Button size="sm" onClick={() => go("goods")}><Truck /> Record receipt</Button>}>
        <DataTable headers={["SKU", "Product", "Available", "Reserved", "Reorder level", "Status"]} rows={products.map((product, index) => [
          `SKU-${String(index + 1).padStart(3, "0")}`,
          product.name,
          `${product.stock} ${index < 4 ? "bags" : "units"}`,
          String([30, 12, 24, 10, 15, 5][index]),
          String([60, 80, 50, 70, 30, 35][index]),
          <Status key={`stock-${product.name}`} tone={product.stock < [60, 80, 50, 70, 30, 35][index] ? "danger" : "good"}>{product.stock < [60, 80, 50, 70, 30, 35][index] ? "Reorder" : "Healthy"}</Status>,
        ])} />
      </Panel>
      <Panel title="Location, movement & control register"><DataTable headers={["Reference", "Control type", "From / location", "To / purpose", "State"]} rows={[["OPEN-DEMO-001", "Opening balance", "Kanengo main store", "6 product records", <Status key="i1" tone="good">Loaded</Status>],["TRF-DEMO-014", "Stock transfer", "Main store", "Sales point A", <Status key="i2" tone="blue">In transit</Status>],["RES-DEMO-022", "Reservation", "Sales point A", "Order SO-DEMO-020", <Status key="i3" tone="warn">Held</Status>],["ADJ-DEMO-005", "Adjustment request", "Main store", "Damage review", <Status key="i4" tone="danger">Needs approval</Status>],["COUNT-DEMO-044", "Physical count", "Main store", "Reconciliation", <Status key="i5" tone="good">98.4% accuracy</Status>]]} /></Panel>
    </>
  );

  const renderGoods = () => (
    <>
      <div className="process-strip"><span className="done">1. Delivery details</span><span className="done">2. Check quantities</span><span className={goodsPosted ? "done" : "current"}>3. Post receipt</span></div>
      <div className="two-col wide-left">
        <Panel title="Goods received note GRN-DEMO-118">
          <div className="form-grid">
            <label>Supplier<Input value="Supplier DEMO-S01" readOnly /></label>
            <label>Delivery note<Input value="DN-DEMO-9041" readOnly /></label>
            <label>Received date<Input value="10 September 2026" readOnly /></label>
            <label>Warehouse<Input value="Kanengo main store" readOnly /></label>
          </div>
          <DataTable headers={["Item", "Ordered", "Received", "Variance"]} rows={[
            ["Urea 46% N · 50 kg", "120", "120", <Status key="urea-variance" tone="good">0</Status>],
            ["Knapsack Sprayer · 16 L", "60", "60", <Status key="sprayer-variance" tone="good">0</Status>],
          ]} />
        </Panel>
        <Panel title="Receipt control">
          {goodsPosted ? (
            <div className="success-block"><CheckCircle2 /><h3>Receipt posted</h3><p>180 units added to available stock.</p></div>
          ) : (
            <div className="control-copy"><ClipboardCheck /><h3>Checks complete</h3><p>Quantities match the supplier delivery note.</p></div>
          )}
          <Button className="full-button" disabled={goodsPosted} onClick={() => setGoodsPosted(true)}>{goodsPosted ? "Posted" : "Post goods receipt"}</Button>
          <Button className="full-button" variant="outline" onClick={() => go("reconciliation")}>Open reconciliation</Button>
        </Panel>
      </div>
    </>
  );

  const renderReconciliation = () => (
    <>
      <Panel title="Reconciliation RECON-DEMO-044" action={<Status tone={goodsPosted ? "good" : "warn"}>{goodsPosted ? "Receipt included" : "Draft count"}</Status>}>
        <DataTable headers={["Product", "Opening", "Receipts", "Allocated / sold", "Expected", "Physical", "Variance"]} rows={[
          ["NPK 23:21:0+4S", "214", "0", "30", "184", "184", <Status key="npk-variance" tone="good">0</Status>],
          ["Urea 46% N", "88", goodsPosted ? "120" : "0", "12", goodsPosted ? "196" : "76", goodsPosted ? "196" : "76", <Status key="urea-variance" tone="good">0</Status>],
          ["Knapsack Sprayer", "32", goodsPosted ? "60" : "0", "5", goodsPosted ? "87" : "27", goodsPosted ? "86" : "26", <Status key="sprayer-variance" tone="danger">-1</Status>],
        ]} />
      </Panel>
      <div className="two-col">
        <Panel title="Variance note"><p className="body-copy">One sprayer requires investigation for possible damage or an unposted dispatch. Assign a stock-control owner before approval.</p><Input placeholder="Enter investigation note" /></Panel>
        <Panel title="Approval"><dl className="details-list"><div><dt>Counted by</dt><dd>Store team</dd></div><div><dt>Reviewed by</dt><dd>Operations manager</dd></div><div><dt>Status</dt><dd>Pending variance note</dd></div></dl><Button className="full-button" onClick={() => setNotice("RECON-DEMO-044 submitted to an independent supervisor for approval.")}>Submit for approval</Button></Panel>
      </div>
    </>
  );

  const renderCustomers = () => (
    <Panel title="Customer accounts" action={<Button size="sm" onClick={() => setNotice("Synthetic customer-draft form opened; no personal data was saved.")}><Plus /> Add customer</Button>}>
      <DataTable headers={["Customer", "Type", "Location", "Last activity", "YTD value", "Next action"]} rows={[
        [<button key="customer" className="table-link" onClick={() => go("customer")}>Customer DEMO-C01</button>, "Farmers club", "Demo district A", "Quote issued today", "MWK 7.4m", <Status key="status" tone="blue">Follow up</Status>],
        ["Customer DEMO-C02", "Cooperative", "Demo district B", "Enquiry yesterday", "MWK 12.8m", <Status key="status" tone="warn">Prepare quote</Status>],
        ["Customer DEMO-C03", "Retail farmer", "Demo district C", "Order confirmed", "MWK 1.2m", <Status key="status" tone="good">Active</Status>],
        ["Customer DEMO-C04", "Commercial farm", "Demo district D", "Order 19 Aug", "MWK 28.6m", <Status key="status">Quarterly review</Status>],
      ]} />
    </Panel>
  );

  const renderCustomer = () => (
    <>
      <Button variant="ghost" onClick={() => go("customers")}><ArrowLeft /> Back to customers</Button>
      <div className="account-head">
        <div className="account-icon"><Building2 /></div>
        <div><span>CUSTOMER ACCOUNT · SYNTHETIC</span><h2>Customer DEMO-C01</h2><p>Demo district A · Farmers club · synthetic history</p></div>
        <Button onClick={() => go("quote")}>Create quotation</Button>
      </div>
      <div className="three-col">
        <Panel title="Verified contact state"><div className="contact-list"><p><UserRound /> Contact DEMO-P01</p><p><Phone /> Phone withheld</p><p><Mail /> Demonstration email withheld</p><p><MapPin /> Demo district A</p></div></Panel>
        <Panel title="Account summary"><dl className="details-list"><div><dt>YTD sales</dt><dd>MWK 7.4m</dd></div><div><dt>Open quotes</dt><dd>1</dd></div><div><dt>Payment terms</dt><dd>Prepayment</dd></div></dl></Panel>
        <Panel title="Next action"><Status tone="warn">Follow up today</Status><p className="body-copy">Confirm acceptance of quotation Q-DEMO-081 and planned collection date.</p><Button className="full-button" onClick={() => setNotice("Synthetic follow-up note EVID-DEMO-052 logged.")}>Log follow-up</Button></Panel>
      </div>
      <Panel title="Recent activity"><DataTable headers={["Date", "Activity", "Reference", "Value"]} rows={[["29 Aug", "Quotation issued", "Q-2026-081", money(quantity * 98500 + 75000)], ["16 Jul", "Order completed", "SO-2026-019", "MWK 3,940,000"], ["03 Mar", "Order completed", "SO-2026-004", "MWK 1,860,000"]]} /></Panel>
    </>
  );

  const renderProcurement = () => (
    <>
      <div className="metrics-grid compact">
        <Metric label="Identified" value="7" note="Potential opportunities" />
        <Metric label="In preparation" value="2" note="Documents being assembled" tone="gold" />
        <Metric label="Submitted" value="3" note="Awaiting outcome" tone="green" />
        <Metric label="Due in 7 days" value="1" note="Priority deadline" tone="red" />
      </div>
      <Panel title="Opportunity pipeline" action={<Button size="sm" onClick={() => setNotice("Synthetic procurement-opportunity draft opened.")}><Plus /> Add opportunity</Button>}>
        <DataTable headers={["Reference", "Procuring entity", "Requirement", "Closing date", "Value band", "Stage", "Action"]} rows={[
          ["MANEPS-DEMO-0817", "District Council — Demo", "Fertilizer supply", "04 Sep 2026", "Synthetic value band A", <Status key="status" tone="warn">Preparing</Status>, <Button key="action" size="sm" onClick={() => go("compliance")}>Readiness</Button>],
          ["MANEPS-DEMO-0791", "Public Agency — Demo", "Certified maize seed", "12 Sep 2026", "MWK 20m–50m", <Status key="status" tone="blue">Review</Status>, <Button key="action" size="sm" variant="outline" onClick={() => setNotice("Synthetic opportunity MANEPS-DEMO-0791 selected.")}>Open</Button>],
          ["MANEPS-DEMO-0714", "Training Institute — Demo", "Farm input framework", "Closed", "MWK 100m+", <Status key="status" tone="good">Submitted</Status>, <Button key="action" size="sm" variant="outline" onClick={() => setNotice("Synthetic submission history opened.")}>Track</Button>],
        ]} />
      </Panel>
      <div className="two-col"><Panel title="Suppliers, requests & purchase orders"><DataTable headers={["Reference", "Record", "Supplier", "Owner", "State"]} rows={[["SUP-DEMO-S01", "Supplier record", "Supplier DEMO-S01", "Procurement", <Status key="p1" tone="good">Demo ready</Status>],["PR-DEMO-027", "Purchase request", "Competitive sourcing", "Storekeeper", <Status key="p2" tone="warn">Approval</Status>],["PO-DEMO-014", "Purchase order", "Supplier DEMO-S01", "Manager", <Status key="p3" tone="blue">Issued in demo</Status>],["DEL-DEMO-118", "Delivery evidence", "DN-DEMO-9041", "Storekeeper", <Status key="p4" tone="good">Received</Status>]]} /></Panel><Panel title="Procurement readiness"><ul className="plain-control-list"><li>Need and budget owner recorded</li><li>Supplier and conflict checks demonstrated</li><li>Purchase request separated from approval</li><li>Purchase order linked to goods received</li><li>Opportunity and compliance registers use DEMO references</li></ul><Button className="full-button" variant="outline" onClick={() => go("compliance")}>Open compliance register</Button></Panel></div>
      <p className="source-note">MANePS references and procuring entities shown here are synthetic demo data.</p>
    </>
  );

  const renderCompliance = () => {
    const items = [
      ["Business registration example", "Synthetic ready", "No company claim"],
      ["Tax clearance example", "Synthetic ready", "No tax claim"],
      ["Supplier registration example", "Synthetic ready", "No registration claim"],
      ["Product-permit readiness", "Review", "Production verification required"],
      ["Bid security example", complianceReady ? "Synthetic ready" : "Missing", "Required for demo submission"],
    ];
    return (
      <>
        <div className="readiness">
          <div><span>Bid readiness</span><strong>{complianceReady ? "100%" : "80%"}</strong></div>
          <div className="progress-track"><div style={{ width: complianceReady ? "100%" : "80%" }} /></div>
          <Button onClick={() => setComplianceReady(true)} disabled={complianceReady}>{complianceReady ? "Ready for review" : "Mark bid security received"}</Button>
        </div>
        <Panel title="Compliance documents">
          <DataTable headers={["Document", "Status", "Expiry / note", "Control"]} rows={items.map((item) => [
            item[0],
            <Status key={`status-${item[0]}`} tone={item[1] === "Synthetic ready" ? "good" : item[1] === "Review" ? "warn" : "danger"}>{item[1]}</Status>,
            item[2],
            <Button key={`action-${item[0]}`} size="sm" variant="outline" onClick={() => setNotice(`${item[0]} opened as synthetic readiness evidence.`)}>View record</Button>,
          ])} />
        </Panel>
        <div className="two-col">
          <Panel title="Opportunity controls"><dl className="details-list"><div><dt>Opportunity</dt><dd>MANEPS-DEMO-0817</dd></div><div><dt>Closing</dt><dd>04 Sep 2026, 10:00</dd></div><div><dt>Owner</dt><dd>Commercial team</dd></div></dl></Panel>
          <Panel title="Submission checklist"><ul className="check-list"><li><CheckCircle2 /> Technical response complete</li><li><CheckCircle2 /> Pricing reviewed</li><li className={complianceReady ? "" : "pending"}>{complianceReady ? <CheckCircle2 /> : <AlertTriangle />} Bid security attached</li></ul></Panel>
        </div>
      </>
    );
  };

  const renderDelivery = () => (
    <>
      <div className="start-banner">
        <div><span>PLANNED COMMENCEMENT</span><strong>Thursday, 10 September 2026</strong><small>Work starts after countersignature and cleared payment.</small></div>
        <Status tone={readinessEvidence ? "good" : "warn"}>{readinessEvidence ? "Evidence gate prepared" : "Conditional start"}</Status>
      </div>
      <div className="three-col worker-grid">
        {[
          ["Worker 1", "Project Lead & Business Analyst", "Commercial control, discovery, decisions, scope, risk and acceptance."],
          ["Worker 2", "Platform Engineer & Technical Lead", "Architecture, build, data, security, deployment and integrations."],
          ["Worker 3", "UX, QA, Data & Adoption Specialist", "Brand/UX, migration, testing, training, adoption and evidence."],
        ].map(([worker, role, responsibility]) => (
          <Panel key={worker} className="worker-card">
            <span>{worker}</span><h3>{role}</h3><b>[Name to be confirmed]</b><p>{responsibility}</p>
          </Panel>
        ))}
      </div>
      <Panel title="Illustrative delivery paths">
        <DataTable headers={["Path", "Commercial position", "Execution", "Decision value"]} rows={[
          ["1 · Readiness Sprint", "Withheld from public evidence build", "7-business-day illustration", "Verified baseline, demo, architecture and GO/NO-GO"],
          ["2 · Kanengo Pilot", "Separate authorized proposal required", "90-day illustration", "Operating proof across sales, stock, CRM, tasks, contracts and finance"],
          ["3 · Pilot + Managed Operations", "Separate authorized proposal required", "Pilot, then illustrative managed service", "Sustained controls, reporting, support and improvement"],
        ]} />
        <p className="source-note">No price, payment term, negotiated option or client commitment is published in this public repository.</p>
      </Panel>
      <div className="two-col wide-left">
        <Panel title="Delivery controls">
          <div className="delivery-stats"><div><strong>45</strong><span>assigned tasks</span></div><div><strong>12</strong><span>delivery phases</span></div><div><strong>11</strong><span>approval gates</span></div><div><strong>151</strong><span>readiness questions</span></div></div>
          <div className="phase-list">
            {["Mobilization & readiness", "Architecture & public platform", "Sales, stock, contracts & finance", "QA, training, 90-day pilot & closeout"].map((phase, index) => <div key={phase}><span>{index + 1}</span><b>{phase}</b><Status tone={index === 0 ? "warn" : "neutral"}>{index === 0 ? "Pending authority" : "Gated"}</Status></div>)}
          </div>
        </Panel>
        <Panel title="Readiness evidence">
          <div className="readiness-score"><span>Illustrative score</span><strong>{readinessEvidence ? "82%" : "68%"}</strong><div><i style={{ width: readinessEvidence ? "82%" : "68%" }} /></div></div>
          <ul className="plain-control-list"><li>Verified signatory authority</li><li>Named process and data owners</li><li>Approved product and opening-stock evidence</li><li>Business-owned collection account</li><li>UAT and production approvers</li></ul>
          <Button className="full-button" onClick={() => setReadinessEvidence(true)} disabled={readinessEvidence}>{readinessEvidence ? "Evidence recorded for demo" : "Simulate evidence completion"}</Button>
          <p className="form-note">A numerical score never overrides a NO-GO blocker.</p>
        </Panel>
      </div>
    </>
  );

  const renderContracts = () => (
    <>
      <div className="metrics-grid compact">
        <Metric label="Unsigned drafts" value="3" note="Authorization required" tone="gold" />
        <Metric label="Open obligations" value="12" note="Synthetic demo records" />
        <Metric label="Due in 7 days" value="4" note="Owner action required" tone="red" />
        <Metric label="Accepted evidence" value="0" note="No client signatures recorded" tone="green" />
      </div>
      <Panel title="Agreement and contract register" action={<Button size="sm" onClick={() => setNotice("Synthetic contract-register draft opened; no legal document was created.")}><Plus /> New record</Button>}>
        <DataTable headers={["Record", "Effective / review date", "Owner", "Status", "Next control"]} rows={[
          ["Illustrative master services record", "Proposed date · synthetic", "Worker 1", <Status key="status" tone="warn">Draft — unsigned</Status>, "Verify parties and counsel review outside this repo"],
          ["Illustrative pilot work record", "Proposed start · synthetic", "Worker 1", <Status key="status" tone="warn">Path not authorized</Status>, "Obtain separate scope and commercial approval"],
          ["Illustrative data-protection addendum", "Before live-data migration", "Worker 2", <Status key="status" tone="danger">Incomplete</Status>, "Complete roles, retention and subprocessors"],
          ["Illustrative bank/API change record", "Only after readiness approval", "Worker 2", <Status key="status">Not authorized</Status>, "Confirm bank, API, ownership and security"],
        ]} />
      </Panel>
      <div className="two-col">
        <Panel title="Assigned contract tasks"><DataTable headers={["Task", "Owner", "Due", "Status"]} rows={[
          ["Verify contracting identities", "Worker 1", "Before signature", <Status key="status" tone="warn">Open</Status>],
          ["Complete processing schedule", "Worker 2", "Before live data", <Status key="status" tone="warn">Open</Status>],
          ["Index signature and authority evidence", "Worker 3", "At execution", <Status key="status">Not started</Status>],
          ["Record acceptance and closeout", "Worker 1", "Pilot end", <Status key="status">Gated</Status>],
        ]} /></Panel>
        <Panel title="Obligation controls"><ul className="plain-control-list"><li>Named owner and approver</li><li>Effective, renewal and termination dates</li><li>Payment and delivery obligations</li><li>Evidence and document version</li><li>Overdue escalation and exception approval</li></ul><Button variant="outline" className="full-button" onClick={() => downloadDemoFile("obligations-register-demo.csv", "Reference,Owner,Due,Evidence\nOBL-DEMO-001,Worker DEMO-01,Before signature,EVID-DEMO-001\n")}>Export obligations register</Button></Panel>
      </div>
      <div className="two-col"><Panel title="Decision, risk & issue register"><DataTable headers={["Reference", "Type", "Owner", "Due / review", "State"]} rows={[["DEC-DEMO-004", "Decision: pilot option", "Manager", "Before commitment", <Status key="d1" tone="warn">Open</Status>],["RISK-DEMO-009", "Unverified business claims", "Content owner", "Every release", <Status key="d2" tone="good">Controlled</Status>],["ISS-DEMO-003", "Bank integration not authorized", "Finance owner", "Production only", <Status key="d3" tone="blue">Deferred</Status>]]} /></Panel><Panel title="Change, approval & closeout"><DataTable headers={["Reference", "Change / record", "Approval", "Evidence"]} rows={[["CHG-DEMO-006", "Add agent expansion demo", "Manager review", "EVID-DEMO-060"],["APR-DEMO-011", "Public data boundary", "Security + owner", "G0 checklist"],["CLOSE-DEMO-001", "Prototype acceptance", "Not yet approved", "Pending release evidence"]]} /></Panel></div>
      <p className="source-note">All contract records are synthetic workflow examples. No signature, authority or executed agreement is represented.</p>
    </>
  );

  const renderFinance = () => (
    <>
      <div className="finance-boundary"><AlertTriangle /><div><b>Bank connection is not active</b><span>Start with a verified business-account statement import. API access requires bank support, client consent, secure token handling, MFA, segregation and written approval.</span></div></div>
      <div className="metrics-grid compact">
        <Metric label="Physical cash" value="Demo MWK 1.24m" note={shiftStage === "approved" ? "Daily close approved" : "Pending approved daily close"} tone={shiftStage === "approved" ? "green" : "gold"} />
        <Metric label="Recorded receipts" value="Demo MWK 1.31m" note="Numbered source evidence" />
        <Metric label="Deposit batch" value={shiftStage === "deposited" || shiftStage === "reconciled" ? "Demo MWK 1.20m" : "Pending"} note="Business account only" tone={shiftStage === "deposited" || shiftStage === "reconciled" ? "green" : "gold"} />
        <Metric label="Unreconciled" value={bankReconciled ? "Demo MWK 0" : "Demo MWK 40,000"} note={bankReconciled ? "Statement match simulated" : "Exception requires evidence"} tone={bankReconciled ? "green" : "red"} />
      </div>
      <Panel title="Cash-to-bank control chain">
        <div className="finance-chain">
          {["1 · Sale / approved expense", "2 · Numbered receipt", "3 · Daily cash count", "4 · Business-bank deposit", "5 · Statement evidence", "6 · Reconciliation & approval"].map((step, index) => <div key={step}><span>{index + 1}</span><b>{step}</b><small>{index < 4 ? "Source and owner required" : "Independent review required"}</small></div>)}
        </div>
      </Panel>
      <div className="two-col">
        <Panel title="Cashbook & expenses"><DataTable headers={["Reference", "Type", "Evidence", "Amount", "Status"]} rows={[["RCPT-DEMO-184", "Sale receipt", "Numbered receipt", "MWK 98,500", <Status key="f1" tone="good">Posted</Status>],["EXP-DEMO-011", "Approved transport", "Invoice EVID-DEMO-44", "MWK 32,000", <Status key="f2" tone="blue">Approved</Status>],["EXP-DEMO-012", "Store supplies", "Evidence required", "MWK 8,500", <Status key="f3" tone="warn">Draft</Status>]]} /></Panel>
        <Panel title="Daily close & deposit batch"><dl className="details-list"><div><dt>Close reference</dt><dd>CLOSE-DEMO-010</dd></div><div><dt>Prepared by</dt><dd>Seller DEMO-02</dd></div><div><dt>Approved by</dt><dd>{shiftStage === "approved" || shiftStage === "deposited" || shiftStage === "reconciled" ? "Supervisor DEMO-05" : "Required"}</dd></div><div><dt>Deposit batch</dt><dd>{shiftStage === "deposited" || shiftStage === "reconciled" ? "DEP-DEMO-0901" : "Not created"}</dd></div></dl><Button className="full-button" disabled={!canAdvanceShift(shiftStage, "create-deposit", role)} onClick={() => setShiftStage(advanceShift(shiftStage, "create-deposit", role))}>Create deposit batch</Button></Panel>
      </div>
      <div className="two-col wide-left">
        <Panel title="Reconciliation exceptions">
          <DataTable headers={["Reference", "System amount", "Bank / cash evidence", "Difference", "Control"]} rows={[
            ["DEP-DEMO-0901", "MWK 1,200,000", bankReconciled ? "MWK 1,200,000" : "Awaiting statement", bankReconciled ? <Status key="matched" tone="good">MWK 0</Status> : <Status key="pending" tone="warn">Pending</Status>, "Preparer + approver"],
            ["RCPT-DEMO-184", "MWK 70,000", "Cash count MWK 30,000", bankReconciled ? <Status key="resolved" tone="good">Resolved in demo</Status> : <Status key="difference" tone="danger">MWK 40,000</Status>, "Investigate before close"],
          ]} />
        </Panel>
        <Panel title="Safe integration sequence">
          <ol className="integration-steps"><li><b>Statement import</b><span>CSV/PDF evidence from verified business account.</span></li><li><b>Read-only bank feed</b><span>Only if supported and approved.</span></li><li><b>Payment initiation</b><span>Separate high-risk change with dual approval.</span></li></ol>
          <Button className="full-button" onClick={() => { setBankReconciled(true); setShiftStage(advanceShift(shiftStage, "reconcile", role)); }} disabled={bankReconciled || !canAdvanceShift(shiftStage, "reconcile", role)}>{bankReconciled ? "Demo reconciliation completed" : "Import statement & match"}</Button>
        </Panel>
      </div>
      <Panel title="Period reports & finance audit trail" action={<Button size="sm" variant="outline" onClick={() => downloadDemoFile("finance-period-report-demo.csv", "Area,Amount,Status\nReceipts,1310000,Posted\nExpenses,40500,Approved and draft\nDeposits,1200000,Synthetic\nExceptions,40000,Assigned\n")}><Download /> Excel-compatible export</Button>}><DataTable headers={["Event", "Preparer", "Approver", "Time", "Evidence"]} rows={[["Cash close submitted", "Seller DEMO-02", "Supervisor DEMO-05", "10 Sep 17:05", "CLOSE-DEMO-010"],["Deposit batch prepared", "Finance DEMO-06", "Manager DEMO-07", "Pending", "DEP-DEMO-0901"],["Statement item assigned", "Finance DEMO-06", "Finance lead", "Due within 2 business days", "MATCH-DEMO-022"]]} /></Panel>
      <p className="source-note">Every value is synthetic. No bank, account, balance, credential or live transaction is connected or implied.</p>
    </>
  );

  const renderContentAdmin = () => (
    <>
      <div className="metrics-grid compact">
        <Metric label="Published items" value={contentPublished ? "19" : "18"} note="Pages, products and stories" tone="green" />
        <Metric label="Awaiting approval" value={contentPublished ? "0" : "1"} note="Four-eyes publication control" tone="gold" />
        <Metric label="Scheduled" value="2" note="Seasonal notices" />
        <Metric label="Archived" value="7" note="Recoverable history" />
      </div>
      <Panel title="Content publishing register" action={<Button size="sm" onClick={() => setNotice("Blank synthetic content draft created in temporary session state.")}><Plus /> New draft</Button>}>
        <DataTable headers={["Content", "Type", "Owner", "State", "Control"]} rows={[
          ["2026 planting-season input guide", "Story", "Content editor", <Status key="s1" tone={contentPublished ? "good" : "warn"}>{contentPublished ? "Published" : "Approved draft"}</Status>, <Button key="a1" size="sm" onClick={() => setContentPublished(true)} disabled={contentPublished || !["manager", "supervisor", "administrator"].includes(role)}>{contentPublished ? "Published" : role === "editor" ? "Second reviewer required" : "Publish approved version"}</Button>],
          ["NPK 23:21:0+4S", "Product", "Product-data owner", <Status key="s2" tone="good">Published</Status>, <Button key="a2" size="sm" variant="outline" onClick={() => setNotice("A new product-content draft was opened; the published version remains unchanged.")}>Edit draft</Button>],
          ["Kanengo collection procedure", "Page", "Operations manager", <Status key="s3" tone="blue">Scheduled</Status>, <Button key="a3" size="sm" variant="outline" onClick={() => setNotice("Scheduled page entered the four-eyes review queue.")}>Review</Button>],
          ["Old price notice", "Notice", "Content editor", <Status key="s4">Archived</Status>, <Button key="a4" size="sm" variant="outline" onClick={() => setNotice("Archived notice restored as an unpublished draft.")}>Restore</Button>],
        ]} />
      </Panel>
      <div className="two-col">
        <Panel title="Controlled publishing procedure"><ol className="integration-steps"><li><b>Draft</b><span>Editor records source, owner and expiry date.</span></li><li><b>Review</b><span>Commercial, legal or product owner checks claims.</span></li><li><b>Approve and publish</b><span>Authorized publisher releases a version with an audit log.</span></li><li><b>Correct or archive</b><span>History remains recoverable; deletion requires approval.</span></li></ol></Panel>
        <Panel title="Public-content safeguards"><ul className="plain-control-list"><li>No unverified registration, certification or leadership claims</li><li>Prices and availability marked indicative until confirmed</li><li>Privacy notice and consent wording versioned</li><li>Product and agrochemical claims require an accountable owner</li><li>Emergency unpublish and correction procedure</li></ul></Panel>
      </div>
      <div className="two-col"><Panel title="Media, categories & SEO"><DataTable headers={["Asset / field", "Assignment", "State"]} rows={[["Fertilizer category", "Product taxonomy", <Status key="m1" tone="good">Published</Status>],["Catalogue description", "Search title + description", <Status key="m2" tone="good">Complete</Status>],["Seasonal story image", "Media library · synthetic", <Status key="m3" tone="blue">Rights checked</Status>],["Social preview", "Site-wide Open Graph card", <Status key="m4" tone="warn">Release asset</Status>]]} /></Panel><Panel title="Version history & recovery"><DataTable headers={["Version", "Action", "Actor", "Recoverable"]} rows={[["v18", "Correction drafted", "EDITOR-DEMO", "Yes"],["v17", "Published", "REVIEWER-DEMO", "Yes"],["v16", "Emergency unpublish rehearsal", "MANAGER-DEMO", "Yes"],["v15", "Archived", "SYSTEM", "Yes"]]} /><Button className="full-button" disabled><LockKeyhole /> Controlled deletion disabled</Button></Panel></div>
    </>
  );

  const renderWorkerPortal = () => (
    <>
      <div className="report-head"><div><span>{role.toUpperCase()} VIEW · SYNTHETIC SHIFT</span><b>10 September 2026 · Kanengo sales point · Shift A</b></div><div className="action-row"><Button variant="outline" onClick={exportDailySales}><Download /> Export for Excel</Button><Button variant="outline" onClick={() => go("inventory")}><Search /> Stock search</Button></div></div>
      <div className="metrics-grid compact"><Metric label="Opening float" value="Demo MWK 50,000" note="Seller confirmed" tone="green" /><Metric label="Sales today" value={shiftStage === "open" ? "Demo MWK 474,500" : "Demo MWK 573,000"} note={shiftStage === "open" ? "3 receipts" : "4 numbered receipts"} tone="green" /><Metric label="Cash expected" value={shiftStage === "open" ? "Demo MWK 295,500" : "Demo MWK 394,000"} note="Count before close" tone="gold" /><Metric label="Shift state" value={shiftStage} note="Independent approval required" /></div>
      <Panel title="Demonstration point of sale" action={<Button size="sm" disabled={!canAdvanceShift(shiftStage, "record-sale", role)} onClick={() => { setShiftStage(advanceShift(shiftStage, "record-sale", role)); setNotice("Numbered receipt RCPT-DEMO-0187 created; payment method recorded as cash."); }}><Plus /> Record demo sale</Button>}><DataTable headers={["Receipt", "Time", "Customer", "Payment", "Amount", "Status"]} rows={[["RCPT-DEMO-0184", "08:41", "Walk-in", "Cash", "MWK 98,500", <Status key="r1" tone="good">Posted</Status>],["RCPT-DEMO-0185", "09:16", "Customer DEMO-C02", "Transfer", "MWK 179,000", <Status key="r2" tone="blue">Verified</Status>],["RCPT-DEMO-0186", "10:05", "Customer DEMO-C01", "Cash", "MWK 197,000", <Status key="r3" tone="good">Posted</Status>],...(shiftStage !== "open" ? [["RCPT-DEMO-0187", "11:32", "Walk-in", "Cash", "MWK 98,500", <Status key="r4" tone="good">Posted</Status>] as ReactNode[]] : [])]} /></Panel>
      <div className="two-col"><Panel title="Daily cash close"><dl className="details-list"><div><dt>Expected</dt><dd>{shiftStage === "open" ? "MWK 295,500" : "MWK 394,000"}</dd></div><div><dt>Seller count</dt><dd>{shiftStage === "open" || shiftStage === "sale" ? "Not submitted" : "MWK 393,000"}</dd></div><div><dt>Variance</dt><dd>{shiftStage === "open" || shiftStage === "sale" ? "Pending" : "MWK -1,000 · explanation attached"}</dd></div></dl><div className="action-row"><Button disabled={!canAdvanceShift(shiftStage, "submit-count", role)} onClick={() => setShiftStage(advanceShift(shiftStage, "submit-count", role))}>Submit count</Button><Button disabled={!canAdvanceShift(shiftStage, "approve-close", role)} onClick={() => setShiftStage(advanceShift(shiftStage, "approve-close", role))}><ShieldCheck /> Supervisor close</Button><Button disabled variant="outline">Seller cannot self-approve</Button></div></Panel><Panel title="Discount, refund & adjustment controls"><ul className="plain-control-list"><li>Seller discount limit: illustrative 2%</li><li>Cancellation requires reason before posting</li><li>Refund request requires original receipt</li><li>Seller cannot approve own refund or variance</li><li>Stock adjustment requires storekeeper + supervisor</li></ul></Panel></div>
      <div className="two-col"><Panel title="My assigned work"><DataTable headers={["Task", "Due", "Evidence", "Status"]} rows={[["Follow up ENQ-1048", "11:00", "Call note DEMO-E22", <Status key="t1" tone="warn">Due</Status>],["Count NPK shelf", "Before close", readinessEvidence ? "COUNT-DEMO-14" : "Required", <Status key="t2" tone={readinessEvidence ? "good" : "neutral"}>{readinessEvidence ? "Submitted" : "Open"}</Status>],["Upload transfer evidence", "Completed", "EVID-DEMO-31", <Status key="t3" tone="good">Done</Status>]]} /><div className="action-row"><Button disabled={readinessEvidence} onClick={() => setReadinessEvidence(true)}>Submit task evidence</Button><Button disabled={!readinessEvidence || !["supervisor", "manager", "administrator"].includes(role) || taskApproved} onClick={() => setTaskApproved(true)}>Approve evidence</Button></div></Panel><Panel title="Performance targets"><ul className="plain-control-list"><li>Unique enquiry references: 100%</li><li>Complete enquiries quoted within 8 hours: 90%</li><li>Daily cash closes signed: 100%</li><li>Training completion: 100%</li><li>Role-assessment pass mark: at least 80%</li></ul></Panel></div>
      <p className="source-note">All receipt numbers, staff, customers, targets and cash values are synthetic. The CSV is Excel-compatible. Sellers cannot approve their own variance, refund or stock adjustment.</p>
    </>
  );

  const renderCustomerPortal = () => (
    <>
      <div className="account-head"><div className="account-icon"><UserRound /></div><div><span>CUSTOMER SELF-SERVICE · SYNTHETIC</span><h2>Customer DEMO-C01</h2><p>Verified demonstration contact · isolated own-record view</p></div><Button onClick={() => go("mobile-enquiry")}>New enquiry</Button></div>
      <div className="metrics-grid compact"><Metric label="Open enquiries" value="1" note="ENQ-1048" /><Metric label="Quotes awaiting action" value="1" note="Valid until confirmed" tone="gold" /><Metric label="Orders in progress" value="0" note="No release pending" /><Metric label="Receipts available" value="2" note="Downloadable evidence" tone="green" /></div>
      <Panel title="My transactions only"><DataTable headers={["Reference", "Type", "Date", "Value", "State", "Action"]} rows={[["Q-DEMO-081", "Quotation", "10 Sep 2026", "MWK 2,045,000", <Status key="c1" tone={quoteAccepted ? "good" : "warn"}>{quoteAccepted ? "Accepted" : "Review"}</Status>, <Button key="c2" size="sm" onClick={() => go("mobile-quote")}>Open quote</Button>],["SO-DEMO-019", "Completed order", "16 Jul 2026", "MWK 3,940,000", <Status key="c3" tone="good">Completed</Status>, <Button key="c4" size="sm" variant="outline" onClick={() => downloadDemoFile("receipt-RCPT-DEMO-144.txt", "SYNTHETIC RECEIPT\nRCPT-DEMO-144\nCustomer DEMO-C01\nMWK 3,940,000\nNot a fiscal receipt\n", "text/plain")}><Download /> Receipt</Button>]]} /></Panel>
      <div className="two-col"><Panel title="Profile, fulfilment & statements"><dl className="details-list"><div><dt>Contact</dt><dd>Verified demonstration contact</dd></div><div><dt>Collection</dt><dd>Kanengo sales point · wait for release notice</dd></div><div><dt>Delivery</dt><dd>No live delivery instruction recorded</dd></div><div><dt>Statement</dt><dd>Approved synthetic period statement</dd></div></dl><Button className="full-button" variant="outline" onClick={() => downloadDemoFile("customer-statement-demo.csv", "Date,Reference,Type,Amount\n2026-07-16,SO-DEMO-019,Order,3940000\n")}>Download approved statement</Button></Panel><Panel title="Support & privacy controls"><ul className="plain-control-list"><li>Consent history: service updates accepted 10 Sep 2026</li><li>Communication preference: email only (synthetic)</li><li>Contact correction requires re-verification</li><li>Data access, correction and deletion are review requests</li><li>Report misuse and sign out other sessions</li></ul><div className="action-row"><Button variant="outline" disabled={supportRequest} onClick={() => setSupportRequest(true)}>{supportRequest ? "SUP-DEMO-014 opened" : "Open support request"}</Button><Button variant="outline" disabled={privacyRequest} onClick={() => setPrivacyRequest(true)}>{privacyRequest ? "PRIV-DEMO-009 opened" : "Open privacy request"}</Button></div></Panel></div>
    </>
  );

  const renderPublicInfo = () => {
    const pages: { id: PublicPage; label: string }[] = [
      { id: "about", label: "About" }, { id: "how", label: "How to buy" }, { id: "stories", label: "Stories" },
      { id: "contact", label: "Contact" }, { id: "privacy", label: "Privacy" }, { id: "terms", label: "Terms" },
    ];
    return (
      <>
        <div className="tab-strip" role="tablist" aria-label="Public information pages">{pages.map((page) => <button role="tab" aria-selected={publicPage === page.id} className={publicPage === page.id ? "active" : ""} onClick={() => setPublicPage(page.id)} key={page.id}>{page.label}</button>)}</div>
        {publicPage === "about" && <Panel title="About the business concept"><div className="prose-block"><p>Fatima Agro Dealers and General Suppliers is presented here as a proposed farm-inputs dealer concept serving the Kanengo, Lilongwe area. The public release does not assert verified registration, licensing, certification, ownership or signing authority.</p><p>The demonstration connects customer enquiries with quotation, stock, sales, finance and management controls. Aothothe Technologies prepared the evidence prototype.</p></div></Panel>}
        {publicPage === "how" && <Panel title="How to buy"><div className="journey-grid numbered"><article><b>1. Find an input</b><span>Search fertilizer, seed, agrochemical and equipment categories. Prices and availability are indicative.</span></article><article><b>2. Request confirmation</b><span>Submit a synthetic enquiry and receive a unique reference for staff follow-up.</span></article><article><b>3. Review a quotation</b><span>Accept it, request an amendment, or let it expire without creating a binding order.</span></article><article><b>4. Agree fulfilment</b><span>Staff confirm payment, reservation, collection or authorized delivery instructions.</span></article></div></Panel>}
        {publicPage === "stories" && <><Panel title="Farming stories & guidance"><div className="story-grid"><article><span>PLANTING READINESS</span><h3>Plan inputs before the first effective rains</h3><p>A synthetic editorial example showing how seasonal guidance enters review before publication.</p><Status tone="good">Approved demo content</Status></article><article><span>STORAGE</span><h3>Keep fertilizer dry, raised and traceable</h3><p>A practical content example with an accountable product-data owner and review date.</p><Status tone="blue">Reviewed 10 Sep 2026</Status></article></div></Panel><p className="source-note">These are demonstration stories, not agronomic instructions for a specific farm.</p></>}
        {publicPage === "contact" && <div className="two-col"><Panel title="Contact & location"><dl className="details-list"><div><dt>Area reference</dt><dd>Kanengo, Lilongwe</dd></div><div><dt>Contact status</dt><dd>Public details pending client verification</dd></div><div><dt>Enquiry route</dt><dd>Use the demonstration enquiry form</dd></div></dl><Button className="full-button" onClick={() => go("mobile-enquiry")}><Send /> Start an enquiry</Button></Panel><Panel title="Before visiting"><ul className="plain-control-list"><li>Request confirmed stock and indicative pricing</li><li>Receive collection instructions from authorized staff</li><li>Do not send identity documents or bank credentials</li><li>No live map pin or private address is published in this demo</li></ul></Panel></div>}
        {publicPage === "privacy" && <Panel title="Privacy notice — demonstration"><div className="prose-block"><p>This public evidence prototype uses synthetic records. Workflow changes and role selection remain in temporary browser-session state and are resettable. Do not enter real personal, banking, employee, contract or procurement information.</p><p>Demonstrated rights include access, correction, deletion review, consent history and communication preferences. Production processing would require a verified controller notice, lawful basis, retention schedule and accountable contacts.</p><div className="preference-row"><span>Current preference: <b>{cookiePreference ?? "not selected"}</b></span><Button size="sm" variant="outline" onClick={() => setCookiePreference("essential")}>Essential only</Button><Button size="sm" onClick={() => setCookiePreference("all")}>Allow optional</Button></div></div></Panel>}
        {publicPage === "terms" && <Panel title="Terms of evaluation"><div className="prose-block"><p>This is an interactive concept and evidence prototype, not deployed production software. Product prices, availability, customers, staff, balances, tenders and transactions are synthetic and non-binding.</p><p>Copyright © 2026 Aothothe Technologies. Public availability permits evaluation and review only; it does not grant commercial reuse, redistribution, sublicensing or production-operation rights. A separate approved licence is required.</p></div></Panel>}
        <Button variant="outline" onClick={() => go("public")}><ArrowLeft /> Back to public website</Button>
      </>
    );
  };

  const renderServiceManagement = () => (
    <>
      <div className="metrics-grid compact"><Metric label="Open enquiries" value="6" note="100% have references" /><Metric label="Quoted within 8h" value="92%" note="Proposed target ≥ 90%" tone="green" /><Metric label="Conversion" value="64%" note="Synthetic period" /><Metric label="Overdue actions" value="1" note="Escalated to supervisor" tone="red" /></div>
      <Panel title="Enquiry assignment & response control" action={<Button size="sm" onClick={() => go("quote")}>Open quotation builder</Button>}><DataTable headers={["Reference", "Owner", "Customer need", "SLA", "Stage", "Next control"]} rows={[["ENQ-1048", "Seller DEMO-02", "20 NPK + 10 Urea", "3h 12m", <Status key="s1" tone="warn">Pricing approval</Status>, "Manager validates discount"],["ENQ-1047", "Seller DEMO-04", "40 maize seed", "6h 05m", <Status key="s2" tone="blue">Draft quote</Status>, "Reserve after acceptance"],["ENQ-1044", "Unassigned", "Delivery enquiry", "8h 26m", <Status key="s3" tone="danger">Escalated</Status>, "Supervisor assigns owner"]]} /></Panel>
      <div className="two-col"><Panel title="Sales-order controls"><ul className="plain-control-list"><li>Quotation builder with price-source and validity date</li><li>Independent approval for discounts outside seller limits</li><li>Customer acceptance or amendment request captured</li><li>Stock reservation and allocation before order release</li><li>Collection or delivery instructions recorded</li></ul><Button className="full-button" onClick={() => go("order")}>Review synthetic order</Button></Panel><Panel title="CRM & follow-up"><DataTable headers={["Account", "History", "Reminder", "Owner"]} rows={[["Customer DEMO-C01", "3 enquiries · 2 orders", "Call today 14:00", "DEMO-02"],["Customer DEMO-C02", "1 active quote", "Confirm seed quantity", "DEMO-04"],["Walk-in segment", "14 receipts", "No personal profile", "Sales point"]]} /></Panel></div>
    </>
  );

  const renderAgentPortal = () => (
    <>
      <div className="future-banner"><Globe2 /><div><b>Future expansion capability</b><span>This does not represent a currently operating Fatima agent or distribution network.</span></div></div>
      <div className="account-head"><div className="account-icon"><UserRoundCog /></div><div><span>APPLICANT AGT-DEMO-007 · SYNTHETIC</span><h2>Central Region Dealer Applicant</h2><p>Territory request: Lilongwe North · no real documents</p></div><Status tone={agentStage === "approved" ? "good" : agentStage === "review" ? "warn" : "neutral"}>{agentStage}</Status></div>
      <div className="metrics-grid compact"><Metric label="Readiness" value={agentStage === "approved" ? "100%" : agentStage === "review" ? "80%" : "60%"} note="Synthetic checklist" tone={agentStage === "approved" ? "green" : "gold"} /><Metric label="Product access" value="4 groups" note="Illustrative only" /><Metric label="Margin model" value="Demo 8%" note="Not a commercial offer" /><Metric label="Orders" value="2" note="Synthetic submissions" /></div>
      <div className="two-col"><Panel title="Onboarding readiness"><ul className="check-list"><li><CheckCircle2 /> Territory and sales-point request</li><li><CheckCircle2 /> Product-access acknowledgement</li><li><CheckCircle2 /> Support and training orientation</li><li className={agentStage === "draft" ? "pending" : ""}>{agentStage === "draft" ? <AlertTriangle /> : <CheckCircle2 />} Document-readiness review</li><li className={agentStage === "approved" ? "" : "pending"}>{agentStage === "approved" ? <CheckCircle2 /> : <AlertTriangle />} Independent approval decision</li></ul><div className="action-row"><Button disabled={agentStage !== "draft"} onClick={() => setAgentStage("review")}>Submit readiness review</Button><Button disabled={role !== "manager" && role !== "supervisor" && role !== "administrator" || agentStage !== "review"} onClick={() => setAgentStage("approved")}>Approve application</Button></div></Panel><Panel title="Dealer workspace"><ul className="plain-control-list"><li>Territory: illustrative assignment only</li><li>Product catalogue and controlled price list</li><li>Order submission with availability confirmation</li><li>Commission / margin illustration and statement</li><li>Performance report and support requests</li></ul><Button className="full-button" variant="outline" onClick={() => downloadDemoFile("agent-performance-demo.csv", "Metric,Value\nOrders,2\nIllustrative margin,8%\nReadiness,80%\n")}>Export performance</Button></Panel></div>
    </>
  );

  const renderSystemAdmin = () => (
    <>
      <div className="metrics-grid compact"><Metric label="Environment" value="Public demo" note="Synthetic session data" tone="green" /><Metric label="Release" value="v1.0.0-demo" note="10 September 2026" /><Metric label="Open incidents" value="1 demo" note="No production impact" tone="gold" /><Metric label="Health" value="Ready" note="Build evidence required" tone="green" /></div>
      <Panel title="Role and permission matrix"><DataTable headers={["Role", "Own records", "Create / prepare", "Independent approval", "Administration"]} rows={[["Customer", "Customer-owned only", "Enquiries, support, privacy", "None", "None"],["Seller", "Assigned sales point", "Sales, counts, follow-ups", "Never own variance/refund/stock", "None"],["Storekeeper", "Assigned location", "Receipts, transfers, counts", "No own adjustment", "None"],["Content editor", "Assigned content", "Draft, correct, archive request", "No own regulated claim", "None"],["Finance officer", "Finance records", "Cashbook, matching, reports", "Finance approval by authority", "None"],["Supervisor", "Team operations", "Assignments and reviews", "Variance, refund, stock close", "Limited users"],["Manager", "Management scope", "Targets, decisions, contracts", "Commercial and release gates", "Reports"],["Administrator", "System metadata", "Users, retention, restore", "Cannot replace business approver", "Full demo admin"],["Agent / dealer", "Own applicant record", "Orders and support", "No self-approval", "None"]]} /></Panel>
      <div className="three-col"><Panel title="Identity & sessions"><ul className="plain-control-list"><li>Authentication-state demonstration</li><li>Role switcher is clearly synthetic</li><li>Session timeout and sign-out-all pattern</li><li>MFA required for future production</li><li>Customer record isolation policy</li></ul><Button className="full-button" variant="outline" onClick={() => setNotice("All synthetic sessions except the current demo session were revoked.")}><KeyRound /> Revoke demo sessions</Button></Panel><Panel title="Privacy & data control"><ul className="plain-control-list"><li>Privacy-request register and deadlines</li><li>Export approval and purpose record</li><li>Retention: demo state ends with browser session</li><li>Controlled deletion disabled in public release</li><li>No real bank or identity data</li></ul></Panel><Panel title="Resilience & incidents"><ul className="plain-control-list"><li>Source + release tag are rollback point</li><li>Backup verification procedure documented</li><li>Restore rehearsal requires approval</li><li>Incident register with owner and severity</li><li>Environment and dependency status</li></ul><Button className="full-button" disabled><LockKeyhole /> Destructive restore disabled</Button></Panel></div>
      <Panel title="Audit log"><DataTable headers={["Time", "Actor", "Action", "Object", "Result"]} rows={[["10 Sep 10:18", "ADMIN-DEMO", "Viewed permission matrix", "RBAC v1", <Status key="a1" tone="good">Allowed</Status>],["10 Sep 10:12", "SELLER-DEMO", "Attempted own variance approval", "CLOSE-DEMO-09", <Status key="a2" tone="danger">Denied</Status>],["10 Sep 09:54", "EDITOR-DEMO", "Submitted product claim", "CONTENT-DEMO-18", <Status key="a3" tone="warn">Review required</Status>],["10 Sep 09:40", "SYSTEM", "Demo state reset", "Browser session", <Status key="a4" tone="good">Complete</Status>]]} /></Panel>
    </>
  );

  const renderJourneys = () => {
    const journeys = [
      ["Visitor → enquiry → quote → acceptance → order", quoteAccepted ? "Complete" : enquirySent ? "In progress" : "Ready", "Public, Service, Customer"],
      ["Seller → receipt → cash count → close → deposit → reconciliation", shiftStage === "reconciled" ? "Complete" : "In progress", "Seller, Supervisor, Finance"],
      ["Supplier delivery → stock update → count → reconciliation", goodsPosted ? "Complete" : "Ready", "Storekeeper, Supervisor"],
      ["Manager task → worker evidence → approval", taskApproved ? "Complete" : readinessEvidence ? "Awaiting approval" : "Ready", "Manager, Worker"],
      ["Contract → obligation → evidence → review", "Ready", "Owner, Approver"],
      ["Editor draft → approval → publication → correction → archive", contentPublished ? "Published" : "Ready", "Editor, Reviewer"],
      ["Customer login demo → quote → receipt → support/privacy", privacyRequest || supportRequest ? "Complete" : "Ready", "Customer-owned records"],
      ["Dealer applicant → readiness → approval decision", agentStage === "approved" ? "Complete" : agentStage === "review" ? "Awaiting decision" : "Ready", "Agent, Manager"],
    ];
    return <><Panel title="End-to-end workflow register"><DataTable headers={["Connected journey", "State", "Separation / scope"]} rows={journeys.map(([name, state, scope], index) => [<b key={`${index}-n`}>{name}</b>, <Status key={`${index}-s`} tone={state === "Complete" || state === "Published" ? "good" : state.includes("Awaiting") || state === "In progress" ? "warn" : "blue"}>{state}</Status>, scope])} /></Panel><div className="source-note">Every workflow operates on temporary synthetic state. Real notifications, payment initiation, bank feeds, identity providers and regulated-data exchange remain deferred production integrations.</div></>;
  };

  const renderReport = () => (
    <>
      <div className="report-head"><div><span>SYNTHETIC REPORTING PERIOD</span><b>August 2026 · demonstration figures</b></div><Button variant="outline" onClick={() => downloadDemoFile("management-report-demo.csv", "Metric,Value,Status\nRevenue,18600000,Synthetic\nQuote conversion,64%,Synthetic\nStock accuracy,98.4%,Synthetic\nCash closes,100%,Proposed target\n")}><Download /> Export report</Button></div>
      <div className="metrics-grid">
        <Metric label="Revenue" value="MWK 18.6m" note="Target: MWK 17.2m" tone="green" />
        <Metric label="Gross margin" value="17.8%" note="Target: 18.0%" tone="gold" />
        <Metric label="Order conversion" value="64%" note="9 of 14 quotations" />
        <Metric label="Stock variance" value="0.2%" note="Within control limit" tone="green" />
      </div>
      <div className="two-col wide-left">
        <Panel title="Revenue by category"><div className="h-bars">{[["Fertilizer", 58, "MWK 10.8m"], ["Seed", 24, "MWK 4.5m"], ["Agrochemicals", 12, "MWK 2.2m"], ["Equipment", 6, "MWK 1.1m"]].map(([label, width, value]) => <div key={label}><div><b>{label}</b><span>{value}</span></div><div className="h-track"><span style={{ width: `${width}%` }} /></div></div>)}</div></Panel>
        <Panel title="Management attention"><ul className="attention-list"><li><AlertTriangle /><span><b>Reorder two fast-moving items</b><small>Protect September availability.</small></span></li><li><AlertTriangle /><span><b>Close the margin gap</b><small>Review transport recovery on small orders.</small></span></li><li><CheckCircle2 /><span><b>Receivables controlled</b><small>No overdue demo balances.</small></span></li></ul></Panel>
      </div>
      <Panel title="Operating summary"><DataTable headers={["Area", "Actual", "Target / limit", "Position"]} rows={[["Monthly sales", "MWK 18.6m", "MWK 17.2m", <Status key="sales" tone="good">Ahead</Status>], ["Quotation turnaround", "6.4 hours", "Under 8 hours", <Status key="turnaround" tone="good">On target</Status>], ["Low-stock SKUs", "2", "0", <Status key="stock" tone="danger">Action</Status>], ["Tender submissions", "3", "2", <Status key="tenders" tone="good">Ahead</Status>]]} /></Panel>
      <p className="source-note">Every figure and target comparison is synthetic. Proposed operating targets are not historical Fatima results.</p>
    </>
  );

  const renderMobileEnquiry = () => (
    <div className="phone-stage">
      <div className="phone-shell">
        <div className="phone-top"><b>Fatima Agro</b><span>Kanengo, Lilongwe</span></div>
        <div className="phone-content">
          {enquirySent ? (
            <div className="mobile-success"><CheckCircle2 /><h2>Enquiry received</h2><p>Reference ENQ-DEMO-1051. Seller DEMO-02 is assigned to confirm indicative price and stock.</p><Button variant="outline" onClick={() => go("mobile-quote")}>View sample quote</Button></div>
          ) : (
            <>
              <span className="eyebrow">FARM INPUT ENQUIRY</span><h2>Request price and availability</h2><p>Use synthetic labels only. This demo does not place a binding order or send a message.</p>
              <label>Customer label<Input defaultValue="Customer DEMO-C05" aria-describedby="synthetic-contact-note" /></label>
              <label>Contact preference<Input value="Demonstration follow-up only" readOnly /></label>
              <label>Product<Input value="NPK 23:21:0+4S · 50 kg" readOnly /></label>
              <label>Quantity<Input value="20 bags" readOnly /></label>
              <p id="synthetic-contact-note" className="form-note">Do not enter a real name, phone number, email address or location.</p>
              <Button className="full-button" onClick={() => { setEnquirySent(true); setNotice("Unique enquiry ENQ-DEMO-1051 created and assigned to Seller DEMO-02."); }}>Create synthetic enquiry</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderMobileQuote = () => (
    <div className="phone-stage">
      <div className="phone-shell">
        <div className="phone-top"><b>Fatima Agro</b><span>Quotation Q-DEMO-081</span></div>
        <div className="phone-content">
          {quoteAccepted ? (
            <div className="mobile-success"><CheckCircle2 /><h2>Order request sent</h2><p>Staff will confirm payment and collection before goods are released.</p><span className="mobile-ref">ORDER REQUEST OR-1051</span></div>
          ) : (
            <>
              <Status tone="good">Valid to 15 Sep 2026</Status><h2>Your quotation</h2><p>Prepared for Customer DEMO-C01.</p>
              <div className="mobile-line"><div><b>NPK 23:21:0+4S</b><span>20 bags × MWK 98,500</span></div><strong>MWK 1,970,000</strong></div>
              <div className="mobile-line"><div><b>Collection handling</b><span>Kanengo pickup</span></div><strong>MWK 75,000</strong></div>
              <div className="mobile-total"><span>Total</span><strong>MWK 2,045,000</strong></div>
              <Button className="full-button" onClick={() => setQuoteAccepted(true)}>Accept and request order</Button>
              <Button className="full-button" variant="outline" onClick={() => go("mobile-enquiry")}>Request a change</Button>
              <p className="form-note">Acceptance remains subject to staff confirmation and payment.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    if (!canAccess) return <div className="access-denied"><LockKeyhole /><h2>Role-limited demonstration</h2><p>The {demoRoles.find((item) => item.id === role)?.label} role cannot open this area. Switch to an authorized synthetic role to continue.</p><Button onClick={() => changeRole("administrator")}>Switch to administrator demo</Button></div>;
    switch (active) {
      case "public": return renderPublic();
      case "dashboard": return renderDashboard();
      case "catalogue": return renderCatalogue();
      case "product": return renderProduct();
      case "enquiries": return renderEnquiries();
      case "quote": return renderQuote();
      case "order": return renderOrder();
      case "inventory": return renderInventory();
      case "goods": return renderGoods();
      case "reconciliation": return renderReconciliation();
      case "customers": return renderCustomers();
      case "customer": return renderCustomer();
      case "procurement": return renderProcurement();
      case "compliance": return renderCompliance();
      case "delivery": return renderDelivery();
      case "contracts": return renderContracts();
      case "finance": return renderFinance();
      case "content-admin": return renderContentAdmin();
      case "worker-portal": return renderWorkerPortal();
      case "customer-portal": return renderCustomerPortal();
      case "service-management": return renderServiceManagement();
      case "system-admin": return renderSystemAdmin();
      case "agent-portal": return renderAgentPortal();
      case "public-info": return renderPublicInfo();
      case "journeys": return renderJourneys();
      case "report": return renderReport();
      case "mobile-enquiry": return renderMobileEnquiry();
      case "mobile-quote": return renderMobileQuote();
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">FA</div>
          <div><b>Fatima Agro</b><span>Operations prototype</span></div>
          <button className="nav-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return <button className={active === item.id ? "active" : ""} onClick={() => go(item.id)} key={item.id}><Icon />{item.label}</button>;
              })}
            </div>
          ))}
        </nav>
        <div className="provider-lockup"><span>PROPOSED AND PREPARED BY</span><img src="/aothothe-logo.png" alt="Aothothe Technologies" /></div>
        <div className="sidebar-note">All records and figures are synthetic for demonstration.</div>
      </aside>

      {mobileNav && <button className="nav-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main className="main-shell" id="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button>
          <div className="prototype-label"><span /> Interactive evidence prototype — synthetic data only</div>
          <div className="role-switcher"><label htmlFor="demo-role">Demo role</label><select id="demo-role" value={role} onChange={(event) => changeRole(event.target.value as DemoRole)}>{demoRoles.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><Button size="sm" variant="outline" onClick={resetDemo}><RefreshCcw /> Reset</Button></div>
        </header>
        <div className="page-wrap">
          <div className="release-strip"><span><ShieldCheck /> Public evidence build</span><span>v1.0.0-demo</span><span>Release date: 10 Sep 2026</span><span>Provider: Aothothe Technologies</span></div>
          <div className="live-notice" role="status" aria-live="polite">{notice}</div>
          <div className="page-head">
            <div><p>FATIMA AGRO DEALERS AND GENERAL SUPPLIERS</p><h1>{title.title}</h1><span>{title.description}</span></div>
            <Status tone="blue">Demo data</Status>
          </div>
          <div className="screen-content">{renderScreen()}</div>
        </div>
      </main>
    </div>
  );
}
