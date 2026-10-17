import { createClient } from '@supabase/supabase-js'

// Connect to the same Supabase project used by the backend
export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)