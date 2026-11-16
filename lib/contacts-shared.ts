/** Leads and contacts, shared by the API and the client. */
export const stages = [
  { id: "neu", label: "Neu" },
  { id: "kontaktiert", label: "Kontaktiert" },
  { id: "gespraech", label: "Im Gespräch" },
  { id: "angebot", label: "Angebot" },
  { id: "gewonnen", label: "Gewonnen" },
  { id: "ruhend", label: "Ruhend" },
] as const;
export type Stage = (typeof stages)[number]["id"];
export type ContactKind = "lead" | "kontakt";
export type Contact = {
  id: string;
  kind: ContactKind;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  /** Only meaningful for leads. */
  stage: Stage;
  source: string;
  owner: string;
  next_step: string;
  next_date: string | null;
  note: string;
  /** Linked project or idea, if any. */
  item_id: string | null;
  version: number;
  updated_at: string;
};
