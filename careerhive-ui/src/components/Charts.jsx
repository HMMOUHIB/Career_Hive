import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Validated pair (dataviz validator): ember #F2554A/#4896CA on #3A1519, frost #2F7BF6/#E07A20 on #FFF.
// No recharts entrance animations: they re-render the whole SVG through React every frame for a second, while the
// page's own reveal is already running. The cards still rise in with the page.
const SERIES = [
  { color: 'var(--chart-a)' },
  { color: 'var(--chart-b)' },
]

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tt">
      <b>{label}</b>
      {payload.map((p) => (
        <div key={p.dataKey}><i style={{ background: p.color }} />{p.name}: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.value}</span></div>
      ))}
    </div>
  )
}

/** Grouped weekly bars for up to two series. series: [{key, name}] */
export function WeeklyBars({ data, series, height = 220 }) {
  return (
    <>
      <div className="legend" style={{ marginBottom: 10 }}>
        {series.map((s, i) => <span key={s.key}><i style={{ background: SERIES[i].color, height: 10, width: 10, borderRadius: 3 }} />{s.name}</span>)}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--dim)', fontSize: 11 }} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--dim)', fontSize: 11 }} />
          <Tooltip content={<Tip />} cursor={{ fill: 'color-mix(in srgb, var(--text) 6%, transparent)' }} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={SERIES[i].color} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

/** Single-series radar: skill mastery. Reference ring (target) is drawn dashed. */
export function MasteryRadar({ data, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11.5 }} />
        <Tooltip content={<Tip />} />
        <Radar name="Target" dataKey="target" stroke="var(--dim)" strokeDasharray="4 4" strokeWidth={1.5} fill="none" isAnimationActive={false} />
        <Radar name="Mastery" dataKey="score" stroke="var(--chart-a)" strokeWidth={2} fill="var(--chart-a)" fillOpacity={0.22} dot={{ r: 3, fill: 'var(--chart-a)' }} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
