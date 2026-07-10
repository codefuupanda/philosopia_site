import React, { useState } from 'react';
import {
  Users, BookOpen, Scale, Lightbulb, TrendingUp, Eye,
  Clock, MousePointerClick, LogOut as LogOutIcon, BarChart3, Activity
} from 'lucide-react';
import { useAdminStats } from '../../hooks/queries';
import { Loader } from '../ui/Loader';

function Statistics() {
  const [days, setDays] = useState(7);

  const { data, isLoading: loading } = useAdminStats(days);
  const contentStats = data?.contentStats;
  const analytics = data?.analytics;

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader /></div>;
  }

  const contentCards = [
    { label: 'Philosophers', value: contentStats?.philosophers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Schools', value: contentStats?.schools ?? 0, icon: BookOpen, color: 'text-green-500' },
    { label: 'Concepts', value: contentStats?.concepts ?? 0, icon: Lightbulb, color: 'text-yellow-500' },
    { label: 'Beefs', value: contentStats?.beefs ?? 0, icon: Scale, color: 'text-red-500' },
  ];

  const hasAnalytics = analytics && analytics.totalPageviews > 0;

  return (
    <div className="space-y-8">
      {/* Content Overview */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Content Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contentCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card p-6 rounded-xl border border-amber-500 text-center">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${card.color}`} />
                <div className="text-3xl font-bold text-foreground">{card.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Site Analytics</h2>
        <div className="ml-auto flex gap-1">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                days === d
                  ? 'bg-amber-500 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {!hasAnalytics ? (
        <div className="bg-card rounded-xl border border-amber-500 p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No analytics data yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Visit your site to start collecting data. Events appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Analytics KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon={Eye}
              label="Page Views"
              value={analytics.totalPageviews.toLocaleString()}
              color="text-blue-500"
            />
            <KpiCard
              icon={Users}
              label="Sessions"
              value={analytics.totalSessions.toLocaleString()}
              color="text-green-500"
            />
            <KpiCard
              icon={LogOutIcon}
              label="Bounce Rate"
              value={`${analytics.bounceRate}%`}
              color={analytics.bounceRate > 70 ? 'text-red-500' : 'text-yellow-500'}
            />
            <KpiCard
              icon={Clock}
              label="Avg Time (top page)"
              value={
                analytics.avgTimeOnPage.length > 0
                  ? formatTime(analytics.avgTimeOnPage[0].avgTimeMs)
                  : '—'
              }
              color="text-purple-500"
            />
          </div>

          {/* Daily Trend */}
          {analytics.dailyTrend.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Daily Pageviews
              </h3>
              <div className="bg-card rounded-xl border border-amber-500 p-4">
                <BarChart data={analytics.dailyTrend} />
              </div>
            </div>
          )}

          {/* Popular Pages */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Top Pages
            </h3>
            <DataTable
              columns={['Page', 'Views']}
              rows={analytics.pageViews.map((p) => [p.page, p.views.toLocaleString()])}
              alignRight={[1]}
            />
          </div>

          {/* Average Time on Page */}
          {analytics.avgTimeOnPage.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Avg Time on Page
              </h3>
              <DataTable
                columns={['Page', 'Avg Time', 'Samples']}
                rows={analytics.avgTimeOnPage.map((p) => [
                  p.page,
                  formatTime(p.avgTimeMs),
                  p.samples.toLocaleString(),
                ])}
                alignRight={[1, 2]}
              />
            </div>
          )}

          {/* Exit Pages */}
          {analytics.exitPages.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <LogOutIcon className="w-4 h-4 text-primary" /> Exit Pages
              </h3>
              <DataTable
                columns={['Page', 'Exits']}
                rows={analytics.exitPages.map((p) => [p.page, p.exits.toLocaleString()])}
                alignRight={[1]}
              />
            </div>
          )}

          {/* Top Events */}
          {analytics.topEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-primary" /> Top Events
              </h3>
              <DataTable
                columns={['Category', 'Action', 'Label', 'Count']}
                rows={analytics.topEvents.map((e) => [
                  e.category || '—',
                  e.action || '—',
                  e.label || '—',
                  e.count.toLocaleString(),
                ])}
                alignRight={[3]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card p-5 rounded-xl border border-amber-500 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function DataTable({ columns, rows, alignRight = [] }) {
  return (
    <div className="bg-card rounded-xl border border-amber-500 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={col}
                className={`p-3 text-xs font-bold text-muted-foreground ${
                  alignRight.includes(i) ? 'text-right' : 'text-left'
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`p-3 text-sm ${ci === 0 ? 'font-mono text-foreground' : 'text-muted-foreground'} ${
                    alignRight.includes(ci) ? 'text-right' : 'text-left'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ data }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => {
        const height = Math.max((d.views / maxViews) * 100, 2);
        const label = d.date.slice(5); // "MM-DD"
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.views} views`}>
            <span className="text-[10px] text-muted-foreground">{d.views}</span>
            <div
              className="w-full bg-amber-500 rounded-t"
              style={{ height: `${height}%` }}
            />
            <span className="text-[9px] text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(ms) {
  if (!ms || ms <= 0) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

export default Statistics;
