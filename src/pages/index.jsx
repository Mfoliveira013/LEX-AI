import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Casos from "./Casos";

import Upload from "./Upload";

import Minutas from "./Minutas";

import Landing from "./Landing";

import Usuarios from "./Usuarios";

import CadastroEmpresa from "./CadastroEmpresa";

import SolicitarAcesso from "./SolicitarAcesso";

import Agentes from "./Agentes";

import PecasGeradas from "./PecasGeradas";

import OrganizarDocumentos from "./OrganizarDocumentos";

import DocumentosOrganizados from "./DocumentosOrganizados";

import Configuracoes from "./Configuracoes";

import GerenciarAgentes from "./GerenciarAgentes";

import AvaliacaoAIC from "./AvaliacaoAIC";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Casos: Casos,
    
    Upload: Upload,
    
    Minutas: Minutas,
    
    Landing: Landing,
    
    Usuarios: Usuarios,
    
    CadastroEmpresa: CadastroEmpresa,
    
    SolicitarAcesso: SolicitarAcesso,
    
    Agentes: Agentes,
    
    PecasGeradas: PecasGeradas,
    
    OrganizarDocumentos: OrganizarDocumentos,
    
    DocumentosOrganizados: DocumentosOrganizados,
    
    Configuracoes: Configuracoes,
    
    GerenciarAgentes: GerenciarAgentes,
    
    AvaliacaoAIC: AvaliacaoAIC,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Casos" element={<Casos />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Minutas" element={<Minutas />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Usuarios" element={<Usuarios />} />
                
                <Route path="/CadastroEmpresa" element={<CadastroEmpresa />} />
                
                <Route path="/SolicitarAcesso" element={<SolicitarAcesso />} />
                
                <Route path="/Agentes" element={<Agentes />} />
                
                <Route path="/PecasGeradas" element={<PecasGeradas />} />
                
                <Route path="/OrganizarDocumentos" element={<OrganizarDocumentos />} />
                
                <Route path="/DocumentosOrganizados" element={<DocumentosOrganizados />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
                <Route path="/GerenciarAgentes" element={<GerenciarAgentes />} />
                
                <Route path="/AvaliacaoAIC" element={<AvaliacaoAIC />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}