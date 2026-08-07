// ========== SUPABASE CONFIGURATION ==========
// Para almacenar imágenes de destacados (Supabase Storage)

const SUPABASE_URL = 'https://xgwlzndirvqzmaikdzzi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sy8pM68ESM-AsnXbE0rUcA_3Q7bvr7C';

// Crear cliente Supabase y exponerlo globalmente
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase conectado:', SUPABASE_URL);
