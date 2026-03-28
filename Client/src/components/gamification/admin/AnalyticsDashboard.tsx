/**
 * Analytics Dashboard Component
 * 
 * Admin interface for viewing XP trends, badge unlock rates, and engagement metrics.
 * Requirements: All (analytics)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, RefreshCw, TrendingUp, Award, Users, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface XPTrend {
  date: string;
  total_xp: number;
  transaction_count: number;
}

interface BadgeUnlockRate {
  badge_name: string;
  unlock_count: number;
  category: string;
}

interface EngagementMetric {
  metric: string;
  value: number;
  change: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [xpTrends, setXpTrends] = useState<XPTrend[]>([]);
  const [badgeUnlocks, setBadgeUnlocks] = useState<BadgeUnlockRate[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const supabase = createClient();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadXPTrends(),
        loadBadgeUnlocks(),
        loadEngagementMetrics()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadXPTrends = async () => {
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('xp_transactions')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const trendMap = new Map<string, { total_xp: number; transaction_count: number }>();
      data?.forEach((tx: any) => {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { total_xp: 0, transaction_count: 0 });
        }
        const trend = trendMap.get(date)!;
        trend.total_xp += tx.amount;
        trend.transaction_count++;
      });

      const trends: XPTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        ...data
      }));

      setXpTrends(trends);
    } catch (err: any) {
      console.error('Error loading XP trends:', err);
    }
  };

  const loadBadgeUnlocks = async () => {
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges!inner(name, category)
        `)
        .gte('earned_at', startDate.toISOString())
        .is('revoked_at', null);

      if (error) throw error;

      // Group by badge
      const unlockMap = new Map<string, { badge_name: string; unlock_count: number; category: string }>();
      data?.forEach((ub: any) => {
        const badgeId = ub.badge_id;
        if (!unlockMap.has(badgeId)) {
          unlockMap.set(badgeId, {
            badge_name: ub.badges.name,
            unlock_count: 0,
            category: ub.badges.category
          });
        }
        unlockMap.get(badgeId)!.unlock_count++;
      });

      const unlocks = Array.from(unlockMap.values())
        .sort((a, b) => b.unlock_count - a.unlock_count)
        .slice(0, 10);

      setBadgeUnlocks(unlocks);
    } catch (err: any) {
      console.error('Error loading badge unlocks:', err);
    }
  };

  const loadEngagementMetrics = async () => {
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Active users (users with XP transactions in period)
      const { data: activeUsers, error: auError } = await supabase
        .from('xp_transactions')
        .select('user_id')
        .gte('created_at', startDate.toISOString());

      if (auError) throw auError;

      const uniqueActiveUsers = new Set(activeUsers?.map((tx: any) => tx.user_id)).size;

      // Total XP awarded
      const { data: xpData, error: xpError } = await supabase
        .from('xp_transactions')
        .select('amount')
        .gte('created_at', startDate.toISOString());

      if (xpError) throw xpError;

      const totalXP = xpData?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0;

      // Badge unlocks
      const { count: badgeCount, error: bcError } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .gte('earned_at', startDate.toISOString())
        .is('revoked_at', null);

      if (bcError) throw bcError;

      // Rank ups (from rank history)
      const { count: rankUpCount, error: rcError } = await supabase
        .from('user_ranks_history')
        .select('*', { count: 'exact', head: true })
        .gte('achieved_at', startDate.toISOString());

      if (rcError) throw rcError;

      const metrics: EngagementMetric[] = [
        {
          metric: 'Active Users',
          value: uniqueActiveUsers,
          change: 0 // Would need previous period data for real change
        },
        {
          metric: 'Total XP Awarded',
          value: totalXP,
          change: 0
        },
        {
          metric: 'Badges Unlocked',
          value: badgeCount || 0,
          change: 0
        },
        {
          metric: 'Rank Ups',
          value: rankUpCount || 0,
          change: 0
        }
      ];

      setEngagementMetrics(metrics);
    } catch (err: any) {
      console.error('Error loading engagement metrics:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading analytics data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Engagement Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {engagementMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric}
              </CardTitle>
              {metric.metric === 'Active Users' && <Users className="h-4 w-4 text-muted-foreground" />}
              {metric.metric === 'Total XP Awarded' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
              {metric.metric === 'Badges Unlocked' && <Award className="h-4 w-4 text-muted-foreground" />}
              {metric.metric === 'Rank Ups' && <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
              {metric.change !== 0 && (
                <p className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from previous period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* XP Earning Trends */}
      <Card>
        <CardHeader>
          <CardTitle>XP Earning Trends</CardTitle>
          <CardDescription>
            Daily XP awarded and transaction volume over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={xpTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_xp"
                stroke="#8884d8"
                name="Total XP"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transaction_count"
                stroke="#82ca9d"
                name="Transactions"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Badge Unlock Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Unlock Rates</CardTitle>
          <CardDescription>
            Top 10 most unlocked badges in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={badgeUnlocks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="badge_name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="unlock_count" fill="#8884d8" name="Unlocks" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Badge Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Unlocks by Category</CardTitle>
          <CardDescription>
            Distribution of badge unlocks across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(
              badgeUnlocks.reduce((acc, badge) => {
                acc.set(badge.category, (acc.get(badge.category) || 0) + badge.unlock_count);
                return acc;
              }, new Map<string, number>())
            ).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="font-medium capitalize">{category}</span>
                </div>
                <span className="text-muted-foreground">{count} unlocks</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Movement Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard Activity</CardTitle>
          <CardDescription>
            Recent changes in top user rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Leaderboard movement tracking coming soon. This will show users who have moved up or down in rankings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
