
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Building2, Mail, Phone, CreditCard, Briefcase, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SolicitarAcesso() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    cargo: "advogado_junior",
    nome_empresa: "",
    cnpj: "",
    telefone: "",
    oab_numero: "",
    oab_uf: "",
    mensagem: ""
  });

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      setFormData(prev => ({ ...prev, nome_completo: currentUser.full_name }));
      
      // Se já tem empresa, redirecionar para dashboard
      if (currentUser.cnpj_escritorio) {
        navigate(createPageUrl("Dashboard"));
      }
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, [navigate]);

  const formatCPF = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  // Verificar se é estagiário
  const isEstagiario = formData.cargo === "estagiario";

  const solicitacaoMutation = useMutation({
    mutationFn: async (data) => {
      // Validar CPF
      const cpfLimpo = data.cpf.replace(/[^\d]/g, '');
      if (cpfLimpo.length !== 11) {
        throw new Error("CPF inválido. Deve conter 11 dígitos.");
      }

      // Validar CNPJ
      const cnpjLimpo = data.cnpj.replace(/[^\d]/g, '');
      if (cnpjLimpo.length !== 14) {
        throw new Error("CNPJ inválido. Deve conter 14 dígitos.");
      }

      // Verificar se empresa existe
      const escritorios = await base44.entities.Escritorio.filter({ cnpj: data.cnpj });
      if (escritorios.length === 0) {
        throw new Error("CNPJ não encontrado. Verifique se a empresa está cadastrada na plataforma.");
      }

      const escritorio = escritorios[0];

      // Verificar se já existe solicitação pendente
      const solicitacoesExistentes = await base44.entities.SolicitacaoAcesso.filter({
        usuario_email: user.email,
        cnpj_escritorio: data.cnpj,
        status: "pendente"
      });

      if (solicitacoesExistentes.length > 0) {
        throw new Error("Você já possui uma solicitação pendente para esta empresa.");
      }

      // Criar solicitação
      const solicitacao = await base44.entities.SolicitacaoAcesso.create({
        usuario_email: user.email,
        usuario_nome: data.nome_completo,
        cpf: data.cpf,
        cargo_solicitado: data.cargo,
        cnpj_escritorio: data.cnpj,
        nome_empresa: data.nome_empresa,
        telefone: data.telefone,
        oab_numero: data.oab_numero || null, // If empty, send null
        oab_uf: data.oab_uf || null,       // If empty, send null
        mensagem: data.mensagem,
        status: "pendente"
      });

      // Enviar email para o email de contato do escritório
      await base44.integrations.Core.SendEmail({
        from_name: "LexDoc AI - Solicitação de Acesso",
        to: escritorio.email_contato,
        subject: `🔔 Nova Solicitação de Acesso - ${data.nome_completo}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px;">⚖️ LexDoc AI</h1>
              <p style="color: white; margin-top: 10px;">Solicitação de Acesso Pendente</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1e3a8a; margin-bottom: 20px;">Olá!</h2>
              
              <p style="color: #64748b; line-height: 1.6;">
                <strong>${data.nome_completo}</strong> solicitou acesso à sua empresa <strong>${escritorio.nome_fantasia}</strong> na plataforma LexDoc AI.
              </p>
              
              <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>Nome:</strong> ${data.nome_completo}</p>
                <p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>CPF:</strong> ${data.cpf}</p>
                <p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>Cargo Solicitado:</strong> ${data.cargo.replace('_', ' ')}</p>
                ${data.oab_numero ? `<p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>OAB:</strong> ${data.oab_numero}/${data.oab_uf}</p>` : ''}
                ${data.telefone ? `<p style="margin: 0 0 10px 0; color: #1e3a8a;"><strong>Telefone:</strong> ${data.telefone}</p>` : ''}
                ${data.mensagem ? `<p style="margin: 10px 0 0 0; color: #64748b;"><strong>Mensagem:</strong><br/>${data.mensagem}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}${createPageUrl('Usuarios')}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Revisar Solicitação
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              
              <p style="color: #94a3b8; font-size: 13px; text-align: center;">
                <strong>LexDoc AI Corporate</strong><br/>
                Acesse a plataforma para aprovar ou rejeitar esta solicitação.
              </p>
            </div>
          </div>
        `
      });

      return { solicitacao, empresa: escritorio };
    },
    onSuccess: () => {
      setShowSuccess(true);
      setError("");
    },
    onError: (error) => {
      setError(error.message || "Erro ao enviar solicitação. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nome_completo || !formData.cpf || !formData.cnpj) {
      setError("Nome, CPF e CNPJ são obrigatórios.");
      return;
    }

    // OAB é obrigatória apenas se não for estagiário
    if (!isEstagiario && (!formData.oab_numero || !formData.oab_uf)) {
      setError("Número e UF da OAB são obrigatórios para Advogados.");
      return;
    }

    solicitacaoMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {showSuccess ? (
          <Card className="shadow-2xl border-0">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-16 h-16 text-blue-600" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                ✅ Solicitação Enviada!
              </h2>
              
              <p className="text-slate-600 mb-6">
                Seu pedido de acesso foi enviado para o administrador da empresa.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-slate-600 mb-2">O que acontece agora?</p>
                <ul className="text-left text-sm text-slate-700 space-y-2">
                  <li>✓ Administrador receberá um email com sua solicitação</li>
                  <li>✓ Seus dados serão revisados</li>
                  <li>✓ Você receberá um email quando for aprovado</li>
                  <li>✓ Após aprovação, poderá acessar a plataforma normalmente</li>
                </ul>
              </div>
              
              <Button
                onClick={() => base44.auth.logout(window.location.origin)}
                variant="outline"
                className="w-full"
              >
                Fazer Logout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 pb-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 bg-amber-400 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Solicitar Acesso</CardTitle>
                  <CardDescription className="text-blue-200">
                    Entrar em uma empresa existente
                  </CardDescription>
                </div>
              </div>
              <p className="text-center text-blue-100 text-sm">
                Olá, <strong>{user.full_name}</strong>! Preencha os dados para solicitar acesso
              </p>
            </CardHeader>

            <CardContent className="p-8">
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl("CadastroEmpresa"))}
                className="mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Cadastro de Empresa
              </Button>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Este cadastro está vinculado ao e-mail: <strong>{user.email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo Solicitado *</Label>
                  <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advogado_senior">Advogado Sênior</SelectItem>
                      <SelectItem value="advogado_junior">Advogado Júnior</SelectItem>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input
                      id="nome_empresa"
                      placeholder="Ex: Silva & Associados"
                      value={formData.nome_empresa}
                      onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ da Empresa *</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                      maxLength={18}
                      required
                    />
                  </div>
                </div>

                {!isEstagiario && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oab_numero">Número da OAB *</Label>
                      <Input
                        id="oab_numero"
                        placeholder="123456"
                        value={formData.oab_numero}
                        onChange={(e) => setFormData({ ...formData, oab_numero: e.target.value })}
                        required={!isEstagiario}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oab_uf">UF da OAB *</Label>
                      <Input
                        id="oab_uf"
                        placeholder="SP"
                        maxLength={2}
                        value={formData.oab_uf}
                        onChange={(e) => setFormData({ ...formData, oab_uf: e.target.value.toUpperCase() })}
                        required={!isEstagiario}
                      />
                    </div>
                  </div>
                )}

                {isEstagiario && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      Como estagiário, o número da OAB não é obrigatório.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 98765-4321"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    placeholder="Conte um pouco sobre você e por que deseja acessar esta empresa..."
                    rows={4}
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 h-12 text-lg"
                  disabled={solicitacaoMutation.isPending}
                >
                  {solicitacaoMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando Solicitação...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500 mt-4">
                  Sua solicitação será enviada para o administrador da empresa para aprovação.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
