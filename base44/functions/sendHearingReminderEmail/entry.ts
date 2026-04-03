import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get upcoming hearings in the next 2 days
    const today = new Date();
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);

    const todayStr = today.toISOString().split('T')[0];
    const laterStr = twoDaysLater.toISOString().split('T')[0];

    const hearings = await base44.asServiceRole.entities.Hearing.filter(
      { status: "scheduled", reminder_sent: false },
      "date",
      50
    ).catch(() => []);

    const upcoming = hearings.filter(h => h.date >= todayStr && h.date <= laterStr);

    let sent = 0;
    for (const hearing of upcoming) {
      if (!hearing.case_id) continue;

      // Get case + client info
      const cases = await base44.asServiceRole.entities.Case.filter({ id: hearing.case_id }, "-created_date", 1).catch(() => []);
      const caseData = cases[0];
      if (!caseData?.client_id) continue;

      const clients = await base44.asServiceRole.entities.Client.filter({ id: caseData.client_id }, "-created_date", 1).catch(() => []);
      const client = clients[0];
      if (!client?.email) continue;

      const hearingDate = new Date(hearing.date);
      const dateStr = hearingDate.toLocaleDateString('ar-QA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject: `تذكير: جلسة قضائية غداً — ${caseData.title}`,
        body: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #F3F7FD; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(18,62,124,0.10);">
    <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 32px; text-align: center;">
      <span style="font-size: 40px;">🗓️</span>
      <h1 style="color: white; margin: 12px 0 0; font-size: 20px;">تذكير بموعد الجلسة</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="color: #101828; font-size: 16px; margin: 0 0 8px;">عزيزنا <strong>${client.full_name}</strong>،</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
        نذكركم بموعد الجلسة القضائية القادمة المتعلقة بقضيتكم.
      </p>

      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #065F46; font-size: 13px; padding: 8px 0; font-weight: 600;">📋 القضية</td>
            <td style="color: #101828; font-weight: 700; font-size: 14px; text-align: left;">${caseData.title}</td>
          </tr>
          <tr>
            <td style="color: #065F46; font-size: 13px; padding: 8px 0; font-weight: 600;">📅 التاريخ</td>
            <td style="color: #101828; font-weight: 600; font-size: 14px; text-align: left;">${dateStr}</td>
          </tr>
          ${hearing.time ? `<tr><td style="color: #065F46; font-size: 13px; padding: 8px 0; font-weight: 600;">⏰ الوقت</td><td style="color: #101828; font-weight: 600; font-size: 14px; text-align: left;">${hearing.time}</td></tr>` : ""}
          <tr>
            <td style="color: #065F46; font-size: 13px; padding: 8px 0; font-weight: 600;">🏛️ المحكمة</td>
            <td style="color: #101828; font-size: 14px; text-align: left;">${hearing.court_name}</td>
          </tr>
          ${hearing.location ? `<tr><td style="color: #065F46; font-size: 13px; padding: 8px 0; font-weight: 600;">📍 القاعة</td><td style="color: #101828; font-size: 14px; text-align: left;">${hearing.location}</td></tr>` : ""}
        </table>
      </div>

      <div style="background: #FFF4E5; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
        <p style="color: #8A5A00; font-size: 13px; margin: 0;">
          ⚠️ يرجى الحضور قبل الموعد المحدد بـ 15 دقيقة على الأقل، وإحضار وثيقة الهوية الشخصية.
        </p>
      </div>

      <p style="color: #6B7280; font-size: 13px; line-height: 1.7;">
        للاستفسار أو إذا كنتم بحاجة إلى أي معلومات إضافية قبل الجلسة، تواصلوا معنا عبر المنصة.
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

      // Mark reminder as sent
      await base44.asServiceRole.entities.Hearing.update(hearing.id, { reminder_sent: true }).catch(() => {});
      sent++;
    }

    return Response.json({ success: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});