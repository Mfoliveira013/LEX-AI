import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Brain, Sparkles, Settings, Zap } from "lucide-react";

export default function NovoAgenteModal({ open, onClose, user }) {
  const [formData, setFormData] = useState({
    nome_agente: "",
    descricao_agente: "",
    instrucoes_gerais: "",
    modelo_llm: "gpt-4-turbo",
    temperatura: 0.3,
    resposta_maxima_tokens: 4000,
    idioma: "portugues",
    ton_linguagem: "formal_juridico",
    nivel_detalhe: "intermediario",
    modo_resposta: "documento_estruturado",
    incluir_assinatura: true,
    incluir_referencias_legais: true,
    acoes_pos_analise: "salvar_rascunho",
    status: "ativo"
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const createAgenteMutation = useMutation({
    mutationFn: async (data) => {
      const agente = await base44.entities.AgenteLLM.create({
        cnpj_escritorio: user.cnpj_escritorio,
        usuario_criador: user.email,
        nome_agente: data.nome_agente,
        descricao_agente: data.descricao_agente,
        instrucoes_gerais: data.instrucoes_gerais,
        palavras_chave: [],
        gatilhos_acoes: {
          intimacao: "gerar_contestacao",
          protesto: "gerar_defesa",
          minuta: "revisar_documento",
          sentenca: "gerar_recurso",
          manifestacao: "analisar_prazo"
        },
        personalidade_ia: {
          tom_linguagem: data.ton_linguagem,
          nivel_detalhe: data.nivel_detalhe,
          modo_resposta: data.modo_resposta,
          incluir_assinatura: data.incluir_assinatura,
          incluir_referencias_legais: data.incluir_referencias_legais
        },
        modelo_llm: data.modelo_llm,
        temperatura: data.temperatura,
        resposta_maxima_tokens: data.resposta_maxima_tokens,
        idioma: data.idioma,
        acoes_pos_analise: data.acoes_pos_analise,
        status: data.status,
        total_execucoes: 0,
        metricas: {
          documentos_analisados: 0,
          pecas_geradas: 0,
          taxa_sucesso: 0,
          tempo_medio_segundos: 0
        }
      });

      return agente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      setFormData({
        nome_agente: "",
        descricao_agente: "",
        instrucoes_gerais: "",
        modelo_llm: "gpt-4-turbo",
        temperatura: 0.3,
        resposta_maxima_tokens: 4000,
        idioma: "portugues",
        ton_linguagem: "formal_juridico",
        nivel_detalhe: "intermediario",
        modo_resposta: "documento_estruturado",
        incluir_assinatura: true,
        incluir_referencias_legais: true,
        acoes_pos_analise: "salvar_rascunho",
        status: "ativo"
      });
      setError("");
      onClose();
    },
    onError: (error) => {
      setError(error.message || "Erro ao criar agente. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nome_agente || !formData.instrucoes_gerais) {
      setError("Nome do agente e instruções são obrigatórios.");
      return;
    }

    createAgenteMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Novo Agente LLM</DialogTitle>
              <DialogDescription>
                Configure sua IA jurídica personalizada
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">
                <Sparkles className="w-4 h-4 mr-2" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="personalidade">
                <Brain className="w-4 h-4 mr-2" />
                Personalidade
              </TabsTrigger>
              <TabsTrigger value="avancado">
                <Settings className="w-4 h-4 mr-2" />
                Avançado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_agente">Nome do Agente *</Label>
                <Input
                  id="nome_agente"
                  placeholder="Ex: IA Trabalhista - Defesas"
                  value={formData.nome_agente}
                  onChange={(e) => setFormData({ ...formData, nome_agente: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_agente">Descrição</Label>
                <Input
                  id="descricao_agente"
                  placeholder="Ex: Especializada em contestações trabalhistas"
                  value={formData.descricao_agente}
                  onChange={(e) => setFormData({ ...formData, descricao_agente: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucoes_gerais">Instruções do Agente * (System Prompt)</Label>
                <Textarea
                  id="instrucoes_gerais"
                  placeholder="Ex: Você é um agente especializado em direito trabalhista. Analise intimações e gere contestações formais, sempre citando CLT e jurisprudências relevantes. Use tom técnico e profissional."
                  rows={8}
                  value={formData.instrucoes_gerais}
                  onChange={(e) => setFormData({ ...formData, instrucoes_gerais: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500">
                  Defina como seu agente deve se comportar, qual área do direito atua, e como deve estruturar as respostas.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelo_llm">Modelo de IA</Label>
                  <Select value={formData.modelo_llm} onValueChange={(value) => setFormData({ ...formData, modelo_llm: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4-turbo">⚡ GPT-4 Turbo (Rápido)</SelectItem>
                      <SelectItem value="gpt-4">🤖 GPT-4 (Balanceado)</SelectItem>
                      <SelectItem value="gpt-5">🚀 GPT-5 (Avançado)</SelectItem>
                      <SelectItem value="claude">🧠 Claude (Criativo)</SelectItem>
                      <SelectItem value="gemini">✨ Gemini (Google)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select value={formData.idioma} onValueChange={(value) => setFormData({ ...formData, idioma: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portugues">🇧🇷 Português</SelectItem>
                      <SelectItem value="ingles">🇺🇸 Inglês</SelectItem>
                      <SelectItem value="espanhol">🇪🇸 Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personalidade" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ton_linguagem">Tom de Linguagem</Label>
                <Select value={formData.ton_linguagem} onValueChange={(value) => setFormData({ ...formData, ton_linguagem: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal_juridico">⚖️ Formal Jurídico</SelectItem>
                    <SelectItem value="tecnico_neutro">🔬 Técnico e Neutro</SelectItem>
                    <SelectItem value="amigavel_profissional">🤝 Amigável Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivel_detalhe">Nível de Detalhe</Label>
                <Select value={formData.nivel_detalhe} onValueChange={(value) => setFormData({ ...formData, nivel_detalhe: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resumo">📝 Resumo (Conciso)</SelectItem>
                    <SelectItem value="intermediario">📄 Intermediário</SelectItem>
                    <SelectItem value="extenso">📚 Extenso (Detalhado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modo_resposta">Modo de Resposta</Label>
                <Select value={formData.modo_resposta} onValueChange={(value) => setFormData({ ...formData, modo_resposta: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto_puro">Texto Puro</SelectItem>
                    <SelectItem value="documento_estruturado">Documento Estruturado (Cabeçalho, Fatos, Direito, Pedidos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir_assinatura"
                    checked={formData.incluir_assinatura}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluir_assinatura: checked })}
                  />
                  <label htmlFor="incluir_assinatura" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Incluir assinatura automática do escritório
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir_referencias_legais"
                    checked={formData.incluir_referencias_legais}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluir_referencias_legais: checked })}
                  />
                  <label htmlFor="incluir_referencias_legais" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Incluir referências legais automáticas (leis e artigos)
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avancado" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperatura">
                  Temperatura (Criatividade): {formData.temperatura}
                </Label>
                <input
                  type="range"
                  id="temperatura"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => setFormData({ ...formData, temperatura: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Menor = Mais conservador e preciso | Maior = Mais criativo e variado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resposta_maxima_tokens">Tamanho Máximo da Resposta (Tokens)</Label>
                <Input
                  type="number"
                  id="resposta_maxima_tokens"
                  min="500"
                  max="8000"
                  value={formData.resposta_maxima_tokens}
                  onChange={(e) => setFormData({ ...formData, resposta_maxima_tokens: parseInt(e.target.value) })}
                />
                <p className="text-xs text-slate-500">
                  Aproximadamente 1 token = 0.75 palavras. 4000 tokens ≈ 3000 palavras.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acoes_pos_analise">Ação Após Análise</Label>
                <Select value={formData.acoes_pos_analise} onValueChange={(value) => setFormData({ ...formData, acoes_pos_analise: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gerar_documento">Gerar Documento Final</SelectItem>
                    <SelectItem value="enviar_revisao">Enviar para Revisão</SelectItem>
                    <SelectItem value="salvar_rascunho">Salvar como Rascunho</SelectItem>
                    <SelectItem value="notificar_usuario">Notificar Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">✅ Ativo</SelectItem>
                    <SelectItem value="em_treinamento">🔄 Em Treinamento</SelectItem>
                    <SelectItem value="inativo">⏸️ Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
              disabled={createAgenteMutation.isPending}
            >
              {createAgenteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Criar Agente
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}