export class PortalError extends Error {
  status: number; code: string;
  constructor(message: string, status = 400, code = "VALIDATION") { super(message); this.status = status; this.code = code; }
}
export function ensure(condition: unknown, message: string, status = 400, code = "VALIDATION"): asserts condition { if (!condition) throw new PortalError(message, status, code); }
export function textField(value: unknown, name: string, max = 500, optional = false) { ensure(typeof value === "string" || (optional && value === undefined), `${name} is required.`); const text = (value as string | undefined)?.trim() ?? ""; ensure((optional || text.length > 0) && text.length <= max, `${name} must contain ${optional ? "0" : "1"}–${max} characters.`); return text; }
export function integer(value: unknown, name: string, min = 1, max = 1_000_000_000_000) { ensure(typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max, `${name} must be a whole number from ${min} to ${max}.`); return value; }
export function emailField(value: unknown, optional = false) { const email = textField(value, "Email", 254, optional).toLowerCase(); ensure((optional && !email) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address."); return email; }
export function dateField(value: unknown, name: string) { const valueText = textField(value, name, 30); ensure(/^\d{4}-\d{2}-\d{2}$/.test(valueText) && !Number.isNaN(Date.parse(`${valueText}T00:00:00Z`)), `${name} must be a valid YYYY-MM-DD date.`); ensure(new Date(`${valueText}T00:00:00Z`).toISOString().slice(0, 10) === valueText, `${name} is not a calendar date.`); return valueText; }
