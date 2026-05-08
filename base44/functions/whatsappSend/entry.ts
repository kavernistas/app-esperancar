import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Format phone to WhatsApp format (55 + DDD + number)
function formatWhatsAppPhone(phone) {
  if (!phone) return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // If already has country code (55), keep. Otherwise add
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length === 10) {
    // Add 9 for mobile
    return `55${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      contactIds = [], 
      message, 
      mode = "test",
      instanceUrl,
      instanceToken,
      sendToAll = false,
      filters = {}
    } = body;

    if (!message || message.trim() === '') {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Fetch contacts to send to
    let contacts = [];

    if (sendToAll) {
      // Fetch all active contacts
      contacts = await base44.entities.Contact.filter({ status: "active" }, "-created_date", 500);
      // Apply extra filters if provided
      if (filters.is_leader !== undefined) {
        contacts = contacts.filter(c => c.is_leader === filters.is_leader);
      }
      if (filters.neighborhood) {
        contacts = contacts.filter(c => c.neighborhood === filters.neighborhood);
      }
      if (filters.city) {
        contacts = contacts.filter(c => c.city === filters.city);
      }
    } else if (contactIds.length > 0) {
      // Fetch specific contacts
      const allContacts = await base44.entities.Contact.list("-created_date", 500);
      contacts = allContacts.filter(c => contactIds.includes(c.id));
    }

    // Filter only contacts with valid phones
    const contactsWithPhone = contacts.filter(c => {
      const formatted = formatWhatsAppPhone(c.phone);
      return formatted !== null;
    });

    if (contactsWithPhone.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum contato com telefone válido encontrado',
        total: contacts.length,
        withPhone: 0
      });
    }

    if (mode === "preview") {
      // Just preview - don't send
      return Response.json({
        success: true,
        mode: "preview",
        total: contacts.length,
        withPhone: contactsWithPhone.length,
        withoutPhone: contacts.length - contactsWithPhone.length,
        preview: contactsWithPhone.slice(0, 5).map(c => ({
          name: c.full_name,
          phone: c.phone,
          whatsapp_number: formatWhatsAppPhone(c.phone),
          message_preview: message.replace('{{nome}}', c.full_name).substring(0, 100)
        })),
        message_template: message
      });
    }

    if (mode === "send") {
      // Send via Evolution API (WhatsApp)
      if (!instanceUrl || !instanceToken) {
        // Simulate send if no credentials
        return Response.json({
          success: true,
          mode: "simulated",
          sent: contactsWithPhone.length,
          failed: 0,
          total: contacts.length,
          message: `Mensagem simulada enviada para ${contactsWithPhone.length} contatos`,
          note: "Configure instanceUrl e instanceToken da Evolution API para envio real"
        });
      }

      const results = { sent: 0, failed: 0, errors: [] };

      for (const contact of contactsWithPhone) {
        const whatsappNumber = formatWhatsAppPhone(contact.phone);
        const personalizedMessage = message.replace('{{nome}}', contact.full_name || 'Amigo(a)');

        const sendPayload = {
          number: whatsappNumber,
          text: personalizedMessage
        };

        const res = await fetch(`${instanceUrl}/message/sendText/${instanceToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': instanceToken
          },
          body: JSON.stringify(sendPayload)
        });

        if (res.ok) {
          results.sent++;
        } else {
          results.failed++;
          const errText = await res.text();
          results.errors.push({ contact: contact.full_name, error: errText });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      }

      return Response.json({
        success: true,
        mode: "sent",
        sent: results.sent,
        failed: results.failed,
        total: contactsWithPhone.length,
        errors: results.errors.slice(0, 10),
        message: `${results.sent} mensagens enviadas, ${results.failed} falhas`
      });
    }

    return Response.json({ error: 'Modo inválido. Use "preview" ou "send"' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});