import reportJson from "@/data/report-data.json";
import changes from "@/data/changes-2027.json";
import { requireSession } from "@/lib/auth";
import type { ReportData } from "@/lib/types";
import { Dashboard } from "./dashboard";

export default async function Home() {
  await requireSession();
  return <Dashboard report={reportJson as ReportData} changes={changes} />;
}
