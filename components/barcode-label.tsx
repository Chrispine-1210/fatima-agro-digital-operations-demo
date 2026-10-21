"use client";

import { useEffect, useRef, useState } from "react";
import "./device-tools.css";

export function BarcodeLabel({ value, caption, showActions = true, showHelp = true, onReady }: { value: string; caption?: string; showActions?: boolean; showHelp?: boolean; onReady?: (ready: boolean) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    let current = true;
    setReady(false);
    onReadyRef.current?.(false);
    setError("");
    if (!value || value.length > 80 || !/^[\x20-\x7E]+$/.test(value)) {
      setError("Use 1 to 80 printable characters for a Code 128 label.");
      return;
    }
    import("jsbarcode").then(({ default: JsBarcode }) => {
      if (!current || !svg.current) return;
      JsBarcode(svg.current, value, { format: "CODE128", width: 2, height: 64, margin: 16, fontSize: 15, textMargin: 8, background: "#ffffff", lineColor: "#000000" });
      setReady(true);
      onReadyRef.current?.(true);
    }).catch(() => { if (current) setError("The label could not load. Try again after refreshing."); });
    return () => { current = false; };
  }, [value]);

  function download() {
    if (!svg.current || !ready) return;
    const copy = svg.current.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${value.replace(/[^a-z0-9_-]/gi, "-")}-barcode.svg`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function print() {
    if (!svg.current || !ready) return;
    const popup = window.open("", "_blank", "width=720,height=620");
    if (!popup) { setError("Allow the print preview window, then choose Print label again."); return; }
    popup.opener = null;
    popup.document.title = `${value} - Fatima Agro label`;
    const style = popup.document.createElement("style");
    style.textContent = "@page{size:80mm 60mm;margin:4mm}*{box-sizing:border-box}body{margin:0;font:12px Arial,sans-serif;color:#000}main{max-width:72mm;margin:0 auto;text-align:center}h1{font-size:12px;margin:0 0 3mm}p{font-size:10px;overflow-wrap:anywhere;margin:2mm 0}svg{display:block;max-width:100%;height:auto;margin:auto}small{font-size:8px}";
    popup.document.head.appendChild(style);
    const main = popup.document.createElement("main");
    const heading = popup.document.createElement("h1");
    heading.textContent = "FATIMA AGRO";
    const description = popup.document.createElement("p");
    description.textContent = caption || "Internal inventory label";
    const note = popup.document.createElement("small");
    note.textContent = "Internal Code 128 - not a manufacturer GTIN";
    main.appendChild(heading);
    main.appendChild(description);
    main.appendChild(svg.current.cloneNode(true));
    main.appendChild(note);
    popup.document.body.appendChild(main);
    popup.focus();
    // Printing remains a browser dialog; paper selection and output are controlled by the user.
    popup.requestAnimationFrame(() => popup.print());
  }

  return <div className="dt-barcode-label">
    {caption && <p className="dt-label-caption">{caption}</p>}
    <div className="dt-barcode-canvas"><svg ref={svg} role="img" aria-label={`Code 128 barcode for ${value}`} /></div>
    {showHelp && <small>Internal Code 128. Keep the full label and white margins when printing.</small>}
    {error && <p className="dt-error" role="alert">{error}</p>}
    {showActions && <div className="dt-actions"><button type="button" onClick={print} disabled={!ready}>Print label</button><button type="button" className="dt-secondary" onClick={download} disabled={!ready}>Download SVG</button></div>}
  </div>;
}
