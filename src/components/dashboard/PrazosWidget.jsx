import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PrazosWidget({ casos }) {
  return (
    <Card className="shadow-lg border-red-200">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="flex items-center gap-2 text-lg text-red-900">
          <AlertCircle className="w-5 h-5" />
          Prazos Urgentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {casos.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nenhum prazo urgente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {casos.slice(0, 5).map((caso) => {
              const diasRestantes = differenceInDays(new Date(caso.prazo_proximo), new Date());
              const isVeryUrgent = diasRestantes <= 2;
              
              return (
                <div 
                  key={caso.id} 
                  className={`p-3 rounded-lg border ${isVeryUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-sm text-slate-900 mb-1">{caso.titulo}</h5>
                      <p className="text-xs text-slate-600">{caso.cliente}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isVeryUrgent ? 'text-red-700' : 'text-yellow-700'}`}>
                        {diasRestantes}d
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(caso.prazo_proximo), "dd/MM")}
                      </p>
                    </div>
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