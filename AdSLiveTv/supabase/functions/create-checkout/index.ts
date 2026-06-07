// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
})

serve(async (req) => {
  try {
    const { priceId, userId, email } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${Deno.env.get("SITE_URL")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/billing`,
      customer_email: email,
      metadata: { userId },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!)

serve(async (req) => {
    try {
        const { priceId, userId } = await req.json()

        // JWT Verification
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("No authorization header")

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) throw new Error("Invalid JWT")

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${Deno.env.get("SITE_URL")}/profile.html?success=true`,
            cancel_url: `${Deno.env.get("SITE_URL")}/payments.html`,
            metadata: { userId: user.id }
        })

        return new Response(JSON.stringify({ sessionId: session.id }), {
            headers: { "Content-Type": "application/json" }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})  

// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!)

serve(async (req) => {
    try {
        const { priceId, userId } = await req.json()

        // JWT Verification
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("No authorization header")

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) throw new Error("Invalid JWT")

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${Deno.env.get("SITE_URL")}/profile.html?success=true`,
            cancel_url: `${Deno.env.get("SITE_URL")}/payments.html`,
            metadata: { userId: user.id }
        })

        return new Response(JSON.stringify({ sessionId: session.id }), {
            headers: { "Content-Type": "application/json" }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})