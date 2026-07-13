import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Droplets } from "lucide-react";

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

// IMPORTANDO OS COMPONENTES DE NOTAS QUE ACABAMOS DE CRIAR
import NotasList from "./components/NotasList";
import NotasCadastro from "./components/NotasCadastro";

import AprovacoesList from "./components/AprovacoesList";
import AprovacoesCadastro from "./components/AprovacoesCadastro";
export const getPerfil = () => localStorage.getItem("usuarioPerfil");

export const temAcesso = (perfisPermitidos) => {
  const perfilAtual = getPerfil();
  return perfisPermitidos.includes(perfilAtual);
};
// Componente temporário (mantido caso você queira usar no futuro para outras telas)
function EmConstrucao({ modulo }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>🚧 {modulo}</h3>
      <p>Esta funcionalidade será desenvolvida em breve.</p>
    </div>
  );
}

// Tela inicial / dashboard de boas-vindas
function Inicio() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-flow-100 flex items-center justify-center mb-4">
          <Droplets className="w-6 h-6 text-flow-600" />
        </div>
        <h2 className="font-display font-semibold text-2xl text-slate-800 mb-2">
          Bem-vindo ao sistema HidroPag!
        </h2>
        <p className="text-slate-500 leading-relaxed">
          Use o menu ao lado para gerenciar filiais, usuários, obras e notas
          fiscais.
        </p>
      </div>
    </div>
  );
}

// Guarda de rota: só deixa passar quem tem token salvo no localStorage.
// Sem token -> manda direto para o /login. Com token -> mostra o layout
// completo (sidebar + header) e renderiza a rota filha no <Outlet />.
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
        {/* Login fica de fora da guarda: é a única tela acessível sem token */}
        <Route path="/login" element={<Login />} />

        {/* Tudo aqui dentro exige login */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Inicio />} />

          {/* FILIAIS */}
          <Route path="/filiais" element={<FiliaisList />} />
          <Route path="/filiais/nova" element={<FilialForm />} />

          {/* USUÁRIOS */}
          <Route path="/usuarios" element={<UsuariosList />} />
          <Route path="/usuarios/novo" element={<UsuariosCadastro />} />

          {/* OBRAS */}
          <Route path="/obras" element={<ObrasList />} />
          <Route path="/obras/nova" element={<ObrasCadastro />} />

          {/* NOTAS - AGORA USANDO OS COMPONENTES REAIS */}
          <Route path="/notas" element={<NotasList />} />
          <Route path="/notas/nova" element={<NotasCadastro />} />

          {/* APROVAÇÕES */}
          <Route path="/aprovacoes" element={<AprovacoesList />} />
          <Route path="/aprovacoes/nova" element={<AprovacoesCadastro />} />
        </Route>

        {/* Qualquer rota que não exista cai no login (ou no início, se já estiver logado) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;


// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// import "./App.css";

// import Login from "./components/Login";

// import FiliaisList from "./components/FiliaisList";
// import FilialForm from "./components/FilialForm";

// import UsuariosList from "./components/UsuariosList";
// import UsuariosCadastro from "./components/UsuariosCadastro";

// import ObrasList from "./components/ObrasList";
// import ObrasCadastro from "./components/ObrasCadastro";

// // Componente temporário
// function EmConstrucao({ modulo }) {
//   return (
//     <div style={{ textAlign: "center", marginTop: "50px" }}>
//       <h3>🚧 {modulo}</h3>
//       <p>Esta funcionalidade será desenvolvida em breve.</p>
//     </div>
//   );
// }

// function App() {
//   return (
//     <Router>

//       <nav className="navbar">

//         <h2>HidroPag</h2>

//         <ul className="nav-links">

//           <li>
//             <Link to="/">Início</Link>
//           </li>

//           <li>
//             <Link to="/login">Login</Link>
//           </li>

//           {/* FILIAIS */}
//           <li className="dropdown">

//             <span className="dropbtn">Filiais ▼</span>

//             <div className="dropdown-content">

//               <Link to="/filiais">
//                 Listar Filiais
//               </Link>

//               <Link to="/filiais/nova">
//                 Cadastrar Filial
//               </Link>

//             </div>

//           </li>

//           {/* USUÁRIOS */}
//           <li className="dropdown">

//             <span className="dropbtn">
//               Usuários ▼
//             </span>

//             <div className="dropdown-content">

//               <Link to="/usuarios">
//                 Listar Usuários
//               </Link>

//               <Link to="/usuarios/novo">
//                 Cadastrar Usuário
//               </Link>

//             </div>

//           </li>

//           {/* OBRAS */}
//           <li className="dropdown">

//             <span className="dropbtn">
//               Obras ▼
//             </span>

//             <div className="dropdown-content">

//               <Link to="/obras">
//                 Listar Obras
//               </Link>

//               <Link to="/obras/nova">
//                 Cadastrar Obra
//               </Link>

//             </div>

//           </li>

//           {/* NOTAS */}
//           <li className="dropdown">

//             <span className="dropbtn">
//               Notas Fiscais ▼
//             </span>

//             <div className="dropdown-content">

//               <Link to="/notas">
//                 Listar Notas
//               </Link>

//               <Link to="/notas/nova">
//                 Cadastrar Nota
//               </Link>

//             </div>

//           </li>

//         </ul>

//       </nav>

//       <div className="container">

//         <Routes>

//           <Route
//             path="/"
//             element={<h3>Bem-vindo ao sistema HidroPag!</h3>}
//           />

//           <Route
//             path="/login"
//             element={<Login />}
//           />

//           {/* FILIAIS */}
//           <Route
//             path="/filiais"
//             element={<FiliaisList />}
//           />

//           <Route
//             path="/filiais/nova"
//             element={<FilialForm />}
//           />

//           {/* USUÁRIOS */}
//           <Route
//             path="/usuarios"
//             element={<UsuariosList />}
//           />

//           <Route
//             path="/usuarios/novo"
//             element={<UsuariosCadastro />}
//           />

//           {/* OBRAS */}
//           <Route path="/obras" element={<ObrasList />} />
//           <Route path="/obras/nova" element={<ObrasCadastro />} />
          
//           {/* NOTAS */}
//           <Route
//             path="/notas"
//             element={<EmConstrucao modulo="Listagem de Notas" />}
//           />

//           <Route
//             path="/notas/nova"
//             element={<EmConstrucao modulo="Cadastro de Notas" />}
//           />

//         </Routes>

//       </div>

//     </Router>
//   );
// }

// export default App;