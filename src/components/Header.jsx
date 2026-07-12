import { useLocation } from "react-router-dom";

// Mapeia cada rota para um título e uma descrição curta exibidos no topo da página
const paginas = {
  "/": { titulo: "Início", desc: "Visão geral do sistema HidroPag" },
  "/login": { titulo: "Login", desc: "Acesso ao sistema" },
  "/filiais": { titulo: "Filiais", desc: "Listagem e gerenciamento de filiais" },
  "/filiais/nova": { titulo: "Nova Filial", desc: "Cadastro de uma nova filial" },
  "/usuarios": { titulo: "Usuários", desc: "Listagem e gerenciamento de usuários" },
  "/usuarios/novo": { titulo: "Novo Usuário", desc: "Cadastro de um novo usuário" },
  "/obras": { titulo: "Obras", desc: "Listagem e gerenciamento de obras" },
  "/obras/nova": { titulo: "Nova Obra", desc: "Cadastro de uma nova obra" },
  "/notas": { titulo: "Notas Fiscais", desc: "Listagem e gerenciamento de notas fiscais" },
  "/notas/nova": { titulo: "Nova Nota Fiscal", desc: "Cadastro de uma nova nota fiscal" },
  "/aprovacoes": { titulo: "Aprovações", desc: "Listagem e edição das decisões de aprovação" },
};

function Header() {
  const { pathname } = useLocation();
  const pagina = paginas[pathname] || { titulo: "HidroPag", desc: "" };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4">
      <h1 className="font-display font-semibold text-xl text-slate-800">
        {pagina.titulo}
      </h1>
      {pagina.desc && (
        <p className="text-sm text-slate-500 mt-0.5">{pagina.desc}</p>
      )}
    </header>
  );
}

export default Header;
