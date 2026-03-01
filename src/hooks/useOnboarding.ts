import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("user-api", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: showOnboarding, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await invoke({ action: "get_onboarding" });
      return data.showOnboarding as boolean;
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      await invoke({ action: "complete_onboarding" });
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
