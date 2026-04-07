/**
 * Rank Management Panel Component
 * 
 * Admin interface for managing rank tiers, XP thresholds, and rank distribution.
 * Requirements: 15.1, 15.2, 15.4
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Plus, Edit, Save, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RankTier {
  id: string;
  name: string;
  minimum_xp_threshold: number;
  rank_order: number;
  icon_url: string;
  perks: Record<string, any>;
  created_at: string;
}

interface RankDistribution {
  rank_name: string;
  user_count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const RankManagementPanel: React.FC = () => {
  const [ranks, setRanks] = useState<RankTier[]>([]);
  const [distribution, setDistribution] = useState<RankDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [editingRank, setEditingRank] = useState<RankTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    minimum_xp_threshold: '',
    icon_url: '',
    perks: ''
  });

  const supabase = createClient();

  useEffect(() => {
    loadRanks();
    loadDistribution();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rank_tiers')
        .select('*')
        .order('rank_order');

      if (error) throw error;
      setRanks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDistribution = async () => {
    try {
      // Get user count per rank
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          current_rank_id,
          rank_tiers!inner(name)
        `);

      if (error) throw error;

      // Calculate distribution
      const distMap = new Map<string, number>();
      profiles?.forEach((profile: any) => {
        const rankName = profile.rank_tiers?.name || 'Unranked';
        distMap.set(rankName, (distMap.get(rankName) || 0) + 1);
      });

      const totalUsers = profiles?.length || 0;
      const dist: RankDistribution[] = Array.from(distMap.entries()).map(([rank_name, user_count]) => ({
        rank_name,
        user_count,
        percentage: totalUsers > 0 ? (user_count / totalUsers) * 100 : 0
      }));

      setDistribution(dist);
    } catch (err: any) {
      console.error('Error loading distribution:', err);
    }
  };

  const handleCreateRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const perks = formData.perks ? JSON.parse(formData.perks) : {};

      const response = await fetch('/api/gamification/admin/ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          minimumXpThreshold: parseInt(formData.minimum_xp_threshold),
          rankOrder: ranks.length + 1,
          iconUrl: formData.icon_url || '/ranks/default.png',
          perks
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create rank');
      }

      setSuccess('Rank tier created successfully');
      resetForm();
      await loadRanks();
      await loadDistribution();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateRank = async (rankId: string) => {
    setError(null);

    try {
      const perks = formData.perks ? JSON.parse(formData.perks) : {};

      const response = await fetch(`/api/gamification/admin/ranks/${rankId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          minimumXpThreshold: parseInt(formData.minimum_xp_threshold),
          iconUrl: formData.icon_url,
          perks
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update rank');
      }

      setSuccess('Rank tier updated successfully. User ranks will be recalculated within 60 seconds.');
      setEditingRank(null);
      resetForm();
      await loadRanks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReorderRanks = async (newOrder: string[]) => {
    setError(null);

    try {
      const response = await fetch('/api/gamification/admin/ranks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankIds: newOrder })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reorder ranks');
      }

      setSuccess('Ranks reordered successfully');
      await loadRanks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveRankUp = (index: number) => {
    if (index === 0) return;
    const newRanks = [...ranks];
    [newRanks[index - 1], newRanks[index]] = [newRanks[index], newRanks[index - 1]];
    setRanks(newRanks);
    handleReorderRanks(newRanks.map(r => r.id));
  };

  const moveRankDown = (index: number) => {
    if (index === ranks.length - 1) return;
    const newRanks = [...ranks];
    [newRanks[index], newRanks[index + 1]] = [newRanks[index + 1], newRanks[index]];
    setRanks(newRanks);
    handleReorderRanks(newRanks.map(r => r.id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minimum_xp_threshold: '',
      icon_url: '',
      perks: ''
    });
  };

  const editRank = (rank: RankTier) => {
    setEditingRank(rank);
    setFormData({
      name: rank.name,
      minimum_xp_threshold: String(rank.minimum_xp_threshold),
      icon_url: rank.icon_url,
      perks: JSON.stringify(rank.perks, null, 2)
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading rank management data...</span>
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

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rank List and Management */}
        <Card>
          <CardHeader>
            <CardTitle>Rank Tiers</CardTitle>
            <CardDescription>
              Manage rank tiers with drag-and-drop reordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ranks.map((rank, index) => (
                <Card key={rank.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveRankUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveRankDown(index)}
                          disabled={index === ranks.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                      <div>
                        <h4 className="font-semibold">{rank.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {rank.minimum_xp_threshold.toLocaleString()} XP
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Order: {rank.rank_order}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editRank(rank)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingRank ? 'Edit Rank Tier' : 'Create New Rank'}</CardTitle>
            <CardDescription>
              Define rank properties and XP threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingRank ? (e) => { e.preventDefault(); handleUpdateRank(editingRank.id); } : handleCreateRank} className="space-y-4">
              <div>
                <Label htmlFor="name">Rank Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bronze, Silver, Gold"
                  required
                />
              </div>

              <div>
                <Label htmlFor="threshold">Minimum XP Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.minimum_xp_threshold}
                  onChange={(e) => setFormData({ ...formData, minimum_xp_threshold: e.target.value })}
                  placeholder="e.g., 1000"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Must be unique and ascending
                </p>
              </div>

              <div>
                <Label htmlFor="icon_url">Icon URL</Label>
                <Input
                  id="icon_url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                  placeholder="/ranks/icon.png"
                />
              </div>

              <div>
                <Label htmlFor="perks">Perks (JSON)</Label>
                <Textarea
                  id="perks"
                  value={formData.perks}
                  onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
                  placeholder='{"feature_access": true, "discount": 10}'
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional JSON object defining rank-specific perks
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingRank ? 'Update Rank' : 'Create Rank'}
                </Button>
                {editingRank && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingRank(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* XP Threshold Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>XP Threshold Visualization</CardTitle>
          <CardDescription>
            Visual representation of XP requirements for each rank
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="minimum_xp_threshold" fill="#8884d8" name="Min XP" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rank Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rank Distribution</CardTitle>
          <CardDescription>
            User count per rank tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {distribution.map((dist, index) => (
                <div key={dist.rank_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-semibold">{dist.rank_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dist.user_count} users ({dist.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="user_count"
                  nameKey="rank_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.rank_name}: ${entry.percentage.toFixed(1)}%`}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
