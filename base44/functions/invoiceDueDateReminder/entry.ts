import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for scheduled task
    const invoices = await base44.asServiceRole.entities.Invoice.list("-created_date", 200);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load lawyer notification settings from any admin user
    let reminderDays = 3;
    let overdueMessage = "عزيزي الموكل، لديك فاتورة متأخرة بمبلغ {amount} ر.ق. يرجى السداد في أقرب وقت ممكن. شكراً - فريق الاتفاق القانوني";
    let upcomingMessage = "عزيزي الموكل، تذكير: فاتورة بمبلغ {amount} ر.ق مستحقة خلال {days} أيام. يرجى الاستعداد للسداد. شكراً - فريق الاتفاق القانوني";

    try {
      const users = await base44.asServiceRole.entities.User.list();
      const adminUser = users.find(u => u.role === "admin");
      if (adminUser?.notification_manager_settings) {
        const s = adminUser.notification_manager_settings;
        if (s.invoiceReminderDays) reminderDays = s.invoiceReminderDays;
        if (s.overdueInvoiceMessage) overdueMessage = s.overdueInvoiceMessage;
        if (s.upcomingInvoiceMessage) upcomingMessage = s.upcomingInvoiceMessage;
      }
    } catch (e) {
      console.log("Could not load settings, using defaults");
    }

    const results = { sent: [], skipped: [] };

    for (const invoice of invoices) {
      // Only process pending/issued invoices
      if (!["pending", "issued", "overdue"].includes(invoice.status)) continue;
      if (!invoice.client_name) continue;

      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
      if (!dueDate) continue;
      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
      const amount = (invoice.total_amount || invoice.amount || 0).toLocaleString("ar");

      let shouldNotify = false;
      let messageTemplate = "";
      let notifTitle = "";

      if (diffDays < 0) {
        // Overdue
        shouldNotify = true;
        messageTemplate = overdueMessage.replace("{amount}", amount).replace("{days}", Math.abs(diffDays));
        notifTitle = `⚠️ فاتورة متأخرة - ${invoice.client_name}`;
      } else if (diffDays <= reminderDays) {
        // Upcoming due
        shouldNotify = true;
        messageTemplate = upcomingMessage.replace("{amount}", amount).replace("{days}", diffDays === 0 ? "اليوم" : diffDays);
        notifTitle = `🔔 تذكير فاتورة - ${invoice.client_name}`;
      }

      if (!shouldNotify) {
        results.skipped.push(invoice.invoice_number);
        continue;
      }

      // Check if we already sent a notification today for this invoice
      const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
        related_id: invoice.id,
        related_type: "Invoice",
      }, "-created_date", 5);

      const todayStr = today.toISOString().split("T")[0];
      const alreadySentToday = existingNotifs.some(n => {
        const nDate = new Date(n.created_date);
        return nDate.toISOString().split("T")[0] === todayStr;
      });

      if (alreadySentToday) {
        results.skipped.push(`${invoice.invoice_number} (already sent today)`);
        continue;
      }

      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: invoice.client_id || "all",
        title: notifTitle,
        body: messageTemplate,
        type: "invoice_due",
        related_id: invoice.id,
        related_type: "Invoice",
        action_url: "/billing",
        is_read: false,
      });

      // Send email if client email is available
      if (invoice.client_email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: invoice.client_email,
            subject: notifTitle,
            body: `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #123E7C;">${notifTitle}</h2>
              <p style="font-size: 16px; color: #333;">${messageTemplate}</p>
              <br/>
              <p style="color: #6B7280; font-size: 13px;">فريق الاتفاق للمحاماة والاستشارات القانونية</p>
            </div>`,
          });
        } catch (emailErr) {
          console.error("Email send error:", emailErr.message);
        }
      }

      results.sent.push(invoice.invoice_number);
      console.log(`Notified: ${invoice.invoice_number} - ${invoice.client_name} (diffDays: ${diffDays})`);
    }

    return Response.json({
      success: true,
      sent: results.sent.length,
      skipped: results.skipped.length,
      details: results,
    });
  } catch (error) {
    console.error("invoiceDueDateReminder error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});