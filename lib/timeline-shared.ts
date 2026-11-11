/** Roadmap vocabulary shared by the API and the client. */
export const lanes = [
  { id: "kunden", label: "Kunden" },
  { id: "produkte", label: "Produkte" },
  { id: "formate", label: "Formate & Events" },
  { id: "intern", label: "Intern" },
] as const;
export const statuses = [
  { id: "idee", label: "Idee" },
  { id: "geplant", label: "Geplant" },
  { id: "fix", label: "Fix" },
  { id: "erledigt", label: "Erledigt" },
] as const;

export type Lane = (typeof lanes)[number]["id"];
export type Status = (typeof statuses)[number]["id"];
export type Entry = {
  id: string;
  title: string;
  lane: Lane;
  status: Status;
  starts: string;
  ends: string | null;
  owner: string;
  note: string;
  version: number;
  updated_at: string;
};
