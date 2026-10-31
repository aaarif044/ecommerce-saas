"use client";

import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export const CHART_COLORS = [
  "#5a5de3",
  "#0ea5e9",
  "#059669",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];

export interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: number | string, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-md">
      {label !== undefined ? (
        <p className="mb-1 text-2xs font-medium text-ink-subtle">{label}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-ink-muted">{item.name}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">
              {formatter
                ? formatter(item.value ?? 0, String(item.name ?? ""))
                : typeof item.value === "number"
                  ? item.value.toLocaleString("en-IN")
                  : item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartFrame({
  height = 260,
  children,
  className,
}: {
  height?: number;
  children: React.ReactElement;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function GridLines({ vertical = false }: { vertical?: boolean }) {
  return (
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="var(--line)"
      vertical={vertical}
      horizontal={!vertical}
    />
  );
}

export function AxisLine() {
  return (
    <>
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={{ stroke: "var(--line)" }}
        tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
        dy={6}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={44}
        tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
        tickFormatter={(value: number) =>
          Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
        }
      />
    </>
  );
}

export function AreaTrendChart({
  data,
  dataKey,
  name,
  color = CHART_COLORS[0],
  height,
  formatter,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  name: string;
  color?: string;
  height?: number;
  formatter?: (value: number | string, name: string) => string;
}) {
  const gradientId = React.useId();
  return (
    <ChartFrame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <GridLines />
        <AxisLine />
        <Tooltip
          content={<ChartTooltip formatter={formatter} />}
          cursor={{ stroke: "var(--line-strong)" }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartFrame>
  );
}

export function BarTrendChart({
  data,
  dataKey,
  name,
  color = CHART_COLORS[0],
  height,
  formatter,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  name: string;
  color?: string;
  height?: number;
  formatter?: (value: number | string, name: string) => string;
}) {
  return (
    <ChartFrame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <GridLines />
        <AxisLine />
        <Tooltip
          content={<ChartTooltip formatter={formatter} />}
          cursor={{ fill: "var(--surface-2)" }}
        />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartFrame>
  );
}

export function LineTrendChart({
  data,
  series,
  height,
}: {
  data: Record<string, unknown>[];
  series: { dataKey: string; name: string; color?: string }[];
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <GridLines />
        <AxisLine />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--ink-muted)" }}
        />
        {series.map((item) => (
          <Line
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stroke={item.color ?? CHART_COLORS[0]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}

export function DonutChart({
  data,
  height = 240,
  valueKey = "value",
  nameKey = "name",
  formatter,
}: {
  data: Record<string, unknown>[];
  height?: number;
  valueKey?: string;
  nameKey?: string;
  formatter?: (value: number | string, name: string) => string;
}) {
  return (
    <ChartFrame height={height}>
      <PieChart>
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--ink-muted)" }}
        />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="var(--surface)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

export function Sparkline({
  data,
  dataKey,
  color = CHART_COLORS[0],
  height = 40,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color?: string;
  height?: number;
}) {
  const gradientId = React.useId();
  return (
    <ChartFrame height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ChartFrame>
  );
}
