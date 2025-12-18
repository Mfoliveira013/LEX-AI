import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  DollarSign,
  User,
  FileText,
  Scale,
  Brain,
  Eye,
  Download,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderOpen
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function CasoDrawer({ caso, open, onClose, onEdit, onDelete }) {
  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-caso', caso?.id],
    queryFn: () => base44.entities.Documento.filter({ caso_id: caso.id }),
    enabled: !!caso?.id && open,
  });

  const { data: pecas = [] } = useQuery({
    queryKey: ['pecas-caso', caso?.id],
    queryFn: () => base44.entities.PecaProcessual.filter({ caso_id: caso.id }),
    enabled: !!caso?.id && open,
  });

  if (!caso) return null;

  const diasPrazo = caso.prazo_proximo ? differenceInDays(new Date(caso.prazo_proximo), new Date()) : null;
  const prazoUrgente = diasPrazo !== null && diasPrazo <= 7;

  const handleDownloadDocumento = (doc) => {
    window.open(doc.url_arquivo, '_blank');
  };

  const handleDownloadPeca = (peca) => {
    const blob = new Blob([peca.conteudo_texto], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${peca.titulo}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl mb-3">{caso.titulo}</SheetTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={`${statusColors[caso.status]} border font-medium`}>
                  {caso.status.replace(/_/g, ' ')}
                </Badge>
                <Badge className={areaColors[caso.area_direito]}>
                  {caso.area_direito}
                </Badge>
                {prazoUrgente && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Prazo Urgente ({diasPrazo}d)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {caso.numero_processo && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              <Scale className="w-4 h-4" />
              <span className="font-mono">{caso.numero_processo}</span>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Informações Principais */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 mb-3">Informações do Caso</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Cliente</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{caso.cliente}</span>
                  </div>
                </div>

                {caso.parte_contraria && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Parte Contrária</p>
                    <span className="text-sm">{caso.parte_contraria}</span>
                  </div>
                )}

                {caso.valor_causa && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Valor da Causa</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        R$ {caso.valor_causa.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                {caso.advogado_responsavel && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Advogado Responsável</p>
                    <span className="text-sm">{caso.advogado_responsavel}</span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Data de Cadastro</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      {format(new Date(caso.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {caso.prazo_proximo && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Próximo Prazo</p>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${prazoUrgente ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${prazoUrgente ? 'text-red-600' : ''}`}>
                        {format(new Date(caso.prazo_proximo), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {caso.resumo && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Resumo</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{caso.resumo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos Vinculados */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documentos Vinculados
                </h3>
                <Badge variant="outline">{documentos.length}</Badge>
              </div>

              {documentos.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum documento vinculado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {doc.nome_arquivo}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(doc.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => handleDownloadDocumento(doc)}
                          title="Baixar"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peças Processuais Vinculadas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  Peças Processuais
                </h3>
                <Badge variant="outline">{pecas.length}</Badge>
              </div>

              {pecas.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma peça gerada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pecas.map((peca) => (
                    <div 
                      key={peca.id}
                      className="flex items-start justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {peca.gerado_por_ia && (
                          <Brain className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {peca.titulo}
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {peca.tipo_peca}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {peca.status}
                            </Badge>
                            {peca.agente_utilizado && (
                              <Badge variant="outline" className="text-xs text-purple-600">
                                {peca.agente_utilizado}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(peca.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-purple-600 hover:text-purple-700"
                          onClick={() => handleDownloadPeca(peca)}
                          title="Baixar"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Ações</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    onEdit(caso);
                    onClose();
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Caso
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    onDelete(caso);
                    onClose();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Caso
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}