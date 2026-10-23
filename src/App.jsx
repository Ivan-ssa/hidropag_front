import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Droplets } from "lucide-react";
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
import Clientes from './components/Clientes'; // <-- 1. IMPORTAMOS A TELA DE CLIENTES AQUI

export const getPerfil = () => localStorage.getItem("usuarioPerfil");

export const temAcesso = (perfisPermitidos) => {
  const perfilAtual = getPerfil();
  return perfisPermitidos.includes(perfilAtual);
};

function EmConstrucao({ modulo }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>🚧 {modulo}</h3>
      <p>Esta funcionalidade será desenvolvida em breve.</p>
    </div>
  );
}

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

function RequireAuth() {
  const token = localStorage.getItem("tokenHidropag");

  if (!token) {
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

          <Route path="/notas" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><NotasList /></PrivateRoute>} />
          <Route path="/notas/nova" element={<PrivateRoute allowedRoles={['root','gestor','lancador']}><NotasCadastro /></PrivateRoute>} />

          <Route path="/aprovacoes" element={<PrivateRoute allowedRoles={['gestor','root']}><AprovacoesList /></PrivateRoute>} />
          <Route path="/aprovacoes/nova" element={<PrivateRoute allowedRoles={['gestor','root','leitor','lancador']}><AprovacoesCadastro /></PrivateRoute>} />
          
          <Route path="/configuracoes" element={<PrivateRoute allowedRoles={['root','gestor']}><Configuracoes /></PrivateRoute>} />
          
          <Route path="/fornecedores" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><Fornecedores /></PrivateRoute>} />
          
          {/* 2. ADICIONAMOS A ROTA DE CLIENTES AQUI */}
          <Route path="/clientes" element={<PrivateRoute allowedRoles={['root','gestor','lancador','leitor']}><Clientes /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;