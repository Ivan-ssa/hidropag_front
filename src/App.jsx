import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Droplets } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { PrivateRoute } from "./components/PrivateRoute";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./components/Login";

import FiliaisList from "./components/FiliaisList";
import FilialForm from "./components/FilialForm";

import UsuariosList from "./components/UsuariosList";
import UsuariosCadastro from "./components/UsuariosCadastro";

import ObrasList from "./components/ObrasList";
import ObrasCadastro from "./components/ObrasCadastro";

import NotasList from "./components/NotasList";
import NotasCadastro from "./components/NotasCadastro";

import AprovacoesList from "./components/AprovacoesList";
import AprovacoesCadastro from "./components/AprovacoesCadastro";

import Configuracoes from './components/Configuracoes';
import Fornecedores from './components/Fornecedores'; 
import Clientes from './components/Clientes';
import Relatorio from './components/Relatorio'; // <-- 1. IMPORT DO RELATÓRIO ADICIONADO

// Interceptor global: se o token vencer durante o uso e a API retornar 401, desloga na hora
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("tokenHidropag");
      sessionStorage.removeItem("tokenHidropag");
      localStorage.removeItem("usuarioId");
      localStorage.removeItem("usuarioNome");
      localStorage.removeItem("usuarioPerfil");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getPerfil = () => localStorage.getItem("usuarioPerfil");

export const temAcesso = (perfisPermitidos) => {
  const perfilAtual = getPerfil();
  return perfisPermitidos.includes(perfilAtual);
};

function Inicio() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center mb-4">
          <Droplets className="w-6 h-6 text-hidrotec-1 fill-extra" />
        </div>
        <h2 className="font-display font-semibold text-2xl text-hidrotec-3 mb-2">
          Bem-vindo ao sistema HidroPag!
        </h2>
        <p className="text-hidrotec-4 leading-relaxed">
          Use o menu ao lado para gerenciar filiais, usuários, obras e notas
          fiscais.
        </p>
      </div>
    </div>
  );
}

// Função auxiliar para checar se o token existe e se NÃO está vencido
function tokenEstaValido() {
  const token = localStorage.getItem("tokenHidropag") || sessionStorage.getItem("tokenHidropag");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const agoraEmSegundos = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < agoraEmSegundos) {
      // Token venceu: limpa tudo
      localStorage.removeItem("tokenHidropag");
      sessionStorage.removeItem("tokenHidropag");
      localStorage.removeItem("usuarioId");
      localStorage.removeItem("usuarioNome");
      localStorage.removeItem("usuarioPerfil");
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem("tokenHidropag");
    sessionStorage.removeItem("tokenHidropag");
    return false;
  }
}

function RequireAuth() {
  if (!tokenEstaValido()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<Inicio />} />

          <Route path="/filiais" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><FiliaisList /></PrivateRoute>} />
          <Route path="/filiais/nova" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><FilialForm /></PrivateRoute>} />

          <Route path="/usuarios" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><UsuariosList /></PrivateRoute>} />
          <Route path="/usuarios/novo" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><UsuariosCadastro /></PrivateRoute>} />

          <Route path="/obras" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><ObrasList /></PrivateRoute>} />
          <Route path="/obras/nova" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><ObrasCadastro /></PrivateRoute>} />
          {/* 2. ROTA DE EDIÇÃO DE OBRAS ADICIONADA */}
          <Route path="/obras/editar/:id" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><ObrasCadastro /></PrivateRoute>} />

          <Route path="/notas" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><NotasList /></PrivateRoute>} />
          <Route path="/notas/nova" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><NotasCadastro /></PrivateRoute>} />

          <Route path="/aprovacoes" element={<PrivateRoute allowedRoles={['gestor','root']}><AprovacoesList /></PrivateRoute>} />
          <Route path="/aprovacoes/nova" element={<PrivateRoute allowedRoles={['gestor','root','leitor','lancador']}><AprovacoesCadastro /></PrivateRoute>} />
          
          <Route path="/configuracoes" element={<PrivateRoute allowedRoles={['root','gestor']}><Configuracoes /></PrivateRoute>} />
          
          <Route path="/fornecedores" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><Fornecedores /></PrivateRoute>} />
          
          {/* 3. ROTA DE RELATÓRIOS PROTEGIDA */}
          <Route path="/relatorios" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><Relatorio /></PrivateRoute>} />
          
          <Route path="/clientes" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><Clientes /></PrivateRoute>} />
        </Route>

        {/* Qualquer rota inválida redireciona para / (que passa pelo RequireAuth e joga p/ /login se deslogado) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;