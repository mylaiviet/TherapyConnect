import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, Award, AlertTriangle, MapPin, BarChart3,
  Calendar, CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TherapistAnalyticsDashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<string>("30");
  const [selectedState, setSelectedState] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh all analytics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/therapists'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // Fetch therapist distribution
  const { data: distribution, isLoading: loadingDistribution } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/therapists/distribution', selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      const response = await fetch(`/api/admin/analytics/therapists/distribution?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch distribution');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch therapy types
  const { data: therapyTypes } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/therapists/therapy-types'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/therapists/therapy-types', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch therapy types');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch specializations
  const { data: specializations } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/therapists/specializations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/therapists/specializations', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch specializations');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch top performers
  const { data: topPerformers } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/therapists/top-performers', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/therapists/top-performers?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch top performers');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch low engagement therapists
  const { data: lowEngagement } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/therapists/low-engagement'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/therapists/low-engagement', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch low engagement');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch booking performance
  const { data: bookingPerformance } = useQuery<any>({
    queryKey: ['/api/admin/analytics/therapists/booking-performance', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/therapists/booking-performance?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch booking performance');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch growth metrics
  const { data: growthMetrics } = useQuery<any>({
    queryKey: ['/api/admin/analytics/therapists/growth'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/therapists/growth', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch growth metrics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  if (loadingDistribution) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalTherapists = distribution?.reduce((sum, d) => sum + d.totalTherapists, 0) || 0;
  const activeTherapists = distribution?.reduce((sum, d) => sum + d.activeTherapists, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Therapist Analytics</h2>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTherapists}</div>
            <p className="text-xs text-muted-foreground">
              {activeTherapists} accepting new clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics?.newTherapistsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {growthMetrics?.growthRate > 0 ? '+' : ''}{growthMetrics?.growthRate?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingPerformance?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {bookingPerformance?.confirmedBookings || 0} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics?.approvalRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Profile approvals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Therapists by state</CardDescription>
          </CardHeader>
          <CardContent>
            {distribution && distribution.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {distribution.slice(0, 15).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.city}, {item.state}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.activeTherapists} accepting clients
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {item.totalTherapists}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Therapy Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Therapy Types
            </CardTitle>
            <CardDescription>Most common approaches</CardDescription>
          </CardHeader>
          <CardContent>
            {therapyTypes && therapyTypes.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {therapyTypes.slice(0, 10).map((type, index) => {
                  const total = therapyTypes.reduce((sum, t) => sum + t.therapistCount, 0);
                  const percentage = Math.round((type.therapistCount / total) * 100);

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{type.therapyType}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {type.therapistCount} therapists, avg {type.avgYearsExperience} years exp
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Therapists
          </CardTitle>
          <CardDescription>By profile views and bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformers && topPerformers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Profile Views</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.slice(0, 10).map((therapist, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{therapist.therapistName}</TableCell>
                    <TableCell>{therapist.city}, {therapist.state}</TableCell>
                    <TableCell className="text-right">{therapist.profileViews}</TableCell>
                    <TableCell className="text-right">{therapist.totalBookings}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {therapist.conversionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Low Engagement Therapists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Low Engagement Therapists
          </CardTitle>
          <CardDescription>Profiles needing promotion</CardDescription>
        </CardHeader>
        <CardContent>
          {lowEngagement && lowEngagement.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Days Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowEngagement.slice(0, 10).map((therapist, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{therapist.therapistName}</TableCell>
                    <TableCell>{therapist.city}, {therapist.state}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {therapist.specialties?.slice(0, 2).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{therapist.profileViews}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{therapist.daysSinceCreated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Great! All therapists have good engagement.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Growth Chart */}
      {growthMetrics?.monthlyGrowth && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
            <CardDescription>New therapist signups by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {growthMetrics.monthlyGrowth.slice(0, 6).map((month: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{month.month}</div>
                  <div className="flex-1">
                    <div className="h-8 flex items-center gap-2">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${(month.newSignups / growthMetrics.monthlyGrowth[0].newSignups) * 100}%` }}
                      />
                      <span className="text-sm text-muted-foreground">{month.newSignups} signups</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      {month.approved}
                    </Badge>
                    {month.rejected > 0 && (
                      <Badge variant="outline" className="bg-red-50">
                        <XCircle className="h-3 w-3 mr-1 text-red-600" />
                        {month.rejected}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
