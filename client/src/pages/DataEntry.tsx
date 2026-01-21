import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, type InsertReport } from "@shared/schema";
import { useCreateReport, useBulkCreateReports } from "@/hooks/use-reports";
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
import { Upload, FileUp } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DataEntry() {
  const { user } = useAuth();
  const createReport = useCreateReport();
  const bulkCreate = useBulkCreateReports();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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
    },
  });

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Data Entry</h2>
        <p className="text-muted-foreground mt-1">Submit new call reports or bulk upload</p>
      </div>

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
                            <Input placeholder="123-456-7890" {...field} />
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
                            <Input placeholder="2024" {...field} value={field.value || ''} />
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
                            <Input placeholder="TX" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} value={field.value || ''} />
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
                      name="closerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Closer Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Closer Name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            className="resize-none h-24"
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
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
                  <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Zip Code</code>, 
                  <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Fronter</code>, 
                  <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Closer</code>, 
                  <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Remarks</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
