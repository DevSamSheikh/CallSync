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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, type InsertReport } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Search, MoreVertical, Edit2, Trash2, Printer, Eye } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [editOpen, setEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const form = useForm<InsertReport>({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      phoneNo: "",
      accidentYear: "",
      state: "",
      closerName: "",
      remarks: "",
      location: "onsite",
      fronterName: "",
    },
  });

  const handleEdit = (report: any) => {
    setSelectedReport(report);
    form.reset({
      phoneNo: report.phoneNo,
      accidentYear: report.accidentYear,
      state: report.state,
      closerName: report.closerName,
      remarks: report.remarks,
      location: report.location,
      fronterName: report.fronterName,
    });
    setEditOpen(true);
  };

  const onSubmit = (data: InsertReport) => {
    setEditOpen(false);
    setSelectedReport(null);
    form.reset();
  };

  const isAdmin = user?.role === "admin";
  const isDeo = user?.role === "deo";
  const isAdminOrDeo = isAdmin || isDeo;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!reports) return;
    const headers = ["Timestamp", "Phone No", "Accident Year", "State", "Closer", "Remarks", "Location", "Fronter"];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        r.timestamp ? format(new Date(r.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
        r.phoneNo,
        r.accidentYear || "",
        r.state || "",
        r.closerName || "",
        `"${r.remarks || ""}"`,
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
  const printReports = filteredReports || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-1">Detailed log of call activities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="print:hidden">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={!reports?.length} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md min-h-9 px-4 py-2 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by phone, closer, or remarks..." 
            className="pl-10 bg-white-input"
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead className="w-[200px]">Remarks</TableHead>
                  {isAdminOrDeo && <TableHead className="pr-6 text-right print:hidden">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdminOrDeo ? 11 : 9} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading reports...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (filteredReports?.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdminOrDeo ? 11 : 9} className="h-24 text-center text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TooltipProvider>
                      {paginatedReports?.map((report) => (
                      <TableRow key={`screen-${report.id}`} className="hover:bg-muted/30 transition-colors print:hidden">
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
                          <Badge 
                            variant={report.isSale ? "default" : "secondary"}
                            className={cn(
                              "capitalize",
                              report.isSale ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            )}
                          >
                            {report.isSale ? "Sale" : "Transfer"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {report.isSale ? `$${report.amount || 0}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-pink-50 text-pink-700 border-pink-200">
                            {report.closerName}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[200px] py-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="line-clamp-2 text-sm leading-tight cursor-help break-words">
                                {report.remarks}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-2 break-words bg-popover text-popover-foreground shadow-md border rounded-md">
                              <p className="text-xs">{report.remarks}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        {isAdminOrDeo && (
                          <TableCell className="pr-6 text-right print:hidden">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover-elevate"
                                onClick={() => window.location.href = `/profile/${report.agentId}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover-elevate"
                                onClick={() => handleEdit(report)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E43636] hover-elevate">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
                                      className="bg-[#E43636] text-white hover:bg-[#E43636]/90 shadow-sm"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    </TooltipProvider>
                    {printReports.map((report) => (
                      <TableRow key={`print-${report.id}`} className="hidden print:table-row">
                        <TableCell className="pl-6 font-mono text-xs">
                          {report.timestamp ? format(new Date(report.timestamp), "MMM dd, HH:mm:ss") : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{report.phoneNo}</TableCell>
                        {isAdminOrDeo && <TableCell>{report.fronterName}</TableCell>}
                        <TableCell>{report.accidentYear}</TableCell>
                        <TableCell>{report.state}</TableCell>
                        <TableCell className="capitalize">{report.location}</TableCell>
                        <TableCell>
                          {report.isSale ? "Sale" : "Transfer"}
                        </TableCell>
                        <TableCell>
                          {report.isSale ? `$${report.amount || 0}` : "-"}
                        </TableCell>
                        <TableCell>{report.closerName}</TableCell>
                        <TableCell className="max-w-[300px] break-words">
                          {report.remarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredReports && filteredReports.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-6 bg-muted/20 border-t print:hidden gap-4">
              <div className="flex items-center gap-4 order-2 sm:order-1">
                <p className="text-sm font-medium text-muted-foreground bg-white/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
                  Showing <span className="text-foreground">{pageIndex * pageSize + 1}</span> to <span className="text-foreground">{Math.min((pageIndex + 1) * pageSize, filteredReports.length)}</span> of <span className="text-foreground">{filteredReports.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Show</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => {
                    setPageSize(parseInt(v));
                    setPageIndex(0);
                  }}>
                    <SelectTrigger className="w-[70px] h-9 text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-1.5 order-1 sm:order-2 bg-white/50 p-1.5 rounded-xl border border-border/50 shadow-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 font-semibold hover:bg-white"
                  onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 h-9 bg-primary/10 text-primary rounded-lg text-sm font-bold min-w-[100px] justify-center border border-primary/20">
                  Page {pageIndex + 1} of {totalPages}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 font-semibold hover:bg-white"
                  onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={editOpen} onOpenChange={(val) => {
        setEditOpen(val);
        if (!val) setSelectedReport(null);
      }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Report: {selectedReport?.phoneNo}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fronterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fronter Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accidentYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accident Year</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closer Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="wfh">WFH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-6">
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
