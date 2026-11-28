import type { Metadata } from "next";
import { feier } from "@/lib/feier";
import { Invitation } from "../invitation";

const description =
  "14 December 2026 from 4 pm, Esplanade 23. Networking. Conversation. Cookies. Mulled wine.";
/** The preview that messengers and social networks show for the link. */
export const metadata: Metadata = {
  title: "Christmas party — E23",
  description,
  metadataBase: new URL(feier.url),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/en",
    title: "Christmas party. Together.",
    description,
    images: [{ url: "/feier/og-en.png", width: 1200, height: 630, alt: "Invitation to the Christmas party at Esplanade 23" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function FeierPageEn() {
  return <Invitation lang="en" />;
}
