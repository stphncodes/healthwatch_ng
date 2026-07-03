// Module: Outbreak Alert Management | Owner: Backend / Platform Engineer
import type { Metadata } from "next";
import { AlertsClient } from "@/components/alerts/AlertsClient";
import { getOutbreakAlerts } from "@/lib/data";

export const metadata: Metadata = { title: "Outbreak Alerts" };

export default async function AlertsPage() {
  const alerts = await getOutbreakAlerts();
  return <AlertsClient initialAlerts={alerts} />;
}
