import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type WeeklyReport = {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  todos_count: number;
  created_at: string;
};

export function useWeeklyReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ["weekly-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports" as any)
        .select("*")
        .order("week_start", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as unknown as WeeklyReport[];
    },
    enabled: !!user,
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-weekly-report", {
        body: {},
      });
      if (error) throw error;
      
      // Check for no_tasks result
      const results = data?.results as Array<{ user_id: string; status: string }> | undefined;
      if (results && results.length > 0 && results[0].status === "no_tasks") {
        throw new Error("no_tasks");
      }
      if (results && results.length > 0 && results[0].status === "rate_limited") {
        throw new Error("rate_limited");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
    },
  });

  const reports = reportsQuery.data ?? [];
  const latestReport = reports.length > 0 ? reports[0] : null;

  return {
    reports,
    latestReport,
    generateReport,
    isGenerating: generateReport.isPending,
    isLoading: reportsQuery.isLoading,
  };
}
