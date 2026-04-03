import Stripe from "npm:stripe@14.21.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const { amount, caseTitle, caseId, clientName, currency = "qar" } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: "المبلغ غير صحيح" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `أتعاب قانونية - ${caseTitle || "قضية قانونية"}`,
              description: clientName ? `موكل: ${clientName}` : "دفعة أتعاب قانونية",
            },
            unit_amount: Math.round(amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "https://app.base44.com"}/billing?payment=success&caseId=${caseId || ""}`,
      cancel_url: `${req.headers.get("origin") || "https://app.base44.com"}/billing?payment=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        case_id: caseId || "",
        case_title: caseTitle || "",
        client_name: clientName || "",
      },
    });

    console.log(`Checkout session created: ${session.id} for case: ${caseTitle}`);
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});