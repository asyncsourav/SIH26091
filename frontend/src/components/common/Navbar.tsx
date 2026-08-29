import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "./LanguageToggle";

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-ink-700">
      <div className="stitch-divider" />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-paper-100">
          <Sprout className="h-6 w-6 text-turmeric-400" strokeWidth={1.75} />
          Gram Vyapaar
        </Link>

        <div className="flex items-center gap-4">
          <LanguageToggle />
          {user ? (
            <>
              <Link to="/applications" className="text-sm text-paper-200 hover:text-turmeric-400">
                {t("nav.myApplications")}
              </Link>
              {user.role === "ADMIN" && (
                <Link to="/admin" className="text-sm text-paper-200 hover:text-turmeric-400">
                  {t("nav.admin")}
                </Link>
              )}
              {user.role === "PARTNER" && (
                <Link to="/partner" className="text-sm text-paper-200 hover:text-turmeric-400">
                  {t("nav.partner")}
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-paper-200 hover:text-turmeric-400">
                {t("nav.login")}
              </Link>
              <Button onClick={() => navigate("/register")}>{t("nav.register")}</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
