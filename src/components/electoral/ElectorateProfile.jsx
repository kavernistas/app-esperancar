import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle } from "lucide-react";

export default function ElectorateProfile({ data }) {
  const totalVotes = data.reduce((s, c) => s + (c.votos || 0), 0);

  // Perfil do eleitorado só está disponível quando dados do TSE por seção (perfil_eleitorado_secao) são importados.
  // Os dados de votação (TSEVoteResult) não contêm perfil demográfico.
  // Exibimos uma mensagem informativa em vez de simular dados.

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Perfil do Eleitorado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Dados demográficos não disponíveis</p>
            <p className="text-xs text-amber-700 mt-1">
              O perfil do eleitorado (gênero, faixa etária, escolaridade) requer a importação do dataset
              "Perfil do Eleitorado por Seção" do TSE. Os dados atuais ({totalVotes.toLocaleString("pt-BR")} votos) são de votação.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Para obter o perfil demográfico, importe o dataset "perfil_eleitorado_secao" no painel de sincronização.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}