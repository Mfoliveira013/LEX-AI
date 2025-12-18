import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertCircle, 
  CheckCircle2,
  Brain,
  FileText,
  Users,
  TrendingUp,
  Activity
} from "lucide-react";

const EMAILS_AUTORIZADOS = [
  "mauricio@nefad.com.br",
  "juliogoncalves@nefad.com.br"
];

export default function AvaliacaoAIC() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(currentUser => {
        setUser(currentUser);
        
        // Verificar se o email está autorizado OU se tem acesso especial AIC
        const isAuthorized = EMAILS_AUTORIZADOS.includes(currentUser.email) || 
                            currentUser.acesso_especial_aic === true;
        
        setHasAccess(isAuthorized);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h3>
            <p className="text-slate-600 mb-4">
              Você não tem permissão para acessar a Avaliação AIC.
            </p>
            <p className="text-sm text-slate-500">
              Usuário atual: <strong>{user?.email}</strong>
            </p>
            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Esta funcionalidade está disponível apenas para usuários autorizados da NEFAD.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            Avaliação AIC
          </h1>
          <p className="text-slate-600">Sistema de Avaliação e Inteligência Corporativa</p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Acesso Autorizado
        </Badge>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Bem-vindo, <strong>{user?.full_name}</strong> ({user?.email})
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="outline">AIC</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Análises Realizadas</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline">Docs</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Documentos Avaliados</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="outline">Performance</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Taxa de Sucesso</h3>
            <p className="text-3xl font-bold text-green-600">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
              <Badge variant="outline">Status</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Sistema</h3>
            <p className="text-lg font-bold text-amber-600">Operacional</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Avaliação AIC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                O sistema de Avaliação AIC está em fase de implementação. 
                As funcionalidades estarão disponíveis em breve.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 mt-6">
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Funcionalidade em Desenvolvimento
                  </h3>
                  <p className="text-slate-600 text-sm">
                    O módulo de Avaliação AIC permitirá análises avançadas de 
                    inteligência corporativa e avaliação de documentos jurídicos.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Usuários Autorizados:</h4>
              <ul className="space-y-2">
                {EMAILS_AUTORIZADOS.map(email => (
                  <li key={email} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {email}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}