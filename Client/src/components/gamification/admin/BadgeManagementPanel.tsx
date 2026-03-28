/**
 * Badge Management Panel Component
 * 
 * Admin interface for creating, editing, and managing badges.
 * Requirements: 3.5, 13.1, 13.2, 13.3, 13.4
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Plus, Edit, Trash2, Award, RefreshCw, BarChart3 } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity_level: string;
  unlock_criteria: any;
  icon_url: string;
  is_active: boolean;
  created_at: string;
}

interface BadgeStats {
  badge_id: string;
  badge_name: string;
  total_earned: number;
  earn_rate: number;
  rarity_percentage: number;
}

export const BadgeManagementPanel: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeStats, setBadgeStats] = useState<BadgeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for creating/editing badges
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'coding',
    rarity_level: 'common',
    icon_url: '',
    criteria_type: 'xp_threshold',
    criteria_field: 'total_xp',
    criteria_operator: 'gte',
    criteria_value: '1000'
  });

  // Manual award/revoke state
  const [awardUserId, setAwardUserId] = useState('');
  const [awardBadgeId, setAwardBadgeId] = useState('');
  const [revokeUserBadgeId, setRevokeUserBadgeId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadBadges();
    loadBadgeStats();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeStats = async () => {
    try {
      // Get badge earn statistics
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          badges!inner(name)
        `)
        .is('revoked_at', null);

      if (error) throw error;

      // Calculate statistics
      const stats = new Map<string, BadgeStats>();
      userBadges?.forEach((ub: any) => {
        if (!stats.has(ub.badge_id)) {
          stats.set(ub.badge_id, {
            badge_id: ub.badge_id,
            badge_name: ub.badges.name,
            total_earned: 0,
            earn_rate: 0,
            rarity_percentage: 0
          });
        }
        const stat = stats.get(ub.badge_id)!;
        stat.total_earned++;
      });

      // Get total user count for rarity calculation
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const statsArray = Array.from(stats.values()).map(stat => ({
        ...stat,
        rarity_percentage: totalUsers ? (stat.total_earned / totalUsers) * 100 : 0
      }));

      setBadgeStats(statsArray);
    } catch (err: any) {
      console.error('Error loading badge stats:', err);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const unlock_criteria = {
        type: formData.criteria_type,
        conditions: [{
          field: formData.criteria_field,
          operator: formData.criteria_operator,
          value: parseInt(formData.criteria_value)
        }]
      };

      const response = await fetch('/api/gamification/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          rarityLevel: formData.rarity_level,
          unlockCriteria: unlock_criteria,
          iconUrl: formData.icon_url || '/badges/default.png'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create badge');
      }

      setSuccess('Badge created successfully');
      resetForm();
      await loadBadges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateBadge = async (badgeId: string) => {
    setError(null);

    try {
      const unlock_criteria = {
        type: formData.criteria_type,
        conditions: [{
          field: formData.criteria_field,
          operator: formData.criteria_operator,
          value: parseInt(formData.criteria_value)
        }]
      };

      const response = await fetch(`/api/gamification/admin/badges/${badgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          rarityLevel: formData.rarity_level,
          unlockCriteria: unlock_criteria,
          iconUrl: formData.icon_url
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update badge');
      }

      setSuccess('Badge updated successfully');
      setEditingBadge(null);
      resetForm();
      await loadBadges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeactivateBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to deactivate this badge?')) return;

    try {
      const response = await fetch(`/api/gamification/admin/badges/${badgeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deactivate badge');
      }

      setSuccess('Badge deactivated successfully');
      await loadBadges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/gamification/admin/badges/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: awardUserId,
          badgeId: awardBadgeId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to award badge');
      }

      setSuccess('Badge awarded successfully');
      setAwardUserId('');
      setAwardBadgeId('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/gamification/admin/badges/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBadgeId: revokeUserBadgeId,
          reason: revokeReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke badge');
      }

      setSuccess('Badge revoked successfully');
      setRevokeUserBadgeId('');
      setRevokeReason('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'coding',
      rarity_level: 'common',
      icon_url: '',
      criteria_type: 'xp_threshold',
      criteria_field: 'total_xp',
      criteria_operator: 'gte',
      criteria_value: '1000'
    });
  };

  const editBadge = (badge: Badge) => {
    setEditingBadge(badge);
    const criteria = badge.unlock_criteria?.conditions?.[0] || {};
    setFormData({
      name: badge.name,
      description: badge.description,
      category: badge.category,
      rarity_level: badge.rarity_level,
      icon_url: badge.icon_url,
      criteria_type: badge.unlock_criteria?.type || 'xp_threshold',
      criteria_field: criteria.field || 'total_xp',
      criteria_operator: criteria.operator || 'gte',
      criteria_value: String(criteria.value || '1000')
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading badge management data...</span>
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

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">All Badges</TabsTrigger>
          <TabsTrigger value="create">Create/Edit</TabsTrigger>
          <TabsTrigger value="manual">Manual Actions</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badge List</CardTitle>
              <CardDescription>
                All badges with create, edit, and deactivate actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badges.map((badge) => (
                  <Card key={badge.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{badge.name}</h4>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {badge.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              badge.rarity_level === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                              badge.rarity_level === 'epic' ? 'bg-purple-100 text-purple-800' :
                              badge.rarity_level === 'rare' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {badge.rarity_level}
                            </span>
                            {!badge.is_active && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editBadge(badge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeactivateBadge(badge.id)}
                          disabled={!badge.is_active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingBadge ? 'Edit Badge' : 'Create New Badge'}</CardTitle>
              <CardDescription>
                Define badge properties and unlock criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingBadge ? (e) => { e.preventDefault(); handleUpdateBadge(editingBadge.id); } : handleCreateBadge} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Badge Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="icon_url">Icon URL</Label>
                    <Input
                      id="icon_url"
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                      placeholder="/badges/icon.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="streaks">Streaks</SelectItem>
                        <SelectItem value="mentorship">Mentorship</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rarity">Rarity Level</Label>
                    <Select
                      value={formData.rarity_level}
                      onValueChange={(value) => setFormData({ ...formData, rarity_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Unlock Criteria</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="criteria_field">Field</Label>
                      <Select
                        value={formData.criteria_field}
                        onValueChange={(value) => setFormData({ ...formData, criteria_field: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total_xp">Total XP</SelectItem>
                          <SelectItem value="event_count">Event Count</SelectItem>
                          <SelectItem value="current_streak">Current Streak</SelectItem>
                          <SelectItem value="badge_count">Badge Count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="criteria_operator">Operator</Label>
                      <Select
                        value={formData.criteria_operator}
                        onValueChange={(value) => setFormData({ ...formData, criteria_operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gte">Greater Than or Equal (≥)</SelectItem>
                          <SelectItem value="lte">Less Than or Equal (≤)</SelectItem>
                          <SelectItem value="eq">Equal (=)</SelectItem>
                          <SelectItem value="gt">Greater Than (>)</SelectItem>
                          <SelectItem value="lt">Less Than (<)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="criteria_value">Value</Label>
                      <Input
                        id="criteria_value"
                        type="number"
                        value={formData.criteria_value}
                        onChange={(e) => setFormData({ ...formData, criteria_value: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingBadge ? 'Update Badge' : 'Create Badge'}
                  </Button>
                  {editingBadge && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingBadge(null);
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
        </TabsContent>

        <TabsContent value="manual">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Award Badge</CardTitle>
                <CardDescription>Manually award a badge to a user</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAwardBadge} className="space-y-4">
                  <div>
                    <Label htmlFor="awardUserId">User ID</Label>
                    <Input
                      id="awardUserId"
                      value={awardUserId}
                      onChange={(e) => setAwardUserId(e.target.value)}
                      placeholder="Enter user UUID"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="awardBadgeId">Badge</Label>
                    <Select
                      value={awardBadgeId}
                      onValueChange={setAwardBadgeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select badge" />
                      </SelectTrigger>
                      <SelectContent>
                        {badges.filter(b => b.is_active).map(badge => (
                          <SelectItem key={badge.id} value={badge.id}>
                            {badge.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit">Award Badge</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revoke Badge</CardTitle>
                <CardDescription>Revoke a badge from a user</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRevokeBadge} className="space-y-4">
                  <div>
                    <Label htmlFor="revokeUserBadgeId">User Badge ID</Label>
                    <Input
                      id="revokeUserBadgeId"
                      value={revokeUserBadgeId}
                      onChange={(e) => setRevokeUserBadgeId(e.target.value)}
                      placeholder="Enter user_badge UUID"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="revokeReason">Reason</Label>
                    <Textarea
                      id="revokeReason"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Explain why this badge is being revoked"
                      required
                    />
                  </div>

                  <Button type="submit" variant="destructive">Revoke Badge</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Badge Statistics</CardTitle>
              <CardDescription>
                Earn rates and rarity distribution across all badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badgeStats.map((stat) => (
                  <Card key={stat.badge_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{stat.badge_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Earned by {stat.total_earned} users ({stat.rarity_percentage.toFixed(2)}%)
                        </p>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
