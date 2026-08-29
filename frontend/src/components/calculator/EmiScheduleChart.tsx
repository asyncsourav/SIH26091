import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import type { EmiScheduleRow } from "@/types";

export function EmiScheduleChart({ schedule }: { schedule: EmiScheduleRow[] }) {
  const { t } = useTranslation();
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    quarter: `Q${row.quarter}`,
    balance: row.closingBalance,
    interest: row.interestPaid,
    principal: row.principalPaid
  }));

  return (
    <Card>
      <h3 className="mb-4 font-display text-xl text-paper-100">{t("calculator.emiTitle")}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D9A441" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#D9A441" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#28454C" />
            <XAxis dataKey="quarter" stroke="#DED0AE" fontSize={11} interval={2} />
            <YAxis stroke="#DED0AE" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#1E3339", border: "1px solid #28454C", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
            />
            <Area type="monotone" dataKey="balance" stroke="#E8B646" fill="url(#balanceGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
