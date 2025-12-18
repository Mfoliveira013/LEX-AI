

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, LayoutDashboard, FolderOpen, Upload, FileText, Users, Settings, LogOut, Bell, Search, Brain, FileCheck, FolderTree } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Casos",
    url: createPageUrl("Casos"),
    icon: FolderOpen,
  },
  {
    title: "Upload",
    url: createPageUrl("Upload"),
    icon: Upload,
  },
  {
    title: "Organizar Documentos",
    url: createPageUrl("OrganizarDocumentos"),
    icon: FileText,
  },
  {
    title: "Documentos Organizados",
    url: createPageUrl("DocumentosOrganizados"),
    icon: FolderTree,
  },
  {
    title: "Minutas",
    url: createPageUrl("Minutas"),
    icon: FileText,
  },
  {
    title: "Peças Geradas",
    url: createPageUrl("PecasGeradas"),
    icon: FileCheck,
  },
  {
    title: "Agentes de IA",
    url: createPageUrl("GerenciarAgentes"),
    icon: Brain,
  },
];

const adminItems = [
  {
    title: "Usuários",
    url: createPageUrl("Usuarios"),
    icon: Users,
  },
  {
    title: "Configurações",
    url: createPageUrl("Configuracoes"),
    icon: Settings,
  },
];

// Adicionar item especial para usuários autorizados
const specialItems = [
  {
    title: "Avaliação AIC",
    url: createPageUrl("AvaliacaoAIC"),
    icon: Brain,
    emails: ["mauricio@nefad.com.br", "juliogoncalves@nefad.com.br"]
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    // Se está fazendo logout, não tentar carregar usuário
    if (isLoggingOut) {
      return;
    }

    base44.auth.me()
      .then(currentUser => {
        setUser(currentUser);
        
        // Se usuário não tem empresa cadastrada, redirecionar para cadastro
        if (!currentUser.cnpj_escritorio && location.pathname !== createPageUrl("CadastroEmpresa") && location.pathname !== createPageUrl("SolicitarAcesso")) {
          navigate(createPageUrl("CadastroEmpresa"));
        }
        
        setLoading(false);
      })
      .catch(() => {
        // Se não está logado e não está fazendo logout, redirecionar para login
        if (!isLoggingOut) {
          base44.auth.redirectToLogin(window.location.origin);
        }
      });
  }, [navigate, location.pathname, isLoggingOut]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Limpar estado do usuário imediatamente
    setUser(null);
    
    // Fazer logout - base44.auth.logout pode não retornar Promise
    try {
      const logoutResult = base44.auth.logout(window.location.origin);
      
      // Se retornou Promise, esperar
      if (logoutResult && typeof logoutResult.then === 'function') {
        logoutResult
          .then(() => {
            window.location.href = window.location.origin;
          })
          .catch(() => {
            window.location.href = window.location.origin;
          });
      } else {
        // Se não retornou Promise, já foi feito o logout
        // Aguardar um momento e recarregar
        setTimeout(() => {
          window.location.href = window.location.origin;
        }, 500);
      }
    } catch (error) {
      // Em caso de erro, forçar reload
      console.error('Erro ao fazer logout:', error);
      window.location.href = window.location.origin;
    }
  };

  const isAdmin = user?.cargo === 'admin';
  const hasSpecialAccess = user && (
    specialItems.some(item => item.emails.includes(user.email)) || 
    user.acesso_especial_aic === true
  );

  if (loading || isLoggingOut) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  // Se estiver na página de cadastro de empresa ou solicitação, não mostrar o layout completo
  if (location.pathname === createPageUrl("CadastroEmpresa") || location.pathname === createPageUrl("SolicitarAcesso")) {
    return children;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <style>{`
          :root {
            --lexai-navy: #1e3a8a;
            --lexai-gold: #d4af37;
            --lexai-gray: #64748b;
          }
        `}</style>

        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-900">LexDoc AI</h2>
                <p className="text-xs text-slate-500">Inteligência Jurídica</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-900 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-900 font-semibold shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {hasSpecialAccess && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-purple-600 uppercase tracking-wider px-3 py-2 mt-4">
                  Acesso Especial
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {specialItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-purple-50 hover:text-purple-900 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-purple-50 text-purple-900 font-semibold shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-4">
                  Administração
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-amber-50 hover:text-amber-900 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.foto_perfil_url} />
                    <AvatarFallback className="bg-blue-900 text-white">
                      {user.full_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.cargo?.replace('_', ' ')}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-slate-600 hover:text-slate-900"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors" />
                <div className="hidden md:flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar casos, documentos..." 
                    className="bg-slate-50 border-0 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-96"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    3
                  </Badge>
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

