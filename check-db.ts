import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/dotenv/load.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemes() {
    const { data, error } = await supabase.from('funding_schemes').select('id, name, template_json');
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

checkSchemes();
