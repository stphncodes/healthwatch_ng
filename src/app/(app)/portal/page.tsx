// Module: Public Health Officer Portal | Owner: Health Officer / Epidemiologist
import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/Card";
import { ForecastChart } from "@/components/portal/ForecastChart";
import { EpiReportCard } from "@/components/portal/EpiReportCard";
import { HighRiskLGATable } from "@/components/portal/HighRiskLGATable";
import { DownloadReportButton } from "@/components/portal/DownloadReportButton";
import { EPI_REPORT } from "@/lib/mockData";

export const metadata: Metadata = { title: "Officer Portal" };

export default function PortalPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="4-Week Cholera Forecast"
            subtitle="National projection with 90% confidence interval"
          />
          <div className="p-5">
            <ForecastChart />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Weekly Epi Report"
            subtitle={`${EPI_REPORT.epiWeek} · ${EPI_REPORT.periodLabel}`}
            action={<DownloadReportButton />}
          />
          <div className="p-5">
            <EpiReportCard />
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Top 5 High-Risk LGAs"
            subtitle="Model-predicted caseload for the coming epi week"
          />
          <HighRiskLGATable />
        </Card>
      </section>
    </div>
  );
}
