import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, FileText, Scale, Edit, Download, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const tipoPecaLabels = {
  contestacao: "Contestação",
  defesa: "Defesa",
  peticao_intermediaria: "Petição Intermediária",
  manifestacao: "Manifestação",
  cumprimento_sentenca: "Cumprimento de Sentença",
  recurso: "Recurso",
  agravo: "Agravo",
  embargos: "Embargos"
};

export default function PecaGeradaPreview({ peca, onClose }) {
  const navigate = useNavigate();

  const handleRevisarPeca = () => {
    navigate(createPageUrl("Minutas"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-xl border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Peça Processual Gerada com Sucesso!</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Revisão e edição disponíveis
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Informações da Peça */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {tipoPecaLabels[peca.tipo_peca] || peca.tipo_peca}
                </h4>
                <p className="text-sm text-slate-700 mb-3">{peca.titulo}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-green-100 text-green-800">
                    Gerada por IA
                  </Badge>
                  <Badge variant="outline">
                    Status: {peca.status}
                  </Badge>
                  {peca.agente_utilizado && (
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      🤖 {peca.agente_utilizado}
                    </Badge>
                  )}
                  {peca.prazo_legal && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Prazo: {new Date(peca.prazo_legal).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview do Conteúdo */}
          <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Preview da Peça
            </h4>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
              {peca.conteudo_texto.substring(0, 1500)}
              {peca.conteudo_texto.length > 1500 && "..."}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              💡 A peça foi gerada automaticamente e está pronta para revisão
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button 
                onClick={handleRevisarPeca}
                className="bg-blue-900 hover:bg-blue-800"
              >
                <Edit className="w-4 h-4 mr-2" />
                Revisar e Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}