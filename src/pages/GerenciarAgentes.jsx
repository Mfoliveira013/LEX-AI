import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp,
  Activity,
  FileText,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AgenteCard from "../components/agentes/AgenteCard";
import EditarAgenteModal from "../components/agentes/EditarAgenteModal";
import VisualizarAgenteDrawer from "../components/agentes/VisualizarAgenteDrawer";

const statusColors = {
  ativo: "bg-green-100 text-green-800 border-green-200",
  em_treinamento: "bg-blue-100 text-blue-800 border-blue-200",
  inativo: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function GerenciarAgentes() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agenteSelecionado, setAgenteSelecionado] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: agentes = [], isLoading } = useQuery({
    queryKey: ['agentes', user?.cnpj_escritorio],
    queryFn: () => base44.entities.AgenteLLM.filter({ 
      cnpj_escritorio: user?.cnpj_escritorio 
    }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const deleteAgenteMutation = useMutation({
    mutationFn: (agenteId) => base44.entities.AgenteLLM.delete(agenteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ agenteId, status }) => base44.entities.AgenteLLM.update(agenteId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
    },
  });

  const handleDelete = (agente) => {
    if (window.confirm(`Tem certeza que deseja excluir o agente "${agente.nome_agente}"?`)) {
      deleteAgenteMutation.mutate(agente.id);
    }
  };

  const handleEdit = (agente) => {
    setAgenteSelecionado(agente);
    setShowEditModal(true);
  };

  const handleView = (agente) => {
    setAgenteSelecionado(agente);
    setShowViewDrawer(true);
  };

  const handleToggleStatus = (agente) => {
    const newStatus = agente.status === 'ativo' ? 'inativo' : 'ativo';
    updateStatusMutation.mutate({ agenteId: agente.id, status: newStatus });
  };

  const filteredAgentes = agentes.filter(agente => {
    const matchesSearch = agente.nome_agente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agente.descricao_agente?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || agente.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const agentesAtivos = agentes.filter(a => a.status === 'ativo').length;
  const totalExecucoes = agentes.reduce((sum, a) => sum + (a.total_execucoes || 0), 0);
  const totalDocumentosAnalisados = agentes.reduce((sum, a) => sum + (a.metricas?.documentos_analisados || 0), 0);
  const totalPecasGeradas = agentes.reduce((sum, a) => sum + (a.metricas?.pecas_geradas || 0), 0);

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            Agentes de IA
          </h1>
          <p className="text-slate-600">Gerencie seus agentes de inteligência artificial</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl("Agentes"))}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Agente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Agentes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{agentesAtivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total de Execuções</p>
                <p className="text-2xl font-bold text-blue-600">{totalExecucoes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Documentos Analisados</p>
                <p className="text-2xl font-bold text-purple-600">{totalDocumentosAnalisados}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Peças Geradas</p>
                <p className="text-2xl font-bold text-amber-600">{totalPecasGeradas}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar agentes por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "ativo" ? "default" : "outline"}
                onClick={() => setStatusFilter("ativo")}
                size="sm"
                className={statusFilter === "ativo" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Ativos
              </Button>
              <Button
                variant={statusFilter === "inativo" ? "default" : "outline"}
                onClick={() => setStatusFilter("inativo")}
                size="sm"
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
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
      ) : filteredAgentes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || statusFilter !== "all" ? "Nenhum agente encontrado" : "Nenhum agente criado"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca" 
                : "Comece criando seu primeiro agente de IA"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button 
                onClick={() => navigate(createPageUrl("Agentes"))}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAgentes.map(agente => (
              <motion.div
                key={agente.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AgenteCard
                  agente={agente}
                  onView={() => handleView(agente)}
                  onEdit={() => handleEdit(agente)}
                  onDelete={() => handleDelete(agente)}
                  onToggleStatus={() => handleToggleStatus(agente)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modais */}
      {showEditModal && agenteSelecionado && (
        <EditarAgenteModal
          agente={agenteSelecionado}
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setAgenteSelecionado(null);
          }}
        />
      )}

      {showViewDrawer && agenteSelecionado && (
        <VisualizarAgenteDrawer
          agente={agenteSelecionado}
          open={showViewDrawer}
          onClose={() => {
            setShowViewDrawer(false);
            setAgenteSelecionado(null);
          }}
          onEdit={() => {
            setShowViewDrawer(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
}