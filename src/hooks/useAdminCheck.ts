import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      navigate("/");
      return;
    }

    supabase.functions
      .invoke("user-api", { body: { action: "check_admin" } })
      .then(({ data, error }) => {
        if (error || !data?.isAdmin) {
          navigate("/");
        } else {
          setIsAdmin(true);
        }
        setIsLoading(false);
      });
  }, [user, authLoading, navigate]);

  return { isAdmin, isLoading };
}
