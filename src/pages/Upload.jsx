
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle2, Loader2, Brain } from "lucide-react";

import FileUploadZone from "../components/upload/FileUploadZone";
import DocumentosList from "../components/upload/DocumentosList";
import ProcessingStatusLLM from "../components/upload/ProcessingStatusLLM";
import PecaGeradaPreview from "../components/upload/PecaGeradaPreview";
import AnaliseEstrategicaPreview from "../components/upload/AnaliseEstrategicaPreview";

export default function Upload() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [casoSelecionado, setCasoSelecionado] = useState(null);
  const [agenteSelecionado, setAgenteSelecionado] = useState(null);
  const [currentPeca, setCurrentPeca] = useState(null);
  const [analiseEstrategica, setAnaliseEstrategica] = useState(null);
  const [documentoAtual, setDocumentoAtual] = useState(null); // Added state for the current document
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: casos = [] } = useQuery({
    queryKey: ['casos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Caso.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes', user?.cnpj_escritorio],
    queryFn: () => base44.entities.AgenteLLM.filter({ 
      cnpj_escritorio: user?.cnpj_escritorio,
      status: 'ativo'
    }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Documento.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date', 20),
    enabled: !!user?.cnpj_escritorio,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, casoId, agenteId }) => {
      // 1. Buscar configurações do agente (se selecionado)
      const agente = agenteId ? agentes.find(a => a.id === agenteId) : null;

      // 2. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 3. Determinar formato
      const fileName = file.name.toLowerCase();
      let formato = 'pdf';
      
      if (fileName.endsWith('.pdf')) formato = 'pdf';
      else if (fileName.endsWith('.docx')) formato = 'docx';
      else if (fileName.endsWith('.doc')) formato = 'doc';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) formato = 'jpg';
      else if (fileName.endsWith('.png')) formato = 'png';

      // 4. Criar documento
      const documento = await base44.entities.Documento.create({
        cnpj_escritorio: user.cnpj_escritorio,
        caso_id: casoId || null,
        nome_arquivo: file.name,
        tipo_documento: "outros",
        url_arquivo: file_url,
        tamanho_bytes: file.size,
        formato: formato,
        status_processamento: "processando_ocr",
        numero_paginas: 1
      });

      // 5. Extrair texto via OCR/processamento inteligente
      let textoExtraido = "";
      
      try {
        // Para todos os formatos, usar ExtractDataFromUploadedFile que suporta PDF, DOCX, DOC, JPG, PNG
        const schemaExtracao = {
          type: "object",
          properties: {
            texto_completo: { type: "string" }
          }
        };

        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: schemaExtracao
        });

        textoExtraido = extractResult.output?.texto_completo || "";
      } catch (error) {
        console.error('Erro na extração:', error);
        textoExtraido = "Não foi possível extrair texto do documento.";
      }

      // 6. ANÁLISE ESTRATÉGICA PROCESSUAL
      const promptEstrategico = `${agente?.instrucoes_gerais || 'Você é um Agente Jurídico de Estratégia Processual especializado em interpretação documental, análise de viabilidade e direcionamento processual.'}

DOCUMENTO RECEBIDO (Formato: ${formato.toUpperCase()}):
${textoExtraido.substring(0, 4000)}

TAREFA:
1. Identifique o tipo de documento (petição inicial, contestação, contrato, CCB, termo de adesão, notificação, etc.)
2. Classifique em pasta temática (Provas, Contratos, Defesas, Cálculos, Ofícios)
3. Analise o contexto jurídico (ação revisional, cobrança, monitória, execução, defesa, etc.)
4. Determine o lado do escritório: ativo (propositura) ou passivo (defesa)
5. Verifique suficiência documental (há contrato? cálculo? assinatura? procuração?)
6. Liste documentos faltantes (se houver)
7. Defina ação recomendada
8. Identifique riscos ou inconsistências

ATENÇÃO: Se o documento for uma imagem (JPG/PNG), analise visualmente o conteúdo extraído e identifique elementos textuais, assinaturas, carimbos e informações relevantes.

Retorne APENAS um JSON estruturado:
{
  "tipo_documento": "string",
  "classificacao": "string",
  "contexto_juridico": "string",
  "lado_processo": "ativo|passivo",
  "documentacao_suficiente": boolean,
  "documentos_faltantes": ["string"],
  "acao_recomendada": "string",
  "tipo_peca_sugerida": "contestacao|defesa|peticao_inicial|recurso|manifestacao|nenhuma",
  "observacoes": "string detalhada",
  "nivel_confianca": "string",
  "autor": "string",
  "reu": "string",
  "numero_processo": "string",
  "valor_causa": 0,
  "prazo_resposta_dias": 15,
  "fundamentacao_legal": "string"
}`;

      const analiseEstrategica = await base44.integrations.Core.InvokeLLM({
        prompt: promptEstrategico,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            tipo_documento: { type: "string" },
            classificacao: { type: "string" },
            contexto_juridico: { type: "string" },
            lado_processo: { type: "string" },
            documentacao_suficiente: { type: "boolean" },
            documentos_faltantes: { type: "array", items: { type: "string" } },
            acao_recomendada: { type: "string" },
            tipo_peca_sugerida: { type: "string" },
            observacoes: { type: "string" },
            nivel_confianca: { type: "string" },
            autor: { type: "string" },
            reu: { type: "string" },
            numero_processo: { type: "string" },
            valor_causa: { type: "number" },
            prazo_resposta_dias: { type: "integer" },
            fundamentacao_legal: { type: "string" }
          }
        }
      });

      // Update agent metrics for analysis (only counting analysis part here)
      if (agente) {
        await base44.entities.AgenteLLM.update(agenteId, {
          total_execucoes: (agente.total_execucoes || 0) + 1, // Increment for analysis LLM call
          ultima_execucao: new Date().toISOString(),
          metricas: {
            ...agente.metricas,
            documentos_analisados: (agente.metricas?.documentos_analisados || 0) + 1,
          }
        });
      }

      // 7. Atualizar documento com a análise estratégica (SEM gerar peça ainda)
      await base44.entities.Documento.update(documento.id, {
        tipo_documento: analiseEstrategica.tipo_documento,
        contexto_extraido: {
          tipo_documento: analiseEstrategica.tipo_documento,
          classificacao: analiseEstrategica.classificacao,
          contexto_juridico: analiseEstrategica.contexto_juridico,
          lado_processo: analiseEstrategica.lado_processo,
          autor: analiseEstrategica.autor,
          reu: analiseEstrategica.reu,
          numero_processo: analiseEstrategica.numero_processo,
          valor_causa: analiseEstrategica.valor_causa,
          analisado_por_agente: agente ? agente.nome_agente : "Agente Padrão",
          modelo_usado: agente ? agente.modelo_llm : "gpt-4-turbo"
        },
        texto_extraido: textoExtraido,
        analise_llm: JSON.stringify(analiseEstrategica),
        tipo_sugestao_peca: analiseEstrategica.tipo_peca_sugerida, // Keep suggestion
        status_processamento: "concluido"
      });

      return { documento, analiseEstrategica, agente };
    },
    onSuccess: ({ documento, analiseEstrategica: analise, agente }) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['agentes'] }); // Invalidate for agent metrics update
      
      // Salvar documento e agente para uso posterior
      setDocumentoAtual(documento);
      
      // Exibir análise estratégica
      setAnaliseEstrategica(analise);
      
      setFiles([]);
      setUploadError("");
      setCurrentPeca(null); // Clear any previously generated piece
    },
    onError: (error) => {
      console.error('Erro no upload:', error);
      setUploadError(error.message || "Erro ao processar documento.");
    }
  });

  const generatePecaMutation = useMutation({
    mutationFn: async ({ docId, analiseData, agenteData, userData }) => {
      // 1. Calcular prazo
      const hoje = new Date();
      const prazoDate = new Date(hoje);
      prazoDate.setDate(prazoDate.getDate() + (analiseData.prazo_resposta_dias || 15));

      // 2. Gerar peça processual se recomendado e documentação suficiente
      let pecaGerada = null;
      if (analiseData.tipo_peca_sugerida && 
          analiseData.tipo_peca_sugerida !== "nenhuma" && 
          analiseData.documentacao_suficiente) {
        
        const promptGeracao = `${agenteData?.instrucoes_gerais || 'Você é advogado especializado.'}

Com base na análise estratégica, gere uma ${analiseData.tipo_peca_sugerida} profissional.

CONTEXTO:
- Tipo de ação: ${analiseData.acao_recomendada}
- Lado do processo: ${analiseData.lado_processo}
- Autor: ${analiseData.autor || 'A definir'}
- Réu: ${analiseData.reu || 'A definir'}
- Processo: ${analiseData.numero_processo || 'Não informado'}
- Fundamentação: ${analiseData.fundamentacao_legal}
- Observações: ${analiseData.observacoes}

ESTRUTURA OBRIGATÓRIA:
1. Cabeçalho formal (EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO...)
2. Identificação das partes
3. DOS FATOS (objetivo e claro)
4. DO DIREITO (com artigos de lei aplicáveis)
5. DOS PEDIDOS
6. "Termos em que, pede deferimento."
7. Local, data e "Assinatura do Advogado"

Tom: ${agenteData?.personalidade_ia?.tom_linguagem || 'formal_juridico'}
Seja técnico, objetivo e fundamentado.`;

        const textoPeca = await base44.integrations.Core.InvokeLLM({
          prompt: promptGeracao,
          add_context_from_internet: false
        });

        pecaGerada = await base44.entities.PecaProcessual.create({
          cnpj_escritorio: userData.cnpj_escritorio,
          documento_origem_id: docId,
          caso_id: casoSelecionado || null,
          tipo_peca: analiseData.tipo_peca_sugerida,
          titulo: `${analiseData.tipo_peca_sugerida.toUpperCase()} - ${analiseData.acao_recomendada}`,
          conteudo_texto: typeof textoPeca === 'string' ? textoPeca : JSON.stringify(textoPeca),
          conteudo_html: `<div class="peca-juridica">${typeof textoPeca === 'string' ? textoPeca.replace(/\n/g, '<br/>') : JSON.stringify(textoPeca)}</div>`,
          status: "rascunho",
          gerado_por_ia: true,
          prazo_legal: prazoDate.toISOString().split('T')[0],
          agente_utilizado: agenteData ? agenteData.nome_agente : "Agente Padrão",
          modelo_llm_usado: agenteData ? agenteData.modelo_llm : "gpt-4-turbo"
        });

        // Atualizar métricas do agente para geração de peça
        if (agenteData) {
          await base44.entities.AgenteLLM.update(agenteData.id, {
            total_execucoes: (agenteData.total_execucoes || 0) + 1, // Increment for piece generation LLM call
            ultima_execucao: new Date().toISOString(),
            metricas: {
              ...agenteData.metricas,
              pecas_geradas: (agenteData.metricas?.pecas_geradas || 0) + 1
            }
          });
        }
      }

      // 3. Atualizar documento com a peça gerada
      if (docId) {
        await base44.entities.Documento.update(docId, {
          peca_gerada_id: pecaGerada?.id || null,
          // Re-update contexto_extraido to include prazo_resposta which is now calculated
          contexto_extraido: {
            ...analiseData, // Spread the analysis data
            analisado_por_agente: agenteData ? agenteData.nome_agente : "Agente Padrão",
            modelo_usado: agenteData ? agenteData.modelo_llm : "gpt-4-turbo",
            prazo_resposta: prazoDate.toISOString().split('T')[0] // Add prazo_resposta here
          },
        });
      }

      return pecaGerada;
    },
    onSuccess: (pecaGerada) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['agentes'] }); // Invalidate for agent metrics update
      
      if (pecaGerada) {
        setCurrentPeca(pecaGerada);
        setAnaliseEstrategica(null); // Hide analysis preview once piece is generated
      }
      setUploadError("");
    },
    onError: (error) => {
      console.error('Erro ao gerar peça:', error);
      setUploadError(error.message || "Erro ao gerar peça processual.");
    }
  });


  const handleFilesSelected = (selectedFiles) => {
    setUploadError("");
    setFiles(selectedFiles);
  };

  const handleUpload = () => {
    if (files.length === 0) {
      setUploadError("Selecione ao menos um arquivo.");
      return;
    }

    setUploadError("");
    setAnaliseEstrategica(null);
    setCurrentPeca(null);
    setDocumentoAtual(null); // Clear document state before new upload
    uploadMutation.mutate({ 
      file: files[0], 
      casoId: casoSelecionado,
      agenteId: agenteSelecionado 
    });
  };

  // This function is now used to trigger the piece generation from the AnaliseEstrategicaPreview component
  const handleGeneratePeca = () => {
    if (documentoAtual && analiseEstrategica && user) {
      const selectedAgente = agentes.find(a => a.id === agenteSelecionado);
      generatePecaMutation.mutate({
        docId: documentoAtual.id,
        analiseData: analiseEstrategica,
        agenteData: selectedAgente,
        userData: user,
      });
    } else {
      setUploadError("Não foi possível gerar a peça. Informações incompletas.");
    }
  };

  // This function can simply close the strategic analysis preview
  const handleContinuarParaPeca = () => {
    setAnaliseEstrategica(null);
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload de Documentos</h1>
        <p className="text-slate-600">Análise jurídica estratégica automática com geração de peças processuais</p>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Show processing status if either mutation is pending */}
      {(uploadMutation.isPending || generatePecaMutation.isPending) && <ProcessingStatusLLM />}

      {analiseEstrategica && !uploadMutation.isPending && (
        <AnaliseEstrategicaPreview 
          analise={analiseEstrategica}
          documentoId={documentoAtual?.id}
          agente={agentes.find(a => a.id === agenteSelecionado)}
          user={user}
          temPecaGerada={!!currentPeca}
          onGeneratePeca={handleGeneratePeca} // New prop to trigger piece generation
          isGeneratingPeca={generatePecaMutation.isPending} // New prop for loading state
          onContinuar={handleContinuarParaPeca} // Now just closes the analysis preview
          onClose={() => setAnaliseEstrategica(null)}
        />
      )}

      {currentPeca && !uploadMutation.isPending && !analiseEstrategica && (
        <PecaGeradaPreview 
          peca={currentPeca}
          onClose={() => setCurrentPeca(null)}
        />
      )}

      {/* Only show upload section if no processing is pending and no previews are active */}
      {!uploadMutation.isPending && !generatePecaMutation.isPending && !currentPeca && !analiseEstrategica && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5 text-blue-900" />
                  Novo Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <FileUploadZone 
                  onFilesSelected={handleFilesSelected}
                  selectedFiles={files}
                  onRemoveFile={(index) => setFiles(files.filter((_, i) => i !== index))}
                />

                {files.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Selecione o Agente de IA
                      </Label>
                      <Select
                        value={agenteSelecionado || ""}
                        onValueChange={(value) => setAgenteSelecionado(value || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="🤖 Escolha o agente para esta análise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Agente Padrão (Estratégia Processual)</SelectItem>
                          {agentes.map(agente => (
                            <SelectItem key={agente.id} value={agente.id}>
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                {agente.nome_agente} — {agente.modelo_llm}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {agentes.length === 0 && (
                        <p className="text-xs text-amber-600">
                          💡 Nenhum agente criado. <a href="/Agentes" className="underline">Criar primeiro agente</a>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Vincular a um caso (opcional)
                      </Label>
                      <Select
                        value={casoSelecionado || ""}
                        onValueChange={(value) => setCasoSelecionado(value || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nenhum caso selecionado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Nenhum caso</SelectItem>
                          {casos.map(caso => (
                            <SelectItem key={caso.id} value={caso.id}>
                              {caso.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleUpload}
                      className="w-full bg-blue-900 hover:bg-blue-800 h-12"
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Iniciar Análise Estratégica
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <DocumentosList documentos={documentos} />
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <CardTitle className="text-lg">⚖️ Análise Estratégica Processual</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-900 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Identificação Documental</h4>
                    <p className="text-sm text-slate-600">Classifica tipo e pasta temática</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-900 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Análise de Viabilidade</h4>
                    <p className="text-sm text-slate-600">Verifica suficiência documental</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-900 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Direcionamento Processual</h4>
                    <p className="text-sm text-slate-600">Define ação recomendada</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-900 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Geração Automática</h4>
                    <p className="text-sm text-slate-600">Cria peças processuais completas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-amber-200">
              <CardHeader className="bg-amber-50 border-b border-amber-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Formatos Aceitos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span>PDF (.pdf)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Word (.docx, .doc)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>Imagens (.jpg, .jpeg, .png)</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-200">
                  Tamanho máximo: 10MB por arquivo
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>🤖 Processamento Inteligente:</strong> A IA extrai texto automaticamente de todos os formatos, incluindo documentos escaneados e imagens.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
