import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link as RouterLink } from "react-router-dom";
import {
  Database, CheckCircle2, XCircle, RefreshCw, ExternalLink, Activity
} from "lucide-react";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const ANOS = [2012,2014,2016,2018,2020,2022,2024];

export default function ImportPanel({ syncStatuses }) {
  const importedCount = syncStatuses?.filter(s => s.status === 'importado').length || 0;
  const totalPossible = ANOS.length * ESTADOS.length;

  const statusBadge = (status) => {
    if (!status || status === 'nao_importado') return <Badge variant="outline" className="text-xs text-slate-400">Não importado</Badge>;
    if (status === 'importado') return <Badge className="text-xs bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Importado</Badge>;
    if (status === 'importando') return <Badge className="text-xs bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-0.5 animate-spin" />Importando</Badge>;
    if (status === 'erro') return <Badge className="text-xs bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-0.5" />Erro</Badge>;
    return null;
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Status da Importação TSE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{importedCount} de {totalPossible} bases importadas</span>
          <Progress value={Math.round((importedCount / totalPossible) * 100)} className="h-1.5 flex-1" />
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Importação via serviço externo</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Os dados do TSE são processados pelo <strong>esperancar-tse-etl</strong> —
                um serviço dedicado que baixa, descompacta e normaliza os arquivos oficiais
                antes de enviá-los em lotes para o Base44.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <RouterLink to="/DiagnosticoTSE">
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Activity className="w-3.5 h-3.5" />
              Painel de Diagnóstico
            </span>
          </RouterLink>
        </div>
      </CardContent>
    </Card>
  );
}