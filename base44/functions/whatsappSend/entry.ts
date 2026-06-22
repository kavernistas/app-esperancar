import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Rate-limiting & anti-ban config ──
const DEFAULT_DELAY_MS = 1500;        // between individual messages (was 300)
const DEFAULT_BATCH_SIZE = 8;         // messages per batch
const DEFAULT_BATCH_PAUSE_MS = 45000; // pause between batches (45s)
const DEFAULT_MAX_PER_HOUR = 30;      // hard cap per hour
const DEFAULT_MAX_PER_DAY = 200;      // hard cap per day
const JITTER_PCT = 0.30;             // ±30% random jitter on delays

// Simple sent-tracking store (resets on cold-start; good enough for rate limiting)
// Keyed by phone prefix to avoid storing full numbers in logs
const sentLog = { hourly: 0, daily: 0, hourStart: Date.now(), dayStart: Date.now() };

function resetCounters() {
  const now = Date.now();
  if (now - sentLog.hourStart > 3600000) { sentLog.hourly = 0; sentLog.hourStart = now; }
  if (now - sentLog.dayStart > 86400000) { sentLog.daily = 0; sentLog.dayStart = now; }
}

function randomJitter(baseMs) {
  const range = baseMs * JITTER_PCT;
  return baseMs + (Math.random() * 2 - 1) * range;
}

// Format phone to WhatsApp format (55 + DDD + number)
function formatWhatsAppPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 10) return `55${digits.slice(0, 2)}9${digits.slice(2)}`;
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
      sendToAll = false,
      filters = {},

      // ── Rate-limit overrides (optional) ──
      delayMs = DEFAULT_DELAY_MS,
      batchSize = DEFAULT_BATCH_SIZE,
      batchPauseMs = DEFAULT_BATCH_PAUSE_MS,
      maxPerHour = DEFAULT_MAX_PER_HOUR,
      maxPerDay = DEFAULT_MAX_PER_DAY,

      // ── Direct recipients (alternative to contactIds) ──
      // [{ phone, name }] — used for mission notifications
      recipients = [],
    } = body;

    // Credenciais recuperadas do ambiente seguro, nunca do payload
    const instanceUrl = Deno.env.get('WHATSAPP_INSTANCE_URL');
    const instanceToken = Deno.env.get('WHATSAPP_INSTANCE_TOKEN');

    // ── Modo teste de conexão ──
    if (mode === "test") {
      if (!instanceUrl || !instanceToken) {
        return Response.json({
          success: false,
          mode: "test",
          error: 'Credenciais WhatsApp não configuradas no ambiente (WHATSAPP_INSTANCE_URL / WHATSAPP_INSTANCE_TOKEN)',
        });
      }
      try {
        const res = await fetch(`${instanceUrl}/instance/connectionState/${instanceToken}`, {
          headers: { apikey: instanceToken },
        });
        if (res.ok) {
          const data = await res.json();
          return Response.json({
            success: true,
            mode: "test",
            instance_status: data.instance?.state || data.state || 'connected',
            message: 'Conexão WhatsApp verificada com sucesso',
          });
        }
        return Response.json({
          success: false,
          mode: "test",
          error: `Falha na conexão: ${res.status} ${res.statusText}`,
        });
      } catch (e) {
        return Response.json({
          success: false,
          mode: "test",
          error: `Erro ao conectar: ${e.message}`,
        });
      }
    }

    if (!message || message.trim() === '') {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Determine target phone list
    let targets = []; // { phone, name, rawPhone }

    if (recipients.length > 0) {
      // Direct recipients mode
      for (const r of recipients) {
        const formatted = formatWhatsAppPhone(r.phone);
        if (formatted) {
          targets.push({ phone: formatted, name: r.name || 'Liderança', rawPhone: r.phone });
        }
      }
    } else {
      // Contact-based mode
      let contacts = [];

      if (sendToAll) {
        contacts = await base44.entities.Contact.filter({ status: "active" }, "-created_date", 500);
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
        const allContacts = await base44.entities.Contact.list("-created_date", 500);
        contacts = allContacts.filter(c => contactIds.includes(c.id));
      }

      for (const c of contacts) {
        const formatted = formatWhatsAppPhone(c.phone);
        if (formatted) {
          targets.push({ phone: formatted, name: c.full_name || 'Contato', rawPhone: c.phone });
        }
      }
    }

    if (targets.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum destinatário com telefone válido encontrado',
        total: 0,
        withPhone: 0,
      });
    }

    // ── Preview mode ──
    if (mode === "preview") {
      return Response.json({
        success: true,
        mode: "preview",
        total: targets.length,
        withPhone: targets.length,
        withoutPhone: 0,
        rate_limit: { delayMs, batchSize, batchPauseMs, maxPerHour, maxPerDay },
        preview: targets.slice(0, 5).map(t => ({
          name: t.name,
          phone: t.rawPhone,
          whatsapp_number: t.phone,
          message_preview: message.replace('{{nome}}', t.name).substring(0, 100),
        })),
        message_template: message,
      });
    }

    // ── Send mode ──
    if (mode === "send") {
      resetCounters();

      // Enforce per-day cap
      const remainingDaily = maxPerDay - sentLog.daily;
      const remainingHourly = maxPerHour - sentLog.hourly;
      const allowed = Math.min(remainingDaily, remainingHourly, targets.length);

      if (allowed <= 0) {
        return Response.json({
          success: false,
          error: `Limite diário de ${maxPerDay} mensagens atingido. Tente novamente amanhã.`,
          sent: 0,
          failed: targets.length,
          total: targets.length,
          rate_limit_reached: true,
          daily_count: sentLog.daily,
          hourly_count: sentLog.hourly,
        });
      }

      // Slice to allowed count
      const toSend = targets.slice(0, allowed);
      const skipped = allowed < targets.length ? targets.length - allowed : 0;

      if (!instanceUrl || !instanceToken) {
        // Simulated mode
        return Response.json({
          success: true,
          mode: "simulated",
          sent: toSend.length,
          failed: 0,
          skipped,
          total: targets.length,
          message: `Mensagem simulada enviada para ${toSend.length} destinatários`,
          note: "Configure instanceUrl e instanceToken da Evolution API para envio real",
          rate_limit: { delayMs, batchSize, batchPauseMs, maxPerHour, maxPerDay },
        });
      }

      // ── Real send with rate limiting ──
      const results = { sent: 0, failed: 0, skipped, errors: [] };
      const apiUrl = `${instanceUrl}/message/sendText/${instanceToken}`;

      for (let i = 0; i < toSend.length; i++) {
        const target = toSend[i];
        const personalizedMessage = message.replace('{{nome}}', target.name);
        const batchIndex = Math.floor(i / batchSize);

        // Batch pause (not before first batch)
        if (i > 0 && i % batchSize === 0) {
          console.log(`⏸ Pausa de ${batchPauseMs}ms entre lotes (${i}/${toSend.length})`);
          await new Promise(r => setTimeout(r, batchPauseMs));
        }

        // Inter-message delay with jitter
        if (i > 0 || batchIndex > 0) {
          const jitteredDelay = randomJitter(delayMs);
          await new Promise(r => setTimeout(r, jitteredDelay));
        }

        try {
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': instanceToken,
            },
            body: JSON.stringify({ number: target.phone, text: personalizedMessage }),
          });

          if (res.ok) {
            results.sent++;
            sentLog.daily++;
            sentLog.hourly++;
          } else {
            results.failed++;
            const errText = await res.text();
            results.errors.push({ recipient: target.name, error: errText });
          }
        } catch (fetchErr) {
          results.failed++;
          results.errors.push({ recipient: target.name, error: fetchErr.message });
        }

        // Respect hourly cap mid-batch
        if (sentLog.hourly >= maxPerHour) {
          console.log(`⛔ Limite horário de ${maxPerHour} atingido. Parando.`);
          if (i + 1 < toSend.length) {
            results.skipped += (toSend.length - i - 1);
          }
          break;
        }
      }

      return Response.json({
        success: true,
        mode: "sent",
        sent: results.sent,
        failed: results.failed,
        skipped: results.skipped,
        total: targets.length,
        errors: results.errors.slice(0, 10),
        message: `${results.sent} mensagens enviadas, ${results.failed} falhas${results.skipped > 0 ? `, ${results.skipped} não enviadas (limite)` : ''}`,
        rate_limit: {
          delayMs,
          batchSize,
          batchPauseMs,
          maxPerHour,
          maxPerDay,
          daily_count: sentLog.daily,
          hourly_count: sentLog.hourly,
        },
      });
    }

    return Response.json({ error: 'Modo inválido. Use "preview" ou "send"' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});