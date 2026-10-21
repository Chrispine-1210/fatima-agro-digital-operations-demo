"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Worker } from "tesseract.js";
import "./device-tools.css";

type CaptureTarget = { id: string; label: string; targetType: "receipt" | "goods-receipt" | "expense" };
type CaptureFile = { file: File; source: "camera" | "file"; sha256: string; url: string };
const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function ReceiptCapture({ targets, onAction }: { targets: CaptureTarget[]; onAction: (action: string, data: Record<string, unknown>) => Promise<unknown> }) {
  const uid = useId();
  const [target, setTarget] = useState("");
  const [capture, setCapture] = useState<CaptureFile | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [extracted, setExtracted] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [reading, setReading] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null);
  const imageUrl = useRef("");
  const ocrGeneration = useRef(0);
  const fileGeneration = useRef(0);
  const ocrField = useRef<HTMLTextAreaElement>(null);
  const requestKey = useRef("");
  const selectedTarget = targets.find(item => `${item.targetType}:${item.id}` === target) ?? targets[0];

  useEffect(() => () => {
    ocrGeneration.current++;
    fileGeneration.current++;
    void worker.current?.terminate().catch(() => {});
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
  }, []);

  function stopReading(showMessage = true) {
    ocrGeneration.current++;
    void worker.current?.terminate().catch(() => {});
    worker.current = null;
    setReading(false);
    setStage("");
    if (showMessage) setMessage("Text extraction stopped. You can enter the evidence reference manually.");
  }

  function clearFile() {
    fileGeneration.current++;
    stopReading(false);
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = "";
    setCapture(null); setExtracted(""); setHashing(false); setProgress(0); setPreviewFailed(false); requestKey.current = "";
  }

  async function chooseFile(file: File | undefined, source: "camera" | "file") {
    if (!file) return;
    clearFile(); setError(""); setMessage("");
    if ((!imageTypes.includes(file.type) && !(source === "file" && file.type === "application/pdf")) || file.size < 1 || file.size > 10_000_000) { setError("Choose a JPEG, PNG, WebP, HEIC, HEIF or PDF file up to 10 MB. Camera capture must be an image."); return; }
    if (!crypto.subtle) { setError("File fingerprints require HTTPS. You can still save a manual evidence reference."); return; }
    const token = fileGeneration.current;
    setHashing(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      if (token !== fileGeneration.current) return;
      const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      imageUrl.current = url;
      setCapture({ file, source, sha256, url });
      setMessage("File selected and fingerprinted on this device. Save a local copy before leaving this page.");
    } catch { if (token === fileGeneration.current) setError("The file could not be read. Choose it again or save a manual evidence reference."); }
    finally { if (token === fileGeneration.current) setHashing(false); }
  }

  async function extract() {
    if (!capture || reading || !capture.file.type.startsWith("image/")) return;
    stopReading(false); setError(""); setMessage(""); setExtracted(""); setProgress(0); setReading(true); setStage("Loading local text reader");
    const token = ocrGeneration.current;
    let activeWorker: Worker | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      const bitmap = await createImageBitmap(capture.file);
      if (token !== ocrGeneration.current) { bitmap.close(); return; }
      if (bitmap.width * bitmap.height > 40_000_000) { bitmap.close(); throw new Error("This image is too large to extract safely. Choose a smaller image or enter the reference manually."); }
      const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
      canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("This browser cannot prepare the image. Enter the reference manually."); }
      context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const { createWorker } = await import("tesseract.js");
      if (token !== ocrGeneration.current) return;
      activeWorker = await createWorker("eng", 1, {
        workerPath: "/vendor/ocr/worker.min.js", corePath: "/vendor/ocr/core", langPath: "/vendor/ocr/lang", workerBlobURL: false,
        logger: update => {
          if (token !== ocrGeneration.current) return;
          setStage(update.status === "recognizing text" ? "Reading receipt text" : "Preparing text reader");
          setProgress(Math.round(Math.max(0, Math.min(1, update.progress || 0)) * 100));
        },
      });
      if (token !== ocrGeneration.current) { await activeWorker.terminate(); activeWorker = null; return; }
      worker.current = activeWorker;
      const result = await activeWorker.recognize(canvas);
      if (token !== ocrGeneration.current) return;
      setExtracted(result.data.text.slice(0, 12000));
      setMessage("Text extracted locally. Check it against the original, then select only the reference or note you want to save.");
    } catch (cause) {
      if (token === ocrGeneration.current) setError(cause instanceof Error && cause.message.includes("manually") ? cause.message : "Text extraction could not finish. Try a clear JPEG or PNG image, or enter the evidence reference manually.");
    } finally {
      if (activeWorker) { await activeWorker.terminate().catch(() => {}); }
      if (worker.current === activeWorker) worker.current = null;
      if (canvas) { canvas.width = 1; canvas.height = 1; }
      if (token === ocrGeneration.current) { setReading(false); setStage(""); }
    }
  }

  function useSelection(as: "reference" | "note") {
    const field = ocrField.current;
    if (!field || field.selectionEnd <= field.selectionStart) { setError("Select the reference or note inside the extracted text first."); return; }
    const selection = extracted.slice(field.selectionStart, field.selectionEnd).replace(/\s+/g, " ").trim();
    if (as === "reference") setReference(selection.slice(0, 180)); else setNote(selection.slice(0, 500));
    requestKey.current = ""; setError("");
  }

  function download() {
    if (!capture) return;
    const url = URL.createObjectURL(capture.file), anchor = document.createElement("a");
    anchor.href = url; anchor.download = capture.file.name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selectedTarget || saving || hashing || reading) return;
    setError(""); setMessage(""); setSaving(true);
    requestKey.current ||= crypto.randomUUID();
    try {
      await onAction("finance.receiptCapture", {
        targetType: selectedTarget.targetType, targetId: selectedTarget.id, source: capture?.source ?? "manual",
        fileName: capture?.file.name.replace(/[\\/\u0000-\u001F\u007F]/g, "-").slice(0, 160) ?? "", mimeType: capture?.file.type ?? "", byteLength: capture?.file.size ?? 0, sha256: capture?.sha256 ?? "", reference: reference.trim(), note: note.trim(), idempotencyKey: requestKey.current,
      });
      setMessage("Evidence metadata saved. Your image and full extracted text remain on this device; no payment or stock movement was created.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The evidence could not be saved. Check the reference and try again."); }
    finally { setSaving(false); }
  }

  return <section className="dt-receipt-capture" aria-label="Receipt evidence capture">
    <div className="dt-privacy"><strong>Your receipt stays on your device.</strong><p>Take a photo or choose a file. Text extraction runs locally. Saving sends only the record link, file name, type, size, fingerprint and the reference and note you approve. Keep the original or download a copy.</p></div>
    <div className="dt-actions"><label className="dt-file-button">Take receipt photo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" disabled={saving || hashing || reading} onChange={event => { void chooseFile(event.target.files?.[0], "camera"); event.target.value = ""; }} /></label><label className="dt-file-button">Choose receipt file<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" disabled={saving || hashing || reading} onChange={event => { void chooseFile(event.target.files?.[0], "file"); event.target.value = ""; }} /></label></div>
    {hashing && <p role="status">Creating a SHA-256 fingerprint on this device...</p>}
    {capture && <div className="dt-capture-file">{capture.url && !previewFailed && <img src={capture.url} alt="Selected receipt preview held only on this device" onError={() => setPreviewFailed(true)} />}<div><strong>{capture.file.name}</strong><p>{(capture.file.size / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })} KB · {capture.file.type}</p><small>SHA-256: <span className="dt-fingerprint">{capture.sha256}</span></small><div className="dt-actions"><button type="button" className="dt-secondary" onClick={download}>Download local copy</button><button type="button" className="dt-secondary" onClick={clearFile} disabled={saving}>Remove file</button>{capture.file.type.startsWith("image/") && <button type="button" onClick={() => { void extract(); }} disabled={reading || saving}>Extract receipt text locally</button>}</div>{previewFailed && <p className="dt-hint">This browser cannot preview the image format. Save its fingerprint with a manual reference, or choose a JPEG or PNG copy for preview and text extraction.</p>}{capture.file.type === "application/pdf" && <p className="dt-hint">PDF fingerprints can be saved. For text extraction, photograph the receipt or choose a JPEG or PNG image.</p>}</div></div>}
    {reading && <div className="dt-progress" role="status"><label htmlFor={`${uid}-progress`}>{stage} · {progress}%</label><progress id={`${uid}-progress`} max={100} value={progress} /><button type="button" className="dt-secondary" onClick={() => stopReading()}>Cancel text extraction</button></div>}
    {extracted && <div className="dt-extracted"><label htmlFor={`${uid}-extracted`}>Extracted text - review and edit before using</label><textarea ref={ocrField} id={`${uid}-extracted`} rows={7} maxLength={12000} value={extracted} onChange={event => setExtracted(event.target.value)} /><small>This text is temporary and is never submitted in full.</small><div className="dt-actions"><button type="button" className="dt-secondary" onClick={() => useSelection("reference")}>Use selected text as reference</button><button type="button" className="dt-secondary" onClick={() => useSelection("note")}>Use selected text as note</button></div></div>}
    <form className="dt-capture-form" onSubmit={event => { void save(event); }}>
      <label htmlFor={`${uid}-target`}>Link evidence to a record</label><select id={`${uid}-target`} value={selectedTarget ? `${selectedTarget.targetType}:${selectedTarget.id}` : ""} disabled={!targets.length || saving} onChange={event => { setTarget(event.target.value); requestKey.current = ""; }}>{!targets.length && <option value="">No eligible records yet</option>}{targets.map(item => <option key={`${item.targetType}:${item.id}`} value={`${item.targetType}:${item.id}`}>{item.label}</option>)}</select>
      <label htmlFor={`${uid}-reference`}>Evidence reference</label><input id={`${uid}-reference`} value={reference} maxLength={180} required onChange={event => { setReference(event.target.value); requestKey.current = ""; }} placeholder="Receipt or document reference you have checked" />
      <label htmlFor={`${uid}-note`}>Reviewed note (optional)</label><textarea id={`${uid}-note`} value={note} rows={3} maxLength={500} onChange={event => { setNote(event.target.value); requestKey.current = ""; }} /><small>{note.length}/500 characters. Save only the details needed for this record.</small>
      <button type="submit" disabled={!selectedTarget || !reference.trim() || saving || hashing || reading}>{saving ? "Saving metadata..." : "Save evidence metadata"}</button>
    </form>
    {!targets.length && <p className="dt-hint">Create the payment receipt, goods receipt or expense record first, then link its evidence here.</p>}
    {message && <p className="dt-status" role="status">{message}</p>}{error && <p className="dt-error" role="alert">{error}</p>}
  </section>;
}
