import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process new invoices
    if (event.entity_name !== 'Invoice' || event.type !== 'create') {
      return Response.json({ success: true });
    }

    // Get lawyer settings
    let lawyerSettings = null;
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const lawyer = users.find(u => u.role === 'admin' || u.role === 'lawyer');
      if (lawyer?.notification_manager_settings?.autoNotifyOnNewInvoice) {
        lawyerSettings = lawyer.notification_manager_settings;
      }
    } catch (e) {
      console.log('Could not fetch lawyer settings');
    }

    if (!lawyerSettings?.autoNotifyOnNewInvoice) {
      return Response.json({ success: true });
    }

    // Create notification for client
    await base44.asServiceRole.entities.Notification.create({
      user_id: data.client_name,
      title: `فاتورة جديدة: ${data.invoice_number}`,
      body: `تم إنشاء فاتورة بمبلغ ${data.total_amount || data.amount} ر.ق - الاستحقاق: ${data.due_date}`,
      type: 'invoice_due',
      related_id: data.id,
      related_type: 'Invoice',
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});