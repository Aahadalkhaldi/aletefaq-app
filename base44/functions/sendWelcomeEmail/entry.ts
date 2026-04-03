import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, user_name, user_email } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      subject: "مرحباً بك في الاتفاق للمحاماة والاستشارات القانونية",
      body: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #F3F7FD; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(18,62,124,0.10);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0D2F5F, #123E7C); padding: 40px 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">⚖️</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">الاتفاق للمحاماة</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">والاستشارات القانونية</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px 32px;">
      <h2 style="color: #101828; font-size: 20px; margin: 0 0 12px;">أهلاً وسهلاً، ${user_name || 'عزيزنا العميل'} 👋</h2>
      <p style="color: #6B7280; line-height: 1.8; font-size: 15px; margin: 0 0 24px;">
        يسعدنا انضمامك إلى منصة <strong style="color: #123E7C;">الاتفاق للمحاماة</strong>. يمكنك الآن متابعة قضاياك، الاطلاع على المستندات، والتواصل مع فريقنا القانوني بكل سهولة ويسر.
      </p>

      <div style="background: #EAF2FF; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <h3 style="color: #123E7C; margin: 0 0 12px; font-size: 15px;">ما يمكنك فعله في المنصة:</h3>
        <ul style="color: #374151; margin: 0; padding-right: 20px; line-height: 2;">
          <li>📋 متابعة حالة قضاياك أولاً بأول</li>
          <li>📄 الاطلاع على المستندات القانونية</li>
          <li>💬 التواصل المباشر مع المحامي المختص</li>
          <li>🗓️ مشاهدة مواعيد الجلسات</li>
          <li>💰 عرض الفواتير وتسوية المدفوعات</li>
        </ul>
      </div>

      <p style="color: #6B7280; font-size: 13px; line-height: 1.7; margin: 0;">
        في حال واجهتك أي صعوبة أو لديك استفسار، لا تتردد في التواصل معنا عبر المنصة أو الاتصال بمكتبنا مباشرة.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F7F8FA; padding: 24px 32px; text-align: center; border-top: 1px solid #E7ECF3;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">الاتفاق للمحاماة والاستشارات القانونية • قطر</p>
      <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 0;">آمنة • دقيقة • سرية</p>
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