import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.2';

const heatLabels = { cold: "Frio", warm: "Morno", hot: "Quente" };
const heatColors = { cold: [59, 130, 246], warm: [245, 158, 11], hot: [239, 68, 68] };
const positionLabels = {
  mayor: "Prefeito", councilor: "Vereador", governor: "Governador",
  state_deputy: "Dep. Estadual", federal_deputy: "Dep. Federal",
  senator: "Senador", president: "Presidente"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (!['admin', 'coordenador'].includes(user.role)) {
      return Response.json({ error: 'Acesso restrito a admin e coordenador' }, { status: 403 });
    }

    const body = await req.json();
    const { yearFilter = "all", positionFilter = "all", candidateName = "Candidato" } = body;

    // Fetch data
    const [electoralData, contacts] = await Promise.all([
      base44.entities.ElectoralData.list("-votes", 500),
      base44.entities.Contact.list("-created_date", 1000)
    ]);

    // Apply filters
    const filteredData = electoralData.filter(item => {
      const matchYear = yearFilter === "all" || item.year?.toString() === yearFilter;
      const matchPos = positionFilter === "all" || item.position === positionFilter;
      return matchYear && matchPos;
    });

    // Group by neighborhood
    const neighborhoodStats = filteredData.reduce((acc, item) => {
      const key = item.neighborhood || "Sem Bairro";
      if (!acc[key]) {
        acc[key] = {
          neighborhood: key,
          city: item.city,
          totalVotes: 0,
          totalVoters: 0,
          heatLevel: item.heat_level || "warm",
          zone: item.electoral_zone,
          sections: new Set()
        };
      }
      acc[key].totalVotes += item.votes || 0;
      acc[key].totalVoters += item.total_voters || 0;
      if (item.electoral_section) acc[key].sections.add(item.electoral_section);
      return acc;
    }, {});

    const contactsByNeighborhood = contacts.reduce((acc, c) => {
      if (c.neighborhood) acc[c.neighborhood] = (acc[c.neighborhood] || 0) + 1;
      return acc;
    }, {});

    const sortedNeighborhoods = Object.values(neighborhoodStats)
      .sort((a, b) => b.totalVotes - a.totalVotes);

    const totalVotes = filteredData.reduce((sum, d) => sum + (d.votes || 0), 0);
    const totalVoters = filteredData.reduce((sum, d) => sum + (d.total_voters || 0), 0);
    const conversionRate = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : "0.0";

    // Build PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;

    // ── HEADER ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 42, "F");

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 38, pageW, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO MAPA ELEITORAL", marginL, 18);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Candidato: ${candidateName}`, marginL, 28);

    const dateStr = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    });
    doc.text(`Gerado em: ${dateStr}`, pageW - marginR - 60, 28);

    if (yearFilter !== "all" || positionFilter !== "all") {
      const filterText = [
        yearFilter !== "all" ? `Ano: ${yearFilter}` : null,
        positionFilter !== "all" ? `Cargo: ${positionLabels[positionFilter] || positionFilter}` : null
      ].filter(Boolean).join("  |  ");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Filtros: ${filterText}`, marginL, 36);
    }

    let y = 52;

    // ── SUMMARY CARDS ────────────────────────────────────────────────────
    const cards = [
      { label: "Total de Votos", value: totalVotes.toLocaleString("pt-BR"), color: [59, 130, 246] },
      { label: "Eleitores Cadastrados", value: totalVoters.toLocaleString("pt-BR"), color: [16, 185, 129] },
      { label: "Taxa de Conversão", value: `${conversionRate}%`, color: [245, 158, 11] },
      { label: "Bairros Mapeados", value: sortedNeighborhoods.length.toString(), color: [139, 92, 246] },
    ];

    const cardW = (contentW - 9) / 4;
    cards.forEach((card, i) => {
      const x = marginL + i * (cardW + 3);
      doc.setFillColor(...card.color);
      doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
      doc.setFillColor(255, 255, 255, 0.15);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(card.value, x + cardW / 2, y + 10, { align: "center" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(card.label, x + cardW / 2, y + 16, { align: "center" });
    });

    y += 28;

    // ── SECTION TITLE: RANKING ───────────────────────────────────────────
    doc.setFillColor(241, 245, 249);
    doc.rect(marginL, y, contentW, 8, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginL, y, contentW, 8, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RANKING POR BAIRRO / REGIÃO", marginL + 4, y + 5.5);

    y += 12;

    // ── TABLE HEADER ─────────────────────────────────────────────────────
    const cols = {
      rank:    { x: marginL,      w: 10  },
      bairro:  { x: marginL + 10, w: 45  },
      cidade:  { x: marginL + 55, w: 30  },
      zona:    { x: marginL + 85, w: 18  },
      votos:   { x: marginL + 103, w: 23 },
      eleit:   { x: marginL + 126, w: 23 },
      conv:    { x: marginL + 149, w: 18 },
      temp:    { x: marginL + 167, w: 23 },
    };

    doc.setFillColor(30, 58, 138);
    doc.rect(marginL, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("#",               cols.rank.x + 3,   y + 4.5);
    doc.text("BAIRRO",          cols.bairro.x + 2, y + 4.5);
    doc.text("CIDADE",          cols.cidade.x + 2, y + 4.5);
    doc.text("ZONA",            cols.zona.x + 2,   y + 4.5);
    doc.text("VOTOS",           cols.votos.x + 2,  y + 4.5);
    doc.text("ELEITORES",       cols.eleit.x + 2,  y + 4.5);
    doc.text("% CONV.",         cols.conv.x + 2,   y + 4.5);
    doc.text("TEMP.",           cols.temp.x + 2,   y + 4.5);
    y += 7;

    // ── TABLE ROWS ───────────────────────────────────────────────────────
    sortedNeighborhoods.forEach((stat, idx) => {
      // Page break check
      if (y > pageH - 35) {
        doc.addPage();
        y = 20;

        doc.setFillColor(30, 58, 138);
        doc.rect(marginL, y, contentW, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text("#",          cols.rank.x + 3,   y + 4.5);
        doc.text("BAIRRO",    cols.bairro.x + 2,  y + 4.5);
        doc.text("CIDADE",    cols.cidade.x + 2,  y + 4.5);
        doc.text("ZONA",      cols.zona.x + 2,    y + 4.5);
        doc.text("VOTOS",     cols.votos.x + 2,   y + 4.5);
        doc.text("ELEITORES", cols.eleit.x + 2,   y + 4.5);
        doc.text("% CONV.",   cols.conv.x + 2,    y + 4.5);
        doc.text("TEMP.",     cols.temp.x + 2,    y + 4.5);
        y += 7;
      }

      const rowH = 7;
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(marginL, y, contentW, rowH, "F");
      doc.setDrawColor(226, 232, 240);
      doc.line(marginL, y + rowH, marginL + contentW, y + rowH);

      const convRate = stat.totalVoters > 0
        ? ((stat.totalVotes / stat.totalVoters) * 100).toFixed(1)
        : "0.0";

      const heatColor = heatColors[stat.heatLevel] || heatColors.warm;
      const heatLabel = heatLabels[stat.heatLevel] || "Morno";
      const contactsCount = contactsByNeighborhood[stat.neighborhood] || 0;

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}`, cols.rank.x + 5, y + 4.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      const bairroText = stat.neighborhood.length > 20
        ? stat.neighborhood.substring(0, 18) + "…"
        : stat.neighborhood;
      doc.text(bairroText, cols.bairro.x + 2, y + 4.5);

      const cidadeText = (stat.city || "").length > 14
        ? (stat.city || "").substring(0, 12) + "…"
        : (stat.city || "-");
      doc.text(cidadeText, cols.cidade.x + 2, y + 4.5);

      doc.text(stat.zone || "-",                        cols.zona.x + 2,  y + 4.5);
      doc.text(stat.totalVotes.toLocaleString("pt-BR"), cols.votos.x + 2, y + 4.5);
      doc.text(stat.totalVoters.toLocaleString("pt-BR"),cols.eleit.x + 2, y + 4.5);
      doc.text(`${convRate}%`,                           cols.conv.x + 2,  y + 4.5);

      // Heat badge
      doc.setFillColor(...heatColor);
      doc.roundedRect(cols.temp.x + 1, y + 1.5, 20, 4, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(heatLabel, cols.temp.x + 11, y + 4.2, { align: "center" });

      y += rowH;
    });

    if (sortedNeighborhoods.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.text("Nenhum dado eleitoral disponível para os filtros selecionados.",
        pageW / 2, y + 10, { align: "center" });
      y += 20;
    }

    y += 8;

    // ── CONTACTS SUMMARY ─────────────────────────────────────────────────
    if (y > pageH - 60) { doc.addPage(); y = 20; }

    doc.setFillColor(241, 245, 249);
    doc.rect(marginL, y, contentW, 8, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginL, y, contentW, 8, "S");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTATOS CADASTRADOS POR BAIRRO", marginL + 4, y + 5.5);
    y += 12;

    const topNeighborhoods = Object.entries(contactsByNeighborhood)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topNeighborhoods.length > 0) {
      topNeighborhoods.forEach(([neighborhood, count], idx) => {
        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
        doc.rect(marginL, y, contentW, 6, "F");

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(neighborhood, marginL + 4, y + 4);

        // Bar chart
        const maxCount = Math.max(...Object.values(contactsByNeighborhood));
        const barW = Math.max(5, (count / maxCount) * 80);
        doc.setFillColor(59, 130, 246);
        doc.rect(marginL + 80, y + 1.5, barW, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.text(`${count} contatos`, marginL + 165, y + 4);

        y += 6;
      });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text("Nenhum contato cadastrado com bairro definido.", marginL + 4, y + 4);
      y += 8;
    }

    y += 8;

    // ── LEGEND ───────────────────────────────────────────────────────────
    if (y > pageH - 30) { doc.addPage(); y = 20; }

    doc.setFillColor(241, 245, 249);
    doc.rect(marginL, y, contentW, 8, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginL, y, contentW, 8, "S");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("LEGENDA DE TEMPERATURA ELEITORAL", marginL + 4, y + 5.5);
    y += 12;

    const legendItems = [
      { label: "Frio — Menos de 30% de conversão. Região que necessita de trabalho intenso de mobilização.", color: heatColors.cold },
      { label: "Morno — Entre 30% e 60% de conversão. Potencial de crescimento com ações direcionadas.", color: heatColors.warm },
      { label: "Quente — Acima de 60% de conversão. Região forte, foco em manutenção e expansão.", color: heatColors.hot },
    ];
    legendItems.forEach(item => {
      doc.setFillColor(...item.color);
      doc.roundedRect(marginL, y, 18, 5, 1, 1, "F");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, marginL + 22, y + 3.5);
      y += 8;
    });

    // ── FOOTER ───────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 12, pageW, 12, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Esperançar — Plataforma Eleitoral | Documento Confidencial",
        marginL, pageH - 5);
      doc.text(`Página ${p} de ${totalPages}`, pageW - marginR, pageH - 5, { align: "right" });
    }

    // Return as base64
    const pdfBase64 = doc.output("datauristring");

    return Response.json({
      success: true,
      pdf_base64: pdfBase64,
      filename: `mapa-eleitoral-${candidateName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
      pages: totalPages,
      total_neighborhoods: sortedNeighborhoods.length,
      total_votes: totalVotes
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});