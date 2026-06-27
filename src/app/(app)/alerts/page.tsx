// Module: Outbreak Alert Management | Owner: Backend / Platform Engineer
import type { Metadata } from "next";
import { AlertsClient } from "@/components/alerts/AlertsClient";

export const metadata: Metadata = { title: "Outbreak Alerts" };

export default function AlertsPage() {
  return <AlertsClient />;
}
