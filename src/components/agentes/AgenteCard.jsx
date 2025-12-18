import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Eye, 
  Edit, 
  Trash2, 
  Activity,
  FileText,
  TrendingUp,
  Power,
  PowerOff
} from "lucide-react";
import { motion } from "framer-motion";

const statusColors = {
  ativo: "bg-green-100 text-green-800 border-green-200",
  em_treinamento: "bg-blue-100 text-blue-800 border-blue-200",
  inativo: "bg-gray-100 text-gray-800 border-gray-200"
};

const modeloLabels = {
  "gpt-4": "GPT-4",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-5": "GPT-5",
  "claude": "Claude",
  "gemini": "Gemini"
};

export default function AgenteCard({ agente, onView, onEdit, onDelete, onToggleStatus }) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{agente.nome_agente}</h3>
              <p className="text-xs text-slate-500 truncate">{modeloLabels[agente.modelo_llm] || agente.modelo_llm}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${statusColors[agente.status]} border flex-shrink-0`}>
            {agente.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {agente.descricao_agente && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {agente.descricao_agente}
          </p>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <Activity className="w-3 h-3" />
              <span className="text-lg font-bold">{agente.total_execucoes || 0}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase">Execuções</p>
          </div>
          
          <div className="text-center border-x border-slate-100">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <FileText className="w-3 h-3" />
              <span className="text-lg font-bold">{agente.metricas?.documentos_analisados || 0}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase">Docs</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-lg font-bold">{agente.metricas?.pecas_geradas || 0}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase">Peças</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleStatus}
            className={agente.status === 'ativo' ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-green-50 hover:text-green-600"}
            title={agente.status === 'ativo' ? "Desativar" : "Ativar"}
          >
            {agente.status === 'ativo' ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}