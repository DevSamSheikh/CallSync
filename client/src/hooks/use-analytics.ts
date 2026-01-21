import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAnalytics() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.dashboard.path);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.dashboard.responses[200].parse(await res.json());
    },
  });
}
