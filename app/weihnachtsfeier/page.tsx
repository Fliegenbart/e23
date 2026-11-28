import type { Metadata } from "next";
import { feier } from "@/lib/feier";
import { Invitation } from "./invitation";

const description =
  "14.12.2026 ab 16:00, Esplanade 23. Netzwerken. Austauschen. Kekse. Glühwein.";
/** The preview that messengers and social networks show for the link. */
export const metadata: Metadata = {
  title: "Weihnachtsfeier — E23",
  description,
  metadataBase: new URL(feier.url),
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    title: "Weihnachtsfeier. Miteinander.",
    description,
    images: [{ url: "/feier/og-de.png", width: 1200, height: 630, alt: "Einladung zur Weihnachtsfeier an der Esplanade 23" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function FeierPage() {
  return <Invitation lang="de" />;
}
