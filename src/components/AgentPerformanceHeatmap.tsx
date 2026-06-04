import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Zap, Clock, TrendingUp, BarChart2, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

interface HeatmapDataPoint {
  hourString: string;
  hour: number;
  inquiries: number;
  avgResponseMs: number; // in minutes
  trafficLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

const HEATMAP_DEFAULT_DATA: HeatmapDataPoint[] = [
  { hourString: '08:00 AM', hour: 8, inquiries: 4, avgResponseMs: 12, trafficLevel: 'Low' },
  { hourString: '10:00 AM', hour: 10, inquiries: 15, avgResponseMs: 6, trafficLevel: 'High' },
  { hourString: '12:00 PM', hour: 12, inquiries: 24, avgResponseMs: 4, trafficLevel: 'Critical' },
  { hourString: '02:00 PM', hour: 14, inquiries: 18, avgResponseMs: 5, trafficLevel: 'High' },
  { hourString: '04:00 PM', hour: 16, inquiries: 29, avgResponseMs: 3, trafficLevel: 'Critical' },
  { hourString: '06:00 PM', hour: 18, inquiries: 32, avgResponseMs: 8, trafficLevel: 'Critical' },
  { hourString: '08:00 PM', hour: 20, inquiries: 20, avgResponseMs: 15, trafficLevel: 'Medium' },
  { hourString: '10:00 PM', hour: 22, inquiries: 11, avgResponseMs: 22, trafficLevel: 'Medium' },
  { hourString: '12:00 AM', hour: 0, inquiries: 5, avgResponseMs: 45, trafficLevel: 'Low' },
];

export default function AgentPerformanceHeatmap() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'grid' | 'chart'>('grid');
  const [metricFilter, setMetricFilter] = useState<'both' | 'inquiries' | 'speed'>('both');
  const [refreshSeed, setRefreshSeed] = useState(0);

  // Quick refresh generator for interactive play
  const triggerRefresh = () => {
    setRefreshSeed(prev => prev + 1);
  };

  // Compute color based on traffic intensity & response speed
  const getCellColor = (point: HeatmapDataPoint) => {
    if (point.trafficLevel === 'Critical') {
      return 'bg-indigo-600 border bg-opacity-95 text-white';
    }
    if (point.trafficLevel === 'High') {
      return 'bg-blue-500 border bg-opacity-80 text-white';
    }
    if (point.trafficLevel === 'Medium') {
      return 'bg-slate-300 dark:bg-slate-800 border text-slate-800 dark:text-slate-200';
    }
    return 'bg-slate-100 dark:bg-slate-900 border text-slate-500 dark:text-slate-400';
  };

  // Render tooltip Custom hook inside Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl space-y-1 font-sans">
          <p className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">{label}</p>
          <div className="h-px bg-white/5 my-1" />
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[11px] text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || '#3b82f6' }}></span>
              <span className="opacity-80">{entry.name}:</span>
              <strong className="font-mono text-white/95">
                {entry.value} {entry.name.includes('Time') ? 'mins' : 'leads'}
              </strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800 dark:text-white space-y-4">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-mono text-[9px] font-extrabold uppercase border border-indigo-500/20">
              Live Audits
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-350 font-mono font-bold uppercase tracking-wider block">
              Broker Performance Analytics
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
            Performance Heatmap Center
          </h3>
        </div>

        {/* Workspace controls */}
        <div className="flex items-center gap-2">
          {/* Refresh Action */}
          <button
            onClick={triggerRefresh}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-all cursor-pointer active:scale-95"
            title="Reload analysis"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Toggle buttons */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'grid' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap className="h-3 w-3 text-amber-500" /> Matrix Density
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'chart' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BarChart2 className="h-3 w-3 text-indigo-500" /> Response curves
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Viewport */}
      {activeTab === 'grid' ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border dark:border-white/5 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
              This interactive matrix evaluates hour-by-hour client inquiry cycles against your workspace's resolution velocities. Under heavy load hours (such as <strong>12:00 PM</strong> and <strong>06:00 PM</strong>), response latency drops significantly due to client routing automation.
            </p>
          </div>

          {/* 2D Heatmap Grid columns */}
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {HEATMAP_DEFAULT_DATA.map((point) => {
              const adjustedInquiries = Math.max(0, point.inquiries + (refreshSeed % 3) * (point.hour % 2 === 0 ? 1 : -1));
              const adjustedResponse = Math.max(3, point.avgResponseMs - (refreshSeed % 2) * (point.hour % 3 === 0 ? 1 : -1));
              return (
                <div
                  key={point.hourString}
                  className={`p-3 rounded-xl transition-all shadow-sm flex flex-col justify-between h-24 ${getCellColor(point)} border hover:scale-105 hover:shadow-md cursor-help`}
                >
                  <div className="font-mono text-[9px] font-bold opacity-60">
                    {point.hourString}
                  </div>
                  
                  {/* Mid Values */}
                  <div className="flex flex-col py-1.5">
                    <span className="text-lg font-black font-mono leading-none tracking-tight">
                      {adjustedInquiries}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest opacity-80 mt-0.5">
                      Client Leads
                    </span>
                  </div>

                  {/* Bottom Response timer speed */}
                  <div className="mt-1 flex items-center justify-between text-[8px] font-mono border-t border-current border-opacity-10 pt-1 font-bold">
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> {adjustedResponse}m.
                    </span>
                    <span className="text-[7px]">
                      {point.trafficLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 text-[8px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10" /> Safe Sleep
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-800" /> Guard/Standby
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-blue-500" /> Active Peak
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-indigo-600" /> Peak Stress
              </span>
            </div>
            <span>💡 Hover grids to analyze threshold stress</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl w-fit">
            <button
              onClick={() => setMetricFilter('both')}
              className={`px-2.5 py-1 text-[8px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${metricFilter === 'both' ? 'bg-white dark:bg-slate-800 dark:text-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Analyze Both
            </button>
            <button
              onClick={() => setMetricFilter('inquiries')}
              className={`px-2.5 py-1 text-[8px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${metricFilter === 'inquiries' ? 'bg-white dark:bg-slate-800 dark:text-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Leads Volume
            </button>
            <button
              onClick={() => setMetricFilter('speed')}
              className={`px-2.5 py-1 text-[8px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${metricFilter === 'speed' ? 'bg-white dark:bg-slate-800 dark:text-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Response Speed
            </button>
          </div>

          {/* Chart Wrapper Container */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={HEATMAP_DEFAULT_DATA.map(p => ({
                  ...p,
                  inquiries: p.inquiries + (refreshSeed % 3) * (p.hour % 2 === 0 ? 1 : -1),
                  avgResponseMs: p.avgResponseMs - (refreshSeed % 2) * (p.hour % 3 === 0 ? 1 : -1)
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="hourString" 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }}
                  axisLine={false}
                />
                
                {/* Dual Y-axis if metricFilter both is on */}
                {(metricFilter === 'both' || metricFilter === 'inquiries') && (
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tick={{ fontSize: 9, fill: '#3b82f6', fontFamily: 'monospace' }}
                    label={{ value: 'Inquiries (count)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 8, fill: '#3b82f6', fontWeight: 'bold' } }}
                    axisLine={false}
                  />
                )}
                {(metricFilter === 'both' || metricFilter === 'speed') && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 9, fill: '#6366f1', fontFamily: 'monospace' }}
                    label={{ value: 'Resp. Latency (mins)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 8, fill: '#6366f1', fontWeight: 'bold' } }}
                    axisLine={false}
                  />
                )}

                <Tooltip content={<CustomChartTooltip />} />

                {/* Graph segments toggle rendering */}
                {(metricFilter === 'both' || metricFilter === 'inquiries') && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="inquiries"
                    name="Leads Inflow"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInq)"
                  />
                )}

                {(metricFilter === 'both' || metricFilter === 'speed') && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgResponseMs"
                    name="Resolution Speed"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSpeed)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
