import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const doc = body.data;
    if (!doc) return Response.json({ skipped: true });

    // Create notification for the document upload
    await base44.asServiceRole.entities.Notification.create({
      user_id: doc.created_by || "system",
      title: "مستند جديد تم رفعه",
      body: `تم رفع المستند "${doc.name}" ${doc.case_title ? "للقضية: " + doc.case_title : ""}`,
      type: "document_required",
      related_id: doc.id,
      related_type: "CaseDocument",
      is_read: false,
      action_url: doc.case_id ? `/cases/${doc.case_id}` : "/vault",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});