import { api } from "./api";
import type { Application, FeasibilityReport } from "@/types";

/** Public, unauthenticated fetch of the seeded Sunita demo persona. */
export async function getSunitaDemo(): Promise<{ application: Application; report: FeasibilityReport }> {
  const res = await api.get("/demo/sunita");
  return res.data;
}
