/**
 * XP Management Panel Component
 * 
 * Admin interface for managing XP sources, manual adjustments, and monitoring suspicious activity.
 * Requirements: 2.1, 2.2, 2.4, 2.5, 14.1, 14.2, 14.3, 14.4, 20.3, 20.5
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Save, RefreshCw } from 'lucide-react';

interface XPSource {
  id: string;
  source: string;
  base_amount: number;
  multipliers: Record<string, number>;
  cooldown_seconds: number;
  max_per_hour: number;
}

interface FlaggedUser {
  user_id: string;
  username: string;
  total_xp: number;
  suspicious_patterns: string[];
  flagged_at: string;
}

export const XPManagementPanel: React.FC = () => {
  const [xpSources, setXpSources] = useState<XPSource[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Manual adjustment form state
  const [adjustmentUserId, setAdjustmentUserId] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadXPSources();
    loadFlaggedUsers();
  }, []);

  const loadXPSources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('xp_source_config')
        .select('*')
        .order('source');

      if (error) throw error;
      setXpSources(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFlaggedUsers = async () => {
    try {
      // Query for users with suspicious activity patterns
      const { data, error } = await supabase
        .from('xp_transactions')
        .select(`
          user_id,
          profiles!inner(username, total_xp)
        `)
        .eq('manual_adjustment', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process to identify suspicious patterns (simplified)
      const userActivity = new Map<string, any>();
      data?.forEach((tx: any) => {
        if (!userActivity.has(tx.user_id)) {
          userActivity.set(tx.user_id, {
            user_id: tx.user_id,
            username: tx.profiles?.username || 'Unknown',
            total_xp: tx.profiles?.total_xp || 0,
            transaction_count: 0,
            suspicious_patterns: []
          });
        }
        const user = userActivity.get(tx.user_id);
        user.transaction_count++;
      });

      // Flag users with high transaction counts
      const flagged: FlaggedUser[] = [];
      userActivity.forEach((user) => {
        if (user.transaction_count > 50) {
          user.suspicious_patterns.push('High transaction volume (24h)');
          flagged.push({
            ...user,
            flagged_at: new Date().toISOString()
          });
        }
      });

      setFlaggedUsers(flagged);
    } catch (err: any) {
      console.error('Error loading flagged users:', err);
    }
  };

  const updateXPSource = async (sourceId: string, updates: Partial<XPSource>) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('xp_source_config')
        .update(updates)
        .eq('id', sourceId);

      if (error) throw error;

      setSuccess('XP source updated successfully');
      await loadXPSources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustmentLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gamification/admin/xp/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustmentUserId,
          amount: parseInt(adjustmentAmount),
          reason: adjustmentReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to adjust XP');
      }

      setSuccess('XP adjustment applied successfully');
      setAdjustmentUserId('');
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading XP management data...</span>
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

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">XP Sources</TabsTrigger>
          <TabsTrigger value="adjustment">Manual Adjustment</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Users</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XP Source Configuration</CardTitle>
              <CardDescription>
                Manage base amounts, multipliers, cooldowns, and rate limits for each XP source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {xpSources.map((source) => (
                  <Card key={source.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg capitalize">
                          {source.source.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`base-${source.id}`}>Base Amount</Label>
                          <Input
                            id={`base-${source.id}`}
                            type="number"
                            value={source.base_amount}
                            onChange={(e) => {
                              const newSources = xpSources.map(s =>
                                s.id === source.id
                                  ? { ...s, base_amount: parseInt(e.target.value) }
                                  : s
                              );
                              setXpSources(newSources);
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`cooldown-${source.id}`}>Cooldown (seconds)</Label>
                          <Input
                            id={`cooldown-${source.id}`}
                            type="number"
                            value={source.cooldown_seconds}
                            onChange={(e) => {
                              const newSources = xpSources.map(s =>
                                s.id === source.id
                                  ? { ...s, cooldown_seconds: parseInt(e.target.value) }
                                  : s
                              );
                              setXpSources(newSources);
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`max-${source.id}`}>Max Per Hour</Label>
                          <Input
                            id={`max-${source.id}`}
                            type="number"
                            value={source.max_per_hour}
                            onChange={(e) => {
                              const newSources = xpSources.map(s =>
                                s.id === source.id
                                  ? { ...s, max_per_hour: parseInt(e.target.value) }
                                  : s
                              );
                              setXpSources(newSources);
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => updateXPSource(source.id, {
                          base_amount: source.base_amount,
                          cooldown_seconds: source.cooldown_seconds,
                          max_per_hour: source.max_per_hour
                        })}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustment">
          <Card>
            <CardHeader>
              <CardTitle>Manual XP Adjustment</CardTitle>
              <CardDescription>
                Award or deduct XP from a user with a reason for audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualAdjustment} className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={adjustmentUserId}
                    onChange={(e) => setAdjustmentUserId(e.target.value)}
                    placeholder="Enter user UUID"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">XP Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Positive to add, negative to deduct"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use positive numbers to add XP, negative to deduct
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Explain why this adjustment is being made"
                    required
                  />
                </div>

                <Button type="submit" disabled={adjustmentLoading}>
                  {adjustmentLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Apply Adjustment'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Users & Suspicious Activity</CardTitle>
              <CardDescription>
                Users with unusual XP earning patterns requiring review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedUsers.length === 0 ? (
                <p className="text-muted-foreground">No flagged users at this time</p>
              ) : (
                <div className="space-y-4">
                  {flaggedUsers.map((user) => (
                    <Card key={user.user_id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{user.username}</h4>
                          <p className="text-sm text-muted-foreground">
                            Total XP: {user.total_xp.toLocaleString()}
                          </p>
                          <div className="mt-2 space-y-1">
                            {user.suspicious_patterns.map((pattern, idx) => (
                              <div key={idx} className="flex items-center text-sm text-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {pattern}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
