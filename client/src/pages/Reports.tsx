import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useReports, useDeleteReport } from "@/hooks/use-reports";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { KPICard } from "@/components/KPICard";
import { Users as UsersIcon } from "lucide-react";

export default function Reports() {
  const { user } = useAuth();
  const { data: reports, isLoading } = useReports();
  const deleteReport = useDeleteReport();
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date>();
  const [selectedState, setSelectedState] = useState("all");
  const [location, setLocation] = useState<string>("all");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const isAdmin = user?.role === "admin";
  const isDeo = user?.role === "deo";
  const isAdminOrDeo = isAdmin || isDeo;

  const handleExport = () => {
    if (!reports) return;
    
    // Simple CSV export logic
    const headers = ["Timestamp", "Phone No", "Accident Year", "State", "Closer", "Remarks", "Location", "Fronter"];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        r.timestamp ? format(new Date(r.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
        r.phoneNo,
        r.accidentYear || "",
        r.state || "",
        r.closerName || "",
        `"${r.remarks || ""}"`, // Escape quotes for remarks
        r.location,
        r.fronterName || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reports_export_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const states = Array.from(new Set(reports?.map((r: any) => r.state).filter(Boolean))) as string[];

  const filteredReports = reports?.filter((r: any) => {
    const matchesSearch = 
      r.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.closerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesDate = !date || (r.timestamp && format(new Date(r.timestamp), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
    const matchesState = selectedState === "all" || r.state === selectedState;
    const matchesLocation = location === "all" || (r as any).location === location;
    
    return matchesSearch && matchesDate && matchesState && matchesLocation;
  });

  const paginatedReports = filteredReports?.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const totalPages = Math.ceil((filteredReports?.length || 0) / pageSize);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-1">Detailed log of call activities</p>
        </div>
        <Button onClick={handleExport} disabled={!reports?.length} className="shadow-lg shadow-primary/25">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by phone, closer, or remarks..." 
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="wfh">WFH</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal bg-white",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(date || selectedState !== "all" || searchTerm || location !== "all") && (
            <Button variant="ghost" onClick={() => {
              setDate(undefined);
              setSelectedState("all");
              setSearchTerm("");
              setLocation("all");
            }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-visible">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">Timestamp</TableHead>
                  <TableHead>Phone No</TableHead>
                  {isAdminOrDeo && <TableHead>Fronter</TableHead>}
                  <TableHead>Accident Year</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Remarks</TableHead>
                  {isAdminOrDeo && <TableHead className="pr-6 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdminOrDeo ? 9 : 7} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading reports...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdminOrDeo ? 9 : 7} className="h-24 text-center text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports?.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 font-mono text-xs">
                        {report.timestamp ? format(new Date(report.timestamp), "MMM dd, HH:mm:ss") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{report.phoneNo}</TableCell>
                      {isAdminOrDeo && <TableCell>{report.fronterName}</TableCell>}
                      <TableCell>{report.accidentYear}</TableCell>
                      <TableCell>{report.state}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.location}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-pink-50 text-pink-700 border-pink-200">
                          {report.closerName}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={report.remarks || ""}>
                        {report.remarks}
                      </TableCell>
                      {isAdminOrDeo && (
                        <TableCell className="pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="gap-2 text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the report.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteReport.mutate(report.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
