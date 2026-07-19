import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
    
    throw new Error("SUPABASE_URL is missing from the .env file");
}

if (!supabaseSecretKey) {

    throw new Error("SUPABASE_SECRET_KEY is missing from the .env file");
}

const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export default supabase;