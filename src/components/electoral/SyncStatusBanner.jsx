import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, AlertTriangle, XCircle, Clock, WifiOff } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";

export default function SyncStatusBanner({ syncStatuses, ano, uf }) {
  const currentStatus = syncStatuses?.find(s => s.ano === parseInt(ano) && s.uf === uf?.toUpperCase());

  if (!currentStatus || currentStatus.status === 'nao_importado') {
    return (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Base {uf}/{ano} não sincronizada</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Aguardando importação pelo serviço externo de ETL.
            </p>
          </div>
        </div>
        <RouterLink to="/DiagnosticoTSE">
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-medium bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
            Ver status
          </span>
        </RouterLink>
      </div>
    );
  }

  if (currentStatus.status === 'importando') {
    return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">Importação em andamento...</p>
          <p className="text-blue-700 text-xs mt-0.5">
            Recebendo dados do TSE para {uf}/{ano} via serviço externo de ETL.
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus.status === 'erro') {
    return (
      <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Erro na importação</p>
            <p className="text-red-700 text-xs mt-0.5">
              {currentStatus.mensagem_erro || "Verifique o serviço externo de ETL."}
            </p>
          </div>
        </div>
        <RouterLink to="/DiagnosticoTSE">
          <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium border border-red-300 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Diagnosticar
          </span>
        </RouterLink>
      </div>
    );
  }

  if (currentStatus.status === 'importado') {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 text-sm">
            Base {uf}/{ano} sincronizada em {moment(currentStatus.data_ultima_sincronizacao).format('DD/MM/YYYY [às] HH:mm')}
          </p>
          <p className="text-emerald-700 text-xs mt-0.5">
            {currentStatus.total_linhas?.toLocaleString() || 0} registros oficiais. Base local pronta para consulta.
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 ml-auto flex-shrink-0">
          <Database className="w-3 h-3 mr-1" />Consulta local
        </Badge>
      </div>
    );
  }

  return null;
}