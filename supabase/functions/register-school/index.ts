import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { school_name, director_name, email, password, plan } = await req.json();

    // Validate required fields
    if (!school_name?.trim() || !director_name?.trim() || !email?.trim() || !password) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos: nombre del colegio, nombre del director, email y contraseña" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "El correo electrónico no es válido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate password
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate plan
    const validPlan = ["basico", "pro"].includes(plan) ? plan : "basico";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique slug
    const baseSlug = slugify(school_name.trim());
    let slug = `${baseSlug}-${randomSuffix()}`;

    // Insert school
    const { data: school, error: schoolError } = await adminClient
      .from("schools")
      .insert({
        name: school_name.trim(),
        slug,
        plan: validPlan,
        status: "trial",
      })
      .select("id, slug")
      .single();

    if (schoolError) {
      // Retry with different slug on unique violation
      if (schoolError.code === "23505") {
        slug = `${baseSlug}-${randomSuffix()}${randomSuffix()}`;
        const { data: retrySchool, error: retryError } = await adminClient
          .from("schools")
          .insert({
            name: school_name.trim(),
            slug,
            plan: validPlan,
            status: "trial",
          })
          .select("id, slug")
          .single();
        if (retryError) {
          return new Response(
            JSON.stringify({ error: "Error al crear el colegio. Intenta de nuevo." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        // Use retrySchool below
        const schoolId = retrySchool.id;
        return await createUserAndRespond(adminClient, schoolId, retrySchool.slug, director_name, email, password);
      }
      return new Response(
        JSON.stringify({ error: `Error al crear el colegio: ${schoolError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return await createUserAndRespond(adminClient, school.id, school.slug, director_name, email, password);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function createUserAndRespond(
  adminClient: ReturnType<typeof createClient>,
  schoolId: string,
  schoolSlug: string,
  directorName: string,
  email: string,
  password: string,
) {
  // Create auth user with school_id in metadata
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      name: directorName.trim(),
      role: "director",
      school_id: schoolId,
    },
  });

  if (userError) {
    // Rollback: delete the school
    await adminClient.from("schools").delete().eq("id", schoolId);

    const message = userError.message.includes("already been registered")
      ? "Ya existe un usuario con ese correo electrónico"
      : userError.message;
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      school: { id: schoolId, slug: schoolSlug },
      user: { id: userData.user.id, email: userData.user.email },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
