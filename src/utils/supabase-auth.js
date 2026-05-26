const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = require('../app/config');

let adminClient = null;
let anonClient = null;

function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  if (!SUPABASE_URL) throw new Error('缺少环境变量：SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('缺少环境变量：SUPABASE_SERVICE_ROLE_KEY');

  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}

function getSupabaseClient() {
  if (anonClient) return anonClient;

  if (!SUPABASE_URL) throw new Error('缺少环境变量：SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) throw new Error('缺少环境变量：SUPABASE_ANON_KEY');

  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return anonClient;
}

module.exports = { getSupabaseAdmin, getSupabaseClient };
