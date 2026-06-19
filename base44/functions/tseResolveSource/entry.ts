import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CDN base do TSE para dados eleitorais
const TSE_CDN_BASE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

// Mapeamento de dataset_tipo → caminho no CDN
const DATASET_PATH = {
  votacao_secao: 'votacao_secao',
  votacao_nominal_munzona: 'votacao_nominal_munzona',
  detalhe_apuracao_munzona: 'detalhe_apuracao_munzona',
  perfil_eleitorado_secao: 'perfil_eleitorado_secao',
};

// Limite para download direto no serverless (50MB)
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ano, uf, dataset_tipo } = body;

    if (!ano || !uf || !dataset_tipo) {
      return Response.json({ error: 'Parâmetros obrigatórios: ano, uf, dataset_tipo' }, { status: 400 });
    }

    const year = parseInt(ano);
    const state = uf.toUpperCase();
    const path = DATASET_PATH[dataset_tipo];

    if (!path) {
      return Response.json({
        error: 'Dataset inválido',
        validos: Object.keys(DATASET_PATH),
      }, { status: 400 });
    }

    // Construir URL oficial
    const url = `${TSE_CDN_BASE}/${path}/${path}_${year}_${state}.zip`;

    // Verificar cache no TSEDataSourceMap
    const cached = await base44.asServiceRole.entities.TSEDataSourceMap.filter({
      ano: year, uf: state, dataset_tipo,
    });

    if (cached.length > 0 && cached[0].status !== 'nao_verificado') {
      const c = cached[0];
      const podeBaixar = c.status === 'disponivel' && c.tamanho_estimado > 0 && c.tamanho_estimado <= MAX_DOWNLOAD_SIZE;
      const exigeUpload = c.status === 'muito_grande' || c.status === 'indisponivel';

      return Response.json({
        success: true,
        ano: year,
        uf: state,
        dataset_tipo,
        fonte_url: c.fonte_url,
        formato: c.formato,
        tamanho_estimado: c.tamanho_estimado,
        status: c.status,
        pode_baixar_direto: podeBaixar,
        exige_upload_manual: exigeUpload,
        observacao: c.observacao,
        cached: true,
      });
    }

    // Verificar disponibilidade no CDN (HEAD request)
    let headStatus = 'nao_verificado';
    let sizeBytes = 0;
    let podeBaixar = false;
    let exigeUpload = false;

    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(15000),
      });

      if (headRes.ok) {
        const contentLength = headRes.headers.get('content-length');
        sizeBytes = contentLength ? parseInt(contentLength) : 0;

        if (sizeBytes > 0 && sizeBytes <= MAX_DOWNLOAD_SIZE) {
          headStatus = 'disponivel';
          podeBaixar = true;
        } else if (sizeBytes > MAX_DOWNLOAD_SIZE) {
          headStatus = 'muito_grande';
          exigeUpload = true;
        } else {
          headStatus = 'disponivel';
          podeBaixar = true;
        }
      } else {
        headStatus = 'indisponivel';
        exigeUpload = true;
      }
    } catch (_e) {
      headStatus = 'indisponivel';
      exigeUpload = true;
    }

    // Salvar/atualizar cache
    const observacao = headStatus === 'muito_grande'
      ? `Arquivo de ${(sizeBytes / (1024*1024)).toFixed(1)}MB excede o limite de 50MB para download automático. Baixe manualmente e importe.`
      : headStatus === 'indisponivel'
        ? 'URL não encontrada no CDN do TSE. O arquivo pode ter sido movido ou não existir para este ano/UF.'
        : 'Disponível no CDN do TSE.';

    if (cached.length > 0) {
      await base44.asServiceRole.entities.TSEDataSourceMap.update(cached[0].id, {
        status: headStatus, tamanho_estimado: sizeBytes, fonte_url: url, observacao,
      });
    } else {
      await base44.asServiceRole.entities.TSEDataSourceMap.create({
        ano: year, uf: state, dataset_tipo, fonte_url: url,
        formato: 'zip', status: headStatus, tamanho_estimado: sizeBytes, observacao,
      });
    }

    return Response.json({
      success: true,
      ano: year,
      uf: state,
      dataset_tipo,
      fonte_url: url,
      formato: 'zip',
      tamanho_estimado: sizeBytes,
      status: headStatus,
      pode_baixar_direto: podeBaixar,
      exige_upload_manual: exigeUpload,
      observacao,
      cached: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});