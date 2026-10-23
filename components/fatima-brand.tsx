type BrandVariant = "header" | "footer" | "portal" | "sign-in";

/** The supplied FA emblem has a compact badge and a full, tagline-bearing seal. */
export function FatimaBrand({ variant = "header" }: { variant?: BrandVariant }) {
  const full = variant === "footer" || variant === "sign-in";
  return <div className={`fatima-brand fatima-brand--${variant}`}>
    <img className="fatima-brand__logo" src={full ? "/brand/fatima-logo.svg" : "/brand/fatima-mark.svg"} alt="" width={full ? 128 : 104} height={full ? 128 : 104} decoding="async" />
    <div className="fatima-brand__copy">
      <strong className="fatima-brand__name">Fatima Agro</strong>
      <span className="fatima-brand__descriptor">{variant === "portal" ? "Headquarters · Core system" : "Dealers and General Suppliers"}</span>
      {variant !== "portal" && <span className="fatima-brand__tagline">Growing Together Feeding Tomorrow</span>}
    </div>
  </div>;
}
