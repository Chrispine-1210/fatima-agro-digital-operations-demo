# Browser devices and receipt evidence

The inventory and Accounting workspaces support phones, keyboard-emulating USB barcode scanners and browser-connected thermal or office printers. Transactions remain captured demonstration records. Physical equipment is not provisioned by the application.

## Barcodes and SKU lookup

Each internal product barcode encodes its approved SKU using Code 128. These are internal identifiers, not manufacturer-assigned GTINs. Generated labels preserve the white quiet zones, contain human-readable text, and can be downloaded as SVG or opened in a dedicated print view. Label printing defaults to an 80 mm paper layout; the browser and printer driver control the final paper selection, scaling and output.

A USB scanner can type into the SKU/barcode field and send Enter. Camera scanning begins only after the operator chooses the camera button and grants browser permission. Native BarcodeDetector is used when its supported formats include Code 128; otherwise ZXing decodes locally. Image-file decoding and manual entry remain available. The camera stops on a successful scan, cancellation or component unmount. A scan only selects a product; a reviewed action is required to change stock.

## Receipt photos and local text extraction

Use Take receipt photo on a phone or Choose receipt file on a computer. The original file is fingerprinted with SHA-256 inside the browser. Images can be previewed and downloaded locally. PDFs can be fingerprinted and linked as metadata, but are not accepted by the image OCR engine.

Extract receipt text locally loads a self-hosted Tesseract.js worker, matching WebAssembly core and English LSTM model. Image pixels are processed in browser memory. Full extracted text remains temporary and editable. Operators select only the relevant text to copy to a checked reference or note; text extraction never creates a payment, approves evidence or changes stock.

Saving evidence submits the linked record ID/type, source, filename, MIME type, size, SHA-256 hash, checked reference (180 characters maximum), note (500 characters maximum) and an idempotency key. The server rejects pixels, base64 files and unknown fields. No image archive is created. Keep the original receipt or download a copy before leaving the page. A fingerprint identifies a file; it does not establish authenticity or settlement.

Files are limited to 10,000,000 bytes. Camera files must be JPEG, PNG, WebP, HEIC or HEIF images. File selection additionally accepts PDFs. Preview and OCR support for HEIC/HEIF depend on the browser; a JPEG/PNG copy or manual reference remains available. Image OCR is downscaled to a maximum dimension of 2,200 pixels and rejects images exceeding 40 million pixels.

## Build and licensing

Run `npm ci`, then `npm run build`. The `prebuild` script runs `node scripts/prepare-ocr-assets.mjs`; this copies assets from pinned installed packages to ignored `public/vendor/ocr/`. Run the preparation script directly before development if assets have not been generated. The build copies these assets into the deployment output. Third-party assets and full receipt images are never fetched from a public OCR service.

`docs/ocr-asset-manifest.json` records exact versions, sizes and SHA-256 hashes. Generated assets are intentionally excluded from Git history. Tesseract.js, its core and ZXing library are Apache-2.0. The English data npm distribution declares MIT; the upstream English model originates from Tesseract's Apache-2.0 training-data project. JsBarcode and ZXing browser are MIT. The preparation script copies bundled license notices and English-data package attribution into the generated license directory. Preserve these notices when redistributing.

Camera APIs require HTTPS (or localhost), user permission and an appropriate camera Permissions Policy. Camera input selectors are browser hints and may open a normal file picker on desktop. Browser printing opens a user-controlled dialog; the app cannot silently select a printer, guarantee physical output, open a cash drawer, or confirm that paper was printed. Direct ESC/POS, serial, Bluetooth, cash-drawer and managed-kiosk printing require a separately configured hardware adapter and deployment policy.

Primary implementation references:

- https://github.com/lindell/JsBarcode
- https://github.com/zxing-js/browser
- https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture
- https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
- https://github.com/naptha/tesseract.js/blob/master/docs/api.md
- https://github.com/naptha/tessdata
- https://developer.mozilla.org/en-US/docs/Web/API/Window/print
- https://developers.cloudflare.com/workers/platform/limits/#static-assets
