import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  FolderTree, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download,
  Loader2,
  Brain,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import FileUploadZone from "../components/upload/FileUploadZone";

const setorLabels = {
  juridico: "Jurídico",
  administrativo: "Administrativo",
  financeiro: "Financeiro",
  recursos_humanos: "Recursos Humanos",
  controldesk: "Controldesk",
  mis: "M.I.S (Gestão da Informação)",
  negociacao: "Negociação"
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

export default function OrganizarDocumentos() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documentosOrganizados = [] } = useQuery({
    queryKey: ['documentos-organizados', user?.cnpj_escritorio],
    queryFn: () => base44.entities.DocumentoOrganizado.filter({ 
      cnpj_escritorio: user?.cnpj_escritorio 
    }, '-created_date', 20),
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

  const organizarMutation = useMutation({
    mutationFn: async (arquivos) => {
      const resultadosProcessamento = [];
      const tempoInicio = Date.now();

      for (let i = 0; i < arquivos.length; i++) {
        const file = arquivos[i];
        setProgresso(((i + 1) / arquivos.length) * 100);

        // 1. Upload do arquivo
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // 2. Criar registro inicial
        const docOrganizado = await base44.entities.DocumentoOrganizado.create({
          cnpj_escritorio: user.cnpj_escritorio,
          nome_arquivo_original: file.name,
          nome_arquivo_organizado: file.name,
          tipo_documento: "outros",
          setor_destino: "juridico",
          paginas_originais: 1,
          paginas_corrigidas: 1,
          url_arquivo_original: file_url,
          url_arquivo_organizado: file_url,
          status: "processando",
          agente_responsavel: agentes.length > 0 ? agentes[0].nome_agente : "IA Documentista"
        });

        // 3. Extrair texto do documento
        const schemaExtracao = {
          type: "object",
          properties: {
            texto_completo: { type: "string" },
            numero_paginas: { type: "integer" }
          }
        };

        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: schemaExtracao
        });

        const textoExtraido = extractResult.output?.texto_completo || "";
        const numeroPaginas = extractResult.output?.numero_paginas || 1;

        // 4. Análise da IA Documentista
        const promptDocumentista = `Você é uma IA Documentista da LexDoc AI.
Sua função é organizar documentos PDF desordenados, corrigindo a ordem lógica das páginas e separando os documentos distintos.

DOCUMENTO RECEBIDO:
${textoExtraido.substring(0, 5000)}

ANÁLISE REQUERIDA:
1. Identifique o tipo de documento (procuração, contrato, defesa, petição inicial, comprovante, etc.)
2. Determine o setor de destino mais adequado
3. Identifique se há múltiplos documentos misturados
4. Sugira reorganização de páginas se necessário
5. Extraia partes e informações relevantes (autor, réu, processo)
6. Sugira palavras-chave para indexação

Retorne APENAS um JSON estruturado:
{
  "tipo_documento": "procuracao|contrato|defesa|peticao_inicial|comprovante_pagamento|recibo|termo_adesao|intimacao|sentenca|despacho|recurso|outros",
  "setor_destino": "juridico|administrativo|financeiro|recursos_humanos|controldesk|mis|negociacao",
  "paginas_reordenadas": boolean,
  "documentos_separados": ["doc1.pdf", "doc2.pdf"],
  "observacoes": "string detalhada",
  "partes_identificadas": {
    "autor": "string",
    "reu": "string",
    "numero_processo": "string"
  },
  "palavras_chave": ["palavra1", "palavra2"],
  "nome_sugerido": "nome_arquivo_organizado.pdf",
  "caminho_pasta_sugerido": "Juridico/Defesa"
}`;

        const analiseIA = await base44.integrations.Core.InvokeLLM({
          prompt: promptDocumentista,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              tipo_documento: { type: "string" },
              setor_destino: { type: "string" },
              paginas_reordenadas: { type: "boolean" },
              documentos_separados: { type: "array", items: { type: "string" } },
              observacoes: { type: "string" },
              partes_identificadas: {
                type: "object",
                properties: {
                  autor: { type: "string" },
                  reu: { type: "string" },
                  numero_processo: { type: "string" }
                }
              },
              palavras_chave: { type: "array", items: { type: "string" } },
              nome_sugerido: { type: "string" },
              caminho_pasta_sugerido: { type: "string" }
            }
          }
        });

        // 5. Atualizar documento com resultados
        const tempoProcessamento = (Date.now() - tempoInicio) / 1000;

        await base44.entities.DocumentoOrganizado.update(docOrganizado.id, {
          nome_arquivo_organizado: analiseIA.nome_sugerido || file.name,
          tipo_documento: analiseIA.tipo_documento || "outros",
          setor_destino: analiseIA.setor_destino || "juridico",
          paginas_originais: numeroPaginas,
          paginas_corrigidas: numeroPaginas,
          documentos_extraidos: analiseIA.documentos_separados?.length || 1,
          caminho_pasta: analiseIA.caminho_pasta_sugerido || "Documentos/Gerais",
          status: "organizado",
          observacoes: analiseIA.observacoes,
          tempo_processamento_segundos: tempoProcessamento,
          metadados_ia: {
            paginas_reordenadas: analiseIA.paginas_reordenadas || false,
            documentos_separados: analiseIA.documentos_separados || [],
            palavras_chave: analiseIA.palavras_chave || [],
            partes_identificadas: analiseIA.partes_identificadas || {}
          }
        });

        resultadosProcessamento.push({
          ...docOrganizado,
          ...analiseIA,
          status: "organizado"
        });
      }

      return resultadosProcessamento;
    },
    onSuccess: (resultados) => {
      setResultados(resultados);
      setProcessando(false);
      setProgresso(0);
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['documentos-organizados'] });
    },
    onError: (error) => {
      setErro(error.message || "Erro ao processar documentos");
      setProcessando(false);
      setProgresso(0);
    }
  });

  const handleOrganizar = () => {
    if (files.length === 0) {
      setErro("Selecione pelo menos um arquivo para organizar");
      return;
    }

    setErro("");
    setResultados([]);
    setProcessando(true);
    organizarMutation.mutate(files);
  };

  const handleDownload = async (doc) => {
    window.open(doc.url_arquivo_organizado, '_blank');
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <FolderTree className="w-8 h-8 text-purple-600" />
          Organizar Documentos
        </h1>
        <p className="text-slate-600">
          Envie documentos desorganizados e deixe a IA reorganizar, separar e classificar automaticamente
        </p>
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Upload e Processamento */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-900" />
                Upload de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FileUploadZone
                onFilesSelected={setFiles}
                selectedFiles={files}
                onRemoveFile={(index) => setFiles(files.filter((_, i) => i !== index))}
              />

              {files.length > 0 && !processando && (
                <Button
                  onClick={handleOrganizar}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Organizar com IA
                </Button>
              )}

              {processando && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando documentos...
                    </span>
                    <span>{Math.round(progresso)}%</span>
                  </div>
                  <Progress value={progresso} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados do Processamento */}
          {resultados.length > 0 && (
            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="w-5 h-5" />
                  Documentos Organizados ({resultados.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {resultados.map((resultado, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {resultado.nome_sugerido || resultado.nome_arquivo_organizado}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-purple-100 text-purple-800">
                            {tipoDocumentoLabels[resultado.tipo_documento]}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {setorLabels[resultado.setor_destino]}
                          </Badge>
                          {resultado.documentos_extraidos > 1 && (
                            <Badge variant="outline">
                              {resultado.documentos_extraidos} documentos separados
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resultado)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                    </div>

                    <div className="text-sm text-slate-600 space-y-2">
                      <p>
                        <strong>Pasta:</strong> {resultado.caminho_pasta_sugerido || resultado.caminho_pasta}
                      </p>
                      {resultado.observacoes && (
                        <p>
                          <strong>Observações:</strong> {resultado.observacoes}
                        </p>
                      )}
                      {resultado.partes_identificadas && (
                        <div className="grid md:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
                          {resultado.partes_identificadas.autor && (
                            <p><strong>Autor:</strong> {resultado.partes_identificadas.autor}</p>
                          )}
                          {resultado.partes_identificadas.reu && (
                            <p><strong>Réu:</strong> {resultado.partes_identificadas.reu}</p>
                          )}
                          {resultado.partes_identificadas.numero_processo && (
                            <p><strong>Processo:</strong> {resultado.partes_identificadas.numero_processo}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Documentos Organizados */}
          {documentosOrganizados.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Histórico Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {documentosOrganizados.slice(0, 10).map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {doc.nome_arquivo_organizado}
                          </h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline">
                              {tipoDocumentoLabels[doc.tipo_documento]}
                            </Badge>
                            <Badge variant="outline">
                              {setorLabels[doc.setor_destino]}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(doc.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
              <CardTitle className="text-lg">🤖 IA Documentista</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-900 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Análise Inteligente</h4>
                  <p className="text-sm text-slate-600">Identifica tipo e setor do documento</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-900 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Reorganização</h4>
                  <p className="text-sm text-slate-600">Corrige páginas fora de ordem</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-900 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Separação Automática</h4>
                  <p className="text-sm text-slate-600">Identifica documentos misturados</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-900 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Organização por Pastas</h4>
                  <p className="text-sm text-slate-600">Cria estrutura hierárquica automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="text-lg">📁 Setores Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2 text-sm text-slate-600">
                {Object.entries(setorLabels).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-600" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}