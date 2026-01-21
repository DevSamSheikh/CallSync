import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertReport } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ReportsFilter = z.infer<Exclude<typeof api.reports.list.input, undefined>>;

export function useReports(filters?: ReportsFilter) {
  return useQuery({
    queryKey: [api.reports.list.path, filters],
    queryFn: async () => {
      const url = filters 
        ? buildUrl(api.reports.list.path) + `?${new URLSearchParams(filters as Record<string, string>)}`
        : api.reports.list.path;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return api.reports.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReport) => {
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create report");
      return api.reports.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
      toast({
        title: "Report Submitted",
        description: "The report has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkCreateReports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReport[]) => {
      const res = await fetch(api.reports.bulkCreate.path, {
        method: api.reports.bulkCreate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to upload reports");
      return api.reports.bulkCreate.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
      toast({
        title: "Bulk Import Successful",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
