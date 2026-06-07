// supabase/functions/create-portal-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!)

serve(async (req) => {
    const { customerId } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${Deno.env.get("SITE_URL")}/profile.html`
    })

    return new Response(JSON.stringify({ url: session.url }), {
        headers: { "Content-Type": "application/json" }
    })
})