import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save, Loader2, Brain, Settings, Palette } from "lucide-react";

export default function EditarAgenteModal({ agente, open, onClose }) {
  const [formData, setFormData] = useState({
    nome_agente: agente.nome_agente || "",
    descricao_agente: agente.descricao_agente || "",
    instrucoes_gerais: agente.instrucoes_gerais || "",
    modelo_llm: agente.modelo_llm || "gpt-4-turbo",
    temperatura: agente.temperatura || 0.3,
    resposta_maxima_tokens: agente.resposta_maxima_tokens || 4000,
    idioma: agente.idioma || "portugues",
    ton_linguagem: agente.personalidade_ia?.tom_linguagem || "formal_juridico",
    nivel_detalhe: agente.personalidade_ia?.nivel_detalhe || "intermediario",
    modo_resposta: agente.personalidade_ia?.modo_resposta || "documento_estruturado",
    incluir_assinatura: agente.personalidade_ia?.incluir_assinatura ?? true,
    incluir_referencias_legais: agente.personalidade_ia?.incluir_referencias_legais ?? true,
    acoes_pos_analise: agente.acoes_pos_analise || "salvar_rascunho",
    status: agente.status || "ativo"
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const atualizarAgenteMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.AgenteLLM.update(agente.id, {
        nome_agente: data.nome_agente,
        descricao_agente: data.descricao_agente,
        instrucoes_gerais: data.instrucoes_gerais,
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
        status: data.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      onClose();
    },
    onError: (error) => {
      setError(error.message || "Erro ao atualizar agente. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nome_agente || !formData.instrucoes_gerais) {
      setError("Nome do agente e instruções são obrigatórios.");
      return;
    }

    atualizarAgenteMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-purple-600" />
            Editar Agente: {agente.nome_agente}
          </DialogTitle>
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
                <Brain className="w-4 h-4 mr-2" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="personalidade">
                <Palette className="w-4 h-4 mr-2" />
                Personalidade
              </TabsTrigger>
              <TabsTrigger value="avancado">
                <Settings className="w-4 h-4 mr-2" />
                Avançado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="nome_agente">Nome do Agente *</Label>
                <Input
                  id="nome_agente"
                  value={formData.nome_agente}
                  onChange={(e) => setFormData({ ...formData, nome_agente: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_agente">Descrição</Label>
                <Input
                  id="descricao_agente"
                  value={formData.descricao_agente}
                  onChange={(e) => setFormData({ ...formData, descricao_agente: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucoes_gerais">Instruções do Agente * (System Prompt)</Label>
                <Textarea
                  id="instrucoes_gerais"
                  rows={10}
                  value={formData.instrucoes_gerais}
                  onChange={(e) => setFormData({ ...formData, instrucoes_gerais: e.target.value })}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelo_llm">Modelo de IA</Label>
                  <Select value={formData.modelo_llm} onValueChange={(value) => setFormData({ ...formData, modelo_llm: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-5">GPT-5</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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
              </div>
            </TabsContent>

            <TabsContent value="personalidade" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="ton_linguagem">Tom de Linguagem</Label>
                <Select value={formData.ton_linguagem} onValueChange={(value) => setFormData({ ...formData, ton_linguagem: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal_juridico">Formal Jurídico</SelectItem>
                    <SelectItem value="tecnico_neutro">Técnico e Neutro</SelectItem>
                    <SelectItem value="amigavel_profissional">Amigável Profissional</SelectItem>
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
                    <SelectItem value="resumo">Resumo (Conciso)</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="extenso">Extenso (Detalhado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="incluir_assinatura"
                    checked={formData.incluir_assinatura}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluir_assinatura: checked })}
                  />
                  <label htmlFor="incluir_assinatura" className="text-sm font-medium leading-none cursor-pointer">
                    Incluir assinatura automática do escritório
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="incluir_referencias_legais"
                    checked={formData.incluir_referencias_legais}
                    onCheckedChange={(checked) => setFormData({ ...formData, incluir_referencias_legais: checked })}
                  />
                  <label htmlFor="incluir_referencias_legais" className="text-sm font-medium leading-none cursor-pointer">
                    Incluir referências legais automáticas
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avancado" className="space-y-4 mt-6">
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
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700" 
              disabled={atualizarAgenteMutation.isPending}
            >
              {atualizarAgenteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}