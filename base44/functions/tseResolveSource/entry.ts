import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TSE_CDN_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

const DATASET_CDN_PATH = {
  votacao_secao:                'votacao_secao',
  votacao_nominal_munzona:      'votacao_candidato_munzona',
  detalhe_apuracao_munzona:     'detalhe_votacao_secao',
  perfil_eleitorado_secao:      'perfil_eleitor_secao',
};

const DATASETS_NACIONAIS = new Set([
  'votacao_nominal_munzona',
  'detalhe_apuracao_munzona',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { ano, uf, dataset_tipo } = body;

    if (!ano || !uf || !dataset_tipo) {
      return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, dataset_tipo' }, { status: 400 });
    }

    const year = parseInt(ano);
    const state = uf.toUpperCase();
    const cdnPath = DATASET_CDN_PATH[dataset_tipo];

    if (!cdnPath) {
      return Response.json({
        error: 'Dataset inválido',
        validos: Object.keys(DATASET_CDN_PATH),
      }, { status: 400 });
    }

    const isNacional = DATASETS_NACIONAIS.has(dataset_tipo);
    const url = isNacional
      ? `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}.zip`
      : `${TSE_CDN_BASE}/${cdnPath}/${cdnPath}_${year}_${state}.zip`;

    // Verifica cache
    const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({
      ano: year, uf: state, dataset_tipo,
    });

    if (cached.length > 0 && cached[0].status !== 'nao_verificado') {
      const c = cached[0];
      if (c.fonte_url !== url) {
        await base44.asServiceRole.entities.TSEDataSourceMap.update(c.id, {
          status: 'nao_verificado', fonte_url: url,
        });
      } else {
        return Response.json({
          success: true, ano: year, uf: state, dataset_tipo,
          fonte_url: c.fonte_url, formato: c.formato,
          tamanho_estimado: c.tamanho_estimado, status: c.status,
          disponivel: c.status === 'disponivel',
          observacao: c.observacao, nacional: isNacional, cached: true,
        });
      }
    }

    // HEAD request para verificar disponibilidade
    let status = 'nao_verificado';
    let sizeBytes = 0;

    try {
      const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      if (headRes.ok) {
        sizeBytes = parseInt(headRes.headers.get('content-length') || '0');
        status = sizeBytes > 0 ? 'disponivel' : 'indisponivel';
      } else {
        status = 'indisponivel';
      }
    } catch (_e) {
      status = 'indisponivel';
    }

    const observacao = isNacional
      ? 'Este arquivo é nacional. O filtro UF/Município será aplicado durante a importação assíncrona.'
      : (status === 'indisponivel' ? 'URL não encontrada no CDN do TSE.' : 'Disponível para importação assíncrona.');

    // Salva cache
    if (cached.length > 0) {
      await base44.asServiceRole.entities.TSEDataSourceMap.update(cached[0].id, {
        status, tamanho_estimado: sizeBytes, fonte_url: url, observacao,
      });
    } else {
      await base44.asServiceRole.entities.TSEDataSourceMap.create({
        ano: year, uf: state, dataset_tipo, fonte_url: url,
        formato: 'zip', status, tamanho_estimado: sizeBytes, observacao,
      });
    }

    return Response.json({
      success: true, ano: year, uf: state, dataset_tipo,
      fonte_url: url, formato: 'zip', tamanho_estimado: sizeBytes,
      status, disponivel: status === 'disponivel',
      nacional: isNacional, observacao, cached: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});