import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Clock, Eye, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800",
  processando: "bg-blue-100 text-blue-800",
  concluido: "bg-green-100 text-green-800",
  erro: "bg-red-100 text-red-800"
};

export default function DocumentosList({ documentos }) {
  const queryClient = useQueryClient();

  const deleteDocumentoMutation = useMutation({
    mutationFn: (documentoId) => base44.entities.Documento.delete(documentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
  });

  const handleDelete = (documento) => {
    if (window.confirm(`Tem certeza que deseja excluir "${documento.nome_arquivo}"?`)) {
      deleteDocumentoMutation.mutate(documento.id);
    }
  };

  const handleView = (documento) => {
    // Abrir documento em modal ou nova aba
    window.open(documento.url_arquivo, '_blank');
  };

  const handleDownload = async (documento) => {
    try {
      const response = await fetch(documento.url_arquivo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('Erro ao baixar documento. Tente novamente.');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-900" />
          Documentos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {documentos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Nenhum documento enviado ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documentos.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{doc.nome_arquivo}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={statusColors[doc.status_processamento]}>
                          {doc.status_processamento}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {(doc.tamanho_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(doc)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Visualizar documento"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Baixar documento"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir documento"
                      disabled={deleteDocumentoMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                  <Clock className="w-3 h-3" />
                  {format(new Date(doc.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}