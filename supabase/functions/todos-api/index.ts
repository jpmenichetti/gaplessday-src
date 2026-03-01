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

        return json(
          todos.map((t: any) => ({ ...t, images: images.filter((img: any) => img.todo_id === t.id) }))
        );
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
          return json(data ?? []);
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
        return json(data ?? []);
      }

      case "count_archived": {
        const { searchText } = params;
        if (searchText) {
          const { data, error } = await db.rpc("count_archived_todos", { search_term: searchText });
          if (error) throw error;
          return json({ count: data ?? 0 });
        }
        const { count, error } = await db
          .from("todos")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("removed", true);
        if (error) throw error;
        return json({ count: count ?? 0 });
      }

      case "add": {
        const { text, category } = params;
        const { error } = await db.from("todos").insert({ text, category, user_id: userId });
        if (error) throw error;
        return json({ success: true });
      }

      case "update": {
        const { id, ...updates } = params;
        const { error } = await db.from("todos").update(updates).eq("id", id).eq("user_id", userId);
        if (error) throw error;
        return json({ success: true });
      }

      case "toggle_complete": {
        const { id, completed } = params;
        const { error } = await db
          .from("todos")
          .update({ completed, completed_at: completed ? new Date().toISOString() : null })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return json({ success: true });
      }

      case "remove": {
        const { id } = params;
        const { error } = await db
          .from("todos")
          .update({ removed: true, removed_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return json({ success: true });
      }

      case "restore": {
        const { id } = params;
        const { error } = await db
          .from("todos")
          .update({ removed: false, removed_at: null, completed: false, completed_at: null })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return json({ success: true });
      }

      case "delete_permanent": {
        const { ids } = params;
        for (let i = 0; i < ids.length; i += 500) {
          const batch = ids.slice(i, i + 500);
          const { error } = await db.from("todos").delete().in("id", batch).eq("user_id", userId);
          if (error) throw error;
        }
        return json({ success: true });
      }

      case "delete_all": {
        const { error } = await db.from("todos").delete().eq("user_id", userId);
        if (error) throw error;
        return json({ success: true });
      }

      case "bulk_insert": {
        const { todos } = params;
        const rows = todos.map((t: any) => ({ ...t, user_id: userId }));
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await db.from("todos").insert(batch);
          if (error) throw error;
        }
        return json({ success: true });
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
        return json({ success: true });
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
        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    const status = e.status || 500;
    return json({ error: e.message || "Internal error" }, status);
  }
});
