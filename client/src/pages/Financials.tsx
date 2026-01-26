import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, Report } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { Banknote, Gift, AlertTriangle, Clock, LogIn, LogOut } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function Financials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const markAttendance = useMutation({
    mutationFn: async (type: 'in' | 'out') => {
      const res = await apiRequest("POST", "/api/attendance/mark", { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Attendance Marked", description: "Your attendance has been recorded successfully." });
    }
  });

  const todayAttendance = useMemo(() => {
    if (!attendanceData) return null;
    const today = new Date().toDateString();
    return attendanceData.find(a => new Date(a.date).toDateString() === today);
  }, [attendanceData]);

  const stats = useMemo(() => {
    if (!attendanceData || !reports) return { salary: 30000, punctuality: 0, bonus: 0, docks: 0 };
    
    const punctuality = attendanceData.reduce((acc, curr) => acc + (curr.punctualityBonus || 0), 0);
    const docks = attendanceData.reduce((acc, curr) => acc + (curr.dockAmount || 0), 0);
    const bonus = reports.reduce((acc, curr) => acc + (curr.bonusAmount || 0), 0);

    return {
      salary: 30000,
      punctuality,
      bonus,
      docks
    };
  }, [attendanceData, reports]);

  const daysToSalary = useMemo(() => {
    const today = new Date();
    const nextSalary = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return differenceInDays(nextSalary, today);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Your Financial Stats:</h2>
        </div>
        <div className="text-muted-foreground font-medium">
          Relase in <span className="text-primary font-bold">{daysToSalary}</span> Days
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Salary</p>
              <p className="text-2xl font-bold mt-1">{stats.salary.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Punctuality</p>
              <p className="text-2xl font-bold mt-1">{stats.punctuality.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bonus</p>
              <p className="text-2xl font-bold mt-1">{stats.bonus.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-500 rounded-xl">
              <Gift className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible relative">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Docks</p>
              <p className="text-2xl font-bold mt-1">{stats.docks.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
          <div className="absolute top-2 right-2 text-blue-400 text-xs cursor-help">?</div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-semibold text-sm">Mark Attendance.</span>
        {!todayAttendance?.signInTime ? (
          <Button 
            className="bg-primary hover:bg-primary/90 text-white min-h-9 shadow-md active-elevate-2"
            onClick={() => markAttendance.mutate('in')}
            disabled={markAttendance.isPending}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        ) : !todayAttendance?.signOutTime ? (
          <Button 
            variant="outline"
            className="border-primary/20 hover:bg-primary/5 min-h-9 shadow-sm active-elevate-2"
            onClick={() => markAttendance.mutate('out')}
            disabled={markAttendance.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Badge variant="outline" className="h-9 px-4 text-green-600 border-green-200 bg-green-50">
            Attendance Completed
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Daily Stats / Finance History</h3>
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-blue-50/50">
                <TableRow className="border-none">
                  <TableHead className="font-bold text-foreground">Date</TableHead>
                  <TableHead className="font-bold text-foreground">Sign In Time</TableHead>
                  <TableHead className="font-bold text-foreground">Sign Out Time</TableHead>
                  <TableHead className="font-bold text-foreground">Sales</TableHead>
                  <TableHead className="font-bold text-foreground">Bonus</TableHead>
                  <TableHead className="font-bold text-foreground">Dock</TableHead>
                  <TableHead className="font-bold text-foreground">Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.map((entry) => (
                  entry.isSalaryDay ? (
                    <TableRow key={entry.id} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all border-none shadow-inner">
                      <TableCell className="font-bold py-6">Salary Pay Day</TableCell>
                      <TableCell className="font-medium" colSpan={2}>Monthly Settlement</TableCell>
                      <TableCell className="font-bold">Salary: {entry.salaryAmount?.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">Bonus: {entry.bonusAmount?.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">Dock: {entry.dockAmount?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">Punctuality: {entry.punctualityBonus?.toLocaleString()}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{entry.signInTime ? format(new Date(entry.signInTime), "hh:mm a") : "-"}</TableCell>
                      <TableCell>{entry.signOutTime ? format(new Date(entry.signOutTime), "hh:mm a") : "-"}</TableCell>
                      <TableCell className="font-medium">{entry.salesCount}</TableCell>
                      <TableCell className="text-green-600 font-medium">+{entry.bonusAmount}</TableCell>
                      <TableCell className="text-destructive font-medium">-{entry.dockAmount}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{entry.remark || "-"}</TableCell>
                    </TableRow>
                  )
                ))}
                {(!attendanceData || attendanceData.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No attendance history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
