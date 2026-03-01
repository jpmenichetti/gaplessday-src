import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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
      case "upload": {
        const { todoId, fileBase64, fileName, contentType } = params;

        // Decode and validate
        const bytes = base64Decode(fileBase64);
        const MAX_SIZE = 10 * 1024 * 1024;
        if (bytes.length > MAX_SIZE) return json({ error: "File too large. Maximum size is 10MB." }, 400);

        // Validate magic bytes
        const isValidImage =
          (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
          (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
          (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) ||
          (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
           bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50);
        if (!isValidImage) return json({ error: "Invalid image file. Only JPEG, PNG, GIF, and WebP are allowed." }, 400);

        // Verify todo belongs to user
        const { data: todo } = await db.from("todos").select("id").eq("id", todoId).eq("user_id", userId).maybeSingle();
        if (!todo) return json({ error: "Todo not found" }, 404);

        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
        const path = `${userId}/${todoId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await db.storage
          .from("todo-images")
          .upload(path, bytes, { contentType });
        if (uploadError) throw uploadError;

        const { error: dbError } = await db.from("todo_images").insert({
          todo_id: todoId,
          storage_path: path,
          file_name: safeName,
        });
        if (dbError) throw dbError;

        return json({ success: true });
      }

      case "delete": {
        const { id, storagePath } = params;
        await db.storage.from("todo-images").remove([storagePath]);
        const { error } = await db.from("todo_images").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }

      case "get_url": {
        const { storagePath } = params;
        const { data, error } = await db.storage
          .from("todo-images")
          .createSignedUrl(storagePath, 3600);
        if (error) throw error;
        return json({ signedUrl: data.signedUrl });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    const status = e.status || 500;
    return json({ error: e.message || "Internal error" }, status);
  }
});
