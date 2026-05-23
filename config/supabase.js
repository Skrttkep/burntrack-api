const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? 'TERBACA' : 'KOSONG');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'TERBACA' : 'KOSONG');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib diisi di file .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;