import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ROLES = ['admin', 'manager', 'professional', 'patient'] as const;
type AppRole = typeof ALLOWED_ROLES[number];

interface InviteBody {
  email: string;
  full_name: string;
  role: AppRole;
  password?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate caller using anon client + their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check caller is admin
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
      _user_id: userRes.user.id, _role: 'admin',
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem convidar usuários' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as InviteBody;
    if (!body?.email || !body?.full_name || !body?.role) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, full_name, role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_ROLES.includes(body.role)) {
      return new Response(JSON.stringify({ error: 'Papel inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user (auto-confirm so they can log in immediately)
    const password = body.password || crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'A1!';
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = created.user!.id;

    // handle_new_user trigger creates default 'professional' role; remove it if other was requested
    if (body.role !== 'professional') {
      await admin.from('user_roles').delete().eq('user_id', newUserId).eq('role', 'professional');
    }
    // Insert requested role (idempotent on unique)
    const { error: insRoleErr } = await admin
      .from('user_roles')
      .insert({ user_id: newUserId, role: body.role });
    if (insRoleErr && !String(insRoleErr.message).toLowerCase().includes('duplicate')) {
      return new Response(JSON.stringify({ error: insRoleErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        user_id: newUserId,
        email: body.email,
        temp_password: body.password ? undefined : password,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
