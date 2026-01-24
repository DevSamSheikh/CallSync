import { useAnalytics } from "@/hooks/use-analytics";
import { KPICard } from "@/components/KPICard";
import { 
  Users as UsersIcon, 
  ArrowLeftRight, 
  BadgeCheck, 
  Percent 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const COLORS = ['#189bfe', '#f51288', '#00C49F', '#FFBB28'];

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [location, setLocation] = useState<string>("all");
  
  // Handle Preview mode from URL parameters
  const params = new URLSearchParams(window.location.search);
  const agentIdParam = params.get("agentId");
  const viewAsAgent = params.get("viewAsAgent") === "true";
  
  const { data, isLoading } = useAnalytics({ 
    days, 
    location, 
    agentId: agentIdParam ? parseInt(agentIdParam) : undefined 
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const { kpis, dailyStats, agentPerformance, performerComparison } = data;

  const pieData = [
    { name: 'Transfers', value: kpis.totalTransfers },
    { name: 'Sales', value: kpis.totalSales },
  ];

  // If viewing as agent (from preview), treat as non-admin for UI purposes
  const isAdmin = authUser?.role === "admin" && !viewAsAgent;
  const user = data.agentName ? { name: data.agentName, role: viewAsAgent ? "agent" : authUser?.role } : authUser;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="sticky top-0 z-[40] bg-white/80 backdrop-blur-md -mx-6 px-6 py-4 border-b md:relative md:bg-transparent md:backdrop-blur-none md:border-none md:mx-0 md:px-0 md:py-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">
              Welcome, {user?.name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? "Overview of call center operations" : "Track your personal progress"}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {user?.role !== "agent" && (
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="flex-1 sm:w-[120px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="wfh">WFH</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="flex-1 sm:w-[120px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Today</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title={isAdmin ? "Total Agents" : "Total Calls"} 
          value={isAdmin ? kpis.totalAgents : kpis.totalCalls} 
          icon={UsersIcon}
          className="border-none bg-[hsl(var(--custom-card-bg))]"
          iconClassName="bg-primary/20 text-primary"
        />
        <KPICard 
          title="Total Transfers" 
          value={kpis.totalTransfers} 
          icon={ArrowLeftRight}
          className="border-none bg-[hsl(var(--custom-card-bg))]"
          iconClassName="bg-primary/20 text-primary"
        />
        <KPICard 
          title="Total Sales" 
          value={kpis.totalSales} 
          icon={BadgeCheck}
          className="border-none bg-[hsl(var(--custom-card-bg))]"
          iconClassName="bg-primary/20 text-primary"
        />
        <KPICard 
          title="Conversion Rate" 
          value={kpis.conversionRate} 
          icon={Percent}
          className="border-none bg-[hsl(var(--custom-card-bg))]"
          iconClassName="bg-primary/20 text-primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* Daily Performance Line Chart */}
        <Card className="lg:col-span-4 shadow-md border-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Daily Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] -ml-4 flex items-center justify-center">
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyStats} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="transfers" 
                      stroke="#189bfe" 
                      strokeWidth={3} 
                      dot={{ fill: '#189bfe', r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#f51288" 
                      strokeWidth={3}
                      dot={{ fill: '#f51288', r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data available for the selected filters</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transfer vs Sale Ratio Pie Chart */}
        <Card className="lg:col-span-3 shadow-md border-none overflow-hidden">
          <CardHeader>
            <CardTitle>Transfer vs Sale Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center">
              {kpis.totalTransfers > 0 || kpis.totalSales > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                        isAnimationActive={false}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={false}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data available for the selected filters</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Performers Table */}
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Agent Name</TableHead>
                    <TableHead>Transfers</TableHead>
                    <TableHead className="text-right pr-6">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformance.length > 0 ? (
                    agentPerformance.slice(0, 5).map((agent, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6 font-medium">{agent.agentName}</TableCell>
                        <TableCell>{agent.transfers}</TableCell>
                        <TableCell className="text-right pr-6">{agent.sales}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                        No data available for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Bar Chart */}
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader>
              <CardTitle>Performers comparison (Onsite vs WFH)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] -ml-4 flex items-center justify-center">
                {performerComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performerComparison} margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                      cursor={{fill: 'transparent'}} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                      <Bar dataKey="transfers" fill="#189bfe" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="sales" fill="#f51288" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No data available for the selected filters</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-[400px] rounded-2xl" />
      </div>
      <Skeleton className="h-[400px] rounded-2xl" />
    </div>
  );
}
