// supabase/functions/_shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const createSupabaseClient = () => {
    return createClient(
        Deno.env.get('https://hvmorwakzafqratahwbr.supabase.co')!,
        Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bW9yd2FremFmcXJhdGFod2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY5NzQ4NCwiZXhwIjoyMDk2MjczNDg0fQ.NvOhGeRj3XjIlqWa85qzg91U3KHniWSNy0sZx_7Q0Mk')!
    )
}

export async function verifyJWT(req: Request) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No token')

    const token = authHeader.replace('Bearer ', '')
    const supabase = createSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) throw new Error('Invalid JWT')

    return user
}