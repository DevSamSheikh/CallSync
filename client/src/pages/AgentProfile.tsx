import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { User, Attendance, Report, insertAttendanceSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  User as UserIcon, 
  FileText, 
  DollarSign, 
  PieChart as PieIcon,
  ArrowLeft,
  Clock,
  Briefcase,
  Search,
  Calendar as CalendarIcon,
  MoreVertical,
  Edit2,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const COLORS = ["#189bfe", "#f51288", "#00C49F", "#FFBB28"];

function TruncatedTitle({ title, icon: Icon, color }: { title: string; icon?: any; color?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CardTitle className="text-sm font-medium flex items-center gap-2 truncate cursor-default">
            {Icon && <Icon className={cn("h-4 w-4 shrink-0", color)} />}
            <span className="truncate">{title}</span>
          </CardTitle>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AgentProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [reportSearch, setReportSearch] = useState("");
  const [reportDate, setReportDate] = useState<Date>();
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeDate, setFinanceDate] = useState<Date>();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

  const form = useForm({
    resolver: zodResolver(insertAttendanceSchema),
    defaultValues: {
      userId: parseInt(id || "0"),
      date: new Date(),
      workedHours: 0,
      salesCount: 0,
      bonusAmount: 0,
      dockAmount: 0,
      remark: "",
    },
  });

  const updateAttendance = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/attendance/${selectedRecord?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
      toast({ title: "Success", description: "Financial record updated" });
      setEditOpen(false);
    },
  });

  const deleteAttendance = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
      toast({ title: "Deleted", description: "Record removed" });
    },
  });

  const handleEdit = (record: Attendance) => {
    setSelectedRecord(record);
    form.reset({
      userId: record.userId,
      date: new Date(record.date),
      workedHours: record.workedHours || 0,
      salesCount: record.salesCount || 0,
      bonusAmount: record.bonusAmount || 0,
      dockAmount: record.dockAmount || 0,
      remark: record.remark || "",
    });
    setEditOpen(true);
  };

  if (authUser && authUser.role !== 'admin') {
    setLocation("/");
    return null;
  }

  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const agent = users?.find(u => u.id === parseInt(id || "0"));

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/reports", { agentId: id }],
    enabled: !!id,
  });

  const { data: adminAttendance } = useQuery<Attendance[]>({
    queryKey: ["/api/admin/attendance"],
    enabled: authUser?.role === 'admin',
  });

  const agentAttendance = useMemo(() => 
    adminAttendance?.filter(a => a.userId === parseInt(id || "0")) || [],
    [adminAttendance, id]
  );

  const filteredReports = useMemo(() => 
    reports?.filter(r => {
      const matchesSearch = r.phoneNo.includes(reportSearch) || r.remarks?.toLowerCase().includes(reportSearch.toLowerCase());
      const matchesDate = !reportDate || format(new Date(r.timestamp), "yyyy-MM-dd") === format(reportDate, "yyyy-MM-dd");
      return matchesSearch && matchesDate;
    }) || [],
    [reports, reportSearch, reportDate]
  );

  const filteredAttendance = useMemo(() => 
    agentAttendance.filter(a => {
      const matchesSearch = a.remark?.toLowerCase().includes(financeSearch.toLowerCase());
      const matchesDate = !financeDate || format(new Date(a.date), "yyyy-MM-dd") === format(financeDate, "yyyy-MM-dd");
      return matchesSearch && matchesDate;
    }),
    [agentAttendance, financeSearch, financeDate]
  );

  if (!agent) return <div className="p-8">Loading agent data...</div>;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayReports = reports?.filter(r => r.timestamp && format(new Date(r.timestamp), "yyyy-MM-dd") === dateStr) || [];
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
          variant="outline" size="icon" onClick={() => setLocation("/users")}
          className="rounded-full shadow-sm hover-elevate active-elevate-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#189bfe] truncate">Agent Profile</h1>
          <p className="text-muted-foreground truncate">Comprehensive performance overview for {agent.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 gap-2">
            <TruncatedTitle title="Full Name" icon={UserIcon} color="text-[#189bfe]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{agent.name}</div>
            <p className="text-xs text-muted-foreground truncate">Agent ID: {agent.username}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 gap-2">
            <TruncatedTitle title="Total Calls" icon={FileText} color="text-[#f51288]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{totalCalls}</div>
            <p className="text-xs text-muted-foreground truncate">Lifetime records</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 gap-2">
            <TruncatedTitle title="Sales" icon={DollarSign} color="text-[#00C49F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{totalSales}</div>
            <p className="text-xs text-muted-foreground truncate">{convRate}% Conv. Rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card hover-elevate transition-all overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 gap-2">
            <TruncatedTitle title="Location" icon={Briefcase} color="text-[#FFBB28]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize truncate">{agent.location}</div>
            <p className="text-xs text-muted-foreground truncate">Primary workspace</p>
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
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <TruncatedTitle title="Activity Trend (Last 7 Days)" icon={PieIcon} color="text-[#189bfe]" />
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="calls" fill="#189bfe" radius={[4, 4, 0, 0]} name="Total Calls" />
                    <Bar dataKey="sales" fill="#f51288" radius={[4, 4, 0, 0]} name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <TruncatedTitle title="Performance Split" icon={PieIcon} color="text-[#f51288]" />
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search remarks..." className="pl-10 h-10 bg-white" value={financeSearch} onChange={(e) => setFinanceSearch(e.target.value)} />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[200px] justify-start text-left font-normal bg-white", !financeDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {financeDate ? format(financeDate, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={financeDate} onSelect={setFinanceDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Worked Hours</TableHead>
                    <TableHead>Sales Bonus</TableHead>
                    <TableHead>Docks/Fines</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 font-medium">{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{record.workedHours?.toFixed(1) || "0"}h</div></TableCell>
                      <TableCell className="text-[#00C49F] font-bold">{record.bonusAmount > 0 ? `+${record.bonusAmount} PKR` : "-"}</TableCell>
                      <TableCell className="text-[#f51288] font-bold">{record.dockAmount > 0 ? `-${record.dockAmount} PKR` : "-"}</TableCell>
                      <TableCell><div className="max-w-[150px] truncate">{record.remark || "-"}</div></TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(record)}><Edit2 className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><DropdownMenuItem className="gap-2 text-[#E43636] focus:text-[#E43636]" onSelect={e => e.preventDefault()}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the financial record.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAttendance.mutate(record.id)} className="bg-[#E43636]">Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search phone or remarks..." className="pl-10 h-10 bg-white" value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[200px] justify-start text-left font-normal bg-white", !reportDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportDate ? format(reportDate, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={reportDate} onSelect={setReportDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-6">Timestamp</TableHead>
                    <TableHead>Phone No</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Closer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 text-xs font-mono">{report.timestamp ? format(new Date(report.timestamp), "MMM dd, HH:mm") : "-"}</TableCell>
                      <TableCell className="font-medium">{report.phoneNo}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[#189bfe]">{report.state}</Badge></TableCell>
                      <TableCell>{report.closerName}</TableCell>
                      <TableCell><Badge className={report.isSale ? "bg-[#00C49F]" : "bg-blue-100 text-blue-700"}>{report.isSale ? "SALE" : "TRANSFER"}</Badge></TableCell>
                      <TableCell className="pr-6 max-w-[200px] truncate text-xs text-muted-foreground italic">"{report.remarks}"</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Edit Financial Record</SheetTitle></SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => updateAttendance.mutate(data))} className="space-y-4">
              <FormField control={form.control} name="workedHours" render={({ field }) => (<FormItem><FormLabel>Worked Hours</FormLabel><FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bonusAmount" render={({ field }) => (<FormItem><FormLabel>Bonus Amount</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="dockAmount" render={({ field }) => (<FormItem><FormLabel>Dock Amount</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="remark" render={({ field }) => (<FormItem><FormLabel>Remark</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full" disabled={updateAttendance.isPending}>{updateAttendance.isPending ? "Updating..." : "Update Record"}</Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
