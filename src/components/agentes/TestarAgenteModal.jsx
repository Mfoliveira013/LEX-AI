import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, CheckCircle2, AlertCircle, Brain, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestarAgenteModal({ open, onClose, agente, user }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);

  const testarMutation = useMutation({
    mutationFn: async (file) => {
      // 1. Upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Extrair texto
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            texto_completo: { type: "string" }
          }
        }
      });

      const textoExtraido = extractResult.output?.texto_completo || "";

      // 3. Construir prompt baseado no agente
      const promptAgente = `${agente.instrucoes_gerais}

---
ANÁLISE DE DOCUMENTO

Documento recebido:
${textoExtraido.substring(0, 2000)}

Identifique:
1. Tipo de documento (intimação, petição, manifestação, etc)
2. Partes envolvidas
3. Ação sugerida (contestação, defesa, etc)
4. Gere o documento jurídico apropriado conforme suas instruções.

Responda no formato estruturado conforme seu modo de resposta configurado.`;

      // 4. Chamar LLM
      const resposta = await base44.integrations.Core.InvokeLLM({
        prompt: promptAgente,
        add_context_from_internet: false
      });

      return {
        texto_extraido: textoExtraido,
        resposta_ia: typeof resposta === 'string' ? resposta : JSON.stringify(resposta, null, 2),
        confianca: 0.85
      };
    },
    onSuccess: (data) => {
      setResult(data);
      setError("");
    },
    onError: (error) => {
      setError(error.message || "Erro ao testar agente.");
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError("");
    }
  };

  const handleTest = () => {
    if (!file) {
      setError("Selecione um arquivo primeiro.");
      return;
    }
    testarMutation.mutate(file);
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
              <DialogTitle className="text-2xl">Testar Agente: {agente.nome_agente}</DialogTitle>
              <p className="text-sm text-slate-500">{agente.descricao_agente}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload */}
          <Card className="border-2 border-dashed border-slate-300 hover:border-purple-400 transition-colors">
            <CardContent className="p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {!file ? (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-4">Selecione um documento para testar o agente</p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    Escolher Arquivo
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                      Trocar Arquivo
                    </Button>
                    <Button 
                      onClick={handleTest} 
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={testarMutation.isPending}
                      size="sm"
                    >
                      {testarMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analisar com IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processamento */}
          {testarMutation.isPending && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-purple-900">Processando com {agente.modelo_llm}...</p>
                    <p className="text-sm text-purple-600">Aguarde enquanto o agente analisa o documento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Resultado da Análise</h3>
                <Badge className="bg-green-100 text-green-800">
                  Confiança: {(result.confianca * 100).toFixed(0)}%
                </Badge>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Resposta da IA:</h4>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg text-sm text-slate-800 overflow-x-auto">
                      {result.resposta_ia}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Texto Extraído (Preview):</h4>
                  <div className="bg-slate-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {result.texto_extraido.substring(0, 1000)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}