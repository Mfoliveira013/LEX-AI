import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Building2, 
  Brain, 
  Bell, 
  Palette, 
  Shield, 
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("empresa");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const [empresaData, setEmpresaData] = useState({
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email_contato: "",
    logo_url: ""
  });

  const [iaData, setIaData] = useState({
    modelo_ia_preferido: "gpt-4-turbo",
    ml_habilitado: true,
    auto_classificacao: true,
    auto_organizacao: true,
  });

  const [notificacoesData, setNotificacoesData] = useState({
    email_novos_documentos: true,
    email_prazos_urgentes: true,
    email_pecas_geradas: true,
    email_usuarios_novos: true,
    notif_desktop: false
  });

  const [aparenciaData, setAparenciaData] = useState({
    cor_primaria: "#1e3a8a",
    cor_secundaria: "#d4af37",
  });

  React.useEffect(() => {
    base44.auth.me().then(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser.cnpj_escritorio) {
        const escritorios = await base44.entities.Escritorio.filter({ 
          cnpj: currentUser.cnpj_escritorio 
        });
        
        if (escritorios.length > 0) {
          const escritorio = escritorios[0];
          setEmpresaData({
            nome_fantasia: escritorio.nome_fantasia || "",
            razao_social: escritorio.razao_social || "",
            cnpj: escritorio.cnpj || "",
            endereco: escritorio.endereco || "",
            telefone: escritorio.telefone || "",
            email_contato: escritorio.email_contato || "",
            logo_url: escritorio.logo_url || ""
          });
          
          if (escritorio.configuracoes) {
            setIaData({
              modelo_ia_preferido: escritorio.configuracoes.modelo_ia_preferido || "gpt-4-turbo",
              ml_habilitado: escritorio.configuracoes.ml_habilitado ?? true,
              auto_classificacao: escritorio.configuracoes.auto_classificacao ?? true,
              auto_organizacao: escritorio.configuracoes.auto_organizacao ?? true,
            });
          }
          
          if (escritorio.cor_primaria || escritorio.cor_secundaria) {
            setAparenciaData({
              cor_primaria: escritorio.cor_primaria || "#1e3a8a",
              cor_secundaria: escritorio.cor_secundaria || "#d4af37",
            });
          }
        }
      }
    }).catch(() => {});
  }, []);

  const { data: escritorios = [] } = useQuery({
    queryKey: ['escritorio', user?.cnpj_escritorio],
    queryFn: () => base44.entities.Escritorio.filter({ cnpj: user?.cnpj_escritorio }),
    enabled: !!user?.cnpj_escritorio,
  });

  const escritorio = escritorios[0];

  const atualizarEmpresaMutation = useMutation({
    mutationFn: async (data) => {
      if (!escritorio) throw new Error("Escritório não encontrado");
      return await base44.entities.Escritorio.update(escritorio.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escritorio'] });
      setSuccessMessage("Configurações da empresa atualizadas com sucesso!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Erro ao atualizar configurações");
      setSuccessMessage("");
    }
  });

  const atualizarIAMutation = useMutation({
    mutationFn: async (data) => {
      if (!escritorio) throw new Error("Escritório não encontrado");
      return await base44.entities.Escritorio.update(escritorio.id, {
        configuracoes: {
          ...escritorio.configuracoes,
          ...data
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escritorio'] });
      setSuccessMessage("Configurações de IA atualizadas com sucesso!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Erro ao atualizar configurações");
      setSuccessMessage("");
    }
  });

  const atualizarAparenciaMutation = useMutation({
    mutationFn: async (data) => {
      if (!escritorio) throw new Error("Escritório não encontrado");
      return await base44.entities.Escritorio.update(escritorio.id, {
        cor_primaria: data.cor_primaria,
        cor_secundaria: data.cor_secundaria
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escritorio'] });
      setSuccessMessage("Aparência atualizada com sucesso!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Erro ao atualizar aparência");
      setSuccessMessage("");
    }
  });

  const handleSalvarEmpresa = () => {
    atualizarEmpresaMutation.mutate({
      nome_fantasia: empresaData.nome_fantasia,
      razao_social: empresaData.razao_social,
      endereco: empresaData.endereco,
      telefone: empresaData.telefone,
      email_contato: empresaData.email_contato,
      logo_url: empresaData.logo_url
    });
  };

  const handleSalvarIA = () => {
    atualizarIAMutation.mutate(iaData);
  };

  const handleSalvarAparencia = () => {
    atualizarAparenciaMutation.mutate(aparenciaData);
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEmpresaData({ ...empresaData, logo_url: file_url });
      
      if (escritorio) {
        await base44.entities.Escritorio.update(escritorio.id, { logo_url: file_url });
        queryClient.invalidateQueries({ queryKey: ['escritorio'] });
        setSuccessMessage("Logo atualizado com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Erro ao fazer upload do logo");
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
            <p className="text-slate-600">Apenas administradores podem acessar as configurações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações</h1>
        <p className="text-slate-600">Gerencie as configurações do escritório e da plataforma</p>
      </div>

      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">IA & ML</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>Gerencie os dados cadastrais do escritório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Logo do Escritório</Label>
                <div className="flex items-center gap-4">
                  {empresaData.logo_url && (
                    <img src={empresaData.logo_url} alt="Logo" className="w-20 h-20 object-contain border border-slate-200 rounded-lg p-2" />
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={handleUploadLogo} className="max-w-xs" />
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG ou SVG (máx. 2MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                  <Input
                    id="nome_fantasia"
                    value={empresaData.nome_fantasia}
                    onChange={(e) => setEmpresaData({ ...empresaData, nome_fantasia: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={empresaData.razao_social}
                    onChange={(e) => setEmpresaData({ ...empresaData, razao_social: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={empresaData.cnpj} disabled className="bg-slate-50" />
                  <p className="text-xs text-slate-500">O CNPJ não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="telefone"
                      className="pl-10"
                      value={empresaData.telefone}
                      onChange={(e) => setEmpresaData({ ...empresaData, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_contato">Email de Contato</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email_contato"
                      type="email"
                      className="pl-10"
                      value={empresaData.email_contato}
                      onChange={(e) => setEmpresaData({ ...empresaData, email_contato: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="endereco"
                      className="pl-10"
                      value={empresaData.endereco}
                      onChange={(e) => setEmpresaData({ ...empresaData, endereco: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSalvarEmpresa} disabled={atualizarEmpresaMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
                  <Save className="w-4 h-4 mr-2" />
                  {atualizarEmpresaMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {escritorio && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Sigla do Escritório</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{escritorio.sigla}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Domínio Customizado</p>
                      <p className="text-xs font-mono text-purple-900 mt-1">{escritorio.dominio_customizado}</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Plano LexDoc AI Corporate</p>
                      <p className="text-xs text-amber-800">Machine Learning habilitado • Agentes de IA ilimitados • Armazenamento ilimitado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Configurações de Inteligência Artificial
              </CardTitle>
              <CardDescription>Configure o comportamento da IA e aprendizado de máquina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Machine Learning Habilitado</Label>
                    <p className="text-sm text-slate-600 mt-1">Permite que a IA aprenda continuamente com os feedbacks dos usuários</p>
                  </div>
                  <Switch checked={iaData.ml_habilitado} onCheckedChange={(checked) => setIaData({ ...iaData, ml_habilitado: checked })} />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Classificação Automática</Label>
                    <p className="text-sm text-slate-600 mt-1">Classifica automaticamente documentos por tipo e área jurídica</p>
                  </div>
                  <Switch checked={iaData.auto_classificacao} onCheckedChange={(checked) => setIaData({ ...iaData, auto_classificacao: checked })} />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Organização Automática</Label>
                    <p className="text-sm text-slate-600 mt-1">Reorganiza e separa documentos desorganizados automaticamente</p>
                  </div>
                  <Switch checked={iaData.auto_organizacao} onCheckedChange={(checked) => setIaData({ ...iaData, auto_organizacao: checked })} />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h4 className="font-semibold text-slate-900">Modelo de IA Preferido</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: "gpt-4", label: "GPT-4", desc: "Balanceado" },
                    { value: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Rápido" },
                    { value: "gpt-5", label: "GPT-5", desc: "Avançado" },
                    { value: "claude", label: "Claude", desc: "Criativo" },
                    { value: "gemini", label: "Gemini", desc: "Google" }
                  ].map((modelo) => (
                    <button
                      key={modelo.value}
                      onClick={() => setIaData({ ...iaData, modelo_ia_preferido: modelo.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        iaData.modelo_ia_preferido === modelo.value ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{modelo.label}</p>
                      <p className="text-xs text-slate-600 mt-1">{modelo.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {escritorio?.metricas_ml && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-slate-900 mb-4">Métricas de Machine Learning</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Acurácia Geral</p>
                      <p className="text-3xl font-bold text-green-700">{((escritorio.metricas_ml.acuracia_geral || 0.85) * 100).toFixed(0)}%</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Documentos Processados</p>
                      <p className="text-3xl font-bold text-blue-700">{escritorio.metricas_ml.documentos_processados || 0}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Última Atualização</p>
                      <p className="text-sm font-medium text-purple-700">
                        {escritorio.metricas_ml.ultima_atualizacao_modelo 
                          ? new Date(escritorio.metricas_ml.ultima_atualizacao_modelo).toLocaleDateString('pt-BR')
                          : "Nunca"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSalvarIA} disabled={atualizarIAMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  {atualizarIAMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Preferências de Notificações
              </CardTitle>
              <CardDescription>Configure quando e como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'email_novos_documentos', label: 'Novos Documentos', desc: 'Receber email quando um novo documento for processado' },
                  { key: 'email_prazos_urgentes', label: 'Prazos Urgentes', desc: 'Alertas quando um prazo está próximo (7 dias ou menos)' },
                  { key: 'email_pecas_geradas', label: 'Peças Processuais Geradas', desc: 'Notificar quando a IA gerar uma nova peça processual' },
                  { key: 'email_usuarios_novos', label: 'Novos Usuários', desc: 'Notificar administradores sobre solicitações de acesso' },
                  { key: 'notif_desktop', label: 'Notificações Desktop', desc: 'Receber notificações push no navegador' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label className="text-base font-semibold">{item.label}</Label>
                      <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notificacoesData[item.key]}
                      onCheckedChange={(checked) => setNotificacoesData({ ...notificacoesData, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button className="bg-blue-900 hover:bg-blue-800">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-600" />
                Personalização Visual
              </CardTitle>
              <CardDescription>Customize as cores e o tema da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor_primaria"
                      value={aparenciaData.cor_primaria}
                      onChange={(e) => setAparenciaData({ ...aparenciaData, cor_primaria: e.target.value })}
                      className="w-20 h-12 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Input
                        value={aparenciaData.cor_primaria}
                        onChange={(e) => setAparenciaData({ ...aparenciaData, cor_primaria: e.target.value })}
                        className="font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cor principal do sistema</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor_secundaria"
                      value={aparenciaData.cor_secundaria}
                      onChange={(e) => setAparenciaData({ ...aparenciaData, cor_secundaria: e.target.value })}
                      className="w-20 h-12 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Input
                        value={aparenciaData.cor_secundaria}
                        onChange={(e) => setAparenciaData({ ...aparenciaData, cor_secundaria: e.target.value })}
                        className="font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cor de destaque (badges, links)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-4">Prévia das Cores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 rounded-lg flex items-center justify-center text-white font-semibold" style={{ backgroundColor: aparenciaData.cor_primaria }}>
                    Cor Primária
                  </div>
                  <div className="h-32 rounded-lg flex items-center justify-center text-white font-semibold" style={{ backgroundColor: aparenciaData.cor_secundaria }}>
                    Cor Secundária
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSalvarAparencia} disabled={atualizarAparenciaMutation.isPending} className="bg-pink-600 hover:bg-pink-700">
                  <Save className="w-4 h-4 mr-2" />
                  {atualizarAparenciaMutation.isPending ? "Salvando..." : "Aplicar Cores"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Segurança e Privacidade
              </CardTitle>
              <CardDescription>Configurações de segurança e controle de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Segurança Corporativa Ativa</p>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>✓ Autenticação via Base44 Platform</li>
                      <li>✓ Isolamento multi-tenant por CNPJ</li>
                      <li>✓ Criptografia de dados em repouso e em trânsito</li>
                      <li>✓ Logs de auditoria completos</li>
                      <li>✓ Backup automático diário</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Autenticação em Dois Fatores (2FA)</Label>
                    <p className="text-sm text-slate-600 mt-1">Exigir código adicional no login</p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full font-medium">Em breve</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Logs de Auditoria</Label>
                    <p className="text-sm text-slate-600 mt-1">Registrar todas as ações dos usuários</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-3">Controle de Acesso</h4>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-slate-600" />
                    <span className="font-semibold text-slate-900">Hierarquia de Permissões</span>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1 ml-8">
                    <li>• <strong>Admin:</strong> Acesso total ao sistema</li>
                    <li>• <strong>Advogado Sênior:</strong> Pode criar casos e gerenciar documentos</li>
                    <li>• <strong>Advogado Júnior:</strong> Pode visualizar e editar casos existentes</li>
                    <li>• <strong>Estagiário:</strong> Pode visualizar documentos e minutas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}