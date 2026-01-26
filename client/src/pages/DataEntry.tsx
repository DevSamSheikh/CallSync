import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, type InsertReport } from "@shared/schema";
import { useCreateReport, useBulkCreateReports, useReports } from "@/hooks/use-reports";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileUp, Search, Loader2, Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import Papa from "papaparse";
import { useRef, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function DataEntry() {
  const { user } = useAuth();
  const { data: reports, isLoading: isLoadingReports } = useReports();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const createReport = useCreateReport();
  const bulkCreate = useBulkCreateReports();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const agents = useMemo(() => users?.filter(u => u.role === "agent") || [], [users]);

  const form = useForm<InsertReport>({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      phoneNo: "",
      accidentYear: "",
      state: "",
      zipCode: "",
      fronterName: user?.name || "",
      closerName: "",
      remarks: "",
      location: "onsite",
      isSale: false,
      amount: undefined,
      bonusAmount: undefined,
    },
  });

  const watchIsSale = form.watch("isSale");

  const onSubmit = (data: InsertReport) => {
    createReport.mutate(data, {
      onSuccess: () => {
        form.reset({
          phoneNo: "",
          accidentYear: "",
          state: "",
          zipCode: "",
          fronterName: user?.name || "",
          closerName: "",
          remarks: "",
          location: "onsite",
          isSale: false,
          amount: undefined,
          bonusAmount: undefined,
        });
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const validReports: InsertReport[] = results.data.map((row: any) => ({
            phoneNo: row.phoneNo || row.Phone || row['Phone No'] || "Unknown",
            accidentYear: row.accidentYear || row.Year || "",
            state: row.state || row.State || "",
            zipCode: row.zipCode || row.Zip || "",
            fronterName: row.fronterName || row.Fronter || user?.name || "Unknown",
            closerName: row.closerName || row.Closer || "",
            remarks: row.remarks || row.Remarks || "",
            location: (row.location?.toLowerCase() === 'wfh' ? 'wfh' : 'onsite') as "onsite" | "wfh",
            isSale: false,
          }));

          bulkCreate.mutate(validReports);
        } catch (err) {
          toast({
            title: "Parse Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive",
          });
        } finally {
          setIsProcessingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        setIsProcessingFile(false);
        toast({
          title: "Error",
          description: `File reading error: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  const filteredReports = reports?.filter(r => 
    r.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.closerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  ).slice(0, 10);

  const isAdminOrDeo = user?.role === "admin" || user?.role === "deo";

  const AgentSelect = () => (
    isAdminOrDeo && (
      <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "justify-between bg-white border-primary/20 hover:border-primary/40 h-10 shadow-sm",
                !form.watch("fronterName") && "text-muted-foreground"
              )}
            >
              {form.watch("fronterName")
                ? agents.find((agent) => agent.name === form.watch("fronterName"))?.name
                : "Search agents..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search agent name..." />
              <CommandList>
                <CommandEmpty>No agent found.</CommandEmpty>
                <CommandGroup>
                  {agents.map((agent) => (
                    <CommandItem
                      key={agent.id}
                      value={agent.name}
                      onSelect={() => {
                        form.setValue("fronterName", agent.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          agent.name === form.watch("fronterName")
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {agent.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">New Report</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Enter details for a single call record</p>
        </div>
        <div className="w-full sm:w-auto">
          <AgentSelect />
        </div>
      </div>

      {!isAdminOrDeo ? (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          Only Admin and DEO roles can perform data entry.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                <TabsTrigger value="single">Single Entry</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>New Report</CardTitle>
                    <CardDescription>Enter details for a single call record.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <FormField
                            control={form.control}
                            name="phoneNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Phone Number" 
                                    className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                    {...field} 
                                  />
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
                                <FormControl>
                                  <Input 
                                    placeholder="Accident Year" 
                                    className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                    {...field} 
                                    value={field.value || ''}
                                  />
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
                                <FormControl>
                                  <Input 
                                    placeholder="State" 
                                    className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                    {...field} 
                                    value={field.value || ''}
                                  />
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
                                <FormControl>
                                  <Input 
                                    placeholder="Closer Name" 
                                    className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                    {...field} 
                                  />
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl">
                                      <SelectValue placeholder="Select Location" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="onsite">Onsite</SelectItem>
                                    <SelectItem value="wfh">WFH</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isSale"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between min-h-[50px] px-4 border border-muted-foreground/20 rounded-xl">
                                <span className="text-lg font-medium text-foreground">Transfer</span>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-[#189bfe]"
                                  />
                                </FormControl>
                                <span className="text-lg font-medium text-foreground">Sale</span>
                              </FormItem>
                            )}
                          />
                          {watchIsSale && (
                            <>
                              <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="Sale Amount" 
                                        className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                        {...field} 
                                        onChange={e => field.onChange(e.target.valueAsNumber)} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="bonusAmount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="Bonus Amount" 
                                        className="min-h-[50px] text-lg px-4 border-muted-foreground/20 rounded-xl"
                                        {...field} 
                                        onChange={e => field.onChange(e.target.valueAsNumber)} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold px-1">Remarks</h3>
                          <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter call details, customer response, etc." 
                                    className="min-h-[150px] text-lg p-4 border-muted-foreground/20 rounded-xl resize-none"
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="min-h-[50px] text-lg px-8 border-muted-foreground/20 rounded-xl hover:bg-muted/50 w-full sm:w-auto"
                            onClick={() => form.reset({
                              phoneNo: "",
                              accidentYear: "",
                              state: "",
                              zipCode: "",
                              fronterName: user?.name || "",
                              closerName: "",
                              remarks: "",
                              location: "onsite",
                              isSale: false,
                              amount: undefined,
                              bonusAmount: undefined,
                            })}
                            disabled={createReport.isPending}
                          >
                            Reset
                          </Button>
                          <Button 
                            type="submit" 
                            className="min-h-[50px] text-lg px-12 bg-[#189bfe] hover:bg-[#189bfe]/90 text-white shadow-[0_3px_0_0_#0d7cd4] active:translate-y-[1px] active:shadow-none transition-all rounded-xl w-full sm:w-auto"
                            disabled={createReport.isPending}
                          >
                            {createReport.isPending ? "Submitting..." : "Submit Report"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk">
                <Card className="border-none shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>Bulk Upload</CardTitle>
                      <CardDescription>Upload a CSV file containing multiple call records.</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1.5 w-[240px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select 
                          value={form.watch("fronterName")} 
                          onValueChange={(val) => form.setValue("fronterName", val)}
                        >
                          <SelectTrigger className="pl-10 h-10 border-primary/20 bg-white">
                            <SelectValue placeholder="Search or select agent..." />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 sticky top-0 bg-popover z-20 border-b">
                              <Input
                                placeholder="Search agents..."
                                className="h-8 text-xs"
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {agents.filter(a => 
                                a.name.toLowerCase().includes(searchTerm.toLowerCase())
                              ).map((agent) => (
                                <SelectItem key={agent.id} value={agent.name}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={isProcessingFile || bulkCreate.isPending}
                      />
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                          <FileUp className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Click to upload CSV</h3>
                          <p className="text-sm text-muted-foreground mt-1">or drag and drop file here</p>
                        </div>
                        {(isProcessingFile || bulkCreate.isPending) && (
                          <p className="text-sm text-primary font-medium animate-pulse">Processing file...</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">CSV Format Requirements</h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Your CSV file should have the following headers: <br/>
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Phone No</code>, 
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Accident Year</code>, 
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">State</code>, 
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Fronter</code>, 
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Closer</code>, 
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Remarks</code>,
                        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Location</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Entries</h3>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-7 h-8 text-xs bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Card className="border-none shadow-md">
              <CardContent className="p-0 overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-10">
                      <TableHead className="text-[11px] pl-3 w-[100px]">Phone</TableHead>
                      <TableHead className="text-[11px] w-[80px]">Agent</TableHead>
                      <TableHead className="text-[11px] w-[70px]">Type</TableHead>
                      <TableHead className="text-[11px] text-right pr-3 w-[90px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingReports ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-20 text-center">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredReports?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-20 text-center text-[11px] text-muted-foreground">
                          No recent entries
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports?.map((r) => (
                        <TableRow key={r.id} className="h-12 hover:bg-muted/30">
                          <TableCell className="text-[11px] pl-3 font-medium truncate">{r.phoneNo}</TableCell>
                          <TableCell className="text-[11px] truncate">
                            {r.fronterName}
                          </TableCell>
                          <TableCell className="text-[11px]">
                            <Badge variant={r.isSale ? "default" : "secondary"} className="text-[9px] px-1 h-4 scale-90 origin-left">
                              {r.isSale ? "Sale" : "Transfer"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-right pr-3 text-muted-foreground whitespace-nowrap">
                            {r.timestamp ? format(new Date(r.timestamp), "MMM dd, HH:mm") : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
