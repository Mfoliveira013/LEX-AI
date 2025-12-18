
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Search, Filter, Calendar, DollarSign, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import CasoCard from "../components/casos/CasoCard";
import NovoCasoModal from "../components/casos/NovoCasoModal";
import CasoDrawer from "../components/casos/CasoDrawer";

const statusColors = {
  em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
  aguardando_resposta: "bg-purple-100 text-purple-800 border-purple-200",
  concluido: "bg-green-100 text-green-800 border-green-200",
  arquivado: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function Casos() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [casoSelecionado, setCasoSelecionado] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ['casos', user?.cnpj_escritorio],
    queryFn: async () => {
      const { data } = await base44.entities.Caso.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date');
      return data;
    },
    enabled: !!user?.cnpj_escritorio,
  });

  const createCasoMutation = useMutation({
    mutationFn: (casoData) => base44.entities.Caso.create({
      ...casoData,
      cnpj_escritorio: user.cnpj_escritorio,
      advogado_responsavel: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
      setShowModal(false);
      
      // Log de auditoria
      base44.entities.LogAuditoria.create({
        cnpj_escritorio: user.cnpj_escritorio,
        usuario_email: user.email,
        usuario_nome: user.full_name,
        acao: "caso_criado",
        entidade_tipo: "Caso",
        sucesso: true
      });
    },
  });

  const deleteCasoMutation = useMutation({
    mutationFn: async (casoId) => {
      // Antes de deletar, desvincular documentos e peças
      const { data: documentos = [] } = await base44.entities.Documento.filter({ caso_id: casoId });
      const { data: pecas = [] } = await base44.entities.PecaProcessual.filter({ caso_id: casoId });

      // Desvincular documentos
      for (const doc of documentos) {
        await base44.entities.Documento.update(doc.id, { caso_id: null });
      }

      // Desvincular peças
      for (const peca of pecas) {
        await base44.entities.PecaProcessual.update(peca.id, { caso_id: null });
      }

      // Deletar caso
      await base44.entities.Caso.delete(casoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      setShowDrawer(false); // Close drawer if the selected case is deleted
      setCasoSelecionado(null);
    },
  });

  const handleDelete = (caso) => {
    if (window.confirm(`Tem certeza que deseja excluir o caso "${caso.titulo}"?\n\nOs documentos e peças vinculadas serão desvinculados, mas não serão excluídos.`)) {
      deleteCasoMutation.mutate(caso.id);
    }
  };

  const handleCasoClick = (caso) => {
    setCasoSelecionado(caso);
    setShowDrawer(true);
  };

  const filteredCasos = casos.filter(caso => {
    const matchesSearch = caso.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.numero_processo?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || caso.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Casos Jurídicos</h1>
          <p className="text-slate-600">Gerencie todos os processos do escritório</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-blue-900 hover:bg-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Caso
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar por título, cliente ou número do processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "em_andamento" ? "default" : "outline"}
                onClick={() => setFilterStatus("em_andamento")}
                size="sm"
              >
                Em Andamento
              </Button>
              <Button
                variant={filterStatus === "aguardando_resposta" ? "default" : "outline"}
                onClick={() => setFilterStatus("aguardando_resposta")}
                size="sm"
              >
                Aguardando
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Casos */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCasos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== "all" ? "Nenhum caso encontrado" : "Nenhum caso cadastrado"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "Tente ajustar os filtros de busca" 
                : "Comece criando seu primeiro caso jurídico"
              }
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button onClick={() => setShowModal(true)} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Caso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCasos.map(caso => (
            <div key={caso.id} className="relative group">
              <div onClick={() => handleCasoClick(caso)} className="cursor-pointer">
                <CasoCard caso={caso} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 text-red-600 shadow-md"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent handleCasoClick from firing
                  handleDelete(caso);
                }}
                title="Excluir caso"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <NovoCasoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(data) => createCasoMutation.mutate(data)}
        isLoading={createCasoMutation.isPending}
      />

      <CasoDrawer
        caso={casoSelecionado}
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setCasoSelecionado(null);
        }}
        onEdit={(caso) => {
          // Aqui você pode abrir o modal de edição ou outra ação
          console.log("Editar caso:", caso);
          // Example: trigger a separate edit modal or form
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
