import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useAnalytics(filters?: { days?: number; location?: string; agentId?: number }) {
  return useQuery({
    queryKey: [api.analytics.dashboard.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.days !== undefined) params.append("days", filters.days.toString());
      if (filters?.location) params.append("location", filters.location);
      if (filters?.agentId !== undefined) params.append("agentId", filters.agentId.toString());
      
      const queryString = params.toString();
      const url = buildUrl(api.analytics.dashboard.path) + (queryString ? `?${queryString}` : "");
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.dashboard.responses[200].parse(await res.json());
    },
  });
}
