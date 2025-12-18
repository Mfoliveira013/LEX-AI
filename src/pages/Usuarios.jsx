import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Mail, Phone, Shield, Trash2, Edit, CheckCircle2, X } from "lucide-react";

import NovoUsuarioModal from "../components/usuarios/NovoUsuarioModal";
import EditarUsuarioModal from "../components/usuarios/EditarUsuarioModal";

const cargoColors = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  advogado_senior: "bg-blue-100 text-blue-800 border-blue-200",
  advogado_junior: "bg-green-100 text-green-800 border-green-200",
  estagiario: "bg-gray-100 text-gray-800 border-gray-200"
};

const cargoLabels = {
  admin: "Administrador",
  advogado_senior: "Advogado Sênior",
  advogado_junior: "Advogado Júnior",
  estagiario: "Estagiário"
};

export default function Usuarios() {
  const [user, setUser] = useState(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSolicitacoes, setShowSolicitacoes] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', user?.cnpj_escritorio],
    queryFn: () => base44.entities.User.filter({ cnpj_escritorio: user?.cnpj_escritorio }, '-created_date'),
    enabled: !!user?.cnpj_escritorio,
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ['solicitacoes', user?.cnpj_escritorio],
    queryFn: () => base44.entities.SolicitacaoAcesso.filter({
      cnpj_escritorio: user?.cnpj_escritorio,
      status: "pendente"
    }, '-created_date'),
    enabled: !!user?.cnpj_escritorio && user?.cargo === 'admin',
  });

  const aprovarSolicitacaoMutation = useMutation({
    mutationFn: async (solicitacao) => {
      // Atualizar usuário com dados da empresa
      const users = await base44.entities.User.filter({ email: solicitacao.usuario_email });

      if (users.length > 0) {
        const usuario = users[0];
        await base44.entities.User.update(usuario.id, {
          cnpj_escritorio: solicitacao.cnpj_escritorio,
          cargo: solicitacao.cargo_solicitado,
          telefone: solicitacao.telefone,
          oab_numero: solicitacao.oab_numero,
          oab_uf: solicitacao.oab_uf
        });
      }

      // Atualizar solicitação
      await base44.entities.SolicitacaoAcesso.update(solicitacao.id, {
        status: "aprovada",
        data_resposta: new Date().toISOString(),
        respondido_por: user.email
      });

      // Enviar email de aprovação
      await base44.integrations.Core.SendEmail({
        from_name: "LexDoc AI - Acesso Aprovado",
        to: solicitacao.usuario_email,
        subject: "✅ Seu acesso foi aprovado!",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Acesso Aprovado!</h1>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e3a8a;">Olá, ${solicitacao.usuario_nome}!</h2>

              <p style="color: #64748b; line-height: 1.6;">
                Sua solicitação de acesso à empresa <strong>${solicitacao.nome_empresa}</strong> foi aprovada!
              </p>

              <p style="color: #64748b; line-height: 1.6;">
                Você já pode acessar a plataforma LexDoc AI com todas as funcionalidades disponíveis para o cargo de <strong>${solicitacao.cargo_solicitado.replace('_', ' ')}</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}"
                   style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Acessar Plataforma
                </a>
              </div>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
    },
  });

  const rejeitarSolicitacaoMutation = useMutation({
    mutationFn: async ({ solicitacao, motivo }) => {
      await base44.entities.SolicitacaoAcesso.update(solicitacao.id, {
        status: "rejeitada",
        data_resposta: new Date().toISOString(),
        respondido_por: user.email,
        motivo_rejeicao: motivo
      });

      // Enviar email de rejeição
      await base44.integrations.Core.SendEmail({
        from_name: "LexDoc AI - Solicitação Negada",
        to: solicitacao.usuario_email,
        subject: "Solicitação de Acesso - Resposta",
        body: `
          <div style="family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ef4444; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Solicitação Negada</h1>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e3a8a;">Olá, ${solicitacao.usuario_nome}</h2>

              <p style="color: #64748b; line-height: 1.6;">
                Sua solicitação de acesso à empresa <strong>${solicitacao.nome_empresa}</strong> não foi aprovada.
              </p>

              ${motivo ? `<p style="color: #64748b; line-height: 1.6;"><strong>Motivo:</strong> ${motivo}</p>` : ''}

              <p style="color: #64748b; line-height: 1.6;">
                Se você acredita que isso foi um erro, entre em contato diretamente com a empresa.
              </p>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  const handleDelete = (userId) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleRejeitar = (solicitacao) => {
    const motivo = prompt("Motivo da rejeição (opcional):");
    if (motivo !== null) { // User clicked OK or entered text
      rejeitarSolicitacaoMutation.mutate({ solicitacao, motivo });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (user.cargo !== 'admin') {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Acesso Negado</h3>
            <p className="text-slate-600">Apenas administradores podem gerenciar usuários.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciamento de Usuários</h1>
          <p className="text-slate-600">Gerencie colaboradores e permissões do escritório</p>
        </div>
        <div className="flex gap-3">
          {solicitacoes.length > 0 && (
            <Button
              onClick={() => setShowSolicitacoes(!showSolicitacoes)}
              variant="outline"
              className="relative"
            >
              <Mail className="w-4 h-4 mr-2" />
              Solicitações
              <Badge className="ml-2 bg-red-500">{solicitacoes.length}</Badge>
            </Button>
          )}
          <Button
            onClick={() => setShowNovoModal(true)}
            className="bg-blue-900 hover:bg-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Solicitações Pendentes */}
      {showSolicitacoes && solicitacoes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Mail className="w-5 h-5" />
              Solicitações Pendentes ({solicitacoes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {solicitacoes.map((sol) => (
              <Card key={sol.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-2">{sol.usuario_nome}</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-600">
                        <p><strong>Email:</strong> {sol.usuario_email}</p>
                        <p><strong>CPF:</strong> {sol.cpf}</p>
                        <p><strong>Cargo:</strong> {sol.cargo_solicitado.replace('_', ' ')}</p>
                        {sol.oab_numero && <p><strong>OAB:</strong> {sol.oab_numero}/{sol.oab_uf}</p>}
                        {sol.telefone && <p><strong>Telefone:</strong> {sol.telefone}</p>}
                      </div>
                      {sol.mensagem && (
                        <p className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                          <strong>Mensagem:</strong> {sol.mensagem}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => aprovarSolicitacaoMutation.mutate(sol)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={aprovarSolicitacaoMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleRejeitar(sol)}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        disabled={rejeitarSolicitacaoMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          </div>
        ) : usuarios.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum usuário cadastrado
              </h3>
              <p className="text-slate-600 mb-4">
                Comece adicionando colaboradores ao escritório
              </p>
              <Button onClick={() => setShowNovoModal(true)} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Usuário
              </Button>
            </CardContent>
          </Card>
        ) : (
          usuarios.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={usuario.foto_perfil_url} />
                      <AvatarFallback className="bg-blue-900 text-white text-lg">
                        {usuario.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{usuario.full_name}</h3>
                        <Badge variant="outline" className={`${cargoColors[usuario.cargo]} border mt-2`}>
                          {cargoLabels[usuario.cargo]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{usuario.email}</span>
                        </div>

                        {usuario.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{usuario.telefone}</span>
                          </div>
                        )}

                        {usuario.oab_numero && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span>OAB: {usuario.oab_numero}/{usuario.oab_uf}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingUser(usuario)}
                      className="text-blue-900 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(usuario.id)}
                      className="text-red-600 hover:bg-red-50"
                      disabled={usuario.id === user.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <NovoUsuarioModal
        open={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        cnpjEscritorio={user.cnpj_escritorio}
      />

      {editingUser && (
        <EditarUsuarioModal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          usuario={editingUser}
        />
      )}
    </div>
  );
}