import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SYSTEM_PROMPT = `أنت مساعد قانوني ذكي لمكتب "الاتفاق للمحاماة والاستشارات القانونية" في قطر.
مهمتك:
1. الإجابة على استفسارات العملاء حول الإجراءات القانونية بشكل بسيط ومفهوم.
2. إرشاد العملاء لخطوات التقديم والإجراءات داخل التطبيق.
3. إذا طلب العميل التحدث مع محامٍ أو استشارة قانونية مباشرة → أخبره أنك ستحجز له موعداً وأضف في نهاية ردك هذا النص بالضبط: ACTION:book_meeting
4. إذا طلب العميل إرسال رسالة للمحامي → أضف في نهاية ردك: ACTION:contact_lawyer
5. إذا أراد حجز استشارة → اسأله عن الموضوع وأضف: ACTION:book_consultation

قواعد:
- تحدث دائماً بالعربية
- كن ودوداً ومهنياً
- لا تقدم استشارات قانونية ملزمة
- اختصر ردودك وكن واضحاً (3-4 جمل كحد أقصى)
- إذا لم تكن متأكداً، قل "سأحيلك للمحامي المختص"`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messages } = await req.json();
    
    // Try to get user, but don't fail if not logged in
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      // User not authenticated, continue as guest
    }

    // Build conversation context
    const conversationHistory = messages.map(m => `${m.role === 'user' ? 'العميل' : 'المساعد'}: ${m.content}`).join('\n');
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const prompt = `${SYSTEM_PROMPT}

سجل المحادثة:
${conversationHistory}

رد على آخر رسالة من العميل بشكل مفيد ومختصر.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
    });

    const reply = typeof result === 'string' ? result : result?.response || result?.text || JSON.stringify(result);

    // Detect action
    let action = null;
    let cleanReply = reply;

    if (reply.includes('ACTION:book_meeting')) {
      action = { action: 'book_meeting' };
      cleanReply = reply.replace('ACTION:book_meeting', '').trim();
      if (user) {
        await base44.asServiceRole.entities.Meeting.create({
          title: 'استشارة قانونية',
          client_name: user.full_name || 'عميل',
          client_id: user.id,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '10:00',
          location: 'office',
          notes: `طلب عبر المساعد الذكي — ${lastUserMessage}`,
          status: 'scheduled',
        }).catch(() => {});
        await base44.asServiceRole.entities.Notification.create({
          user_id: user.id,
          title: 'تم حجز موعد استشارتك',
          body: 'سيتواصل معك فريق المكتب لتأكيد الموعد',
          type: 'system',
        }).catch(() => {});
      }
    } else if (reply.includes('ACTION:contact_lawyer')) {
      action = { action: 'contact_lawyer' };
      cleanReply = reply.replace('ACTION:contact_lawyer', '').trim();
      await base44.asServiceRole.entities.Notification.create({
        user_id: 'general',
        title: `رسالة من عميل: ${user?.full_name || 'عميل'}`,
        body: lastUserMessage,
        type: 'new_message',
      }).catch(() => {});
    } else if (reply.includes('ACTION:book_consultation')) {
      action = { action: 'book_consultation' };
      cleanReply = reply.replace('ACTION:book_consultation', '').trim();
    }

    return Response.json({ reply: cleanReply, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});