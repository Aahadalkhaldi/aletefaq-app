import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all scheduled meetings
    const meetings = await base44.asServiceRole.entities.Meeting.list('-date', 500);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find meetings scheduled in the next 24-25 hours window (not already notified)
    const upcoming = meetings.filter(m => {
      if (m.status !== 'scheduled' || m.reminder_sent) return false;
      if (!m.date || !m.time) return false;

      const meetingDatetime = new Date(`${m.date}T${m.time}:00`);
      return meetingDatetime >= in24h && meetingDatetime <= in25h;
    });

    console.log(`Found ${upcoming.length} meetings requiring 24h reminder`);

    let notifiedCount = 0;

    for (const meeting of upcoming) {
      try {
        const dateFormatted = new Date(meeting.date + 'T00:00:00').toLocaleDateString('ar-QA', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Notification for client
        if (meeting.client_name) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: meeting.client_name,
            title: `⏰ تذكير: موعدك غداً`,
            body: `لديك موعد "${meeting.title}" غداً ${dateFormatted} الساعة ${meeting.time}`,
            type: 'case_update',
            related_id: meeting.id,
            related_type: 'Meeting',
            action_url: '/appointments',
            is_read: false,
          });
          console.log(`Client notified for meeting ${meeting.id} - ${meeting.client_name}`);
        }

        // Notification for lawyer (admin system)
        await base44.asServiceRole.entities.Notification.create({
          user_id: 'admin',
          title: `⏰ تذكير: موعد غداً`,
          body: `موعد "${meeting.title}" مع ${meeting.client_name || 'عميل'} غداً الساعة ${meeting.time}`,
          type: 'case_update',
          related_id: meeting.id,
          related_type: 'Meeting',
          action_url: '/meetings',
          is_read: false,
        });

        // Mark reminder sent
        await base44.asServiceRole.entities.Meeting.update(meeting.id, { reminder_sent: true });

        notifiedCount++;
      } catch (err) {
        console.error(`Error notifying for meeting ${meeting.id}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      checked: meetings.length,
      notified: notifiedCount,
      message: `Sent ${notifiedCount} meeting reminders`,
    });
  } catch (error) {
    console.error('meetingReminderCheck error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});