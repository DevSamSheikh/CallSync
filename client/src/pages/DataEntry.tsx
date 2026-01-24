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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Data Entry</h2>
        <p className="text-muted-foreground mt-1">Submit new call reports or bulk upload</p>
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
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="phoneNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="123-456-7890" {...field} className="bg-white" />
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
                                  <Input placeholder="2024" {...field} value={field.value || ''} className="bg-white" />
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
                                  <Input placeholder="TX" {...field} value={field.value || ''} className="bg-white" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fronterName"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>User/Agent</FormLabel>
                                <Popover open={open} onOpenChange={setOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className={cn(
                                          "justify-between bg-white",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? agents.find((agent) => agent.name === field.value)?.name
                                          : "Select agent..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                      <CommandInput placeholder="Search agent..." />
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
                                                  agent.name === field.value
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
                                  <Input placeholder="Closer Name" {...field} className="bg-white" />
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
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
                          <FormField
                            control={form.control}
                            name="isSale"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Sale</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
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
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="bg-white" />
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
                                    <FormLabel>Bonus Amount</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>
                          <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Remarks</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Call notes, customer sentiment, etc." 
                                    className="resize-none h-24 bg-white"
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        <div className="flex justify-end gap-3">
                          <Button 
                            type="button" 
                            variant="outline"
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
                            size="lg" 
                            className="shadow-lg shadow-primary/25"
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
                  <CardHeader>
                    <CardTitle>Bulk Upload</CardTitle>
                    <CardDescription>Upload a CSV file containing multiple call records.</CardDescription>
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
            <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-10">
                      <TableHead className="text-xs pl-4">Phone</TableHead>
                      <TableHead className="text-xs">Closer</TableHead>
                      <TableHead className="text-xs text-right pr-4">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingReports ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-20 text-center">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredReports?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground">
                          No recent entries
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports?.map((r) => (
                        <TableRow key={r.id} className="h-10 hover:bg-muted/30">
                          <TableCell className="text-xs pl-4 font-medium">{r.phoneNo}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px] px-1 h-4">
                              {r.closerName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right pr-4 text-muted-foreground">
                            {r.timestamp ? format(new Date(r.timestamp), "MMM dd") : "-"}
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
