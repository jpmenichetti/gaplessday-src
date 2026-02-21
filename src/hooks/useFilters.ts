import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserFilters {
  show_overdue: boolean;
  selected_tags: string[];
}

export function useFilters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const filtersQuery = useQuery({
    queryKey: ["user-filters", user?.id],
    queryFn: async (): Promise<UserFilters> => {
      const { data, error } = await supabase
        .from("user_filters")
        .select("show_overdue, selected_tags")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { show_overdue: false, selected_tags: [] };
    },
    enabled: !!user,
  });

  const upsertFilters = useMutation({
    mutationFn: async (filters: UserFilters) => {
      const { error } = await supabase
        .from("user_filters")
        .upsert(
          { user_id: user!.id, ...filters },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-filters"] }),
  });

  const showOverdue = filtersQuery.data?.show_overdue ?? false;
  const selectedTags = filtersQuery.data?.selected_tags ?? [];

  const toggleOverdue = () => {
    upsertFilters.mutate({ show_overdue: !showOverdue, selected_tags: selectedTags });
  };

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    upsertFilters.mutate({ show_overdue: showOverdue, selected_tags: next });
  };

  const clearFilters = () => {
    upsertFilters.mutate({ show_overdue: false, selected_tags: [] });
  };

  const hasActiveFilters = showOverdue || selectedTags.length > 0;

  return { showOverdue, selectedTags, toggleOverdue, toggleTag, clearFilters, hasActiveFilters, isLoading: filtersQuery.isLoading };
}
