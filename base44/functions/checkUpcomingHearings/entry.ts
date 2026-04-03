import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all scheduled hearings
    const hearings = await base44.asServiceRole.entities.Hearing.list('-updated_date', 500);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

    // Filter hearings scheduled for tomorrow
    const upcomingHearings = hearings.filter(h => {
      if (h.status !== 'scheduled' || !h.date) return false;
      const hearingDate = new Date(h.date);
      const hearingDay = new Date(hearingDate.getFullYear(), hearingDate.getMonth(), hearingDate.getDate());
      return hearingDay >= tomorrowStart && hearingDay < tomorrowEnd;
    });

    console.log(`Found ${upcomingHearings.length} hearings scheduled for tomorrow`);

    // Process each hearing
    for (const hearing of upcomingHearings) {
      try {
        // Get case and client details
        const caseDetails = await base44.asServiceRole.entities.Case.filter({ id: hearing.case_id }, undefined, 1).then(r => r[0]);

        if (!caseDetails) {
          console.log(`Case ${hearing.case_id} not found`);
          continue;
        }

        // Get client
        const client = await base44.asServiceRole.entities.Client.filter({ full_name: caseDetails.client_name }, undefined, 1).then(r => r[0]);

        // Create notification for lawyer
        const lawyerNotif = await base44.asServiceRole.entities.Notification.create({
          user_id: caseDetails.lead_lawyer_id || 'lawyer',
          title: `تذكير: جلسة قضائية غداً`,
          body: `جلسة ${hearing.type || 'عادية'} في ${caseDetails.title} بالمحكمة ${hearing.court_name || 'المحددة'} غداً الساعة ${hearing.time || 'الموقت المحدد'}`,
          type: 'hearing_reminder',
          related_id: hearing.id,
          related_type: 'Hearing',
          action_url: `/hearings`,
        }).catch(e => {
          console.log('Failed to create lawyer notification:', e.message);
          return null;
        });

        console.log(`Created lawyer notification for hearing ${hearing.id}`);

        // Create notification for client if has email/phone
        if (client) {
          const clientNotif = await base44.asServiceRole.entities.Notification.create({
            user_id: client.full_name,
            title: `تذكير: جلسة قضائية غداً`,
            body: `جلستك القضائية في ${caseDetails.title} ستكون غداً الساعة ${hearing.time || 'الموقت المحدد'} بالمحكمة ${hearing.court_name || 'المحددة'}`,
            type: 'hearing_reminder',
            related_id: hearing.id,
            related_type: 'Hearing',
            action_url: `/my-hearings`,
          }).catch(e => {
            console.log('Failed to create client notification:', e.message);
            return null;
          });

          console.log(`Created client notification for hearing ${hearing.id}`);
        }

        // Update hearing to mark reminder as sent
        await base44.asServiceRole.entities.Hearing.update(hearing.id, {
          reminder_sent: true,
        }).catch(e => console.log('Failed to update hearing:', e.message));

      } catch (error) {
        console.error(`Error processing hearing ${hearing.id}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      processedCount: upcomingHearings.length,
      message: `Processed ${upcomingHearings.length} upcoming hearings`,
    });
  } catch (error) {
    console.error('Error in checkUpcomingHearings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});