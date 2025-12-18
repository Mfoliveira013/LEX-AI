
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scale, Building2, Mail, Phone, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    cnpj: "",
    telefone: "",
    endereco: ""
  });

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      
      // Se usuário já tem empresa cadastrada, redirecionar para dashboard
      if (currentUser.cnpj_escritorio) {
        navigate(createPageUrl("Dashboard"));
      }
    }).catch(() => {
      // Se não está logado, redirecionar para login
      base44.auth.redirectToLogin(window.location.origin);
    });
  }, [navigate]);

  const gerarSigla = (nomeEmpresa) => {
    const palavras = nomeEmpresa.split(' ').filter(p => p.length > 2);
    const sigla = palavras.slice(0, 3).map(p => p.charAt(0).toUpperCase()).join('');
    return sigla + 'DOC';
  };

  const cadastroMutation = useMutation({
    mutationFn: async (data) => {
      // Validar CNPJ
      const cnpjLimpo = data.cnpj.replace(/[^\d]/g, '');
      if (cnpjLimpo.length !== 14) {
        throw new Error("CNPJ inválido. Deve conter 14 dígitos.");
      }

      // Verificar se CNPJ já existe
      const escritoriosExistentes = await base44.entities.Escritorio.filter({ cnpj: data.cnpj });
      if (escritoriosExistentes.length > 0) {
        throw new Error("Este CNPJ já está cadastrado no sistema.");
      }

      // Gerar sigla do escritório e domínio
      const sigla = gerarSigla(data.nomeEmpresa);
      const dominio = `https://${sigla.toLowerCase()}.lexdoc.ai`;

      // Criar escritório
      const escritorio = await base44.entities.Escritorio.create({
        cnpj: data.cnpj,
        nome_fantasia: data.nomeEmpresa,
        razao_social: data.nomeEmpresa,
        sigla: sigla,
        dominio_customizado: dominio,
        endereco: data.endereco,
        telefone: data.telefone,
        email_contato: user.email,
        cor_primaria: "#1e3a8a", // Azul LexDoc
        cor_secundaria: "#d4af37", // Dourado LexDoc
        configuracoes: {
          modelo_ia_preferido: "padrao",
          areas_atuacao: [],
          ml_habilitado: true,
          auto_classificacao: true,
          auto_organizacao: true
        },
        metricas_ml: {
          documentos_processados: 0,
          acuracia_geral: 0.85,
          ultima_atualizacao_modelo: new Date().toISOString()
        },
        ativo: true // Ativo imediatamente
      });

      // Atualizar usuário atual como admin da empresa
      await base44.auth.updateMe({
        cnpj_escritorio: data.cnpj,
        cargo: 'admin'
      });

      // Criar departamentos padrão para o novo escritório
      const departamentosPadrao = [
        { nome: "Cível", cor: "#3b82f6", icone: "Scale" },
        { nome: "Trabalhista", cor: "#f59e0b", icone: "Briefcase" },
        { nome: "Tributário", cor: "#10b981", icone: "DollarSign" },
        { nome: "Empresarial", cor: "#8b5cf6", icone: "Building2" },
        { nome: "Contratos", cor: "#ec4899", icone: "FileText" }
      ];

      for (const dept of departamentosPadrao) {
        await base44.entities.Departamento.create({
          cnpj_escritorio: data.cnpj,
          nome: dept.nome,
          descricao: `Departamento de ${dept.nome} com inteligência artificial para otimização de documentos.`,
          cor: dept.cor,
          icone: dept.icone,
          ia_modelo_id: `${sigla}_${dept.nome.toLowerCase().replace(/\s/g, '')}_v1`,
          ml_metricas: {
            acuracia: 0.85,
            documentos_treinamento: 0,
            ultima_atualizacao: new Date().toISOString(),
            feedbacks_positivos: 0,
            feedbacks_negativos: 0
          },
          regras_classificacao: [],
          ativo: true
        });
      }

      // Enviar email de confirmação
      await base44.integrations.Core.SendEmail({
        from_name: "LexDoc AI Corporate",
        to: user.email,
        subject: `🎉 ${sigla} - Bem-vindo ao LexDoc AI Corporate`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 40px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 36px;">⚖️ LexDoc AI</h1>
              <p style="color: white; margin-top: 10px; font-size: 14px;">Corporate Edition</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1e3a8a; margin-bottom: 20px;">Olá, ${user.full_name}!</h2>
              
              <p style="color: #64748b; line-height: 1.8; margin-bottom: 20px;">
                Sua empresa <strong>${data.nomeEmpresa}</strong> foi cadastrada com sucesso na plataforma LexDoc AI Corporate!
              </p>
              
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="color: #1e3a8a; margin: 0; font-size: 14px;"><strong>CNPJ:</strong> ${data.cnpj}</p>
                <p style="color: #1e3a8a; margin: 10px 0 0 0; font-size: 14px;"><strong>Sigla:</strong> ${sigla}</p>
                <p style="color: #1e3a8a; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;"><strong>Domínio:</strong></p>
                <p style="color: #d4af37; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${dominio}</p>
              </div>
              
              <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px;">🚀 Recursos Ativados:</h3>
                <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Machine Learning Setorial</li>
                  <li>5 Departamentos com IA Independente</li>
                  <li>Classificação Automática de Documentos</li>
                  <li>Reorganização Inteligente de PDFs</li>
                  <li>Aprendizado Contínuo com Feedback</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${window.location.origin}" 
                   style="background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Acessar Plataforma
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
              
              <p style="color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.6;">
                <strong>LexDoc AI Corporate</strong><br/>
                Inteligência Jurídica Empresarial Avançada<br/>
                Dúvidas? Responda este email ou acesse nosso suporte.
              </p>
            </div>
          </div>
        `
      });

      // Criar log de auditoria - corrigido
      try {
        await base44.entities.LogAuditoria.create({
          cnpj_escritorio: data.cnpj,
          usuario_email: user.email,
          usuario_nome: user.full_name,
          acao: "cadastro_escritorio",
          entidade_tipo: "Escritorio",
          entidade_id: escritorio.id,
          detalhes: {
            nome_empresa: data.nomeEmpresa,
            sigla: sigla,
            dominio: dominio
          },
          sucesso: true
        });
      } catch (logError) {
        console.error('Erro ao criar log de auditoria:', logError);
      }

      return { escritorio, sigla, dominio };
    },
    onSuccess: (data) => {
      setSuccessData(data);
      setShowSuccess(true);
      setError("");
      
      // Redirecionar para dashboard após 3 segundos
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 3000);
    },
    onError: (error) => {
      setError(error.message || "Erro ao cadastrar escritório. Tente novamente.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nomeEmpresa || !formData.cnpj) {
      setError("Nome da empresa e CNPJ são obrigatórios.");
      return;
    }

    cadastroMutation.mutate(formData);
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return numbers; // Return formatted numbers up to 14, or original value if longer before this point.
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
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                🎉 Empresa Cadastrada!
              </h2>
              
              <p className="text-slate-600 mb-6">
                Seu ambiente corporativo está pronto!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-slate-600 mb-2">Sigla Gerada:</p>
                <p className="text-2xl font-bold text-blue-900 mb-4">{successData?.sigla}</p>
                
                <p className="text-sm text-slate-600 mb-2">Domínio Corporativo:</p>
                <p className="text-lg font-semibold text-purple-700">{successData?.dominio}</p>
              </div>
              
              <p className="text-slate-500 text-sm">
                Redirecionando para o dashboard em 3 segundos...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 pb-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 bg-amber-400 rounded-xl flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">LexDoc AI Corporate</CardTitle>
                  <CardDescription className="text-blue-200">
                    Cadastro de Empresa
                  </CardDescription>
                </div>
              </div>
              <p className="text-center text-blue-100 text-sm">
                Olá, <strong>{user.full_name}</strong>! Complete seu cadastro empresarial
              </p>
            </CardHeader>

            <CardContent className="p-8">
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

                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa" className="text-lg">
                    Nome do Escritório *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="nomeEmpresa"
                      placeholder="Ex: Oliveira & Parceiros Advogados"
                      className="pl-10 h-12"
                      value={formData.nomeEmpresa}
                      onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                      required
                    />
                  </div>
                  {formData.nomeEmpresa && (
                    <p className="text-sm text-slate-500">
                      Sigla gerada: <strong className="text-blue-900">{gerarSigla(formData.nomeEmpresa)}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-lg">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    className="h-12"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    maxLength={18}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="telefone"
                      placeholder="(11) 98765-4321"
                      className="pl-10 h-12"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="endereco"
                      placeholder="Av. Paulista, 1000 - São Paulo/SP"
                      className="pl-10 h-12"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 h-12 text-lg"
                  disabled={cadastroMutation.isPending}
                >
                  {cadastroMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Cadastrar Empresa
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500 mt-4">
                  Ao cadastrar, você será o administrador desta empresa e poderá adicionar outros colaboradores.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
        
        {!showSuccess && (
          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-white hover:text-blue-200"
              onClick={() => navigate(createPageUrl("SolicitarAcesso"))}
            >
              Já pertence a uma empresa? Entre aqui
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
