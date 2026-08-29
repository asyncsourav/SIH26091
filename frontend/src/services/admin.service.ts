import { api } from "./api";

export async function listDuplicateReviews() {
  const res = await api.get("/admin/duplicate-reviews");
  return res.data.reviews;
}

export async function decideDuplicateReview(id: string, status: "APPROVED" | "REJECTED", notes?: string) {
  const res = await api.patch(`/admin/duplicate-reviews/${id}`, { status, notes });
  return res.data.review;
}

export async function listAllApplications() {
  const res = await api.get("/admin/applications");
  return res.data.applications;
}

export async function listSchemes() {
  const res = await api.get("/schemes");
  return res.data.schemes;
}

export async function updateScheme(id: string, data: Record<string, unknown>) {
  const res = await api.patch(`/schemes/${id}`, data);
  return res.data.scheme;
}
