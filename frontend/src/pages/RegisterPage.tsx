import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

interface RegisterForm {
  name: string;
  phone: string;
  password: string;
  village: string;
  block: string;
  district: string;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<RegisterForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    setError(null);
    try {
      await registerUser(data);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <Card>
        <h1 className="mb-6 font-display text-2xl text-paper-100">{t("auth.registerTitle")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t("auth.name")} {...register("name", { required: true })} />
          <Input label={t("auth.phone")} {...register("phone", { required: true })} />
          <Input label={t("auth.password")} type="password" {...register("password", { required: true, minLength: 8 })} />
          <Input label={t("wizard.village")} {...register("village", { required: true })} />
          <Input label={t("wizard.block")} {...register("block", { required: true })} />
          <Input label={t("wizard.district")} {...register("district", { required: true })} />
          {error && <p className="text-sm text-terracotta-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("nav.register")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-paper-300">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="text-turmeric-400 hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
