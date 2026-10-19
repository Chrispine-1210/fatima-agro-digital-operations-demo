import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image credits | Fatima Agro",
  description: "Sources and reuse licences for representative agriculture and product photographs.",
};

const photographs = [
  {
    "file": "/images/farm-field.jpg",
    "title": "Corn Field - agriculture illustration",
    "creator": "Heinrich Zaunschirm",
    "year": "before June 2016",
    "source": "https://commons.wikimedia.org/wiki/File:Corn_Field_(158758545).jpeg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/6/60/Corn_Field_%28158758545%29.jpeg",
    "license": "CC0 1.0 public domain dedication",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "changes": "Source-host 1280 x 851 thumbnail. No local crop or content edit.",
    "note": "Sunlit grain crop used as an agriculture illustration; not a Fatima farm, Malawi location or harvest result."
  },
  {
    "file": "/images/harvest-detail.jpg",
    "title": "Corn Field - guide illustration",
    "creator": "Heinrich Zaunschirm",
    "year": "before June 2016",
    "source": "https://commons.wikimedia.org/wiki/File:Corn_Field_(158758545).jpeg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/6/60/Corn_Field_%28158758545%29.jpeg",
    "license": "CC0 1.0 public domain dedication",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "changes": "The same source-host 1280 x 851 thumbnail is reused. No local crop or content edit.",
    "note": "Editorial grain-crop illustration; not evidence of a Fatima harvest."
  },
  {
    "file": "/images/crop-care.jpg",
    "title": "Vegetables - USDA image K7246-9",
    "creator": "Scott Bauer / USDA Agricultural Research Service",
    "year": "published 2003",
    "source": "https://commons.wikimedia.org/wiki/File:Vegetables.jpg",
    "original": "https://www.ars.usda.gov/oc/images/photos/k7246-9/",
    "license": "Public domain - US government / USDA ARS",
    "licenseUrl": "https://www.ars.usda.gov/oc/images/copyright/",
    "changes": "Source-host 960 x 1450 thumbnail. No local crop or content edit.",
    "note": "Mixed vegetables used as an editorial agriculture illustration; not Fatima stock or a supplier relationship. USDA does not endorse Fatima Agro."
  },
  {
    "file": "/images/products/fertiliser.jpg",
    "title": "Bultos de fertilizante Inorg?nico",
    "creator": "Jacqueline284",
    "year": "2020",
    "source": "https://commons.wikimedia.org/wiki/File:Bultos_de_fertilizante_Inorg%C3%A1nico.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Bultos_de_fertilizante_Inorg%C3%A1nico.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "changes": "Source-host 500 x 667 thumbnail. No local crop, retouch or content edit.",
    "note": "Fertinal FERTI-DAP 50 kg fertiliser bags illustrate the category. Fatima's supplied brand, formulation, packaging and availability remain unconfirmed."
  },
  {
    "file": "/images/products/maize.jpg",
    "title": "Sacks of maize",
    "creator": "Cut angles",
    "year": "2025",
    "source": "https://commons.wikimedia.org/wiki/File:Sacks_of_maize.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Sacks_of_maize.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "changes": "Source-host 960 x 638 thumbnail. No local crop or content edit.",
    "note": "Maize grain sacks photographed in Kenya; not certified seed packaging, Fatima stock or a Fatima warehouse."
  },
  {
    "file": "/images/products/sprayer.jpg",
    "title": "Knapsack sprayer",
    "creator": "Safapalanadan94",
    "year": "2016",
    "source": "https://commons.wikimedia.org/wiki/File:Knapsack_sprayer.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/8/89/Knapsack_sprayer.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "changes": "Source-host 500 x 889 thumbnail. No local crop or content edit.",
    "note": "A KASS 16 L sprayer illustrates equipment. Fatima's supplied brand and model require confirmation."
  },
  {
    "file": "/images/products/groundnuts.jpg",
    "title": "Arachis hypogaea 005",
    "creator": "H. Zell",
    "year": "2010",
    "source": "https://commons.wikimedia.org/wiki/File:Arachis_hypogaea_005.JPG",
    "original": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Arachis_hypogaea_005.JPG",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "changes": "Source-host 960 x 720 thumbnail. No local crop or content edit. CC licence selected from the source's dual licensing.",
    "note": "Shelled groundnuts illustrate the category; the photo does not verify seed variety, certification, grade or supplied packaging."
  },
  {
    "file": "/images/products/urea.jpg",
    "title": "Bag near Fence on Field",
    "creator": "jason hu",
    "year": "2024",
    "source": "https://www.pexels.com/photo/bag-near-fence-on-field-21773935/",
    "original": "https://www.pexels.com/photo/bag-near-fence-on-field-21773935/",
    "license": "Pexels licence",
    "licenseUrl": "https://www.pexels.com/legal-pages/license/",
    "changes": "Source-host compressed/resized 960 x 1440 JPEG. No local crop, retouch or content edit.",
    "note": "Sinopec-branded prilled-urea bag photographed in China, used as a category illustration. Fatima's supplied brand and packaging are unconfirmed; no pictured-brand endorsement is implied."
  },
  {
    "file": "/images/products/crop-care.jpg",
    "title": "Roundup Kanister 2020 08",
    "creator": "Flo Beck",
    "year": "2020",
    "source": "https://commons.wikimedia.org/wiki/File:Roundup_Kanister_2020_08.JPG",
    "original": "https://upload.wikimedia.org/wikipedia/commons/1/13/Roundup_Kanister_2020_08.JPG",
    "license": "CC0 1.0 public domain dedication",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "changes": "Source-host 500 x 667 thumbnail. No local crop, retouch or content edit.",
    "note": "A 5 L Roundup PowerFlex container illustrates crop protection. Fatima's supplied brand, formulation, approved uses and Malawi registration require confirmation. This photo is not agronomic advice."
  }
];

export default function ImageCreditsPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 72px", color: "#17372d", background: "#fff", lineHeight: 1.65 }}>
      <Link href="/" style={{ color: "#226242", fontWeight: 700 }}>Fatima Agro home</Link>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "24px 0 12px" }}>Photograph credits</h1>
      <p>These real photographs illustrate agriculture and product categories. They do not verify Fatima Agro stock, brands, packaging, product certification, registration or business relationships. Confirm the precise item and packaging when requesting a quotation.</p>
      <p>Sources, reuse terms and resizing information are recorded below. The photographers and pictured brands do not endorse Fatima Agro. A representative category photograph does not establish that a product is available or approved for sale.</p>
      <div style={{ display: "grid", gap: 20, marginTop: 28 }}>
        {photographs.map((photo) => (
          <article key={photo.file} style={{ border: "1px solid #dce6df", padding: 22 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.3rem" }}>{photo.title}</h2>
            <p style={{ margin: "0 0 10px" }}>{photo.creator}, {photo.year}. <a href={photo.source}>Source and author details</a> ? <a href={photo.original}>Original photograph</a> ? <a href={photo.licenseUrl}>{photo.license}</a></p>
            <p style={{ margin: "0 0 8px" }}>{photo.note}</p>
            <p style={{ margin: 0, fontSize: ".9rem", color: "#53665b" }}>{photo.changes} <a href={photo.file}>View the bundled image</a>.</p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: 28, fontSize: ".9rem", color: "#53665b" }}>Share-alike terms apply to adaptations where specified by the source licence. Pexels reuse restrictions and applicable brand rights remain separate. Website code and other materials retain their respective rights. Product sources checked 18 October 2026; editorial sources checked 17 October 2026.</p>
      <Link href="/" style={{ color: "#226242", fontWeight: 700 }}>Return to Fatima Agro</Link>
    </main>
  );
}
