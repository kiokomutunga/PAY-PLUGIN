import {createClient} from "@supabase/supabase-js";

const supabaseurl = process.env.SUPABASE_URL
const supabasesecretkey = process.env.SUPABASE_SECRET_KEY

if (!supabaseurl) {
    throw new error ( "couldnt fetch supabase url")
}

if (!supabasesecretkey) {
    throw new Error (" couldn't fetch supa secret key")
}
const supabase = createclient (

    supabasesecretkey,
    supabaseurl,
    {
        auth : {

        persistToken: false,
        autoRefreshToken : false

    }

    }
);

export default supabase 