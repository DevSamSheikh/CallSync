import { useReports } from "@/hooks/use-reports";
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
import { Download, Loader2, Search, Filter } from "lucide-react";
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

export default function Reports() {
  const { data: reports, isLoading } = useReports();
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date>();
  const [selectedState, setSelectedState] = useState("all");

  const handleExport = () => {
    if (!reports) return;
    
    // Simple CSV export logic
    const headers = ["Timestamp", "Phone No", "Accident Year", "State", "Closer", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        r.timestamp ? format(new Date(r.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
        r.phoneNo,
        r.accidentYear || "",
        r.state || "",
        r.closerName || "",
        `"${r.remarks || ""}"` // Escape quotes for remarks
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

  const states = Array.from(new Set(reports?.map(r => r.state).filter(Boolean))) as string[];

  const filteredReports = reports?.filter(r => {
    const matchesSearch = 
      r.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.closerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesDate = !date || (r.timestamp && format(new Date(r.timestamp), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
    const matchesState = selectedState === "all" || r.state === selectedState;
    
    return matchesSearch && matchesDate && matchesState;
  });

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

          {(date || selectedState !== "all" || searchTerm) && (
            <Button variant="ghost" onClick={() => {
              setDate(undefined);
              setSelectedState("all");
              setSearchTerm("");
            }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">Timestamp</TableHead>
                  <TableHead>Phone No</TableHead>
                  <TableHead>Accident Year</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead className="pr-6">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading reports...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                      <TableCell>{report.accidentYear}</TableCell>
                      <TableCell>{report.state}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-pink-50 text-pink-700 border-pink-200">
                          {report.closerName}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 max-w-[300px] truncate" title={report.remarks || ""}>
                        {report.remarks}
                      </TableCell>
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
