import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FolderTree, 
  Folder,
  FolderOpen,
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  Filter,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const setorLabels = {
  juridico: "Jurídico",
  administrativo: "Administrativo",
  financeiro: "Financeiro",
  recursos_humanos: "Recursos Humanos",
  controldesk: "Controldesk",
  mis: "M.I.S (Gestão da Informação)",
  negociacao: "Negociação"
};

const setorColors = {
  juridico: "bg-blue-100 text-blue-800 border-blue-200",
  administrativo: "bg-purple-100 text-purple-800 border-purple-200",
  financeiro: "bg-green-100 text-green-800 border-green-200",
  recursos_humanos: "bg-orange-100 text-orange-800 border-orange-200",
  controldesk: "bg-pink-100 text-pink-800 border-pink-200",
  mis: "bg-indigo-100 text-indigo-800 border-indigo-200",
  negociacao: "bg-amber-100 text-amber-800 border-amber-200"
};

const tipoDocumentoLabels = {
  procuracao: "Procuração",
  contrato: "Contrato",
  defesa: "Defesa",
  peticao_inicial: "Petição Inicial",
  comprovante_pagamento: "Comprovante de Pagamento",
  recibo: "Recibo",
  termo_adesao: "Termo de Adesão",
  intimacao: "Intimação",
  sentenca: "Sentença",
  despacho: "Despacho",
  recurso: "Recurso",
  outros: "Outros"
};

export default function DocumentosOrganizados() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [setorExpandido, setSetorExpandido] = useState(null);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos-organizados', user?.cnpj_escritorio],
    queryFn: () => base44.entities.DocumentoOrganizado.filter({ 
      cnpj_escritorio: user?.cnpj_escritorio 
    }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const deleteDocumentoMutation = useMutation({
    mutationFn: (documentoId) => base44.entities.DocumentoOrganizado.delete(documentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-organizados'] });
    },
  });

  const handleDelete = (doc) => {
    if (window.confirm(`Tem certeza que deseja excluir "${doc.nome_arquivo_organizado}"?`)) {
      deleteDocumentoMutation.mutate(doc.id);
    }
  };

  const handleDownload = (doc) => {
    window.open(doc.url_arquivo_organizado, '_blank');
  };

  const handleVisualizar = (doc) => {
    setDocumentoSelecionado(doc);
    setShowVisualizarModal(true);
  };

  const toggleSetor = (setor) => {
    setSetorExpandido(setorExpandido === setor ? null : setor);
  };

  // Agrupar documentos por setor
  const documentosPorSetor = React.useMemo(() => {
    const grupos = {};
    
    documentos.forEach(doc => {
      const setor = doc.setor_destino || 'outros';
      if (!grupos[setor]) {
        grupos[setor] = [];
      }
      grupos[setor].push(doc);
    });

    return grupos;
  }, [documentos]);

  // Filtrar documentos pela busca
  const documentosFiltrados = React.useMemo(() => {
    if (!searchTerm) return documentosPorSetor;

    const filtrados = {};
    Object.entries(documentosPorSetor).forEach(([setor, docs]) => {
      const docsFiltrados = docs.filter(doc => 
        doc.nome_arquivo_organizado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipo_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (docsFiltrados.length > 0) {
        filtrados[setor] = docsFiltrados;
      }
    });

    return filtrados;
  }, [documentosPorSetor, searchTerm]);

  // Estatísticas
  const totalDocumentos = documentos.length;
  const documentosPorTipo = React.useMemo(() => {
    const tipos = {};
    documentos.forEach(doc => {
      const tipo = doc.tipo_documento || 'outros';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });
    return tipos;
  }, [documentos]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <FolderTree className="w-8 h-8 text-blue-600" />
          Documentos Organizados
        </h1>
        <p className="text-slate-600">
          Navegue pelos documentos organizados automaticamente pela IA
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Documentos</p>
                <p className="text-2xl font-bold text-slate-900">{totalDocumentos}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Setores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(documentosPorSetor).length}
                </p>
              </div>
              <Folder className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tipos Diferentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(documentosPorTipo).length}
                </p>
              </div>
              <Filter className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Este Mês</p>
                <p className="text-2xl font-bold text-amber-600">
                  {documentos.filter(d => {
                    const date = new Date(d.created_date);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visualização por Pastas de Setores */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          </CardContent>
        </Card>
      ) : Object.keys(documentosFiltrados).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum documento encontrado
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? "Tente ajustar sua busca" : "Organize documentos para vê-los aqui"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(documentosFiltrados).map(([setor, docs]) => (
            <motion.div
              key={setor}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-lg overflow-hidden">
                <CardHeader 
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${setorColors[setor]} border-b`}
                  onClick={() => toggleSetor(setor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {setorExpandido === setor ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      {setorExpandido === setor ? (
                        <FolderOpen className="w-6 h-6" />
                      ) : (
                        <Folder className="w-6 h-6" />
                      )}
                      <div>
                        <CardTitle className="text-xl">
                          {setorLabels[setor] || setor}
                        </CardTitle>
                        <p className="text-sm font-normal mt-1">
                          {docs.length} documento{docs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {docs.length}
                    </Badge>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {setorExpandido === setor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {docs.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <h4 className="font-semibold text-slate-900 truncate">
                                      {doc.nome_arquivo_organizado}
                                    </h4>
                                  </div>

                                  <div className="flex gap-2 flex-wrap mb-3">
                                    <Badge variant="outline">
                                      {tipoDocumentoLabels[doc.tipo_documento]}
                                    </Badge>
                                    {doc.documentos_extraidos > 1 && (
                                      <Badge className="bg-amber-100 text-amber-800">
                                        {doc.documentos_extraidos} docs separados
                                      </Badge>
                                    )}
                                    {doc.metadados_ia?.paginas_reordenadas && (
                                      <Badge className="bg-blue-100 text-blue-800">
                                        Páginas reorganizadas
                                      </Badge>
                                    )}
                                  </div>

                                  {doc.caminho_pasta && (
                                    <p className="text-xs text-slate-500 mb-2">
                                      📁 {doc.caminho_pasta}
                                    </p>
                                  )}

                                  {doc.observacoes && (
                                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                      {doc.observacoes}
                                    </p>
                                  )}

                                  {doc.metadados_ia?.partes_identificadas && (
                                    <div className="grid md:grid-cols-3 gap-2 text-xs text-slate-600 mb-2">
                                      {doc.metadados_ia.partes_identificadas.autor && (
                                        <p><strong>Autor:</strong> {doc.metadados_ia.partes_identificadas.autor}</p>
                                      )}
                                      {doc.metadados_ia.partes_identificadas.reu && (
                                        <p><strong>Réu:</strong> {doc.metadados_ia.partes_identificadas.reu}</p>
                                      )}
                                      {doc.metadados_ia.partes_identificadas.numero_processo && (
                                        <p><strong>Processo:</strong> {doc.metadados_ia.partes_identificadas.numero_processo}</p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(doc.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    {doc.agente_responsavel && (
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {doc.agente_responsavel}
                                      </span>
                                    )}
                                    {doc.tempo_processamento_segundos && (
                                      <span>
                                        ⏱️ {doc.tempo_processamento_segundos.toFixed(1)}s
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleVisualizar(doc)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Visualizar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(doc)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Baixar"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(doc)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Excluir"
                                    disabled={deleteDocumentoMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Visualização */}
      <Dialog open={showVisualizarModal} onOpenChange={setShowVisualizarModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {documentoSelecionado?.nome_arquivo_organizado}
            </DialogTitle>
          </DialogHeader>

          {documentoSelecionado && (
            <div className="space-y-6">
              {/* Metadados */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Tipo de Documento</p>
                  <Badge variant="outline">
                    {tipoDocumentoLabels[documentoSelecionado.tipo_documento]}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Setor</p>
                  <Badge className={setorColors[documentoSelecionado.setor_destino]}>
                    {setorLabels[documentoSelecionado.setor_destino]}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Páginas</p>
                  <span className="text-sm">
                    {documentoSelecionado.paginas_corrigidas} página{documentoSelecionado.paginas_corrigidas !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Data de Processamento</p>
                  <span className="text-sm">
                    {format(new Date(documentoSelecionado.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {documentoSelecionado.caminho_pasta && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Caminho</p>
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                      {documentoSelecionado.caminho_pasta}
                    </code>
                  </div>
                )}
              </div>

              {/* Observações */}
              {documentoSelecionado.observacoes && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Observações da IA</h4>
                  <p className="text-sm text-slate-700">{documentoSelecionado.observacoes}</p>
                </div>
              )}

              {/* Metadados da IA */}
              {documentoSelecionado.metadados_ia && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Análise Detalhada</h4>
                  
                  {documentoSelecionado.metadados_ia.partes_identificadas && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Partes Identificadas</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        {documentoSelecionado.metadados_ia.partes_identificadas.autor && (
                          <p><strong>Autor:</strong> {documentoSelecionado.metadados_ia.partes_identificadas.autor}</p>
                        )}
                        {documentoSelecionado.metadados_ia.partes_identificadas.reu && (
                          <p><strong>Réu:</strong> {documentoSelecionado.metadados_ia.partes_identificadas.reu}</p>
                        )}
                        {documentoSelecionado.metadados_ia.partes_identificadas.numero_processo && (
                          <p className="md:col-span-2"><strong>Processo:</strong> {documentoSelecionado.metadados_ia.partes_identificadas.numero_processo}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {documentoSelecionado.metadados_ia.palavras_chave && documentoSelecionado.metadados_ia.palavras_chave.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Palavras-chave</p>
                      <div className="flex gap-2 flex-wrap">
                        {documentoSelecionado.metadados_ia.palavras_chave.map((palavra, idx) => (
                          <Badge key={idx} variant="outline">
                            {palavra}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {documentoSelecionado.metadados_ia.documentos_separados && documentoSelecionado.metadados_ia.documentos_separados.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Documentos Separados</p>
                      <ul className="text-sm space-y-1">
                        {documentoSelecionado.metadados_ia.documentos_separados.map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowVisualizarModal(false)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => handleDownload(documentoSelecionado)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Documento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}