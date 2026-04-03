import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signatureId, clientName, documentName } = await req.json();

    // Create notification for the lawyer/admin
    const notification = await base44.entities.Notification.create({
      user_id: 'admin',
      title: 'تم توقيع مستند جديد',
      body: `وقّع ${clientName} على المستند "${documentName}"`,
      type: 'document_signed',
      related_id: signatureId,
      related_type: 'SignatureRequest',
      is_read: false
    });

    // Send email notification
    try {
      await base44.integrations.Core.SendEmail({
        to: 'admin@aletefaq.com',
        subject: `توقيع جديد: ${documentName}`,
        body: `وقّع العميل ${clientName} على المستند "${documentName}".\n\nيرجى مراجعة التفاصيل في لوحة التحكم.`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return Response.json({
      success: true,
      notification: notification
    });
  } catch (error) {
    console.error('Error in notifyOnSignature:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});