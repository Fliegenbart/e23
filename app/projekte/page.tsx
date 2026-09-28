import { authenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Workspace from "./workspace";
import "./workspace.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Projekte & Ideen — E23" };
export default async function ProjectsPage() {
  if (!(await authenticated())) redirect("/?next=projekte");
  return (
    <Suspense
      fallback={<div className="ws-loading">Unser Labor wird geöffnet …</div>}
    >
      <Workspace />
    </Suspense>
  );
}
