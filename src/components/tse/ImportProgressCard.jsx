import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Database } from "lucide-react";

export default function ImportProgressCard({ result }) {
  const success = result?.success && result?.imported > 0;

  return (
    <Card className={`border-0 shadow-sm ${success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${success ? "bg-green-100" : "bg-red-100"}`}>
            {success
              ? <CheckCircle className="w-6 h-6 text-green-600" />
              : <AlertTriangle className="w-6 h-6 text-red-600" />}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg mb-1 ${success ? "text-green-800" : "text-red-800"}`}>
              {success ? "Importação concluída com sucesso!" : "Erro na importação"}
            </h3>
            <p className={`text-sm ${success ? "text-green-700" : "text-red-700"}`}>
              {result?.message || "Resultado desconhecido"}
            </p>
            {success && (
              <div className="flex items-center gap-2 mt-3">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  {result.imported?.toLocaleString("pt-BR")} registros adicionados à entidade <strong>ElectoralData</strong>
                </span>
                {result.usedMock && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">dados simulados</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}