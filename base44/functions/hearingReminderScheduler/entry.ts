import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Only callable by scheduler (no user auth needed - uses service role)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Get all scheduled hearings for tomorrow
    const hearings = await base44.asServiceRole.entities.Hearing.filter({
      status: "scheduled",
      date: tomorrowStr
    });

    let notified = 0;

    for (const hearing of hearings) {
      // Skip if reminder already sent
      if (hearing.reminder_sent) continue;

      // Get case to find lawyer
      let caseData = null;
      if (hearing.case_id) {
        const cases = await base44.asServiceRole.entities.Case.filter({ id: hearing.case_id });
        caseData = cases[0] || null;
      }

      // Create in-app notification for lawyer (if we have lead_lawyer_id)
      const lawyerId = caseData?.lead_lawyer_id;
      if (lawyerId) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: lawyerId,
          title: "تذكير بجلسة غداً",
          body: `لديك جلسة غداً في ${hearing.court_name}${hearing.time ? ` الساعة ${hearing.time}` : ""} — ${hearing.case_title || "قضية"}`,
          type: "hearing_reminder",
          related_id: hearing.id,
          related_type: "Hearing",
          is_read: false,
          action_url: hearing.case_id ? `/cases/${hearing.case_id}` : "/appointments"
        });
      }

      // Also notify client
      const clientId = caseData?.client_id;
      if (clientId) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: clientId,
          title: "تذكير: جلسة قضيتك غداً",
          body: `موعد جلسة قضيتك "${hearing.case_title || ""}" غداً في ${hearing.court_name}${hearing.time ? ` الساعة ${hearing.time}` : ""}`,
          type: "hearing_reminder",
          related_id: hearing.id,
          related_type: "Hearing",
          is_read: false,
          action_url: hearing.case_id ? `/cases/${hearing.case_id}` : "/appointments"
        });
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.Hearing.update(hearing.id, { reminder_sent: true });
      notified++;
    }

    return Response.json({ success: true, reminded: notified, date: tomorrowStr });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});