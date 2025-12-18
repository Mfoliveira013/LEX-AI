
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function NovoUsuarioModal({ open, onClose, cnpjEscritorio }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    cargo: "advogado_junior",
    oab_numero: "",
    oab_uf: "",
    telefone: ""
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Verificar se email já existe
      const existingUsers = await base44.entities.User.filter({ email: userData.email });
      if (existingUsers.length > 0) {
        throw new Error("Este e-mail já está cadastrado no sistema.");
      }

      // Criar usuário
      const user = await base44.entities.User.create({
        ...userData,
        cnpj_escritorio: cnpjEscritorio,
        role: 'user' // Role padrão do Base44
      });

      // Enviar email de boas-vindas
      await base44.integrations.Core.SendEmail({
        from_name: "LexDoc AI",
        to: userData.email,
        subject: "Bem-vindo ao LexDoc AI",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0;">⚖️ LexDoc AI</h1>
            </div>
            
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e3a8a;">Olá, ${userData.full_name}!</h2>
              
              <p style="color: #64748b; line-height: 1.6;">
                Você foi adicionado à plataforma LexDoc AI como <strong>${userData.cargo.replace('_', ' ')}</strong>.
              </p>
              
              <p style="color: #64748b; line-height: 1.6;">
                Para acessar a plataforma, clique no botão abaixo e faça login com seu e-mail:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}" 
                   style="background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Acessar Plataforma
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px;">
                Se tiver dúvidas, entre em contato com o administrador do sistema.
              </p>
            </div>
          </div>
        `
      });

      // Log de auditoria - corrigido
      try {
        await base44.entities.LogAuditoria.create({
          cnpj_escritorio: cnpjEscritorio,
          usuario_email: userData.email,
          usuario_nome: userData.full_name,
          acao: "usuario_criado",
          entidade_tipo: "User",
          entidade_id: user.id,
          detalhes: {
            cargo: userData.cargo,
            email: userData.email
          },
          sucesso: true
        });
      } catch (logError) {
        console.error('Erro ao criar log de auditoria:', logError);
      }

      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setFormData({
        full_name: "",
        email: "",
        cargo: "advogado_junior",
        oab_numero: "",
        oab_uf: "",
        telefone: ""
      });
      setError("");
      onClose();
    },
    onError: (error) => {
      setError(error.message || "Erro ao criar usuário. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name || !formData.email) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }

    if (!formData.email.includes('@')) {
      setError("E-mail inválido.");
      return;
    }

    createUserMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo colaborador ao escritório
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                placeholder="João Silva"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@escritorio.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo *</Label>
            <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="advogado_senior">Advogado Sênior</SelectItem>
                <SelectItem value="advogado_junior">Advogado Júnior</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="oab_numero">Número da OAB</Label>
              <Input
                id="oab_numero"
                placeholder="123456"
                value={formData.oab_numero}
                onChange={(e) => setFormData({ ...formData, oab_numero: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oab_uf">UF da OAB</Label>
              <Input
                id="oab_uf"
                placeholder="SP"
                maxLength={2}
                value={formData.oab_uf}
                onChange={(e) => setFormData({ ...formData, oab_uf: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(11) 98765-4321"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-900 hover:bg-blue-800" 
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
