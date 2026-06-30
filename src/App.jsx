// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import FiliaisList from "./components/FiliaisList";
import FilialForm from "./components/FilialForm"; // Vamos manter o form aqui para quando formos criar
import "./App.css";
import Login from "./components/Login";
import UsuariosList from "./components/UsuariosList";

// Este é um componente temporário para as telas que ainda vamos fazer
function EmConstrucao({ modulo }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>🚧 Módulo de {modulo} 🚧</h3>
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
          <li><Link to="/">Início</Link></li>
          <li><Link to="/login">Login</Link></li>

          {/* Menu Dropdown de Filiais */}
          <li className="dropdown">
            <span className="dropbtn">Filiais ▼</span>
            <div className="dropdown-content">
              <Link to="/filiais">Listar Filiais</Link>
              <Link to="/filiais/nova">Cadastrar Filial</Link>
            </div>
          </li>

          {/* Menu Dropdown de Usuários */}
          <li className="dropdown">
            <span className="dropbtn">Usuários ▼</span>
            <div className="dropdown-content">
              <Link to="/usuarios">Listar Usuários</Link>
              <Link to="/usuarios/novo">Cadastrar Usuário</Link>
            </div>
          </li>

          {/* Menu Dropdown de Obras */}
          <li className="dropdown">
            <span className="dropbtn">Obras ▼</span>
            <div className="dropdown-content">
              <Link to="/obras">Listar Obras</Link>
              <Link to="/obras/nova">Cadastrar Obra</Link>
            </div>
          </li>

          {/* Menu Dropdown de Notas Fiscais */}
          <li className="dropdown">
            <span className="dropbtn">Notas Fiscais ▼</span>
            <div className="dropdown-content">
              <Link to="/notas">Listar Notas</Link>
              <Link to="/notas/nova">Cadastrar Nota</Link>
            </div>
          </li>
        </ul>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<h3>Bem-vindo ao sistema HidroPag!</h3>} />

          <Route path="/login" element={<Login />} />
          
          {/* Rotas Reais de Filiais que já criamos */}
          <Route path="/filiais" element={<FiliaisList />} />
          <Route path="/filiais/nova" element={<FilialForm />} />

          {/* Rotas Temporárias (Em Construção) */}
          <Route path="/usuarios" element={<UsuariosList />} />
          {/* <Route path="/usuarios" element={<EmConstrucao modulo="Usuários (Listagem)" />} /> */}
          <Route path="/usuarios/novo" element={<EmConstrucao modulo="Usuários (Cadastro)" />} />
          
          <Route path="/obras" element={<EmConstrucao modulo="Obras (Listagem)" />} />
          <Route path="/obras/nova" element={<EmConstrucao modulo="Obras (Cadastro)" />} />
          
          <Route path="/notas" element={<EmConstrucao modulo="Notas Fiscais (Listagem)" />} />
          <Route path="/notas/nova" element={<EmConstrucao modulo="Notas Fiscais (Cadastro)" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App
