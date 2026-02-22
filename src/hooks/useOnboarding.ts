import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: showOnboarding, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("onboarding_completed")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      // No row yet → user hasn't completed onboarding
      if (!data) return true;

      return !data.onboarding_completed;
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      // Upsert: insert if missing, update if exists
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user!.id, onboarding_completed: true },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["onboarding", user?.id], false);
    },
  });

  return {
    showOnboarding: !!showOnboarding && !isLoading,
    isLoading,
    completeOnboarding,
  };
}
