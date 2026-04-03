import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    const invoice = data;
    if (!invoice?.client_id || !invoice?.amount) {
      return Response.json({ skipped: true, reason: "missing invoice data" });
    }

    // Get client email
    const clients = await base44.asServiceRole.entities.Client.filter({ id: invoice.client_id }, "-created_date", 1).catch(() => []);
    const client = clients[0];
    if (!client?.email) {
      return Response.json({ skipped: true, reason: "no client email" });
    }

    const total = invoice.total_amount || invoice.amount;
    const dueDateStr = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-QA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      subject: `فاتورة جديدة — ${invoice.invoice_number || "من الاتفاق للمحاماة"}`,
      body: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #F3F7FD; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(18,62,124,0.10);">
    <div style="background: linear-gradient(135deg, #0D2F5F, #123E7C); padding: 32px; text-align: center;">
      <span style="font-size: 40px;">🧾</span>
      <h1 style="color: white; margin: 12px 0 0; font-size: 20px;">فاتورة جديدة</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="color: #101828; font-size: 16px; margin: 0 0 8px;">عزيزنا <strong>${client.full_name}</strong>،</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
        يسعدنا إعلامكم بإصدار فاتورة جديدة مرتبطة بخدماتنا القانونية لكم.
      </p>

      <div style="background: #F7F8FA; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        ${invoice.invoice_number ? `<p style="color: #6B7280; font-size: 12px; margin: 0 0 4px;">رقم الفاتورة</p><p style="color: #101828; font-weight: 700; font-size: 16px; margin: 0 0 16px;">${invoice.invoice_number}</p>` : ""}
        ${invoice.service_description ? `<p style="color: #6B7280; font-size: 12px; margin: 0 0 4px;">الخدمة</p><p style="color: #101828; font-size: 14px; margin: 0 0 16px;">${invoice.service_description}</p>` : ""}
        ${invoice.case_title ? `<p style="color: #6B7280; font-size: 12px; margin: 0 0 4px;">القضية</p><p style="color: #101828; font-size: 14px; margin: 0 0 16px;">${invoice.case_title}</p>` : ""}

        <hr style="border: none; border-top: 1px solid #E7ECF3; margin: 0 0 16px;" />

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="background: #123E7C; color: white; font-size: 20px; font-weight: 800; padding: 10px 20px; border-radius: 10px;">${total.toLocaleString('ar-QA')} ر.ق</span>
          <span style="color: #6B7280; font-size: 13px;">إجمالي الفاتورة</span>
        </div>

        ${dueDateStr ? `<p style="color: #B42318; font-size: 13px; font-weight: 600; margin: 16px 0 0;">⏰ تاريخ الاستحقاق: ${dueDateStr}</p>` : ""}
      </div>

      <p style="color: #6B7280; font-size: 13px; line-height: 1.7;">
        لإتمام الدفع أو الاستفسار عن تفاصيل الفاتورة، يرجى تسجيل الدخول إلى المنصة أو التواصل مع مكتبنا.
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