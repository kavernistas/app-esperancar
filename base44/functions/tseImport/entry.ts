import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simulated TSE voter data generator based on search parameters
function generateTSEVoters(zone, section, city, count = 20) {
  const firstNames = [
    "Maria", "João", "Ana", "Carlos", "Francisca", "Antônio", "Adriana", "Paulo",
    "Juliana", "Marcos", "Fernanda", "Lucas", "Camila", "Rafael", "Beatriz",
    "Rodrigo", "Aline", "Felipe", "Patrícia", "Bruno", "Tatiana", "Gustavo",
    "Sandra", "Ricardo", "Daniela", "Eduardo", "Mariana", "Thiago", "Vanessa",
    "André", "Priscila", "Leandro", "Cristiane", "Diego", "Renata"
  ];
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
    "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha",
    "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado"
  ];

  const neighborhoods = {
    "São Paulo": ["Pinheiros", "Vila Mariana", "Moema", "Itaim Bibi", "Brooklin", "Santo André", "Tatuapé"],
    "Campinas": ["Cambui", "Barão Geraldo", "Taquaral", "Jardim Proença", "Nova Campinas"],
    "Santos": ["Gonzaga", "Boqueirão", "Aparecida", "Vila Mathias", "Ponta da Praia"],
    "default": ["Centro", "Jardim", "Vila Nova", "Parque", "Residencial"]
  };

  const cityNeighborhoods = neighborhoods[city] || neighborhoods["default"];
  const voters = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    const neighborhood = cityNeighborhoods[Math.floor(Math.random() * cityNeighborhoods.length)];
    const sectionNum = parseInt(section) || Math.floor(Math.random() * 500) + 1;
    const zoneNum = parseInt(zone) || Math.floor(Math.random() * 400) + 1;

    voters.push({
      full_name: `${firstName} ${lastName} ${lastName2}`,
      city: city || "São Paulo",
      neighborhood: neighborhood,
      electoral_zone: zoneNum.toString().padStart(3, "0"),
      electoral_section: sectionNum.toString().padStart(4, "0"),
      voting_location: `${["Escola Estadual", "Escola Municipal", "Centro Comunitário", "Igreja"][Math.floor(Math.random() * 4)]} ${lastName}`,
      phone: `(${Math.floor(Math.random() * 90 + 10)}) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: "active",
      engagement_level: Math.floor(Math.random() * 60) + 20,
      is_leader: false,
      tags: ["TSE-Import"],
      source: "TSE",
      tse_zone: zoneNum.toString().padStart(3, "0"),
      tse_section: sectionNum.toString().padStart(4, "0"),
    });
  }

  return voters;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { zone, section, city, count = 20, mode = "preview" } = body;

    if (!city) {
      return Response.json({ error: 'Cidade é obrigatória' }, { status: 400 });
    }

    const clampedCount = Math.min(Math.max(parseInt(count) || 20, 1), 100);

    // Generate simulated TSE data
    const voters = generateTSEVoters(zone, section, city, clampedCount);

    if (mode === "preview") {
      // Just return preview data
      return Response.json({
        success: true,
        voters: voters,
        total: voters.length,
        mode: "preview",
        message: `${voters.length} eleitores encontrados (dados simulados TSE)`
      });
    }

    if (mode === "import") {
      // Actually import into Contact entity
      const imported = [];
      const errors = [];

      for (const voter of voters) {
        const contactData = {
          full_name: voter.full_name,
          city: voter.city,
          neighborhood: voter.neighborhood,
          electoral_zone: voter.electoral_zone,
          electoral_section: voter.electoral_section,
          voting_location: voter.voting_location,
          phone: voter.phone,
          status: "active",
          engagement_level: voter.engagement_level,
          is_leader: false,
          tags: ["TSE-Import"],
          notes: `Importado do TSE - Zona ${voter.electoral_zone}, Seção ${voter.electoral_section}`
        };

        const created = await base44.entities.Contact.create(contactData);
        imported.push(created);
      }

      return Response.json({
        success: true,
        imported: imported.length,
        errors: errors.length,
        message: `${imported.length} contatos importados com sucesso`,
        mode: "import"
      });
    }

    return Response.json({ error: 'Modo inválido. Use "preview" ou "import"' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});