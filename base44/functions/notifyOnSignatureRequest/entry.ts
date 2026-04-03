import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, event } = body;

    if (!data || event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: data.client_id || data.created_by || "system",
      title: "مستند جديد يطلب توقيعك",
      body: `طلب المكتب توقيعك على مستند: ${data.document_name}${data.case_title ? " - القضية: " + data.case_title : ""}`,
      type: "document_required",
      related_id: data.id,
      related_type: "SignatureRequest",
      is_read: false,
      action_url: data.case_id ? `/cases/${data.case_id}` : "/cases",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});