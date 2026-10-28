import { Calendar, ChevronDown } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FinancePeriodSelect({ year, onChange, prominent = false }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([2023, 2024, 2025, 2026, 2027, currentYear])).sort((a, b) => a - b);
  return (
    <label className={`finance-period-select ${prominent ? "is-prominent" : ""}`}>
      {prominent && <span className="finance-period-icon"><Calendar size={21} /></span>}
      <span className="finance-period-fields">
        {prominent && <span className="finance-period-caption">Periode Aktif</span>}
        <select aria-label="Periode laporan keuangan" value={year} onChange={event => onChange(event.target.value === "all" ? "all" : Number(event.target.value))}>
          <option value="all">Semua Tahun</option>
          {years.map(value => <option value={value} key={value}>{prominent ? value : `Tahun ${value}`}</option>)}
        </select>
      </span>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}

const CHART_COLORS = {
  income: ["#00a77b", "#8be3c4"],
  expense: ["#ff4267", "#ffb3c3"],
  balance: ["#5855ff", "#b7b0ff"],
  budget: ["#ffab20", "#ffd26a"],
};

export function FinanceChartCard({ title, icon, tone, data, barKey, barLabel, lineKey, lineLabel, year, onYearChange, tickFormatter, tooltip }) {
  const Icon = icon;
  const [color, pale] = CHART_COLORS[tone];
  return (
    <section className={`finance-panel finance-chart finance-tone-${tone}`} aria-label={title}>
      <div className="finance-panel-heading">
        <div className="finance-panel-title"><span className="finance-section-icon"><Icon size={20} strokeWidth={2.5} /></span><h2>{title}</h2></div>
        <FinancePeriodSelect year={year} onChange={onYearChange} />
      </div>
      <div className="finance-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 14, right: 7, left: -14, bottom: 3 }} barCategoryGap="64%">
            <defs>
              <linearGradient id={`finance-area-${tone}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={pale} stopOpacity={0.32} /><stop offset="100%" stopColor={pale} stopOpacity={0.03} /></linearGradient>
              <linearGradient id={`finance-bar-${tone}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.85} /><stop offset="100%" stopColor={color} /></linearGradient>
            </defs>
            <CartesianGrid stroke="#edf1f7" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b83a4" }} interval={0} tickMargin={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b83a4" }} tickFormatter={tickFormatter} width={51} tickCount={5} />
            <Tooltip content={tooltip} cursor={{ stroke: "#dce5f0", strokeDasharray: "3 3" }} />
            <Area name={lineLabel} type="monotone" dataKey={lineKey} stroke={pale} strokeWidth={1.5} fill={`url(#finance-area-${tone})`} dot={{ r: 2.5, fill: pale, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Bar name={barLabel} dataKey={barKey} fill={`url(#finance-bar-${tone})`} radius={[2, 2, 0, 0]} maxBarSize={16} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="finance-chart-legend"><span><i style={{ background: color }} />{barLabel}</span><span><i style={{ background: pale }} />{lineLabel}</span></div>
    </section>
  );
}

export function FinanceIllustration() {
  return (
    <svg className="finance-illustration" viewBox="0 0 230 140" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="finance-laptop-frame" x1="75" y1="10" x2="174" y2="112" gradientUnits="userSpaceOnUse"><stop stopColor="#325ccc" /><stop offset="1" stopColor="#132d77" /></linearGradient>
        <linearGradient id="finance-laptop-base" x1="43" y1="104" x2="146" y2="136" gradientUnits="userSpaceOnUse"><stop stopColor="#a9c9ff" /><stop offset="1" stopColor="#4b79e4" /></linearGradient>
      </defs>
      <ellipse cx="119" cy="125" rx="98" ry="10" fill="#80a9ec" opacity=".18" />
      <path d="M76 15 172 34 161 115 65 95Z" fill="url(#finance-laptop-frame)" />
      <path d="M81 20 167 38 157 106 71 91Z" fill="#f8fbff" />
      <path d="m66 95 96 20-37 20-94-23Z" fill="url(#finance-laptop-base)" />
      <path d="m70 100 78 16-24 13-76-17Z" fill="#3f68cf" opacity=".8" />
      <path d="m87 124 21 4 9-5-21-4Z" fill="#b2caff" />
      {[0, 1, 2, 3].map(row => <path key={row} d={`m${63 + row * 5} ${110 - row * 2} 65 14`} stroke="#97baff" strokeWidth="1.5" />)}
      {[0, 1, 2, 3, 4, 5, 6].map(col => <path key={col} d={`m${75 + col * 9} ${104 + col * 1.8} -17 9`} stroke="#97baff" strokeWidth="1" />)}
      <path d="m88 34 29 6m-30 2 18 4" stroke="#bdcdee" strokeWidth="3" strokeLinecap="round" />
      <path d="m83 65 5-8 13 5 14-13 12 7 13-9 12 5" stroke="#6a9bfa" strokeWidth="2" />
      <path d="m82 84 69 14" stroke="#dce7fa" strokeWidth="1.5" />
      <path d="m91 80 2-14 7 1-2 14Zm16 4 3-22 7 2-3 21Zm16 3 4-27 7 2-4 26Zm16 3 4-18 7 2-4 17Z" fill="#5c8ff5" />
      <path d="m37 22 23 5-4 33-23-5Z" fill="#eff6ff" /><path d="m41 31 13 3m-14 4 9 2m-10 4 12 3" stroke="#bbd3ff" strokeWidth="2" />
      <path d="m153 13 33 7-3 21-33-7Z" fill="#a4c5ff" opacity=".75" /><path d="m158 22 20 4m-21 3 13 3" stroke="#e2eeff" strokeWidth="2" />
      <path d="m171 49 30 6-4 33-30-6Z" fill="#e6f0ff" opacity=".85" /><path d="m175 56 18 4m-19 4 14 3m-15 4 18 4" stroke="#a4c6ff" strokeWidth="2" />
      <path d="m191 112 3-34" stroke="#12946e" strokeWidth="2.5" /><path d="M194 97c-19-6-15-20-11-21 6 1 11 13 11 21Zm0-8c1-18 10-24 13-18 2 8-4 14-13 18Zm-2 18c-13-3-17-13-11-14 6 0 10 6 11 14Zm3-6c6-15 15-16 15-9-1 6-8 8-15 9Z" fill="#2cc494" />
      <path d="m183 109 21 3-3 18-16-2Z" fill="#284c83" /><path d="m185 112 17 3" stroke="#426da3" strokeWidth="2" />
      <path d="m43 102 1-25" stroke="#30a27a" strokeWidth="2" /><path d="M44 91c-13-4-13-15-8-15 5 3 7 8 8 15Zm1-4c2-13 9-18 12-13 0 6-5 12-12 13Z" fill="#52c990" /><path d="m34 97 21 4-3 19-15-3Z" fill="#ffc84a" />
      <ellipse cx="61" cy="115" rx="10" ry="3" fill="#f5ae23" /><path d="M51 111v4c0 4 20 4 20 0v-4" fill="#ffc84a" /><ellipse cx="61" cy="111" rx="10" ry="3" fill="#ffdd71" /><path d="M51 107v4c0 4 20 4 20 0v-4" fill="#ffc84a" /><ellipse cx="61" cy="107" rx="10" ry="3" fill="#ffdf7c" />
    </svg>
  );
}
