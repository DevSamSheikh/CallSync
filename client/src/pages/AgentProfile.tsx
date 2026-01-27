import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { User, Attendance, Report } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { 
  User as UserIcon, 
  FileText, 
  DollarSign, 
  PieChart as PieIcon,
  ArrowLeft,
  Calendar,
  Clock,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#189bfe", "#f51288", "#00C49F", "#FFBB28"];

export default function AgentProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user: authUser } = useAuth();

  // Redirect if not admin
  if (authUser && authUser.role !== 'admin') {
    setLocation("/");
    return null;
  }

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const agent = users?.find(u => u.id === parseInt(id || "0"));

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/reports", { agentId: id }],
    enabled: !!id,
  });

  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"], // This is a bit tricky since the existing API might only return for current user
    // We might need a special admin endpoint or filter. For now, assuming current API or we'll need to update it.
    // Based on previous turn, /api/admin/attendance exists.
  });

  const { data: adminAttendance } = useQuery<Attendance[]>({
    queryKey: ["/api/admin/attendance"],
    enabled: authUser?.role === 'admin',
  });

  const agentAttendance = adminAttendance?.filter(a => a.userId === parseInt(id || "0")) || [];

  if (!agent) return <div className="p-8">Loading agent data...</div>;

  // Calculate analytics
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayReports = reports?.filter(r => format(new Date(r.timestamp), "yyyy-MM-dd") === dateStr) || [];
    return {
      date: format(d, "MMM dd"),
      calls: dayReports.length,
      sales: dayReports.filter(r => r.isSale).length,
    };
  }).reverse();

  const totalCalls = reports?.length || 0;
  const totalSales = reports?.filter(r => r.isSale).length || 0;
  const convRate = totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : "0";

  const statusData = [
    { name: "Sales", value: totalSales },
    { name: "Transfers", value: totalCalls - totalSales },
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center gap-4 mb-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setLocation("/users")}
          className="rounded-full shadow-sm hover-elevate active-elevate-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#189bfe]">Agent Profile</h1>
          <p className="text-muted-foreground">Comprehensive performance overview for {agent.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Full Name</CardTitle>
            <UserIcon className="h-4 w-4 text-[#189bfe]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.name}</div>
            <p className="text-xs text-muted-foreground">Agent ID: {agent.username}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <FileText className="h-4 w-4 text-[#f51288]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">Lifetime records</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00C49F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">{convRate}% Conv. Rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <Briefcase className="h-4 w-4 text-[#FFBB28]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{agent.location}</div>
            <p className="text-xs text-muted-foreground">Primary workspace</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-[#189bfe] transition-all">Overview</TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-background data-[state=active]:text-[#189bfe] transition-all">Financials</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background data-[state=active]:text-[#189bfe] transition-all">Call Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-[#189bfe]" />
                  Activity Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="calls" fill="#189bfe" radius={[4, 4, 0, 0]} name="Total Calls" />
                    <Bar dataKey="sales" fill="#f51288" radius={[4, 4, 0, 0]} name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-[#f51288]" />
                  Performance Split
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Financial Summary & Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead>Date</TableHead>
                    <TableHead>Worked Hours</TableHead>
                    <TableHead>Sales Bonus</TableHead>
                    <TableHead>Docks/Fines</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {record.workedHours?.toFixed(1) || "0"}h
                        </div>
                      </TableCell>
                      <TableCell className="text-[#00C49F] font-bold">
                        {record.bonusAmount > 0 ? `+${record.bonusAmount} PKR` : "-"}
                      </TableCell>
                      <TableCell className="text-[#f51288] font-bold">
                        {record.dockAmount > 0 ? `-${record.dockAmount} PKR` : "-"}
                      </TableCell>
                      <TableCell>
                        {record.remark ? (
                          <Badge variant="outline" className="font-normal text-xs border-[#189bfe]/20 text-[#189bfe]">
                            {record.remark}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {agentAttendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No financial records found for this agent.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Call Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Phone No</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Closer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(new Date(report.timestamp), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{report.phoneNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-[#189bfe]/5 border-[#189bfe]/20 text-[#189bfe]">
                          {report.state}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.closerName}</TableCell>
                      <TableCell>
                        {report.isSale ? (
                          <Badge className="bg-[#00C49F] hover:bg-[#00C49F]/90">SALE</Badge>
                        ) : (
                          <Badge variant="secondary">TRANSFER</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                        "{report.remarks}"
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!reports || reports.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No call logs found for this agent.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
