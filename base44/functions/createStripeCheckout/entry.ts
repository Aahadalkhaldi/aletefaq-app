import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, invoiceNumber, amount, clientEmail, returnUrl, description } = await req.json();

    if (!invoiceId || !amount || amount <= 0) {
      return Response.json({ error: 'Invalid invoice data' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      mode: 'payment',
      customer_email: clientEmail || user?.email,
      line_items: [
        {
          price_data: {
            currency: 'qar',
            product_data: {
              name: `فاتورة #${invoiceNumber}`,
              description: description || `دفع الفاتورة رقم ${invoiceNumber}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl || `${new URL(req.url).origin}/billing`}?payment=success&invoice=${invoiceId}`,
      cancel_url: `${returnUrl || `${new URL(req.url).origin}/billing`}?payment=cancelled&invoice=${invoiceId}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        client_email: clientEmail || user?.email || '',
      },
    });

    console.log(`Checkout session created: ${session.id} for invoice ${invoiceId}`);

    return Response.json({ 
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});