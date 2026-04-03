import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, body } = await req.json();

    // Send to all clients
    const clients = await base44.asServiceRole.entities.User.list();
    
    for (const client of clients) {
      if (client.role === 'user') {
        await base44.asServiceRole.entities.Notification.create({
          user_id: client.id,
          title: title || 'رسالة تجريبية من النظام',
          body: body || 'هذه رسالة تجريبية',
          type: 'system',
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, sent_to_count: clients.filter(c => c.role === 'user').length });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});