import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Brain, Lock, Zap, FileSearch, BarChart3, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        // Se já está logado, vai para dashboard ou cadastro de empresa
        if (user.cnpj_escritorio) {
          navigate(createPageUrl("Dashboard"));
        } else {
          navigate(createPageUrl("CadastroEmpresa"));
        }
      }
    } catch {
      // Se não está logado, redireciona para login do Base44
      base44.auth.redirectToLogin(window.location.origin + createPageUrl("CadastroEmpresa"));
    }
  };

  const features = [
    {
      icon: Brain,
      title: "IA Jurídica Avançada",
      description: "Machine Learning especializado em documentos jurídicos com aprendizado contínuo",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: FileSearch,
      title: "Classificação Automática",
      description: "Detecta tipo de documento, extrai entidades e organiza automaticamente",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Lock,
      title: "Segurança Empresarial",
      description: "Isolamento total por CNPJ, criptografia e auditoria completa",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Zap,
      title: "Processamento Rápido",
      description: "OCR + NLP em segundos, com reorganização inteligente de páginas",
      color: "from-amber-500 to-amber-600"
    },
    {
      icon: BarChart3,
      title: "Métricas em Tempo Real",
      description: "Dashboard executivo com KPIs e análise de desempenho da IA",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Building2,
      title: "White Label Corporativo",
      description: "Domínio personalizado e marca própria para sua empresa",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const benefits = [
    "Redução de 80% no tempo de processamento documental",
    "IA que aprende com os documentos do seu escritório",
    "5 departamentos com modelos independentes de IA",
    "Auditoria completa e rastreável de todas as ações",
    "Integração com sistema jurídico existente via API"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Scale className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              LexDoc AI <span className="text-amber-400">Corporate</span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-200 mb-4 max-w-3xl mx-auto">
              A inteligência documental que o seu jurídico sempre quis
            </p>

            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
              Organize e analise documentos jurídicos com precisão de IA e Machine Learning. 
              Integração total entre setores e domínios empresariais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6 h-auto"
                onClick={handleLogin}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-400 text-blue-400 hover:bg-blue-400/10 text-lg px-8 py-6 h-auto"
              >
                Ver Demonstração
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Tecnologia Empresarial Avançada
          </h2>
          <p className="text-xl text-slate-400">
            Recursos desenvolvidos especificamente para grandes escritórios jurídicos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Por que escolher o <span className="text-amber-400">LexDoc AI</span>?
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Transforme a gestão documental do seu escritório com inteligência artificial de última geração.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <p className="text-slate-300">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Machine Learning Setorial</p>
                      <p className="text-slate-400 text-sm">Modelos independentes por departamento</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Segurança Corporativa</p>
                      <p className="text-slate-400 text-sm">Isolamento total por CNPJ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Processamento Instantâneo</p>
                      <p className="text-slate-400 text-sm">OCR + NLP em tempo real</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para transformar seu escritório?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Comece hoje mesmo com o LexDoc AI Corporate e leve a inteligência artificial para o seu departamento jurídico.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-12 py-6 h-auto"
            onClick={handleLogin}
          >
            Cadastrar Minha Empresa
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-amber-400" />
              <span className="text-white font-semibold">LexDoc AI Corporate</span>
            </div>
            <div className="flex gap-6 text-slate-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}