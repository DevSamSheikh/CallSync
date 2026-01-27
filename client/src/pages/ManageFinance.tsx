import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, Report, User } from "@shared/schema";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Banknote, Clock, Gift, AlertTriangle, Search, Filter } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function ManageFinance() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allAttendance } = useQuery<Attendance[]>({
    queryKey: ["/api/admin/attendance"],
  });

  const { data: allReports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const agents = useMemo(() => 
    allUsers?.filter(u => u.role === 'agent') || [], 
    [allUsers]
  );

  const filteredAttendance = useMemo(() => {
    if (!allAttendance) return [];
    let filtered = allAttendance;
    
    if (selectedAgent !== "all") {
      filtered = filtered.filter(a => a.userId === parseInt(selectedAgent));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const agent = allUsers?.find(u => u.id === a.userId);
        return agent?.name.toLowerCase().includes(term) || agent?.username.toLowerCase().includes(term);
      });
    }
    
    return filtered;
  }, [allAttendance, selectedAgent, searchTerm, allUsers]);

  const globalStats = useMemo(() => {
    if (!allAttendance || !allReports) return { punctuality: 0, bonus: 0, docks: 0 };
    
    const punctuality = allAttendance.reduce((acc, curr) => acc + (curr.punctualityBonus || 0), 0);
    const docks = allAttendance.reduce((acc, curr) => acc + (curr.dockAmount || 0), 0);
    const bonus = allReports.reduce((acc, curr) => acc + (curr.bonusAmount || 0), 0);

    return {
      punctuality,
      bonus,
      docks
    };
  }, [allAttendance, allReports]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Manage Finance:</h2>
          <p className="text-muted-foreground mt-1">Overview of all agent performance and financial status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Punctuality</p>
              <p className="text-2xl font-bold mt-1">{globalStats.punctuality.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bonuses</p>
              <p className="text-2xl font-bold mt-1">{globalStats.bonus.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-500 rounded-xl">
              <Gift className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover-elevate transition-all overflow-visible">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Docks</p>
              <p className="text-2xl font-bold mt-1">{globalStats.docks.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search agents..." 
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-full sm:w-[200px] h-10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id.toString()}>
                {agent.name} ({agent.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Financial History Logs</h3>
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px] sm:min-w-full">
              <Table>
                <TableHeader className="bg-blue-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold text-foreground py-3 px-4">Agent</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Date</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Worked</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Sales</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Bonus</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Dock</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Remark</TableHead>
                    <TableHead className="font-bold text-foreground py-3 px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((entry) => {
                    const agent = allUsers?.find(u => u.id === entry.userId);
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/30 border-b border-border/50">
                        <TableCell className="py-4 px-4 font-medium">
                          {agent?.name}
                          <div className="text-xs text-muted-foreground font-normal">{agent?.username}</div>
                        </TableCell>
                        <TableCell className="py-4 px-4">{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="py-4 px-4">{entry.workedHours ? `${entry.workedHours}h` : "-"}</TableCell>
                        <TableCell className="font-medium py-4 px-4">{entry.salesCount}</TableCell>
                        <TableCell className="text-green-600 font-medium py-4 px-4">+{entry.bonusAmount}</TableCell>
                        <TableCell className="text-destructive font-medium py-4 px-4">-{entry.dockAmount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4 px-4 max-w-[150px] truncate">{entry.remark || "-"}</TableCell>
                        <TableCell className="py-4 px-4">
                          <Button variant="ghost" size="sm" className="h-8 hover-elevate">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAttendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No financial records found.
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
