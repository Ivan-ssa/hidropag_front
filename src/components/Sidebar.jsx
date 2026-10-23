import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Building2, Users, PieChart, Settings, LogOut, Droplets } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const nome = localStorage.getItem('usuarioNome') || 'Usuário';
  const perfil = localStorage.getItem('usuarioPerfil') || 'Acesso';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/notas', icon: FileText, label: 'Notas Fiscais' },
    { path: '/obras', icon: Building2, label: 'Obras' },
    { path: '/fornecedores', icon: Users, label: 'Fornecedores' },
    { path: '/relatorios', icon: PieChart, label: 'Relatórios' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen font-body z-20">
      
      <div className="h-24 flex items-center px-8 mb-2">
        <Droplets className="w-8 h-8 text-hidrotec-2 fill-extra mr-2" strokeWidth={2} />
        <h1 className="text-2xl font-display font-bold text-hidrotec-1 tracking-tight">
          Hidro<span className="text-hidrotec-2">Pag</span>
        </h1>
      </div>

      <div className="px-8 mb-4">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Menu Principal</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                isActive
                  ? "bg-extra/60 text-hidrotec-1"
                  : "text-hidrotec-4 hover:bg-slate-50 hover:text-hidrotec-3"
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-extra flex items-center justify-center text-hidrotec-1 font-bold text-sm">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-hidrotec-3 truncate">{nome}</p>
            <p className="text-xs text-hidrotec-4 truncate capitalize">{perfil}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}