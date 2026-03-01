import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw { status: 401, message: "Unauthorized" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) throw { status: 401, message: "Unauthorized" };

  const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  return { userId: data.claims.sub as string, db: serviceClient };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, db } = await authenticate(req);
    const { action, ...params } = await req.json();

    switch (action) {
      case "get_filters": {
        const { data, error } = await db
          .from("user_filters")
          .select("show_overdue, selected_tags")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return json(data ?? { show_overdue: false, selected_tags: [] });
      }

      case "upsert_filters": {
        const { show_overdue, selected_tags } = params;
        const { error } = await db
          .from("user_filters")
          .upsert({ user_id: userId, show_overdue, selected_tags }, { onConflict: "user_id" });
        if (error) throw error;
        return json({ success: true });
      }

      case "get_onboarding": {
        const { data, error } = await db
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        // No row = not completed
        const showOnboarding = !data ? true : !data.onboarding_completed;
        return json({ showOnboarding });
      }

      case "complete_onboarding": {
        const { error } = await db
          .from("user_preferences")
          .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" });
        if (error) throw error;
        return json({ success: true });
      }

      case "check_admin": {
        const { data } = await db
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        return json({ isAdmin: !!data });
      }

      case "get_weekly_reports": {
        const { data, error } = await db
          .from("weekly_reports")
          .select("*")
          .eq("user_id", userId)
          .order("week_start", { ascending: false })
          .limit(12);
        if (error) throw error;
        return json(data ?? []);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    const status = e.status || 500;
    return json({ error: e.message || "Internal error" }, status);
  }
});
