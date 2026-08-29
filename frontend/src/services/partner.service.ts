import { api } from "./api";

export async function listIncomingApplications() {
  const res = await api.get("/partner/incoming");
  return res.data.routings;
}

export async function decideRouting(id: string, decision: "ACCEPTED" | "REJECTED") {
  const res = await api.patch(`/partner/routings/${id}`, { decision });
  return res.data.routing;
}
