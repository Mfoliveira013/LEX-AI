import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, User, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
  aguardando_resposta: "bg-purple-100 text-purple-800 border-purple-200",
  concluido: "bg-green-100 text-green-800 border-green-200",
  arquivado: "bg-gray-100 text-gray-800 border-gray-200"
};

const areaColors = {
  civil: "bg-blue-50 text-blue-700",
  trabalhista: "bg-orange-50 text-orange-700",
  tributario: "bg-green-50 text-green-700",
  empresarial: "bg-purple-50 text-purple-700",
  consumidor: "bg-pink-50 text-pink-700",
  previdenciario: "bg-indigo-50 text-indigo-700",
  criminal: "bg-red-50 text-red-700",
  familia: "bg-cyan-50 text-cyan-700",
  administrativo: "bg-amber-50 text-amber-700"
};

export default function CasoCard({ caso }) {
  const diasPrazo = caso.prazo_proximo ? differenceInDays(new Date(caso.prazo_proximo), new Date()) : null;
  const prazoUrgente = diasPrazo !== null && diasPrazo <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{caso.titulo}</h3>
            {prazoUrgente && (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={`${statusColors[caso.status]} border font-medium`}>
              {caso.status.replace(/_/g, ' ')}
            </Badge>
            <Badge className={areaColors[caso.area_direito]}>
              {caso.area_direito}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span className="truncate">{caso.cliente}</span>
          </div>
          
          {caso.valor_causa && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4" />
              <span>R$ {caso.valor_causa.toLocaleString('pt-BR')}</span>
            </div>
          )}
          
          {caso.prazo_proximo && (
            <div className={`flex items-center gap-2 text-sm ${prazoUrgente ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
              <Calendar className="w-4 h-4" />
              <span>
                Prazo: {format(new Date(caso.prazo_proximo), "dd/MM/yyyy")}
                {prazoUrgente && ` (${diasPrazo}d)`}
              </span>
            </div>
          )}

          {caso.numero_processo && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">Processo: {caso.numero_processo}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}