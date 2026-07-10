// Module: Public Health Officer Portal | Owner: Health Officer / Epidemiologist
import type { Metadata } from "next";
import { FileText, LineChart, MapPinOff } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ForecastChart } from "@/components/portal/ForecastChart";
import { EpiReportCard } from "@/components/portal/EpiReportCard";
import { HighRiskLGATable } from "@/components/portal/HighRiskLGATable";
import { DownloadReportButton } from "@/components/portal/DownloadReportButton";
import { getCholeraForecast, getEpiReport, getHighRiskLGAs } from "@/lib/data";

export const metadata: Metadata = { title: "Officer Portal" };

export default async function PortalPage() {
  const [forecast, report, highRiskLGAs] = await Promise.all([
    getCholeraForecast(),
    getEpiReport(),
    getHighRiskLGAs(),
  ]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="4-Week Cholera Forecast"
            subtitle="National projection with 90% confidence interval"
          />
          {forecast.length > 0 ? (
            <div className="p-5">
              <ForecastChart points={forecast} />
            </div>
          ) : (
            <EmptyState
              icon={LineChart}
              title="No forecast available"
              hint="Model output written to the forecast_points table will be projected here."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Weekly Epi Report"
            subtitle={
              report
                ? `${report.epiWeek} · ${report.periodLabel}`
                : "No report published yet"
            }
            action={report ? <DownloadReportButton report={report} /> : null}
          />
          {report ? (
            <div className="p-5">
              <EpiReportCard report={report} />
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No epi report yet"
              hint="The latest row in the epi_reports table becomes the weekly bulletin."
            />
          )}
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Top 5 High-Risk LGAs"
            subtitle="Model-predicted caseload for the coming epi week"
          />
          {highRiskLGAs.length > 0 ? (
            <HighRiskLGATable lgas={highRiskLGAs} />
          ) : (
            <EmptyState
              icon={MapPinOff}
              title="No LGA watchlist"
              hint="Model predictions in the high_risk_lgas table populate this watchlist."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
