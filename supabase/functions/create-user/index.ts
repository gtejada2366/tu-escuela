import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an authenticated director
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check that the caller is a director and get their school_id
    const { data: profile } = await userClient
      .from("profiles")
      .select("role, school_id")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== "director") {
      return new Response(
        JSON.stringify({ error: "Solo los directores pueden crear usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse request body
    const { email, password, name, role, school_id: reqSchoolId } = await req.json();

    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos: email, password, name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!["director", "profesor", "padre"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Rol inválido. Debe ser 'director' o 'profesor'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create user with service_role key (does NOT affect the caller's session)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, school_id: reqSchoolId || profile?.school_id },
    });

    if (error) {
      const message = error.message.includes("already been registered")
        ? "Ya existe un usuario con ese correo electrónico"
        : error.message;
      return new Response(
        JSON.stringify({ error: message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ user: { id: data.user.id, email: data.user.email } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
