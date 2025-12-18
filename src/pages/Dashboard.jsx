
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, TrendingUp, Clock, Users, CheckCircle, FolderOpen, Brain } from "lucide-react"; // Added Brain icon, removed DollarSign
import { format, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import StatsCard from "../components/dashboard/StatsCard";
import CasosList from "../components/dashboard/CasosList";
import PrazosWidget from "../components/dashboard/PrazosWidget";
import AtividadeRecente from "../components/dashboard/AtividadeRecente";

export default function Dashboard() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: casos = [] } = useQuery({
    queryKey: ['casos'],
    queryFn: () => base44.entities.Caso.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos'],
    queryFn: () => base44.entities.Documento.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: minutas = [] } = useQuery({
    queryKey: ['minutas'],
    queryFn: () => base44.entities.Minuta.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => base44.entities.AgenteLLM.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const casosAtivos = casos.filter(c => ['em_analise', 'em_andamento', 'aguardando_resposta'].includes(c.status));
  const casosComPrazo = casos.filter(c => c.prazo_proximo);
  const prazosUrgentes = casosComPrazo.filter(c => {
    const prazo = new Date(c.prazo_proximo);
    const hoje = new Date();
    return isAfter(addDays(hoje, 7), prazo);
  });
  const valorTotalCausas = casos.reduce((sum, c) => sum + (c.valor_causa || 0), 0);
  const minutasEmRevisao = minutas.filter(m => m.status === 'em_revisao').length;
  
  const agentesAtivos = agentes.filter(a => a.status === 'ativo').length;
  const totalAnalisesIA = agentes.reduce((sum, a) => sum + (a.total_execucoes || 0), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Visão geral do escritório - {user.cnpj_escritorio}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Casos Ativos"
          value={casosAtivos.length}
          icon={FolderOpen}
          trend={`${casos.length} total`}
          color="blue"
        />
        <StatsCard
          title="Prazos Urgentes"
          value={prazosUrgentes.length}
          icon={AlertCircle}
          trend="Próximos 7 dias"
          color="red"
        />
        <StatsCard
          title="Agentes de IA Ativos"
          value={agentesAtivos}
          icon={Brain}
          trend={`${totalAnalisesIA} análises`}
          color="purple"
        />
        <StatsCard
          title="Minutas em Revisão"
          value={minutasEmRevisao}
          icon={FileText}
          trend={`${minutas.length} total`}
          color="amber"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CasosList casos={casosAtivos.slice(0, 5)} />
          <AtividadeRecente cnpjEscritorio={user.cnpj_escritorio} />
        </div>

        <div className="space-y-6">
          <PrazosWidget casos={prazosUrgentes} />
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Métricas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Documentos Processados</span>
                <span className="font-semibold text-slate-900">{documentos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Análises de IA</span>
                <span className="font-semibold text-purple-600">{totalAnalisesIA}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Minutas Geradas</span>
                <span className="font-semibold text-slate-900">{minutas.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Taxa de Aprovação</span>
                <span className="font-semibold text-green-600">
                  {minutas.length > 0 ? Math.round((minutas.filter(m => m.status === 'aprovada').length / minutas.length) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
