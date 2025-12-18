import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, CheckCircle2, AlertCircle, FileText, AlertTriangle, ArrowRight, X, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AnaliseEstrategicaPreview({ analise, documentoId, agente, user, temPecaGerada, onContinuar, onClose }) {
  const queryClient = useQueryClient();

  const gerarPecaMutation = useMutation({
    mutationFn: async () => {
      // Construir prompt para geração da peça
      const promptGeracao = `${agente?.instrucoes_gerais || 'Você é advogado especializado em peças processuais.'}

GERE UMA PEÇA PROCESSUAL COMPLETA E PROFISSIONAL

CONTEXTO DA ANÁLISE:
- Tipo de Documento: ${analise.tipo_documento}
- Ação Recomendada: ${analise.acao_recomendada}
- Lado do Processo: ${analise.lado_processo === 'ativo' ? 'Ativo (Propositura de Ação)' : 'Passivo (Defesa)'}
- Autor: ${analise.autor || 'A definir'}
- Réu: ${analise.reu || 'A definir'}
- Nº Processo: ${analise.numero_processo || 'Não distribuído'}
- Valor da Causa: ${analise.valor_causa ? `R$ ${analise.valor_causa.toLocaleString('pt-BR')}` : 'Não informado'}
- Fundamentação Legal: ${analise.fundamentacao_legal}
- Observações: ${analise.observacoes}

ESTRUTURA OBRIGATÓRIA DA PEÇA:

1. CABEÇALHO FORMAL
   EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE __________

2. QUALIFICAÇÃO DAS PARTES
   [Autor/Requerente]: [nome completo], [qualificação]
   [Réu/Requerido]: [nome completo], [qualificação]

3. DOS FATOS
   [Narrativa objetiva, clara e cronológica dos fatos]

4. DO DIREITO
   [Fundamentação jurídica com citação de artigos de lei]
   - ${analise.fundamentacao_legal}
   - Código de Processo Civil (CPC)
   - Código Civil (CC)
   - Código de Defesa do Consumidor (CDC) quando aplicável

5. DOS PEDIDOS
   [Lista clara e objetiva dos pedidos]
   a) [pedido principal]
   b) [pedidos subsidiários]
   c) Seja a presente julgada procedente
   d) Condenação do réu ao pagamento de custas e honorários

6. VALOR DA CAUSA
   Dá-se à causa o valor de R$ ${analise.valor_causa ? analise.valor_causa.toLocaleString('pt-BR') : '0,00'} (extenso)

7. REQUERIMENTOS FINAIS
   Requer-se:
   - Citação do réu
   - Produção de provas
   - Procedência dos pedidos

8. ENCERRAMENTO
   Termos em que,
   Pede deferimento.

   [Local], [data].

   _______________________________
   [Nome do Advogado]
   OAB/[UF] nº [número]

IMPORTANTE:
- Use linguagem técnica e formal
- Cite artigos de lei específicos
- Seja claro, objetivo e fundamentado
- Inclua todos os elementos obrigatórios
- Adapte o tom conforme configurado: ${agente?.personalidade_ia?.tom_linguagem || 'formal_juridico'}`;

      // Gerar texto da peça
      const textoPeca = await base44.integrations.Core.InvokeLLM({
        prompt: promptGeracao,
        add_context_from_internet: false
      });

      // Calcular prazo
      const hoje = new Date();
      const prazoDate = new Date(hoje);
      prazoDate.setDate(prazoDate.getDate() + (analise.prazo_resposta_dias || 15));

      // Criar peça processual
      const peca = await base44.entities.PecaProcessual.create({
        cnpj_escritorio: user.cnpj_escritorio,
        documento_origem_id: documentoId,
        tipo_peca: analise.tipo_peca_sugerida || 'defesa',
        titulo: `${(analise.tipo_peca_sugerida || 'defesa').toUpperCase()} - ${analise.acao_recomendada}`,
        conteudo_texto: typeof textoPeca === 'string' ? textoPeca : JSON.stringify(textoPeca),
        conteudo_html: `<div class="peca-juridica">${typeof textoPeca === 'string' ? textoPeca.replace(/\n/g, '<br/>') : JSON.stringify(textoPeca)}</div>`,
        status: "rascunho",
        gerado_por_ia: true,
        prazo_legal: prazoDate.toISOString().split('T')[0],
        agente_utilizado: agente ? agente.nome_agente : "Agente Padrão",
        modelo_llm_usado: agente ? agente.modelo_llm : "gpt-4-turbo",
        fundamentos_legais: [{
          lei: "Fundamentação Legal",
          descricao: analise.fundamentacao_legal
        }],
        observacoes: analise.observacoes
      });

      // Atualizar documento com a peça gerada
      await base44.entities.Documento.update(documentoId, {
        peca_gerada_id: peca.id
      });

      // Atualizar métricas do agente
      if (agente) {
        await base44.entities.AgenteLLM.update(agente.id, {
          total_execucoes: (agente.total_execucoes || 0) + 1,
          ultima_execucao: new Date().toISOString(),
          metricas: {
            ...agente.metricas,
            pecas_geradas: (agente.metricas?.pecas_geradas || 0) + 1
          }
        });
      }

      return peca;
    },
    onSuccess: (peca) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      onContinuar(peca);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-xl border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Scale className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Análise Estratégica Processual</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Relatório completo da viabilidade jurídica
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Identificação do Documento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Identificação Documental</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Tipo:</span>
                    <p className="font-semibold text-slate-900">{analise.tipo_documento}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Classificação:</span>
                    <p className="font-semibold text-slate-900">{analise.classificacao}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contexto Jurídico */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2">Contexto Jurídico</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Situação:</span>
                    <p className="font-semibold text-slate-900">{analise.contexto_juridico}</p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <span className="text-slate-600">Lado do Processo:</span>
                      <Badge className={`ml-2 ${analise.lado_processo === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {analise.lado_processo === 'ativo' ? 'Ativo (Defesa)' : 'Passivo (Defesa)'}
                      </Badge>
                    </div>
                  </div>
                  {analise.numero_processo && (
                    <div>
                      <span className="text-slate-600">Nº Processo:</span>
                      <p className="font-mono text-slate-900">{analise.numero_processo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suficiência Documental */}
          <div className={`border rounded-lg p-4 ${analise.documentacao_suficiente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {analise.documentacao_suficiente ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${analise.documentacao_suficiente ? 'text-green-900' : 'text-red-900'}`}>
                  Suficiência Documental
                </h4>
                <p className="text-sm text-slate-700 mb-2">
                  {analise.documentacao_suficiente 
                    ? "✅ Documentação suficiente para prosseguir com a ação."
                    : "⚠️ Documentação incompleta. Verificar pendências abaixo."}
                </p>
                {!analise.documentacao_suficiente && analise.documentos_faltantes && analise.documentos_faltantes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-red-800 mb-1">Documentos Faltantes:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {analise.documentos_faltantes.map((doc, index) => (
                        <li key={index}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direcionamento Processual */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-indigo-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900 mb-2">Direcionamento Processual</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Ação Recomendada:</span>
                    <p className="font-semibold text-lg text-indigo-900">{analise.acao_recomendada}</p>
                  </div>
                  {analise.tipo_peca_sugerida && analise.tipo_peca_sugerida !== "nenhuma" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-600">Peça a ser Gerada:</span>
                      <Badge className="bg-indigo-600 text-white">
                        {analise.tipo_peca_sugerida.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Observações Técnicas */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Observações Técnicas</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{analise.observacoes}</p>
            {analise.fundamentacao_legal && (
              <div className="mt-3 pt-3 border-t border-slate-300">
                <p className="text-xs font-semibold text-slate-600 mb-1">Fundamentação Legal:</p>
                <p className="text-sm text-slate-700">{analise.fundamentacao_legal}</p>
              </div>
            )}
          </div>

          {/* Métricas */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analise.nivel_confianca}</p>
              <p className="text-xs text-slate-600">Confiança da Análise</p>
            </div>
            {analise.prazo_resposta_dias && (
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{analise.prazo_resposta_dias}d</p>
                <p className="text-xs text-slate-600">Prazo Legal</p>
              </div>
            )}
            {analise.valor_causa && analise.valor_causa > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analise.valor_causa)}
                </p>
                <p className="text-xs text-slate-600">Valor da Causa</p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            
            <div className="flex gap-2">
              {analise.tipo_peca_sugerida && analise.tipo_peca_sugerida !== "nenhuma" && !temPecaGerada && (
                <Button 
                  onClick={() => gerarPecaMutation.mutate()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  disabled={gerarPecaMutation.isPending}
                >
                  {gerarPecaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando Peça...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      GERAR
                    </>
                  )}
                </Button>
              )}
              
              {temPecaGerada && (
                <Button 
                  onClick={() => onContinuar()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Ver Peça Gerada
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}