import { api, setAccessToken } from "./api";
import type { PublicUser } from "@/types";

export interface RegisterInput {
  phone: string;
  name: string;
  password: string;
  village: string;
  block: string;
  district: string;
  aadhaarLast4?: string;
  dob?: string;
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const res = await api.post("/auth/register", input);
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

export async function login(phone: string, password: string): Promise<PublicUser> {
  const res = await api.post("/auth/login", { phone, password });
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  setAccessToken(null);
}

export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const res = await api.get("/auth/me");
    return res.data.user;
  } catch {
    return null;
  }
}

export async function silentRefresh(): Promise<boolean> {
  try {
    const res = await api.post("/auth/refresh");
    setAccessToken(res.data.accessToken);
    return true;
  } catch {
    return false;
  }
}
