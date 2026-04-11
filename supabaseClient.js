const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Пріоритет для Service Role Key (для адмінських дій в обхід RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

// If credentials are missing — return null.
// server.js checks for null before every Supabase call and falls back to local file.
if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  SUPABASE_URL або SUPABASE_KEY не задані. Використовується локальний файл products.js як fallback.');
    module.exports = null;
} else {
    const { createClient } = require('@supabase/supabase-js');
    module.exports = createClient(supabaseUrl, supabaseKey);
}
