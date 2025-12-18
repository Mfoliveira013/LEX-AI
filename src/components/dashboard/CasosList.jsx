import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
  aguardando_resposta: "bg-purple-100 text-purple-800 border-purple-200",
  concluido: "bg-green-100 text-green-800 border-green-200",
  arquivado: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function CasosList({ casos }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FolderOpen className="w-5 h-5 text-blue-900" />
            Casos Recentes
          </CardTitle>
          <Link to={createPageUrl("Casos")}>
            <Button variant="ghost" size="sm" className="text-blue-900">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {casos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Nenhum caso ativo no momento</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {casos.map((caso) => (
              <Link 
                key={caso.id} 
                to={`${createPageUrl("Casos")}?id=${caso.id}`}
                className="block hover:bg-slate-50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">{caso.titulo}</h4>
                    <Badge variant="outline" className={`${statusColors[caso.status]} border`}>
                      {caso.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{caso.cliente}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{caso.area_direito}</span>
                    </span>
                    {caso.prazo_proximo && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Prazo: {format(new Date(caso.prazo_proximo), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}