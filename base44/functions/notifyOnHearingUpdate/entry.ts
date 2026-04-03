import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, event } = body;

    if (!data || event?.type !== 'update') {
      return Response.json({ skipped: true });
    }

    // Only notify if status changed
    if (old_data?.status === data.status) {
      return Response.json({ skipped: true, reason: "status unchanged" });
    }

    const statusLabels = {
      scheduled: "مجدولة",
      completed: "منتهية",
      postponed: "مؤجلة",
      cancelled: "ملغية",
    };

    await base44.asServiceRole.entities.Notification.create({
      user_id: data.created_by || "system",
      title: "تحديث حالة الجلسة",
      body: `تم تحديث حالة جلسة ${data.court_name}${data.case_title ? " - " + data.case_title : ""} إلى: ${statusLabels[data.status] || data.status}`,
      type: "case_update",
      related_id: data.case_id,
      related_type: "Hearing",
      is_read: false,
      action_url: data.case_id ? `/cases/${data.case_id}` : "/cases",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});