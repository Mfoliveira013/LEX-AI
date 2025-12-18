
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import { FileText, Edit, Eye, CheckCircle, Clock, Brain, Trash2, FolderPlus, X, Plus, Loader2 } from "lucide-react"; // Added Plus, Loader2
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function Minutas() {
  const [user, setUser] = useState(null);
  const [pecaSelecionada, setPecaSelecionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [conteudoEditado, setConteudoEditado] = useState("");
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [pecaParaVincular, setPecaParaVincular] = useState(null);
  const [casoSelecionado, setCasoSelecionado] = useState(null);
  const [showCriarCasoForm, setShowCriarCasoForm] = useState(false); // New state
  const [novoCasoData, setNovoCasoData] = useState({ // New state
    titulo: "",
    cliente: "",
    area_direito: "civil"
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pecas = [], isLoading } = useQuery({
    queryKey: ['pecas', user?.cnpj_escritorio],
    queryFn: () => base44.entities.PecaProcessual.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Caso.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: documentos = [] } = useQuery({ // New query for documents
    queryKey: ['documentos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Documento.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const atualizarPecaMutation = useMutation({
    mutationFn: ({ pecaId, dados }) => base44.entities.PecaProcessual.update(pecaId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      setEditando(false);
      setPecaSelecionada(null);
    },
  });

  const deletePecaMutation = useMutation({
    mutationFn: (pecaId) => base44.entities.PecaProcessual.delete(pecaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
  });

  const vincularCasoMutation = useMutation({
    mutationFn: ({ pecaId, casoId }) => base44.entities.PecaProcessual.update(pecaId, { caso_id: casoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      setShowVincularModal(false);
      setPecaParaVincular(null);
      setCasoSelecionado(null);
      setShowCriarCasoForm(false); // Reset new case form state
      setNovoCasoData({ titulo: "", cliente: "", area_direito: "civil" }); // Reset new case data
    },
  });

  const criarCasoEVincularMutation = useMutation({ // New mutation for creating a case and then linking
    mutationFn: async ({ novoCaso, pecaId }) => {
      // Buscar documento origem da peça para extrair informações
      const pecaCompleta = pecas.find(p => p.id === pecaId);
      const documentoOrigem = pecaCompleta?.documento_origem_id
        ? documentos.find(d => d.id === pecaCompleta.documento_origem_id)
        : null;

      // Extrair informações do contexto do documento
      const contextoExtraido = documentoOrigem?.contexto_extraido || {};
      
      // Criar caso com informações automáticas
      const caso = await base44.entities.Caso.create({
        cnpj_escritorio: user.cnpj_escritorio,
        titulo: novoCaso.titulo,
        cliente: novoCaso.cliente,
        area_direito: novoCaso.area_direito,
        status: "em_analise",
        advogado_responsavel: user.email,
        numero_processo: contextoExtraido.numero_processo || "",
        parte_contraria: contextoExtraido.reu || contextoExtraido.autor || "",
        valor_causa: contextoExtraido.valor_causa || null,
        prazo_proximo: contextoExtraido.prazo_resposta ? new Date(contextoExtraido.prazo_resposta).toISOString() : null,
        resumo: `Caso criado automaticamente a partir da peça processual: ${pecaCompleta?.titulo}`
      });

      // Vincular peça ao caso
      await base44.entities.PecaProcessual.update(pecaId, { caso_id: caso.id });

      // Se houver documento origem, vincular também
      if (documentoOrigem) {
        await base44.entities.Documento.update(documentoOrigem.id, { caso_id: caso.id });
      }

      return caso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      setShowVincularModal(false);
      setPecaParaVincular(null);
      setCasoSelecionado(null);
      setShowCriarCasoForm(false); // Reset new case form state
      setNovoCasoData({ titulo: "", cliente: "", area_direito: "civil" }); // Reset new case data
    },
  });

  const handleSalvarEdicao = () => {
    if (pecaSelecionada) {
      atualizarPecaMutation.mutate({
        pecaId: pecaSelecionada.id,
        dados: {
          conteudo_texto: conteudoEditado,
          conteudo_html: `<div class="peca-juridica">${conteudoEditado.replace(/\n/g, '<br/>')}</div>`,
          status: "revisado",
          revisado_por: user.email,
          data_revisao: new Date().toISOString()
        }
      });
    }
  };

  const handleAprovar = (peca) => {
    atualizarPecaMutation.mutate({
      pecaId: peca.id,
      dados: {
        status: "aprovado",
        aprovado_por: user.email,
        data_aprovacao: new Date().toISOString()
      }
    });
  };

  const handleDelete = (peca) => {
    if (window.confirm(`Tem certeza que deseja excluir a peça "${peca.titulo}"?`)) {
      deletePecaMutation.mutate(peca.id);
    }
  };

  const handleVincularCaso = (peca) => {
    setPecaParaVincular(peca);
    setCasoSelecionado(peca.caso_id || null);
    
    // Determine if the "create new case" form should be shown automatically
    setShowCriarCasoForm(casos.length === 0);

    // Pre-fill new case data based on piece and source document
    const documentoOrigem = peca.documento_origem_id
      ? documentos.find(d => d.id === peca.documento_origem_id)
      : null;
    
    const contexto = documentoOrigem?.contexto_extraido || {};
    
    setNovoCasoData({
      titulo: peca.titulo || "",
      cliente: contexto.autor || contexto.reu || "", // Pre-fill with autor/reu if available
      area_direito: "civil"
    });
    
    setShowVincularModal(true);
  };

  const handleConfirmarVinculo = () => {
    if (pecaParaVincular && casoSelecionado) {
      vincularCasoMutation.mutate({
        pecaId: pecaParaVincular.id,
        casoId: casoSelecionado
      });
    }
  };

  const handleCriarEVincular = () => { // New handler
    if (pecaParaVincular && novoCasoData.titulo && novoCasoData.cliente) {
      criarCasoEVincularMutation.mutate({
        novoCaso: novoCasoData,
        pecaId: pecaParaVincular.id
      });
    }
  };

  const handleVisualizar = (peca) => {
    setPecaSelecionada(peca);
    setConteudoEditado(peca.conteudo_texto);
    setEditando(false);
  };

  const handleEditar = (peca) => {
    setPecaSelecionada(peca);
    setConteudoEditado(peca.conteudo_texto);
    setEditando(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Minutas e Peças Processuais</h1>
          <p className="text-slate-600">Geradas automaticamente pela IA jurídica</p>
        </div>
      </div>

      {pecaSelecionada ? (
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{pecaSelecionada.titulo}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${statusColors[pecaSelecionada.status]} border`}>
                    {pecaSelecionada.status}
                  </Badge>
                  <Badge variant="outline">
                    {tipoPecaLabels[pecaSelecionada.tipo_peca]}
                  </Badge>
                  {pecaSelecionada.agente_utilizado && (
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />
                      {pecaSelecionada.agente_utilizado}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => setPecaSelecionada(null)}>
                Voltar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {editando ? (
              <>
                <Textarea
                  value={conteudoEditado}
                  onChange={(e) => setConteudoEditado(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditando(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSalvarEdicao}
                    className="bg-blue-900 hover:bg-blue-800"
                    disabled={atualizarPecaMutation.isPending}
                  >
                    {atualizarPecaMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="border border-slate-200 rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {pecaSelecionada.conteudo_texto}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Criada em: {format(new Date(pecaSelecionada.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handleEditar(pecaSelecionada)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {pecaSelecionada.status !== "aprovado" && (
                      <Button 
                        onClick={() => handleAprovar(pecaSelecionada)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={atualizarPecaMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            </div>
          ) : pecas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pecas.map((peca) => (
                <Card key={peca.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">{peca.titulo}</CardTitle>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleVincularCaso(peca)}
                          title="Vincular a um caso"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(peca)}
                          title="Excluir peça"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`${statusColors[peca.status]} border`}>
                        {peca.status}
                      </Badge>
                      <Badge variant="outline">
                        {tipoPecaLabels[peca.tipo_peca]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {peca.agente_utilizado && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Brain className="w-4 h-4" />
                        <span>{peca.agente_utilizado}</span>
                      </div>
                    )}
                    {peca.prazo_legal && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <Clock className="w-4 h-4" />
                        <span>Prazo: {format(new Date(peca.prazo_legal), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    {peca.caso_id && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <FolderPlus className="w-4 h-4" />
                        <span>Vinculada a caso</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      Criada em: {format(new Date(peca.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleVisualizar(peca)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditar(peca)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal para Vincular a Caso ou Criar Novo */}
      <Dialog open={showVincularModal} onOpenChange={setShowVincularModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Peça a um Caso</DialogTitle>
            <DialogDescription>
              {casos.length === 0
                ? "Nenhum caso cadastrado. Crie um novo caso para vincular esta peça."
                : "Selecione um caso existente ou crie um novo."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {pecaParaVincular && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-slate-900">{pecaParaVincular.titulo}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {tipoPecaLabels[pecaParaVincular.tipo_peca]}
                </p>
              </div>
            )}

            {!showCriarCasoForm && casos.length > 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecione o Caso</label>
                  <Select value={casoSelecionado || ""} onValueChange={setCasoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um caso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {casos.map((caso) => (
                        <SelectItem key={caso.id} value={caso.id}>
                          {caso.titulo} - {caso.cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCriarCasoForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Caso
                </Button>
              </>
            )}

            {(showCriarCasoForm || casos.length === 0) && (
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Criar Novo Caso</h4>
                  {casos.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCriarCasoForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título do Caso *</Label>
                    <Input
                      id="titulo"
                      placeholder="Ex: Ação Trabalhista - João Silva"
                      value={novoCasoData.titulo}
                      onChange={(e) => setNovoCasoData({...novoCasoData, titulo: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input
                      id="cliente"
                      placeholder="Nome do cliente"
                      value={novoCasoData.cliente}
                      onChange={(e) => setNovoCasoData({...novoCasoData, cliente: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_direito">Área do Direito</Label>
                    <Select
                      value={novoCasoData.area_direito}
                      onValueChange={(value) => setNovoCasoData({...novoCasoData, area_direito: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a área..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="tributario">Tributário</SelectItem>
                        <SelectItem value="empresarial">Empresarial</SelectItem>
                        <SelectItem value="consumidor">Consumidor</SelectItem>
                        <SelectItem value="previdenciario">Previdenciário</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="familia">Família</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-100 border border-blue-200 rounded p-3 text-sm text-blue-900">
                    <p className="font-semibold mb-1">📁 Pasta será criada automaticamente</p>
                    <p className="text-xs">O sistema criará uma pasta organizada com:</p>
                    <ul className="text-xs mt-1 space-y-1 ml-4 list-disc">
                      <li>Documento original vinculado</li>
                      <li>Esta peça processual</li>
                      <li>Informações do processo extraídas pela IA</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVincularModal(false);
                  setPecaParaVincular(null);
                  setCasoSelecionado(null);
                  setShowCriarCasoForm(false);
                  setNovoCasoData({ titulo: "", cliente: "", area_direito: "civil" });
                }}
              >
                Cancelar
              </Button>
              
              {(showCriarCasoForm || casos.length === 0) ? (
                <Button
                  onClick={handleCriarEVincular}
                  disabled={!novoCasoData.titulo || !novoCasoData.cliente || criarCasoEVincularMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {criarCasoEVincularMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Caso e Vincular
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmarVinculo}
                  disabled={!casoSelecionado || vincularCasoMutation.isPending}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  {vincularCasoMutation.isPending ? "Vinculando..." : "Vincular ao Caso"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
