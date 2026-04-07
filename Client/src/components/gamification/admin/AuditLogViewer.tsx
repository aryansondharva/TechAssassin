/**
 * Audit Log Viewer Component
 * 
 * Admin interface for viewing all manual adjustments, configuration changes, and flagged activity.
 * Requirements: 13.5, 14.5
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Download, Filter, Calendar } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  type: string;
  action: string;
  adminId?: string;
  timestamp: string;
  metadata: Record<string, any>;
  description: string;
}

export const AuditLogViewer: React.FC = () => {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadAuditLog();
  }, [actionTypeFilter, startDate, endDate, page]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: '50'
      });

      if (actionTypeFilter !== 'all') {
        params.append('actionType', actionTypeFilter);
      }

      if (startDate) {
        params.append('startDate', new Date(startDate).toISOString());
      }

      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString());
      }

      const response = await fetch(`/api/gamification/admin/audit?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load audit log');
      }

      const data = await response.json();
      setAuditLog(data.auditLog || []);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'Action', 'Admin ID', 'Description', 'Metadata'];
    const rows = auditLog.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.type,
      entry.action,
      entry.adminId || 'N/A',
      entry.description,
      JSON.stringify(entry.metadata)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'xp_adjustment':
        return 'bg-blue-100 text-blue-800';
      case 'badge_award':
        return 'bg-green-100 text-green-800';
      case 'badge_revocation':
        return 'bg-red-100 text-red-800';
      case 'admin_action':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetFilters = () => {
    setActionTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (loading && page === 1) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading audit log...</span>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Filters</CardTitle>
          <CardDescription>
            Filter audit log entries by action type and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger id="actionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="manual_xp_adjustment">XP Adjustments</SelectItem>
                  <SelectItem value="badge_awarded">Badge Awards</SelectItem>
                  <SelectItem value="badge_revoked">Badge Revocations</SelectItem>
                  <SelectItem value="config_change">Config Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={resetFilters} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            All manual adjustments, configuration changes, and flagged activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No audit log entries found for the selected filters
            </p>
          ) : (
            <div className="space-y-4">
              {auditLog.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionBadgeColor(entry.type)}>
                          {entry.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="font-semibold mb-1">{entry.action.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>

                      {/* Metadata Display */}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Details:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(entry.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-gray-600">
                                  {key.replace(/_/g, ' ')}:
                                </span>{' '}
                                <span className="text-gray-900">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.adminId && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Admin ID: {entry.adminId}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Summary</CardTitle>
          <CardDescription>
            Quick statistics for the current view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{auditLog.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP Adjustments</p>
              <p className="text-2xl font-bold">
                {auditLog.filter(e => e.type === 'xp_adjustment').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Badge Operations</p>
              <p className="text-2xl font-bold">
                {auditLog.filter(e => e.type === 'badge_award' || e.type === 'badge_revocation').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Config Changes</p>
              <p className="text-2xl font-bold">
                {auditLog.filter(e => e.type === 'admin_action').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
