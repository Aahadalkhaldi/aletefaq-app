import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch scheduled hearings for today and tomorrow
    const hearings = await base44.asServiceRole.entities.Hearing.filter({ status: "scheduled" });

    const upcoming = hearings.filter(h => h.date === tomorrowStr || h.date === todayStr);

    let reminded = 0;
    for (const hearing of upcoming) {
      // Skip if already reminded
      if (hearing.reminder_sent) continue;

      const dayLabel = hearing.date === todayStr ? "اليوم" : "غداً";

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: hearing.created_by || "system",
        title: `تذكير بجلسة ${dayLabel}`,
        body: `لديك جلسة ${dayLabel} في ${hearing.court_name}${hearing.time ? " الساعة " + hearing.time : ""}${hearing.case_title ? " - القضية: " + hearing.case_title : ""}`,
        type: "hearing_reminder",
        related_id: hearing.id,
        related_type: "Hearing",
        is_read: false,
        action_url: hearing.case_id ? `/cases/${hearing.case_id}` : "/appointments",
      });

      // Send email reminder
      if (hearing.created_by) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: hearing.created_by,
          subject: `تذكير: جلسة قضائية ${dayLabel}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #123E7C;">تذكير بجلسة قضائية</h2>
              <p>لديك جلسة قضائية <strong>${dayLabel}</strong></p>
              <ul>
                <li><strong>المحكمة:</strong> ${hearing.court_name}</li>
                ${hearing.time ? `<li><strong>الوقت:</strong> ${hearing.time}</li>` : ""}
                ${hearing.case_title ? `<li><strong>القضية:</strong> ${hearing.case_title}</li>` : ""}
                ${hearing.location ? `<li><strong>الموقع:</strong> ${hearing.location}</li>` : ""}
                ${hearing.notes ? `<li><strong>ملاحظات:</strong> ${hearing.notes}</li>` : ""}
              </ul>
              <p style="color: #6B7280; font-size: 12px;">الاتفاق للمحاماة والاستشارات القانونية</p>
            </div>
          `,
        });
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.Hearing.update(hearing.id, { reminder_sent: true });
      reminded++;
    }

    return Response.json({
      success: true,
      total_upcoming: upcoming.length,
      reminded,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});