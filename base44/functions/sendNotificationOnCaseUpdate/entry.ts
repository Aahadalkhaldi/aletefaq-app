import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process Case updates
    if (event.entity_name !== 'Case') {
      return Response.json({ success: true });
    }

    // Check if status changed
    if (!old_data || data.status === old_data.status) {
      return Response.json({ success: true });
    }

    // Get lawyer settings
    let lawyerSettings = null;
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const lawyer = users.find(u => u.role === 'admin' || u.role === 'lawyer');
      if (lawyer?.notification_manager_settings?.autoNotifyOnCaseUpdate) {
        lawyerSettings = lawyer.notification_manager_settings;
      }
    } catch (e) {
      console.log('Could not fetch lawyer settings');
    }

    if (!lawyerSettings?.autoNotifyOnCaseUpdate) {
      return Response.json({ success: true });
    }

    // Create notification for client
    const statusMap = {
      'new': 'جديدة',
      'in_progress': 'قيد المتابعة',
      'court': 'أمام المحكمة',
      'closed': 'مغلقة',
      'waiting_docs': 'في انتظار المستندات',
    };

    const oldStatus = statusMap[old_data.status] || old_data.status;
    const newStatus = statusMap[data.status] || data.status;

    await base44.asServiceRole.entities.Notification.create({
      user_id: data.client_name,
      title: `تحديث قضيتك: ${data.title}`,
      body: `تم تحديث حالة القضية من "${oldStatus}" إلى "${newStatus}"`,
      type: 'case_update',
      related_id: data.id,
      related_type: 'Case',
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});