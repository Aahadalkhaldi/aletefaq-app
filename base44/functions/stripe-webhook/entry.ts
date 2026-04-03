import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoice_id;
      
      if (!invoiceId) {
        console.log('No invoice_id in metadata');
        return Response.json({ success: true });
      }

      // Update invoice status to 'paid'
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.Invoice.update(invoiceId, {
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          payment_receipt_url: session.id,
        });

        // Create notification
        const invoice = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId }, undefined, 1).then(r => r[0]);
        if (invoice) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: invoice.client_name,
            title: `تم استلام دفعة الفاتورة #${invoice.invoice_number}`,
            body: `تم تأكيد دفع الفاتورة بنجاح. المبلغ: ${invoice.total_amount} ر.ق`,
            type: 'invoice_paid',
            related_id: invoiceId,
            related_type: 'Invoice',
          }).catch(e => console.log('Notification creation failed:', e.message));
        }

        console.log(`Invoice ${invoiceId} marked as paid`);
      } catch (error) {
        console.error('Error updating invoice:', error.message);
        // Don't fail webhook on update error
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});