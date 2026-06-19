import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { zone, section, city, count = 20, mode = "preview" } = body;

    if (!city) {
      return Response.json({ error: 'Cidade é obrigatória' }, { status: 400 });
    }

    // Apenas consulta local — nunca simular dados
    const contacts = await base44.asServiceRole.entities.Contact.filter({
      city,
      ...(zone ? { electoral_zone: zone } : {}),
      ...(section ? { electoral_section: section } : {}),
      status: 'active',
    }, '-created_date', parseInt(count) || 20);

    if (mode === "preview") {
      return Response.json({
        success: true,
        voters: contacts,
        total: contacts.length,
        mode: "preview",
        message: contacts.length > 0
          ? `${contacts.length} eleitores encontrados na base local`
          : 'Nenhum eleitor encontrado para os filtros informados.',
      });
    }

    if (mode === "import") {
      return Response.json({
        success: true,
        imported: 0,
        message: 'Importação de eleitores via TSE deve ser feita pelo módulo de Consulta TSE com arquivo CSV oficial.',
      });
    }

    return Response.json({ error: 'Modo inválido. Use "preview" ou "import"' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});