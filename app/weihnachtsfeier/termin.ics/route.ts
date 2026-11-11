import { NextResponse } from "next/server";
import { authenticated } from "@/lib/auth";
import { feier } from "@/lib/feier";

export const dynamic = "force-dynamic";

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");

export async function GET() {
  if (!(await authenticated()))
    return new NextResponse("Unauthorized", { status: 401 });
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//E23//Weihnachtsfeier//DE",
    "BEGIN:VEVENT",
    "UID:weihnachtsfeier-2026@e23",
    `DTSTAMP:${stamp(feier.start)}`,
    `DTSTART:${stamp(feier.start)}`,
    `DTEND:${stamp(feier.end)}`,
    `SUMMARY:${feier.title}`,
    `LOCATION:${feier.place}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="e23-weihnachtsfeier.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
