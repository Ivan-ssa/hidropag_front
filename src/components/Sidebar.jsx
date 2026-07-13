import { NavLink, useNavigate } from "react-router-dom";
import {
  Droplets,
  LayoutDashboard,
  Building2,
  Users,
  HardHat,
  Receipt,
  CheckSquare,
  List,
  PlusCircle,
  LogOut,
} from "lucide-react";

// Estrutura de navegação: cada grupo tem um ícone + rótulo + sublinks (listar/cadastrar)
const grupos = [
  {
    label: "Usuários",
    icon: Users,
    links: [
      { to: "/usuarios", label: "Listar Usuários", icon: List },
      { to: "/usuarios/novo", label: "Cadastrar Usuário", icon: PlusCircle },
    ],
  },
  {
    label: "Filiais",
    icon: Building2,
    links: [
      { to: "/filiais", label: "Listar Filiais", icon: List },
      { to: "/filiais/nova", label: "Cadastrar Filial", icon: PlusCircle },
    ],
  },
  
  {
    label: "Obras",
    icon: HardHat,
    links: [
      { to: "/obras", label: "Listar Obras", icon: List },
      { to: "/obras/nova", label: "Cadastrar Obra", icon: PlusCircle },
    ],
  },
  {
    label: "Notas Fiscais",
    icon: Receipt,
    links: [
      { to: "/notas", label: "Listar Notas", icon: List },
      { to: "/notas/nova", label: "Cadastrar Nota", icon: PlusCircle },
    ],
  },
  {
    label: "Aprovações",
    icon: CheckSquare,
    links: [
      { to: "/aprovacoes", label: "Aprovar", icon: List },
      { to: "/aprovacoes/nova", label: "Listar ", icon: List },
    ],
  },
];

const linkBase =
  "flex items-center gap-2.5 pl-4 pr-3 py-2 text-sm rounded-md transition-colors border-l-4";

function Sidebar() {
  const navigate = useNavigate();

  const sair = () => {
    localStorage.removeItem("tokenHidropag");
    navigate("/login");
  };

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-ink-800 text-slate-100 flex flex-col">
      {/* Marca */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-flow-500/20 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-flow-400" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold text-white text-lg tracking-tight">
            HidroPag
          </p>
          <p className="text-[11px] text-slate-400 -mt-0.5">Gestão de Obras</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? "border-flow-400 bg-flow-500/15 text-white font-medium"
                : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Início
        </NavLink>

        {grupos.map((grupo) => (
          <div key={grupo.label}>
            <p className="flex items-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <grupo.icon className="w-3.5 h-3.5" />
              {grupo.label}
            </p>
            <div className="space-y-0.5">
              {grupo.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `${linkBase} ml-2 ${
                      isActive
                        ? "border-flow-400 bg-flow-500/15 text-white font-medium"
                        : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé / sair */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={sair}
          className="w-full flex items-center gap-2.5 pl-4 pr-3 py-2 text-sm rounded-md text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
