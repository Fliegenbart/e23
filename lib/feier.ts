/** Weihnachtsfeier 2026: one place for the date, so page and calendar file agree. */
export const feier = {
  title: "E23 Weihnachtsfeier",
  place: "Esplanade 23",
  /** 14.12.2026, 16:00 Uhr in Berlin (CET, UTC+1). */
  start: "2026-12-14T15:00:00Z",
  /** No end was announced; the calendar entry blocks the evening. */
  end: "2026-12-14T21:00:00Z",
};

/**
 * Who is legally responsible for the invitation. Shown in Impressum and
 * Datenschutzhinweis; an empty required field is flagged on the page.
 */
export const legal = {
  /** Person or company responsible, e.g. "Muster GmbH". */
  name: "",
  street: "",
  /** Postcode and city. */
  city: "",
  email: "",
  /** Optional from here on. */
  phone: "",
  /** For a company: who represents it, e.g. "Geschäftsführerin: …". */
  represented: "",
  /** For a company: e.g. "Amtsgericht …, HRB …". */
  register: "",
  vatId: "",
  /** When sign-ups are deleted, e.g. "2027-01-31". */
  deleteBy: "",
};
