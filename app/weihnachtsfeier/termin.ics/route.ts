import { NextResponse } from "next/server";
import { feier } from "@/lib/feier";

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
/** iCalendar text: backslash, comma, semicolon and line breaks are escaped. */
const text = (value: string) =>
  value.replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");

/**
 * The party as a calendar file. Plain .ics with UTC times opens in Apple
 * Calendar, Outlook (Windows and Mac) and Google Calendar alike.
 */
export function GET() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//E23//Weihnachtsfeier//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:weihnachtsfeier-2026@e23",
    `DTSTAMP:${stamp(feier.start)}`,
    `DTSTART:${stamp(feier.start)}`,
    `DTEND:${stamp(feier.end)}`,
    `SUMMARY:${text(feier.title)}`,
    `LOCATION:${text(feier.place)}`,
    `DESCRIPTION:${text(feier.note)}`,
    `URL:${feier.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="e23-weihnachtsfeier.ics"',
          },
  });
}
