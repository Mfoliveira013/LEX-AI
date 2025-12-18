import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Brain,
  Edit,
  Activity,
  FileText,
  TrendingUp,
  Calendar,
  Zap,
  Settings,
  Palette,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function VisualizarAgenteDrawer({ agente, open, onClose, onEdit }) {
  if (!agente) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl mb-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                {agente.nome_agente}
              </SheetTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={`${statusColors[agente.status]} border font-medium`}>
                  {agente.status}
                </Badge>
                <Badge variant="outline">
                  {modeloLabels[agente.modelo_llm] || agente.modelo_llm}
                </Badge>
                <Badge variant="outline">
                  {agente.idioma}
                </Badge>
              </div>
            </div>
            <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          {agente.descricao_agente && (
            <p className="text-slate-600">{agente.descricao_agente}</p>
          )}
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Métricas */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Métricas de Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-slate-600">Total de Execuções</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{agente.total_execucoes || 0}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-600">Documentos Analisados</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{agente.metricas?.documentos_analisados || 0}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-slate-600">Peças Geradas</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{agente.metricas?.pecas_geradas || 0}</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-slate-600">Taxa de Sucesso</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">
                    {agente.metricas?.taxa_sucesso ? `${(agente.metricas.taxa_sucesso * 100).toFixed(0)}%` : '0%'}
                  </p>
                </div>
              </div>

              {agente.ultima_execucao && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Última execução: {format(new Date(agente.ultima_execucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                Instruções do Agente
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {agente.instrucoes_gerais}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Personalidade */}
          {agente.personalidade_ia && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-slate-600" />
                  Personalidade da IA
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Tom de Linguagem</span>
                    <Badge variant="outline">{agente.personalidade_ia.tom_linguagem?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Nível de Detalhe</span>
                    <Badge variant="outline">{agente.personalidade_ia.nivel_detalhe}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Modo de Resposta</span>
                    <Badge variant="outline">{agente.personalidade_ia.modo_resposta?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Incluir Assinatura</span>
                    <Badge variant={agente.personalidade_ia.incluir_assinatura ? "default" : "outline"}>
                      {agente.personalidade_ia.incluir_assinatura ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Incluir Referências Legais</span>
                    <Badge variant={agente.personalidade_ia.incluir_referencias_legais ? "default" : "outline"}>
                      {agente.personalidade_ia.incluir_referencias_legais ? "Sim" : "Não"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configurações Avançadas */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-600" />
                Configurações Avançadas
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Temperatura</span>
                  <span className="font-medium">{agente.temperatura}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Máximo de Tokens</span>
                  <span className="font-medium">{agente.resposta_maxima_tokens}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Idioma</span>
                  <span className="font-medium">{agente.idioma}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ação Pós-Análise</span>
                  <span className="font-medium">{agente.acoes_pos_analise?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data de Criação */}
          <div className="flex items-center gap-2 text-sm text-slate-600 pt-4 border-t">
            <Calendar className="w-4 h-4" />
            <span>Criado em: {format(new Date(agente.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}