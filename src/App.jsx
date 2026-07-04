import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import "./App.css";

import Login from "./components/Login";

import FiliaisList from "./components/FiliaisList";
import FilialForm from "./components/FilialForm";

import UsuariosList from "./components/UsuariosList";
import UsuariosCadastro from "./components/UsuariosCadastro";

import ObrasList from './components/ObrasList';
import ObrasCadastro from './components/ObrasCadastro';

// Componente temporário
function EmConstrucao({ modulo }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>🚧 {modulo}</h3>
      <p>Esta funcionalidade será desenvolvida em breve.</p>
    </div>
  );
}

function App() {
  return (
    <Router>

      <nav className="navbar">

        <h2>HidroPag</h2>

        <ul className="nav-links">

          <li>
            <Link to="/">Início</Link>
          </li>

          <li>
            <Link to="/login">Login</Link>
          </li>

          {/* FILIAIS */}
          <li className="dropdown">

            <span className="dropbtn">Filiais ▼</span>

            <div className="dropdown-content">

              <Link to="/filiais">
                Listar Filiais
              </Link>

              <Link to="/filiais/nova">
                Cadastrar Filial
              </Link>

            </div>

          </li>

          {/* USUÁRIOS */}
          <li className="dropdown">

            <span className="dropbtn">
              Usuários ▼
            </span>

            <div className="dropdown-content">

              <Link to="/usuarios">
                Listar Usuários
              </Link>

              <Link to="/usuarios/novo">
                Cadastrar Usuário
              </Link>

            </div>

          </li>

          {/* OBRAS */}
          <li className="dropdown">

            <span className="dropbtn">
              Obras ▼
            </span>

            <div className="dropdown-content">

              <Link to="/obras">
                Listar Obras
              </Link>

              <Link to="/obras/nova">
                Cadastrar Obra
              </Link>

            </div>

          </li>

          {/* NOTAS */}
          <li className="dropdown">

            <span className="dropbtn">
              Notas Fiscais ▼
            </span>

            <div className="dropdown-content">

              <Link to="/notas">
                Listar Notas
              </Link>

              <Link to="/notas/nova">
                Cadastrar Nota
              </Link>

            </div>

          </li>

        </ul>

      </nav>

      <div className="container">

        <Routes>

          <Route
            path="/"
            element={<h3>Bem-vindo ao sistema HidroPag!</h3>}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          {/* FILIAIS */}
          <Route
            path="/filiais"
            element={<FiliaisList />}
          />

          <Route
            path="/filiais/nova"
            element={<FilialForm />}
          />

          {/* USUÁRIOS */}
          <Route
            path="/usuarios"
            element={<UsuariosList />}
          />

          <Route
            path="/usuarios/novo"
            element={<UsuariosCadastro />}
          />

          {/* OBRAS */}
          <Route path="/obras" element={<ObrasList />} />

          <Route path="/obras/nova" element={<ObrasCadastro />} />
          
          {/* NOTAS */}
          <Route
            path="/notas"
            element={<EmConstrucao modulo="Listagem de Notas" />}
          />

          <Route
            path="/notas/nova"
            element={<EmConstrucao modulo="Cadastro de Notas" />}
          />

        </Routes>

      </div>

    </Router>
  );
}

export default App;