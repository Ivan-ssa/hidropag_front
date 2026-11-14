import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Users, Building2, ChevronRight, UserCog, Truck, Database } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="max-w-5xl w-full mx-auto font-body pb-12">
      
      {/* Cabeçalho da Página */}
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
            <Settings className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
          </div>
          Configurações e Cadastros Base
        </h1>
        <p className="text-sm text-hidrotec-4">
          Gerencie as unidades, clientes, fornecedores, utilizadores e parâmetros centrais do sistema HidroPag.
        </p>
      </header>

      {/* Cartões de Acesso aos Módulos de Configuração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cartão de Filiais */}
        <Link 
          to="/filiais"
          className="bg-white border border-slate-200 hover:border-hidrotec-2 rounded-2xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center mb-4 group-hover:bg-hidrotec-1 transition-colors">
              <Building2 className="w-6 h-6 text-hidrotec-1 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-display font-bold text-hidrotec-3 mb-2">
              Gestão de Filiais
            </h3>
            <p className="text-sm text-hidrotec-4 leading-relaxed mb-6">
              Registe, edite ou remova as unidades operacionais da empresa, com preenchimento automático por CEP e controlo de CNPJ.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-hidrotec-1 group-hover:translate-x-1 transition-transform">
            <span>Acessar a Filiais</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Cartão de Clientes */}
        <Link 
          to="/clientes"
          className="bg-white border border-slate-200 hover:border-hidrotec-2 rounded-2xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center mb-4 group-hover:bg-hidrotec-1 transition-colors">
              <Users className="w-6 h-6 text-hidrotec-1 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-display font-bold text-hidrotec-3 mb-2">
              Gestão de Clientes
            </h3>
            <p className="text-sm text-hidrotec-4 leading-relaxed mb-6">
              Administre a base de clientes proprietários de obras, com suporte inteligente a Pessoa Física (PF) e Pessoa Jurídica (PJ).
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-hidrotec-1 group-hover:translate-x-1 transition-transform">
            <span>Acessar a Clientes</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Cartão de Fornecedores */}
        <Link 
          to="/fornecedores"
          className="bg-white border border-slate-200 hover:border-hidrotec-2 rounded-2xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center mb-4 group-hover:bg-hidrotec-1 transition-colors">
              <Truck className="w-6 h-6 text-hidrotec-1 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-display font-bold text-hidrotec-3 mb-2">
              Gestão de Fornecedores
            </h3>
            <p className="text-sm text-hidrotec-4 leading-relaxed mb-6">
              Controle os fornecedores parceiros integrados aos lançamentos e faturas do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-hidrotec-1 group-hover:translate-x-1 transition-transform">
            <span>Acessar a Fornecedores</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Cartão de Utilizadores */}
        <Link 
          to="/usuarios"
          className="bg-white border border-slate-200 hover:border-hidrotec-2 rounded-2xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center mb-4 group-hover:bg-hidrotec-1 transition-colors">
              <UserCog className="w-6 h-6 text-hidrotec-1 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-display font-bold text-hidrotec-3 mb-2">
              Gestão de Usuários
            </h3>
            <p className="text-sm text-hidrotec-4 leading-relaxed mb-6">
              Administre os acessos, perfis de segurança (root, gestor, lançador, leitor) e equipas vinculadas às filiais.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-hidrotec-1 group-hover:translate-x-1 transition-transform">
            <span>Acessar a Usuários</span>
            <ChevronRight size={16} />
          </div>
        </Link>

      </div>

      {/* Informação do Sistema */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5 text-hidrotec-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-hidrotec-3 mb-0.5">Sincronização Ativa com a Base de Dados</h4>
          <p className="text-xs text-hidrotec-4">
            Todas as alterações efetuadas nestes módulos refletem-se instantaneamente em todo o ecossistema do HidroPag.
          </p>
        </div>
      </div>

    </div>
  );
}