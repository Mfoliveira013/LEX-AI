import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Search, 
  Eye, 
  Edit, 
  Download, 
  Trash2, 
  FolderPlus,
  Calendar,
  DollarSign,
  Brain,
  Scale,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusColors = {
  rascunho: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_revisao: "bg-blue-100 text-blue-800 border-blue-200",
  revisado: "bg-purple-100 text-purple-800 border-purple-200",
  aprovado: "bg-green-100 text-green-800 border-green-200",
  enviado: "bg-slate-100 text-slate-800 border-slate-200"
};

const tipoPecaLabels = {
  contestacao: "Contestação",
  defesa: "Defesa",
  peticao_intermediaria: "Petição Intermediária",
  manifestacao: "Manifestação",
  cumprimento_sentenca: "Cumprimento de Sentença",
  recurso: "Recurso",
  agravo: "Agravo",
  embargos: "Embargos",
  alegacoes_finais: "Alegações Finais",
  memoriais: "Memoriais",
  peticao_inicial: "Petição Inicial"
};

export default function PecasGeradas() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pecaSelecionada, setPecaSelecionada] = useState(null);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pecas = [], isLoading } = useQuery({
    queryKey: ['pecas', user?.cnpj_escritorio],
    queryFn: () => base44.entities.PecaProcessual.filter({ 
      cnpj_escritorio: user?.cnpj_escritorio,
      gerado_por_ia: true 
    }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Documento.filter({ cnpj_escritorio: user?.cnpj_escritorio }),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Caso.filter({ cnpj_escritorio: user?.cnpj_escritorio }),
    enabled: !!user?.cnpj_escritorio,
  });

  const deletePecaMutation = useMutation({
    mutationFn: (pecaId) => base44.entities.PecaProcessual.delete(pecaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
  });

  const handleDelete = (peca) => {
    if (window.confirm(`Tem certeza que deseja excluir a peça "${peca.titulo}"?`)) {
      deletePecaMutation.mutate(peca.id);
    }
  };

  const handleVisualizar = (peca) => {
    setPecaSelecionada(peca);
    setShowVisualizarModal(true);
  };

  const handleDownload = async (peca) => {
    // Criar arquivo de texto com o conteúdo
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

  const getDocumentoOrigem = (peca) => {
    return documentos.find(d => d.id === peca.documento_origem_id);
  };

  const getCaso = (peca) => {
    return casos.find(c => c.id === peca.caso_id);
  };

  const filteredPecas = pecas.filter(peca => 
    peca.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.tipo_peca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.agente_utilizado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <FileCheck className="w-8 h-8 text-purple-600" />
          Peças Geradas pela IA
        </h1>
        <p className="text-slate-600">
          Gerenciamento de todas as peças processuais criadas automaticamente
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Peças</p>
                <p className="text-2xl font-bold text-slate-900">{pecas.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Em Revisão</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pecas.filter(p => p.status === 'em_revisao').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {pecas.filter(p => p.status === 'aprovado').length}
                </p>
              </div>
              <Scale className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Rascunhos</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pecas.filter(p => p.status === 'rascunho').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
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
              placeholder="Buscar por título, tipo de peça ou agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Peças */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          </CardContent>
        </Card>
      ) : filteredPecas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma peça gerada ainda
            </h3>
            <p className="text-slate-600 mb-4">
              Faça upload de documentos para começar a gerar peças automáticas
            </p>
            <Button 
              onClick={() => window.location.href = '/Upload'}
              className="bg-blue-900 hover:bg-blue-800"
            >
              Ir para Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Tipo de Peça</TableHead>
                  <TableHead className="font-semibold">Documento de Origem</TableHead>
                  <TableHead className="font-semibold">Agente</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Caso</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPecas.map((peca) => {
                  const docOrigem = getDocumentoOrigem(peca);
                  const caso = getCaso(peca);

                  return (
                    <TableRow key={peca.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {tipoPecaLabels[peca.tipo_peca] || peca.tipo_peca}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">
                            {peca.titulo}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="text-sm text-slate-700 truncate max-w-xs">
                          {docOrigem?.nome_arquivo || 'Não vinculado'}
                        </p>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-slate-700">
                            {peca.agente_utilizado || 'Agente Padrão'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${statusColors[peca.status]} border`}>
                          {peca.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {caso ? (
                          <div className="flex items-center gap-2">
                            <FolderPlus className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-slate-700 truncate max-w-xs">
                              {caso.titulo}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sem caso</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(peca.created_date), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleVisualizar(peca)}
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            onClick={() => window.location.href = '/Minutas'}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleDownload(peca)}
                            title="Baixar"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(peca)}
                            title="Excluir"
                            disabled={deletePecaMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualização */}
      <Dialog open={showVisualizarModal} onOpenChange={setShowVisualizarModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {pecaSelecionada?.titulo}
            </DialogTitle>
          </DialogHeader>

          {pecaSelecionada && (
            <div className="space-y-6">
              {/* Metadados */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Tipo de Peça</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {tipoPecaLabels[pecaSelecionada.tipo_peca]}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Status</p>
                  <Badge className={statusColors[pecaSelecionada.status]}>
                    {pecaSelecionada.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Agente Responsável</p>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">{pecaSelecionada.agente_utilizado || 'Agente Padrão'}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Data de Geração</p>
                  <span className="text-sm">
                    {format(new Date(pecaSelecionada.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {pecaSelecionada.prazo_legal && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Prazo Legal</p>
                    <span className="text-sm text-red-600 font-semibold">
                      {format(new Date(pecaSelecionada.prazo_legal), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo da Peça */}
              <div className="border border-slate-200 rounded-lg p-6 bg-white max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {pecaSelecionada.conteudo_texto}
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowVisualizarModal(false)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => handleDownload(pecaSelecionada)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Documento
                </Button>
                <Button 
                  onClick={() => window.location.href = '/Minutas'}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Peça
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}