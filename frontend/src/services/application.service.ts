import { api } from "./api";
import type { Application, EmiScheduleRow, FeasibilityReport, FinancialBreakdown } from "@/types";

export async function computePreview(
  marginCapital: number
): Promise<{ breakdown: FinancialBreakdown; emiSchedule: EmiScheduleRow[] }> {
  const res = await api.post("/calculator/compute", { marginCapital });
  return res.data;
}

export async function createApplication(input: {
  marginCapital: number;
  businessCategory: string;
}): Promise<{ application: Application; emiSchedule: EmiScheduleRow[] }> {
  const res = await api.post("/applications", input);
  return res.data;
}

export async function getApplication(id: string) {
  const res = await api.get(`/applications/${id}`);
  return res.data.application;
}

export async function listMyApplications(): Promise<Application[]> {
  const res = await api.get("/applications/mine");
  return res.data.applications;
}

export async function generateReport(
  applicationId: string
): Promise<{ report: FeasibilityReport; competitorPins?: unknown[] }> {
  const res = await api.post(`/applications/${applicationId}/report`);
  return res.data;
}

export async function getReport(applicationId: string): Promise<FeasibilityReport> {
  const res = await api.get(`/applications/${applicationId}/report`);
  return res.data.report;
}

export async function routeToPartners(applicationId: string) {
  const res = await api.post(`/applications/${applicationId}/route`);
  return res.data;
}
