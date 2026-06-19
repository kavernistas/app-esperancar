import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle2, AlertTriangle, XCircle, Clock, Download, Wifi, WifiOff } from "lucide-react";
import moment from "moment";

const STATUS_STYLES = {
  importado: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", icon: CheckCircle2, iconColor: "text-emerald-500", label: "Sincronizada" },
  importando: { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon: Download, iconColor: "text-blue-500 animate-pulse", label: "Importando" },
  nao_importado: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: AlertTriangle, iconColor: "text-amber-500", label: "Não importada" },
  erro: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: XCircle, iconColor: "text-red-500", label: "Erro" },
  desatualizado: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", icon: Clock, iconColor: "text-slate-400", label: "Desatualizada" },
};

export default function SyncStatusBanner({ syncStatuses, ano, uf, onSync }) {
  const currentStatus = syncStatuses?.find(s => s.ano === parseInt(ano) && s.uf === uf?.toUpperCase());

  if (!currentStatus || currentStatus.status === 'nao_importado') {
    return (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Base {uf}/{ano} não sincronizada</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Dados ainda não importados. Clique em sincronizar para consultar.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => onSync(ano, uf)} className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0">
          <Download className="w-4 h-4 mr-1.5" />Sincronizar
        </Button>
      </div>
    );
  }

  if (currentStatus.status === 'importando') {
    return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Download className="w-5 h-5 text-blue-500 animate-pulse flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">Importação em andamento...</p>
          <p className="text-blue-700 text-xs mt-0.5">
            Buscando dados oficiais do TSE para {uf}/{ano}. Aguarde.
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
            <p className="font-semibold text-red-800 text-sm">Erro ao importar dados do TSE</p>
            <p className="text-red-700 text-xs mt-0.5">
              {currentStatus.mensagem_erro || "Verifique a conexão ou tente novamente."}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onSync(ano, uf)} className="text-red-600 border-red-300 flex-shrink-0">
          Tentar novamente
        </Button>
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
            {currentStatus.total_linhas?.toLocaleString() || 0} registros importados.
            Dados públicos oficiais do TSE, sujeitos ao status de sincronização da base local.
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