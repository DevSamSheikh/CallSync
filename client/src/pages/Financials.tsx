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

  const [elapsed, setElapsed] = useState<string>("00:00");

  useMemo(() => {
    if (todayAttendance?.signInTime && !todayAttendance?.signOutTime) {
      const interval = setInterval(() => {
        const start = new Date(todayAttendance.signInTime!).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed("00:00:00");
    }
  }, [todayAttendance]);

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Your Financial Stats:</h2>
        </div>
        <div className="text-sm sm:text-base text-muted-foreground font-medium">
          Relase in <span className="text-primary font-bold">{daysToSalary}</span> Days
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <span className="font-semibold text-sm">Mark Attendance.</span>
        <div className="flex flex-wrap gap-3 items-center">
          {!todayAttendance?.signInTime ? (
            <Button 
              className="bg-primary hover:bg-primary/90 text-white min-h-9 shadow-md active-elevate-2 w-full sm:w-auto"
              onClick={() => markAttendance.mutate('in')}
              disabled={markAttendance.isPending}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          ) : !todayAttendance?.signOutTime ? (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg border border-blue-100 font-mono font-bold">
                <Clock className="w-4 h-4 animate-pulse" />
                {elapsed}
              </div>
              <Button 
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 min-h-9 shadow-sm active-elevate-2 flex-1 sm:flex-none"
                onClick={() => markAttendance.mutate('out')}
                disabled={markAttendance.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="h-9 px-4 text-green-600 border-green-200 bg-green-50 w-full sm:w-auto justify-center">
              Attendance Completed
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Daily Stats / Finance History</h3>
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px] sm:min-w-full">
              <Table>
                <TableHeader className="bg-blue-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold text-foreground py-3 px-4">Date</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Sign In</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Sign Out</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Worked</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Sales</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Bonus</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Dock</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData?.map((entry) => (
                    entry.isSalaryDay ? (
                      <TableRow key={entry.id} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all border-none shadow-inner">
                        <TableCell className="font-bold py-6 px-4">Salary Pay Day</TableCell>
                        <TableCell className="font-medium px-4" colSpan={2}>Monthly Settlement</TableCell>
                        <TableCell className="font-bold px-4">Salary: {entry.salaryAmount?.toLocaleString()}</TableCell>
                        <TableCell className="font-bold px-4">Bonus: {entry.bonusAmount?.toLocaleString()}</TableCell>
                        <TableCell className="font-bold px-4">Dock: {entry.dockAmount?.toLocaleString()}</TableCell>
                        <TableCell className="font-medium px-4">Punctuality: {entry.punctualityBonus?.toLocaleString()}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={entry.id} className="hover:bg-muted/30 border-b border-border/50">
                        <TableCell className="py-4 px-4">{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="py-4 px-4">{entry.signInTime ? format(new Date(entry.signInTime), "hh:mm a") : "-"}</TableCell>
                        <TableCell className="py-4 px-4">{entry.signOutTime ? format(new Date(entry.signOutTime), "hh:mm a") : "-"}</TableCell>
                        <TableCell className="py-4 px-4">{entry.workedHours ? `${entry.workedHours}h` : "-"}</TableCell>
                        <TableCell className="font-medium py-4 px-4">{entry.salesCount}</TableCell>
                        <TableCell className="text-green-600 font-medium py-4 px-4">+{entry.bonusAmount}</TableCell>
                        <TableCell className="text-destructive font-medium py-4 px-4">-{entry.dockAmount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4 px-4">{entry.remark || "-"}</TableCell>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
