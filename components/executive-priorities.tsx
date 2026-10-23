"use client";

import { ArrowUpRight, CheckCheck, ListChecks } from "lucide-react";
import { executivePriorities, type DecisionFilters } from "@/lib/executive-workbench";
import type { ExecutiveSnapshot } from "@/lib/portal-types";

export function ExecutivePriorities({ executive, onDecisionFocus }: { executive: ExecutiveSnapshot; onDecisionFocus: (filters: Partial<DecisionFilters>) => void }) {
  const priorities = executivePriorities(executive);
  return <section className="ex-agenda" aria-labelledby="ex-agenda-title"><div className="ex-agenda-head"><div><span className="ex-eyebrow">Management workbench</span><h2 id="ex-agenda-title">Where your attention matters.</h2><p>Recorded exceptions and review queues. Open a priority to inspect its evidence.</p></div><span className="ex-agenda-label"><ListChecks size={17} aria-hidden="true" />{priorities.length} attention areas</span></div>{priorities.length ? <div className="ex-agenda-grid">{priorities.map(item => <a className={`ex-priority-card ex-priority-card-${item.tone}`} key={item.id} href={item.href} onClick={() => item.decisionFilter && onDecisionFocus(item.decisionFilter)}><span className="ex-priority-count">{item.count.toLocaleString("en-GB")}<ArrowUpRight size={17} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.detail}</p><span className="ex-priority-link">Review records <span aria-hidden="true">→</span></span></a>)}</div> : <div className="ex-agenda-clear"><CheckCheck size={24} aria-hidden="true" /><div><strong>No exceptions in these queues.</strong><p>Continue reviewing financial activity, low stock and current decisions below.</p></div></div>}</section>;
}
