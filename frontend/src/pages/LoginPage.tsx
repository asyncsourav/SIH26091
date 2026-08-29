import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

interface LoginForm {
  phone: string;
  password: string;
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<LoginForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    setError(null);
    try {
      await login(data.phone, data.password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <Card>
        <h1 className="mb-6 font-display text-2xl text-paper-100">{t("auth.loginTitle")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t("auth.phone")} {...register("phone", { required: true })} />
          <Input label={t("auth.password")} type="password" {...register("password", { required: true })} />
          {error && <p className="text-sm text-terracotta-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("nav.login")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-paper-300">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-turmeric-400 hover:underline">
            {t("nav.register")}
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-paper-300/60">
          Demo: 9999900001 / Demo@12345
        </p>
      </Card>
    </div>
  );
}
