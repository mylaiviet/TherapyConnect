import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, MapPin, Search, TrendingUp, Monitor, Globe,
  BarChart3, PieChart, Activity, RefreshCw
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

interface SummaryStats {
  totalPageViews: number;
  uniqueSessions: number;
  uniqueCities: number;
  uniqueStates: number;
  totalSearches: number;
  avgResultsFound: number;
  avgRadius: number;
}

interface CityData {
  city: string;
  state: string;
  visitors: number;
}

interface LocationMethodStats {
  locationMethod: string;
  searchCount: number;
  avgResultsFound: number;
  avgRadius: number;
}

interface UnderservedMarket {
  city: string;
  state: string;
  searchDemand: number;
  avgResults: number;
  avgRadius: number;
}

interface SearchPattern {
  city: string;
  state: string;
  totalSearches: number;
  avgResultsFound: number;
  avgRadius: number;
  successRate: number;
}

interface DeviceStats {
  deviceType: string;
  visitors: number;
}

interface BrowserStats {
  browserFamily: string;
  visitors: number;
}

interface TrafficSource {
  referrerDomain: string | null;
  newSessions: number;
}

export default function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<string>("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh all analytics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
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

  // Fetch all analytics data with caching
  const { data: summary, isLoading: loadingSummary } = useQuery<SummaryStats>({
    queryKey: ['/api/admin/analytics/summary', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/summary?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    staleTime: 0, // DISABLED CACHE for debugging
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: topCities } = useQuery<CityData[]>({
    queryKey: ['/api/admin/analytics/top-cities', startDate, endDate, 10],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate, limit: '10' });
      const response = await fetch(`/api/admin/analytics/top-cities?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch top cities');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: locationMethods } = useQuery<LocationMethodStats[]>({
    queryKey: ['/api/admin/analytics/location-methods', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/location-methods?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch location methods');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: underservedMarkets } = useQuery<UnderservedMarket[]>({
    queryKey: ['/api/admin/analytics/underserved-markets', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/underserved-markets?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch underserved markets');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: searchPatterns } = useQuery<SearchPattern[]>({
    queryKey: ['/api/admin/analytics/search-patterns', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/search-patterns?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch search patterns');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: deviceData } = useQuery<{deviceStats: DeviceStats[], browserStats: BrowserStats[]}>({
    queryKey: ['/api/admin/analytics/devices', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/devices?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch device data');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: trafficSources } = useQuery<TrafficSource[]>({
    queryKey: ['/api/admin/analytics/traffic-sources', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/admin/analytics/traffic-sources?${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch traffic sources');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  if (loadingSummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
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
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uniqueSessions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalPageViews?.toLocaleString() || 0} page views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalSearches?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg {summary?.avgResultsFound || 0} results found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geographic Reach</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uniqueCities || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.uniqueStates || 0} states
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Search Radius</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgRadius || 0} mi</div>
            <p className="text-xs text-muted-foreground">
              Search distance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Cities by Visitors
            </CardTitle>
            <CardDescription>Most popular visitor locations</CardDescription>
          </CardHeader>
          <CardContent>
            {topCities && topCities.length > 0 ? (
              <div className="space-y-2">
                {topCities.slice(0, 10).map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{city.city}</span>
                      <span className="text-muted-foreground">, {city.state}</span>
                    </div>
                    <Badge variant="secondary">{city.visitors}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Location Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Location Method Usage
            </CardTitle>
            <CardDescription>How users share their location</CardDescription>
          </CardHeader>
          <CardContent>
            {locationMethods && locationMethods.length > 0 ? (
              <div className="space-y-4">
                {locationMethods.map((method, index) => {
                  const total = locationMethods.reduce((sum, m) => sum + Number(m.searchCount), 0);
                  const percentage = total > 0 ? Math.round((Number(method.searchCount) / total) * 100) : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{method.locationMethod}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{method.searchCount} searches</span>
                        <span>Avg {method.avgResultsFound} results</span>
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

      {/* Underserved Markets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Underserved Markets
          </CardTitle>
          <CardDescription>Cities with high demand but few therapists</CardDescription>
        </CardHeader>
        <CardContent>
          {underservedMarkets && underservedMarkets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Search Demand</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                  <TableHead className="text-right">Avg Search Radius</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {underservedMarkets.slice(0, 10).map((market, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {market.city}, {market.state}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{market.searchDemand}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{market.avgResults}</TableCell>
                    <TableCell className="text-right">{market.avgRadius} mi</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Great news! No underserved markets detected.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search Patterns & Device Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device & Browser Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {deviceData?.deviceStats && deviceData.deviceStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Device Types</h4>
                  <div className="space-y-2">
                    {deviceData.deviceStats.map((device, index) => {
                      const total = deviceData.deviceStats.reduce((sum, d) => sum + Number(d.visitors), 0);
                      const percentage = total > 0 ? Math.round((Number(device.visitors) / total) * 100) : 0;

                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{device.deviceType}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {deviceData?.browserStats && deviceData.browserStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Top Browsers</h4>
                  <div className="space-y-2">
                    {deviceData.browserStats.slice(0, 5).map((browser, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{browser.browserFamily}</span>
                        <Badge variant="outline">{browser.visitors}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where new visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {trafficSources && trafficSources.length > 0 ? (
              <div className="space-y-2">
                {trafficSources.slice(0, 10).map((source, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {source.referrerDomain || 'Direct'}
                    </span>
                    <Badge variant="secondary">{source.newSessions}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
