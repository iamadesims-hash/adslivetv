// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!)
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

const supabase = createClient(
    Deno.env.get("https://hvmorwakzafqratahwbr.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bW9yd2FremFmcXJhdGFod2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY5NzQ4NCwiZXhwIjoyMDk2MjczNDg0fQ.NvOhGeRj3XjIlqWa85qzg91U3KHniWSNy0sZx_7Q0Mk")!
)

serve(async (req) => {
    try {
        const signature = req.headers.get("stripe-signature")
        const body = await req.text()

        // === STRIPE WEBHOOK SIGNATURE VERIFICATION ===
        let event: Stripe.Event
        try {
            event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
            console.log(`✅ Verified webhook event: ${event.type}`)
        } catch (err) {
            console.error(`❌ Webhook signature verification failed: ${err.message}`)
            return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        // Handle different events
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
                break

            case "customer.subscription.created":
            case "customer.subscription.updated":
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
                break

            case "customer.subscription.deleted":
                await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
                break

            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
                break
        }

        return new Response("Success", { status: 200 })
    } catch (error) {
        console.error("Webhook error:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
})

// ==================== EVENT HANDLERS ====================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId
    if (!userId) return

    await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: 'premium',
        status: 'active',
        updated_at: new Date().toISOString()
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await supabase.from('subscriptions')
        .update({
            status: subscription.status,
            updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    await supabase.from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for customer: ${invoice.customer}`)
    // You can update billing history here
}