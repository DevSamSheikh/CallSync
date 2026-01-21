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
import { Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { data: reports, isLoading } = useReports();

  const handleExport = () => {
    if (!reports) return;
    
    // Simple CSV export logic
    const headers = ["Timestamp", "Phone No", "Accident Year", "State", "Zip Code", "Fronter", "Closer", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        r.timestamp ? format(new Date(r.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
        r.phoneNo,
        r.accidentYear || "",
        r.state || "",
        r.zipCode || "",
        r.fronterName,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-1">Detailed log of all call activities</p>
        </div>
        <Button onClick={handleExport} disabled={!reports?.length} className="shadow-lg shadow-primary/25">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Phone No</TableHead>
                  <TableHead>Accident Year</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Zip</TableHead>
                  <TableHead>Fronter</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading reports...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports?.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">
                        {report.timestamp ? format(new Date(report.timestamp), "MMM dd, HH:mm:ss") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{report.phoneNo}</TableCell>
                      <TableCell>{report.accidentYear}</TableCell>
                      <TableCell>{report.state}</TableCell>
                      <TableCell>{report.zipCode}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 border-blue-200">
                          {report.fronterName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.closerName && (
                          <Badge variant="outline" className="font-normal bg-pink-50 text-pink-700 border-pink-200">
                            {report.closerName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={report.remarks || ""}>
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
