import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, FileText, Scale, DollarSign, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalisePreview({ analise, onClose }) {
  const entidades = analise.entidades_extraidas || {};

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
                <CardTitle className="text-xl">Análise Concluída com Sucesso!</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Score de confiança: {(analise.score_confianca * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Resumo Executivo */}
          {analise.resumo_executivo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumo Executivo
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {analise.resumo_executivo}
              </p>
            </div>
          )}

          {/* Entidades Extraídas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Partes */}
            {entidades.partes && entidades.partes.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Partes Envolvidas
                </h4>
                <div className="space-y-2">
                  {entidades.partes.map((parte, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-50">
                        {parte.tipo}
                      </Badge>
                      <span className="text-sm text-slate-700">{parte.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valores */}
            {entidades.valores && entidades.valores.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Valores Identificados
                </h4>
                <div className="space-y-2">
                  {entidades.valores.map((valor, idx) => (
                    <div key={idx}>
                      <p className="text-lg font-bold text-green-600">
                        R$ {valor.valor?.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-600">{valor.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Datas */}
            {entidades.datas_importantes && entidades.datas_importantes.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Datas Importantes
                </h4>
                <div className="space-y-2">
                  {entidades.datas_importantes.map((data, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{data.evento}</span>
                      <Badge variant="outline">{data.data}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fundamentos Jurídicos */}
            {entidades.fundamentos_juridicos && entidades.fundamentos_juridicos.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Fundamentos Jurídicos
                </h4>
                <div className="space-y-2">
                  {entidades.fundamentos_juridicos.map((fund, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium text-slate-900">
                        {fund.lei} - Art. {fund.artigo}
                      </p>
                      <p className="text-xs text-slate-600">{fund.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button className="bg-blue-900 hover:bg-blue-800">
              <FileText className="w-4 h-4 mr-2" />
              Gerar Minuta
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}