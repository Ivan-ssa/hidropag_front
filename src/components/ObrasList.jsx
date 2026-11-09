import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Plus, Loader2, ChevronRight, Pencil } from 'lucide-react';

export default function ObrasList() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('tokenHidropag');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [respostaObras, respostaNotas] = await Promise.all([
        axios.get(`${API_URL}/obras`, config),
        axios.get(`${API_URL}/notas`, config).catch(() => ({ data: [] }))
      ]);
      
      setObras(Array.isArray(respostaObras.data) ? respostaObras.data : (respostaObras.data?.data || []));
      
      const dadosNotas = respostaNotas.data;
      setNotas(Array.isArray(dadosNotas) ? dadosNotas : (dadosNotas.data || dadosNotas.notas || []));
      
      setErro(null);
    } catch (error) {
      console.error("🔍 Erro ao buscar dados:", error);
      setErro('Não foi possível carregar a lista de obras do sistema.');
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const obrasAtivas = obras.filter(obra => obra.status !== 3 && obra.ativo !== false).length;

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
            GESTÃO DE PROJETOS
          </p>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2">
            Gerenciamento de Obras
          </h1>
          <p className="text-sm text-hidrotec-4">
            Acompanhe o orçamento e a evolução financeira das suas obras.
          </p>
        </div>
        
        <Link 
          to="/obras/nova" 
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nova Obra
        </Link>
      </header>

      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-hidrotec-3">{obrasAtivas}</span>
          <span className="text-sm font-medium text-hidrotec-4 uppercase tracking-wide">
            Obras ativas
          </span>
        </div>
        <p className="text-xs text-hidrotec-4">Visão consolidada dos projetos em andamento</p>
      </div>

      {carregando ? (
        <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium text-hidrotec-4">A carregar obras...</p>
        </div>
      ) : erro ? (
        <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50 rounded-2xl border border-red-100">
          {erro}
        </div>
      ) : obras.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Building2 className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
          <p className="font-medium mb-1">Nenhuma obra cadastrada ainda.</p>
          <p className="text-sm">Clique em "Nova Obra" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {obras.map((obra) => {
            // Filtra notas da obra com status 1 (Aprovada) para somar no total gasto
            const notasDaObra = notas.filter(n => String(n.obraId || n.obra?.id) === String(obra.id) && Number(n.status) === 1);
            const gastoCalculado = notasDaObra.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);

            const orcamento = Number(obra.valor_previsto || obra.orcamentoPrevisto || 0);
            const gasto = Number(obra.totalGasto || obra.total_gasto || gastoCalculado);
            const percentual = orcamento > 0 ? Math.round((gasto / orcamento) * 100) : 0;
            const larguraBarra = percentual > 100 ? 100 : percentual;

            return (
              <div key={obra.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                
                <div className="p-6 pb-4 border-b border-slate-50 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-hidrotec-1" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-hidrotec-4 mb-1">
                        {obra.codigo || `OBR-${String(obra.id).padStart(3, '0')}`} {obra.cno && `• CNO: ${obra.cno}`}
                      </p>
                      <h3 className="text-xl font-display font-semibold text-hidrotec-3 leading-tight">
                        {obra.nome_obra || obra.nome || obra.descricao || 'Obra sem nome'}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/obras/editar/${obra.id}`)}
                      className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors"
                      title="Editar Obra"
                    >
                      <Pencil size={15} />
                    </button>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      obra.status !== 3 && obra.ativo !== false ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {obra.status === 1 ? 'Em Andamento' : obra.status === 2 ? 'Pausada' : obra.status === 3 ? 'Finalizada' : 'Ativa'}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Cliente</p>
                    <p className="text-sm font-medium text-hidrotec-3 truncate">
                      {obra.cliente?.razao_social || obra.cliente?.razaoSocial || obra.cliente?.nome || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Filial Responsável</p>
                    <p className="text-sm font-medium text-hidrotec-3 truncate">
                      {obra.filial?.nome || 'Não informada'}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5 bg-slate-50/50 mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-hidrotec-3">Consumo do orçamento</p>
                    <p className={`text-xs font-bold ${percentual > 90 ? 'text-red-500' : 'text-hidrotec-1'}`}>
                      {percentual}%
                    </p>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${percentual > 90 ? 'bg-red-500' : 'bg-hidrotec-1'}`}
                      style={{ width: `${larguraBarra}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 mb-0.5">Valor Previsto</p>
                      <p className="text-sm font-bold text-hidrotec-3">{formatarMoeda(orcamento)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-slate-400 mb-0.5">Total Gasto (Notas)</p>
                      <p className="text-sm font-bold text-hidrotec-3">{formatarMoeda(gasto)}</p>
                    </div>
                  </div>
                </div>

                <Link 
                  to={`/notas?obraId=${obra.id}`}
                  className="px-6 py-3 border-t border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center group"
                >
                  <span className="text-xs font-medium text-hidrotec-4 group-hover:text-hidrotec-1 transition-colors flex items-center gap-1">
                    Ver Notas da Obra
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                </Link>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}