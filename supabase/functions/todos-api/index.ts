import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SAMPLE_RATE = 0.2;
const FUNCTION_NAME = "todos-api";

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

function logLatency(db: ReturnType<typeof createClient>, action: string, durationMs: number, statusCode: number, userId?: string) {
  if (Math.random() >= SAMPLE_RATE) return;
  db.from("api_latency_logs").insert({
    function_name: FUNCTION_NAME,
    action,
    duration_ms: Math.round(durationMs),
    status_code: statusCode,
    user_id: userId,
  }).then();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = performance.now();
  let action = "unknown";
  let userId: string | undefined;
  let statusCode = 200;

  try {
    const auth = await authenticate(req);
    userId = auth.userId;
    const { db } = auth;
    const body = await req.json();
    action = body.action;
    const params = body;

    switch (action) {
      case "list": {
        const { data: todos, error } = await db
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .eq("removed", false)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const todoIds = todos.map((t: any) => t.id);
        let images: any[] = [];
        if (todoIds.length > 0) {
          const { data } = await db.from("todo_images").select("*").in("todo_id", todoIds);
          images = data || [];
        }

        const resp = json(
          todos.map((t: any) => ({ ...t, images: images.filter((img: any) => img.todo_id === t.id) }))
        );
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "list_archived": {
        const { searchText, pageSize, pageOffset } = params;
        if (searchText) {
          const { data, error } = await db.rpc("search_archived_todos", {
            search_term: searchText,
            page_size: pageSize,
            page_offset: pageOffset,
          });
          if (error) throw error;
          const resp = json(data ?? []);
          logLatency(db, action, performance.now() - t0, 200, userId);
          return resp;
        }
        const from = pageOffset;
        const to = from + pageSize - 1;
        const { data, error } = await db
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .eq("removed", true)
          .order("removed_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        const resp = json(data ?? []);
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "count_archived": {
        const { searchText } = params;
        if (searchText) {
          const { data, error } = await db.rpc("count_archived_todos", { search_term: searchText });
          if (error) throw error;
          const resp = json({ count: data ?? 0 });
          logLatency(db, action, performance.now() - t0, 200, userId);
          return resp;
        }
        const { count, error } = await db
          .from("todos")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("removed", true);
        if (error) throw error;
        const resp = json({ count: count ?? 0 });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "add": {
        const { text, category } = params;
        const { error } = await db.from("todos").insert({ text, category, user_id: userId });
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "update": {
        const { id, action: _a, ...updates } = params;
        const { error } = await db.from("todos").update(updates).eq("id", id).eq("user_id", userId);
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "toggle_complete": {
        const { id, completed } = params;
        const { error } = await db
          .from("todos")
          .update({ completed, completed_at: completed ? new Date().toISOString() : null })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "remove": {
        const { id } = params;
        const { error } = await db
          .from("todos")
          .update({ removed: true, removed_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "restore": {
        const { id } = params;
        const { error } = await db
          .from("todos")
          .update({ removed: false, removed_at: null, completed: false, completed_at: null })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "delete_permanent": {
        const { ids } = params;
        for (let i = 0; i < ids.length; i += 500) {
          const batch = ids.slice(i, i + 500);
          const { error } = await db.from("todos").delete().in("id", batch).eq("user_id", userId);
          if (error) throw error;
        }
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "delete_all": {
        const { error } = await db.from("todos").delete().eq("user_id", userId);
        if (error) throw error;
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "bulk_insert": {
        const { todos } = params;
        const rows = todos.map((t: any) => ({ ...t, user_id: userId }));
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await db.from("todos").insert(batch);
          if (error) throw error;
        }
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "archive_completed": {
        const { ids } = params;
        const now = new Date().toISOString();
        for (let i = 0; i < ids.length; i += 500) {
          const batch = ids.slice(i, i + 500);
          const { error } = await db
            .from("todos")
            .update({ removed: true, removed_at: now })
            .in("id", batch)
            .eq("user_id", userId);
          if (error) throw error;
        }
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      case "auto_transitions": {
        const { idsToArchive, idsToMoveToThisWeek } = params;
        const now = new Date().toISOString();
        if (idsToArchive?.length > 0) {
          for (const id of idsToArchive) {
            await db.from("todos").update({ removed: true, removed_at: now }).eq("id", id).eq("user_id", userId);
          }
        }
        if (idsToMoveToThisWeek?.length > 0) {
          for (const id of idsToMoveToThisWeek) {
            await db.from("todos").update({ category: "this_week", created_at: now }).eq("id", id).eq("user_id", userId);
          }
        }
        const resp = json({ success: true });
        logLatency(db, action, performance.now() - t0, 200, userId);
        return resp;
      }

      default:
        statusCode = 400;
        const resp = json({ error: `Unknown action: ${action}` }, 400);
        logLatency(db, action, performance.now() - t0, 400, userId);
        return resp;
    }
  } catch (e: any) {
    statusCode = e.status || 500;
    // Try to log even on error (need a service client)
    try {
      const sc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      logLatency(sc, action, performance.now() - t0, statusCode, userId);
    } catch {}
    return json({ error: e.message || "Internal error" }, statusCode);
  }
});
