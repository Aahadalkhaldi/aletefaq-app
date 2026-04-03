import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STATUS_LABELS = {
  new: "جديدة",
  in_progress: "جارية",
  court: "في المحكمة",
  waiting_docs: "بانتظار وثائق",
  closed: "مغلقة",
  archived: "مؤرشفة"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only send if status changed
    if (old_data && data.status === old_data.status) {
      return Response.json({ skipped: true, reason: "status not changed" });
    }

    const caseData = data;
    if (!caseData?.client_name || !caseData?.title) {
      return Response.json({ skipped: true, reason: "missing data" });
    }

    // Try to find client email
    let clientEmail = null;
    if (caseData.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: caseData.client_id }, "-created_date", 1).catch(() => []);
      clientEmail = clients[0]?.email;
    }
    if (!clientEmail) {
      return Response.json({ skipped: true, reason: "no client email" });
    }

    const newStatus = STATUS_LABELS[caseData.status] || caseData.status;
    const oldStatus = old_data ? (STATUS_LABELS[old_data.status] || old_data.status) : "";

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject: `تحديث على قضيتك: ${caseData.title}`,
      body: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #F3F7FD; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(18,62,124,0.10);">
    <div style="background: linear-gradient(135deg, #0D2F5F, #123E7C); padding: 32px; text-align: center;">
      <span style="font-size: 40px;">📋</span>
      <h1 style="color: white; margin: 12px 0 0; font-size: 20px;">تحديث على قضيتك</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="color: #101828; font-size: 16px; margin: 0 0 8px;">عزيزنا <strong>${caseData.client_name}</strong>،</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
        نود إطلاعكم بأنه تم تحديث حالة قضيتكم في منصة الاتفاق للمحاماة.
      </p>

      <div style="background: #F7F8FA; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #6B7280; font-size: 13px; padding: 8px 0;">اسم القضية</td>
            <td style="color: #101828; font-weight: 600; font-size: 14px; text-align: left;">${caseData.title}</td>
          </tr>
          ${caseData.case_number ? `<tr><td style="color: #6B7280; font-size: 13px; padding: 8px 0;">رقم القضية</td><td style="color: #101828; font-weight: 600; font-size: 14px; text-align: left;">${caseData.case_number}</td></tr>` : ""}
          ${oldStatus ? `<tr><td style="color: #6B7280; font-size: 13px; padding: 8px 0;">الحالة السابقة</td><td style="color: #9CA3AF; font-size: 14px; text-align: left;">${oldStatus}</td></tr>` : ""}
          <tr>
            <td style="color: #6B7280; font-size: 13px; padding: 8px 0;">الحالة الجديدة</td>
            <td style="text-align: left;"><span style="background: #EAF2FF; color: #123E7C; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">${newStatus}</span></td>
          </tr>
          ${caseData.court_name ? `<tr><td style="color: #6B7280; font-size: 13px; padding: 8px 0;">المحكمة</td><td style="color: #101828; font-size: 14px; text-align: left;">${caseData.court_name}</td></tr>` : ""}
          ${caseData.next_hearing_date ? `<tr><td style="color: #6B7280; font-size: 13px; padding: 8px 0;">الجلسة القادمة</td><td style="color: #123E7C; font-weight: 600; font-size: 14px; text-align: left;">${new Date(caseData.next_hearing_date).toLocaleDateString('ar-QA')}</td></tr>` : ""}
        </table>
      </div>

      <p style="color: #6B7280; font-size: 13px; line-height: 1.7;">
        يمكنكم الاطلاع على كامل تفاصيل القضية ومتابعة مستجداتها عبر منصتنا. للاستفسار، لا تترددوا في التواصل معنا.
      </p>
    </div>

    <div style="background: #F7F8FA; padding: 20px 32px; text-align: center; border-top: 1px solid #E7ECF3;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">الاتفاق للمحاماة والاستشارات القانونية • قطر</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
      from_name: "الاتفاق للمحاماة"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});