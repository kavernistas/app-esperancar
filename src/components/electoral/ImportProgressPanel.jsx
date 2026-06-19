import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Clock, Zap, Play, Square, BarChart3, Trash2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const STATUS_LABELS = {
  pendente: { label: "Pendente", color: "bg-slate-100 text-slate-600", icon: Clock },
  baixando: { label: "Baixando", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
  extraindo: { label: "Extraindo", color: "bg-indigo-100 text-indigo-700", icon: RefreshCw },
  importando: { label: "Importando", color: "bg-amber-100 text-amber-700", icon: Zap },
  deduplicando: { label: "Deduplicando", color: "bg-purple-100 text-purple-700", icon: BarChart3 },
  concluido: { label: "Concluído", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  erro: { label: "Erro", color: "bg-red-100 text-red-700", icon: XCircle },
  cancelado: { label: "Cancelado", color: "bg-slate-100 text-slate-500", icon: Square },
};

export default function ImportProgressPanel({ onComplete }) {
  const [jobs, setJobs] = useState([]);
  const [polling, setPolling] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("tseDataSync", { action: "job_status" });
      if (res.data?.success && res.data.jobs) {
        setJobs(res.data.jobs);
      }
    } catch (_e) {}
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Poll jobs ativos
  useEffect(() => {
    const activeJobs = jobs.filter(j => !['concluido','erro','cancelado'].includes(j.status));
    if (activeJobs.length === 0) {
      setPolling(false);
      return;
    }
    setPolling(true);
    const interval = setInterval(loadJobs, 3000);
    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  const handleContinue = async (jobId) => {
    try {
      const res = await base44.functions.invoke("tseDataSync", {
        action: "continue_import", job_id: jobId,
      });
      if (res.data?.success) {
        await loadJobs();
        if (res.data.status === 'concluido' && onComplete) onComplete();
      }
    } catch (_e) {}
  };

  const handleCancel = async (jobId) => {
    try {
      await base44.functions.invoke("tseDataSync", { action: "cancel_job", job_id: jobId });
      await loadJobs();
    } catch (_e) {}
  };

  const handleDedup = async (ano, uf) => {
    try {
      await base44.functions.invoke("tseDataSync", { action: "dedup", ano: String(ano), uf });
      await loadJobs();
      if (onComplete) onComplete();
    } catch (_e) {}
  };

  if (jobs.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Monitor de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400 text-center py-4">
            Nenhum job de importação encontrado. Inicie uma importação para monitorar o progresso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-600" />
        Monitor de Importação
        {polling && <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />}
      </h3>

      {jobs.map(job => {
        const statusCfg = STATUS_LABELS[job.status] || STATUS_LABELS.pendente;
        const StatusIcon = statusCfg.icon;
        const isActive = !['concluido','erro','cancelado'].includes(job.status);
        const canRetry = job.status === 'erro';

        return (
          <Card key={job.id} className={`border-slate-200 ${isActive ? 'ring-1 ring-blue-200' : ''}`}>
            <CardContent className="p-4 space-y-3">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${statusCfg.color}`}>
                    <StatusIcon className={`w-3 h-3 mr-0.5 ${isActive ? 'animate-spin' : ''}`} />
                    {statusCfg.label}
                  </Badge>
                  <span className="text-sm font-medium text-slate-700">
                    {job.uf}/{job.ano} — {job.dataset_tipo}
                  </span>
                  {job.municipio && (
                    <Badge variant="outline" className="text-xs">{job.municipio}</Badge>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {moment(job.ultima_atividade || job.inicio).format('HH:mm:ss')}
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {job.linhas_processadas?.toLocaleString()} / {job.total_linhas_arquivo?.toLocaleString()} linhas
                  </span>
                  <span className="font-medium text-slate-700">{job.progresso || 0}%</span>
                </div>
                <Progress value={job.progresso || 0} className="h-2" />
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 rounded p-2">
                  <p className="text-slate-400">Registros</p>
                  <p className="font-semibold text-slate-700">{job.registros_importados?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <p className="text-slate-400">Duplicados</p>
                  <p className="font-semibold text-amber-600">{job.registros_duplicados?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <p className="text-slate-400">Velocidade</p>
                  <p className="font-semibold text-slate-700">
                    {job.velocidade_registros_segundo || 0} reg/s
                  </p>
                </div>
              </div>

              {/* Tempo estimado (apenas jobs ativos) */}
              {isActive && job.tempo_estimado_segundos > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  Tempo estimado: ~{Math.ceil(job.tempo_estimado_segundos / 60)} min
                </div>
              )}

              {/* Erro */}
              {job.status === 'erro' && job.erro && (
                <div className="p-2 bg-red-50 rounded text-xs text-red-700">
                  <strong>Erro:</strong> {job.erro}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2">
                {(isActive || canRetry) && (
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => handleContinue(job.id)}>
                    <Play className="w-3 h-3 mr-1" />
                    {canRetry ? 'Retomar' : 'Continuar'}
                  </Button>
                )}
                {isActive && (
                  <Button size="sm" variant="ghost" className="text-xs text-red-500"
                    onClick={() => handleCancel(job.id)}>
                    <Square className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                )}
                {job.status === 'concluido' && (
                  <Button size="sm" variant="ghost" className="text-xs"
                    onClick={() => handleDedup(job.ano, job.uf)}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Deduplicar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}