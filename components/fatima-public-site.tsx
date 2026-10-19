"use client";

import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  Handshake,
  Leaf,
  MapPin,
  Newspaper,
  PackageCheck,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Star,
  Truck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type PublicInfoPage = "about" | "how" | "stories" | "reviews" | "contact" | "careers" | "privacy" | "terms";

type PublicProduct = {
  name: string;
  category: string;
  pack: string;
  price: number;
};

type Props = {
  products: PublicProduct[];
  onOpenCatalogue: () => void;
  onOpenEnquiry: () => void;
  onOpenPortalAccess: () => void;
  onOpenInfo: (page: PublicInfoPage) => void;
};

const productPhotos = [
  "/images/crop-care.jpg",
  "/images/harvest-detail.jpg",
  "/images/crop-care.jpg",
  "/images/farm-field.jpg",
  "/images/harvest-detail.jpg",
  "/images/farm-field.jpg",
];

const stories = [
  {
    category: "BUYING GUIDE",
    title: "Prepare a clear farm-inputs list before you enquire",
    description: "A simple way to note crop, pack size and quantity so a team member can check the right items with you.",
    image: "/images/crop-care.jpg",
    alt: "Fresh produce at a market, used as an illustrative agriculture image",
  },
  {
    category: "ORDERING",
    title: "What happens after you request a quotation?",
    description: "Follow the steps from availability checks to price confirmation, order agreement and collection details.",
    image: "/images/harvest-detail.jpg",
    alt: "Sunlit crop field, used as an illustrative agriculture image",
  },
  {
    category: "STORAGE",
    title: "Keep product information with the goods you receive",
    description: "Good records help a farm team check packs, dates and storage instructions when products arrive.",
    image: "/images/farm-field.jpg",
    alt: "A wide agricultural field at sunset, used as an illustrative image",
  },
];

const serviceTeams = [
  { icon: UsersRound, title: "Customer care", text: "Answers questions, records your needs and keeps you updated on the next step." },
  { icon: ShoppingBasket, title: "Products and sales", text: "Checks product details and prepares a quotation for you to review." },
  { icon: Boxes, title: "Store and fulfilment", text: "Confirms stock, prepares approved orders and shares collection instructions." },
  { icon: Banknote, title: "Accounts and records", text: "Keeps receipts, statements and payment records available to the right people." },
];

const partnerTypes = [
  { icon: Sprout, title: "Input suppliers", text: "Product and supplier details are added after business verification." },
  { icon: Handshake, title: "Farmer groups", text: "A place for approved cooperatives and farming organizations." },
  { icon: Truck, title: "Delivery services", text: "Delivery options are confirmed for each order before they are offered." },
  { icon: Building2, title: "Payment providers", text: "No payment provider is connected in this demonstration." },
];

const money = (value: number) => `MWK ${value.toLocaleString("en-MW")}`;

export function FatimaPublicSite({ products, onOpenCatalogue, onOpenEnquiry, onOpenPortalAccess, onOpenInfo }: Props) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <div className="fatima-site">
      <div className="site-utility-bar">
        <span><MapPin /> Kanengo, Lilongwe · business details pending verification</span>
        <button onClick={onOpenPortalAccess}><ShieldCheck /> Customer account</button>
      </div>
      <header className="site-header">
        <button className="site-brand" onClick={() => scrollTo("site-home")} aria-label="Fatima Agro home">
          <span className="site-brand-mark"><Leaf /></span>
          <span><b>Fatima Agro</b><small>Dealers and General Suppliers</small></span>
        </button>
        <nav className="site-main-nav" aria-label="Main navigation">
          <button onClick={() => scrollTo("site-catalogue")}>Products</button>
          <button onClick={() => scrollTo("site-stories")}>Guides and news</button>
          <button onClick={() => scrollTo("site-reviews")}>Customer feedback</button>
          <button onClick={() => scrollTo("site-about")}>About us</button>
          <button onClick={() => scrollTo("site-careers")}>Careers</button>
          <button onClick={() => scrollTo("site-contact")}>Contact</button>
        </nav>
        <div className="site-header-actions">
          <Button variant="outline" onClick={onOpenPortalAccess}>Customer portal</Button>
          <Button onClick={onOpenEnquiry}>Request a quote <ArrowRight /></Button>
        </div>
      </header>

      <main id="site-home">
        <section className="site-hero">
          <div className="site-hero-copy">
            <span className="site-eyebrow"><span /> Farm inputs made easier to find</span>
            <h1>Plan your next season with the right inputs in view.</h1>
            <p>Explore a clear product catalogue, tell us what you need and receive a quotation to review. Stock and prices are confirmed with you before an order is agreed.</p>
            <div className="site-hero-actions">
              <Button onClick={() => scrollTo("site-catalogue")}>Explore the catalogue <ArrowRight /></Button>
              <Button variant="outline" onClick={onOpenEnquiry}>Ask for a quotation</Button>
            </div>
            <div className="site-hero-trust"><span><BadgeCheck /> Clear quotation steps</span><span><BadgeCheck /> You review before you agree</span></div>
          </div>
          <div className="site-hero-image">
            <img src="/images/farm-field.jpg" alt="Sunlight over a cultivated field; illustrative image" />
            <div className="site-image-note"><span>AGRICULTURE IN FOCUS</span><b>Product discovery. Clear next steps.</b><small>Illustrative stock photography · not a Fatima farm</small></div>
            <div className="site-season-card"><Sprout /><span><b>A clearer way to enquire</b><small>Share the crop, product and quantity you have in mind.</small></span></div>
          </div>
        </section>

        <section className="site-proof-row" aria-label="How the service works">
          <div><span>01</span><b>Find the product</b><small>Browse by category or item name.</small></div>
          <div><span>02</span><b>Tell us what you need</b><small>Send a question or quantity request.</small></div>
          <div><span>03</span><b>Review the details</b><small>Confirm price, stock and collection.</small></div>
          <div><span>04</span><b>Choose your next step</b><small>Accept, ask for a change, or wait.</small></div>
        </section>

        <section className="site-section site-catalogue" id="site-catalogue">
          <div className="site-section-heading">
            <div><span className="site-eyebrow">PRODUCT CATALOGUE</span><h2>Farm essentials, easy to browse.</h2><p>Explore sample products and packs. A team member confirms current stock and price when preparing your quotation.</p></div>
            <Button variant="outline" onClick={onOpenCatalogue}>Browse the full catalogue <ChevronRight /></Button>
          </div>
          <div className="site-product-grid">
            {products.slice(0, 6).map((product, index) => (
              <article className="site-product-card" key={product.name}>
                <button className="site-product-photo" onClick={onOpenCatalogue} aria-label={`Browse ${product.name}`}>
                  <img src={productPhotos[index % productPhotos.length]} alt={`Illustrative agriculture photograph, not ${product.name} packaging`} loading="lazy" />
                  <span>Illustrative photo</span>
                </button>
                <div className="site-product-info"><small>{product.pack} pack · sample listing</small><h3>{product.name}</h3><div><b>{money(product.price)}</b><span>demo price</span></div><button onClick={onOpenEnquiry}>Ask about this item <ArrowRight /></button></div>
              </article>
            ))}
          </div>
          <p className="site-data-note"><ShieldCheck /> Demonstration catalogue: item names, pack sizes and MWK prices are synthetic examples and are not an offer to sell.</p>
        </section>

        <section className="site-season-feature">
          <img src="/images/crop-care.jpg" alt="Market vegetables, illustrative crop image" loading="lazy" />
          <div><span className="site-eyebrow">BEFORE YOU ORDER</span><h2>Get the details that matter in one conversation.</h2><p>Tell us what you are growing, which products you are considering and when you need them. We will confirm the order details for you to check.</p><Button onClick={onOpenEnquiry}>Start a product enquiry <ArrowRight /></Button></div>
        </section>

        <section className="site-section site-stories" id="site-stories">
          <div className="site-section-heading"><div><span className="site-eyebrow">GUIDES AND NEWS</span><h2>Useful information for your next step.</h2><p>Simple buying and product-handling guides. Any agronomic guidance must be reviewed and approved before publication.</p></div><button className="site-text-link" onClick={() => onOpenInfo("stories")}>View all stories <ArrowRight /></button></div>
          <div className="site-story-grid">
            {stories.map((story) => <article className="site-story-card" key={story.title}><img src={story.image} alt={story.alt} loading="lazy" /><div><span>{story.category} <i>·</i> DEMO STORY</span><h3>{story.title}</h3><p>{story.description}</p><button onClick={() => onOpenInfo("stories")}>Read guide <ArrowRight /></button></div></article>)}
          </div>
        </section>

        <section className="site-review-band" id="site-reviews">
          <div className="site-review-icon"><Star /></div>
          <div><span className="site-eyebrow">CUSTOMER FEEDBACK</span><h2>Your experience should shape our service.</h2><p>Reviews are accepted from customers and held for a team check before they appear publicly. This prototype has no verified customer reviews yet.</p></div>
          <div className="site-review-actions"><span><Star /><Star /><Star /><Star /><Star /></span><small>No public ratings yet</small><Button variant="outline" onClick={() => onOpenInfo("reviews")}>Visit reviews and leave feedback <ArrowRight /></Button></div>
        </section>

        <section className="site-section site-about" id="site-about">
          <div className="site-about-copy"><span className="site-eyebrow">MEET THE TEAM</span><h2>A straightforward service, with clear ownership at every step.</h2><p>Customer care, product sales, store operations and accounts each have a clear role in helping customers discover products, review quotations and follow orders through to fulfilment.</p><p>This prototype describes team responsibilities; names and staff photographs will be added after the business approves verified profiles.</p><Button variant="outline" onClick={() => onOpenInfo("about")}>More about the business <ArrowRight /></Button></div>
          <div className="site-service-grid">{serviceTeams.map((team) => { const Icon = team.icon; return <article key={team.title}><span><Icon /></span><h3>{team.title}</h3><p>{team.text}</p></article>; })}</div>
        </section>

        <section className="site-careers" id="site-careers">
          <div><span className="site-eyebrow">CAREERS & JOBS</span><h2>Find out about opportunities with Fatima Agro.</h2><p>Verified vacancies, duties, location and closing dates will be published here after approval by the Head Office HR and Recruitment team. No current vacancies have been confirmed for this prototype.</p><button className="site-text-link" onClick={() => onOpenInfo("careers")}>How recruitment works <ArrowRight /></button></div>
          <div className="site-career-owner"><UsersRound /><b>Recruitment is managed at HQ</b><span>Branch staffing needs are reviewed by the responsible director and HR before a job is advertised.</span></div>
        </section>

        <section className="site-partners">
          <div className="site-partner-heading"><span className="site-eyebrow">CLIENTS AND PARTNERS</span><h2>Built around trusted working relationships.</h2><p>Partner names, logos and client references are added only after the business confirms permission to publish them.</p></div>
          <div className="site-partner-grid">{partnerTypes.map((partner) => { const Icon = partner.icon; return <article key={partner.title}><Icon /><div><b>{partner.title}</b><span>{partner.text}</span></div></article>; })}</div>
          <small className="site-approval-note"><ShieldCheck /> Partner profiles are placeholders until reviewed and approved.</small>
        </section>

        <section className="site-contact" id="site-contact">
          <div><span className="site-eyebrow">TALK WITH THE TEAM</span><h2>Have a product question or a list to price?</h2><p>Send an enquiry and receive a reference to use when following up. Contact details and operating hours will be published after verification.</p></div>
          <div className="site-contact-actions"><Button onClick={onOpenEnquiry}>Send an enquiry <ArrowRight /></Button><Button variant="outline" onClick={onOpenPortalAccess}>Open customer portal</Button><small><MapPin /> Kanengo, Lilongwe · location reference for this prototype</small></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-main"><div className="site-brand site-brand-static"><span className="site-brand-mark"><Leaf /></span><span><b>Fatima Agro</b><small>Dealers and General Suppliers</small></span></div><p>Explore products, ask questions and review the details before you decide.</p><div className="site-footer-links"><button onClick={() => onOpenInfo("how")}>How to buy</button><button onClick={() => onOpenInfo("reviews")}>Reviews</button><button onClick={() => onOpenInfo("careers")}>Careers</button><button onClick={() => onOpenInfo("privacy")}>Privacy</button><button onClick={onOpenPortalAccess}>Customer portal</button></div></div>
        <div className="site-footer-bottom"><span>Interactive prototype · synthetic examples only</span><span>Illustrative photographs from <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash</a>.</span><button onClick={() => onOpenInfo("terms")}>Terms of evaluation</button></div>
        <div className="site-credit">Prepared as an evidence prototype by Aothothe Technologies</div>
      </footer>
    </div>
  );
}
