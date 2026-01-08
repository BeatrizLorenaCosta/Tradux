const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fshjhrujnxzkjzafhazs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

module.exports = { supabase };
