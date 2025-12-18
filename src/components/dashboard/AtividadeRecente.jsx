
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, Upload, CheckCircle, AlertCircle, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap = {
  upload_documento: Upload,
  analise_iniciada: Activity,
  minuta_gerada: FileText,
  minuta_aprovada: CheckCircle,
  caso_criado: FolderOpen,
};

const colorMap = {
  upload_documento: "text-blue-600",
  analise_iniciada: "text-purple-600",
  minuta_gerada: "text-green-600",
  minuta_aprovada: "text-emerald-600",
  caso_criado: "text-amber-600",
};

export default function AtividadeRecente({ cnpjEscritorio }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['auditoria', cnpjEscritorio],
    queryFn: () => base44.entities.LogAuditoria.filter({ cnpj_escritorio: cnpjEscritorio }, '-created_date', 10),
    enabled: !!cnpjEscritorio,
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="w-5 h-5 text-blue-900" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const Icon = iconMap[log.acao] || Activity;
              const color = colorMap[log.acao] || "text-slate-600";
              
              return (
                <div key={log.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {log.acao.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{log.usuario_nome}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
