import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Search, DollarSign, Users, Target,
  ChevronRight, Clock, Monitor, Smartphone, Tablet, RefreshCw
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

export default function BusinessIntelligenceDashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<string>("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh all analytics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/business'] });
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

  // Fetch supply vs demand with caching
  const { data: supplyDemand, isLoading: loadingSupplyDemand } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/business/supply-demand', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/business/supply-demand?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch supply demand');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch insurance gaps
  const { data: insuranceGaps } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/business/insurance-gaps'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/business/insurance-gaps', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch insurance gaps');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch conversion funnel
  const { data: conversionFunnel } = useQuery<any[]>({
    queryKey: ['/api/admin/analytics/business/conversion-funnel', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/business/conversion-funnel?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch conversion funnel');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch search effectiveness
  const { data: searchEffectiveness } = useQuery<any>({
    queryKey: ['/api/admin/analytics/business/search-effectiveness', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/business/search-effectiveness?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch search effectiveness');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch pricing insights
  const { data: pricingInsights } = useQuery<any>({
    queryKey: ['/api/admin/analytics/business/pricing'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/business/pricing', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch user behavior
  const { data: userBehavior } = useQuery<any>({
    queryKey: ['/api/admin/analytics/business/user-behavior', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/business/user-behavior?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch user behavior');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  if (loadingSupplyDemand) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalDevices = (userBehavior?.mobileVsDesktop?.mobile || 0) +
    (userBehavior?.mobileVsDesktop?.desktop || 0) +
    (userBehavior?.mobileVsDesktop?.tablet || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Business Intelligence</h2>
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
            <CardTitle className="text-sm font-medium">Avg Session Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pricingInsights?.avgIndividualSessionFee?.toFixed(0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual therapy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Quality</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchEffectiveness?.avgResultsFound?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg results per search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchEffectiveness?.zeroResultsRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of all searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBehavior?.returnVisitorRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Returning visitors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="h-5 w-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>User journey from search to booking</CardDescription>
        </CardHeader>
        <CardContent>
          {conversionFunnel && conversionFunnel.length > 0 ? (
            <div className="space-y-4">
              {conversionFunnel.map((stage, index) => {
                const nextStage = conversionFunnel[index + 1];
                const conversionRate = nextStage
                  ? ((nextStage.users / stage.users) * 100).toFixed(1)
                  : 100;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stage.stage}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.users.toLocaleString()} users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {stage.dropoffRate > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">{stage.dropoffRate.toFixed(1)}% drop</span>
                          </div>
                        )}
                        {nextStage && (
                          <div className="text-xs text-muted-foreground">
                            {conversionRate}% conversion
                          </div>
                        )}
                      </div>
                    </div>
                    {nextStage && (
                      <div className="ml-4 pl-4 border-l-2 border-dashed border-muted-foreground/30 h-8" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Performance
            </CardTitle>
            <CardDescription>Most searched locations</CardDescription>
          </CardHeader>
          <CardContent>
            {searchEffectiveness?.searchesByLocation && searchEffectiveness.searchesByLocation.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {searchEffectiveness.searchesByLocation.slice(0, 10).map((location: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{location.city}, {location.state}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.searchCount} searches, avg {location.avgResults.toFixed(1)} results
                      </div>
                    </div>
                    <Badge variant={location.avgResults > 5 ? "secondary" : "destructive"}>
                      {location.avgResults < 3 ? "Low" : location.avgResults < 6 ? "Medium" : "Good"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Usage
            </CardTitle>
            <CardDescription>Platform breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {totalDevices > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Desktop</span>
                    </div>
                    <span className="text-sm font-medium">
                      {((userBehavior.mobileVsDesktop.desktop / totalDevices) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(userBehavior.mobileVsDesktop.desktop / totalDevices) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userBehavior.mobileVsDesktop.desktop.toLocaleString()} visitors
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mobile</span>
                    </div>
                    <span className="text-sm font-medium">
                      {((userBehavior.mobileVsDesktop.mobile / totalDevices) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(userBehavior.mobileVsDesktop.mobile / totalDevices) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userBehavior.mobileVsDesktop.mobile.toLocaleString()} visitors
                  </p>
                </div>

                {userBehavior.mobileVsDesktop.tablet > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tablet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tablet</span>
                      </div>
                      <span className="text-sm font-medium">
                        {((userBehavior.mobileVsDesktop.tablet / totalDevices) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${(userBehavior.mobileVsDesktop.tablet / totalDevices) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {userBehavior.mobileVsDesktop.tablet.toLocaleString()} visitors
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing by Region
          </CardTitle>
          <CardDescription>Average session fees by state</CardDescription>
        </CardHeader>
        <CardContent>
          {pricingInsights?.pricingByRegion && pricingInsights.pricingByRegion.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Avg Session Fee</TableHead>
                  <TableHead className="text-right">Therapists</TableHead>
                  <TableHead className="text-right">vs National Avg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingInsights.pricingByRegion.slice(0, 15).map((region: any, index: number) => {
                  const diff = region.avgFee - pricingInsights.avgIndividualSessionFee;
                  const diffPercent = (diff / pricingInsights.avgIndividualSessionFee) * 100;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{region.state}</TableCell>
                      <TableCell className="text-right">${region.avgFee.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{region.therapistCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={diff > 0 ? "destructive" : "secondary"}>
                          {diff > 0 ? "+" : ""}{diffPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Insurance Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Coverage</CardTitle>
          <CardDescription>Therapists accepting insurance</CardDescription>
        </CardHeader>
        <CardContent>
          {insuranceGaps && insuranceGaps.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {insuranceGaps.slice(0, 15).map((insurance: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{insurance.insuranceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {insurance.providersAccepting} providers accepting
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {insurance.providersAccepting}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
