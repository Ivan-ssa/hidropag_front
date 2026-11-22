// src/pages/ObrasList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Plus, Loader2, Pencil, Search, X, 
  MapPin, Phone, Mail, FileText, Building, User, DollarSign, ExternalLink
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

const maskCNPJ = (value) => {
  if (!value) return "-";
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/gi, '')
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3')
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, '.$1/$2')
    .replace(/([A-Z0-9]{4})([0-9])/, '$1-$2')
    .slice(0, 18);
};

const maskCPF = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

const maskCEP = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export default function ObrasList() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  
  const [obraSelecionada, setObraSelecionada] = useState(null);

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
      
      const listaObras = Array.isArray(respostaObras.data) 
        ? respostaObras.data 
        : (respostaObras.data?.data || []);
      setObras(listaObras);
      
      const dadosNotas = respostaNotas.data;
      setNotas(Array.isArray(dadosNotas) ? dadosNotas : (dadosNotas.data || dadosNotas.notas || []));
      setErro(null);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setErro('Não foi possível carregar a lista de obras do sistema.');
    } finally {
      setCarregando(false);
    }
  };

  const getStatusInfo = (obra) => {
    if (obra.ativo === false || obra.status === 'Inativo') {
      return { rotulo: 'Inativa', cor: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    const statusNum = Number(obra.status);
    switch (statusNum) {
      case 0:
        return { rotulo: 'Nova', cor: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 1:
        return { rotulo: 'Em Andamento', cor: 'bg-green-50 text-green-700 border-green-200' };
      case 2:
        return { rotulo: 'Pausada', cor: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 3:
        return { rotulo: 'Finalizada', cor: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { rotulo: 'Em Andamento', cor: 'bg-green-50 text-green-700 border-green-200' };
    }
  };

  const obrasFiltradas = obras.filter(obra => {
    const estaInativa = obra.ativo === false || obra.status === 'Inativo';
    
    if (filtroStatus === 'inativa' && !estaInativa) return false;
    if (filtroStatus !== 'inativa' && estaInativa) return false;

    if (filtroStatus === 'nova' && Number(obra.status) !== 0 && obra.status !== 'Nova') return false;
    if (filtroStatus === 'andamento' && Number(obra.status) !== 1) return false;
    if (filtroStatus === 'pausada' && Number(obra.status) !== 2) return false;
    if (filtroStatus === 'finalizada' && Number(obra.status) !== 3) return false;

    const termo = busca.toLowerCase();
    if (!termo) return true;

    const nome = (obra.nome_obra || obra.nome || '').toLowerCase();
    const cno = (obra.cno || '').toLowerCase();
    const filial = (obra.filial?.nome || '').toLowerCase();
    const cliente = (obra.cliente?.razao_social || obra.cliente?.nome || '').toLowerCase();
    const endereco = (obra.endereco_localizacao || '').toLowerCase();

    return nome.includes(termo) || cno.includes(termo) || filial.includes(termo) || cliente.includes(termo) || endereco.includes(termo);
  });

  const totalAtivas = obras.filter(o => o.ativo !== false && Number(o.status) !== 3).length;

  const abaCls = (ativa) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
      ativa ? 'bg-hidrotec-3 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:text-hidrotec-3'
    }`;

  const getMetricasFinanceiras = (obra) => {
    if (!obra) return { orcamento: 0, gasto: 0, percentual: 0, saldo: 0 };
    const notasDaObra = notas.filter(n => String(n.obraId || n.obra?.id) === String(obra.id) && Number(n.status) === 1);
    const gastoCalculado = notasDaObra.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);
    const orcamento = Number(obra.valor_previsto || 0);
    const gasto = Number(obra.totalGasto || gastoCalculado);
    const percentual = orcamento > 0 ? Math.round((gasto / orcamento) * 100) : 0;
    const saldo = orcamento - gasto;
    return { orcamento, gasto, percentual, saldo };
  };

  const metricasModal = obraSelecionada ? getMetricasFinanceiras(obraSelecionada) : null;

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
            GESTÃO DE OBRAS
          </p>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <Building2 className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Obras e Empreendimentos
          </h1>
          <p className="text-sm text-hidrotec-4">
            Acompanhe a lista simplificada e clique em qualquer obra para ver os detalhes completos.
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

      {/* Abas e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto">
          <button onClick={() => setFiltroStatus('todas')} className={abaCls(filtroStatus === 'todas')}>
            Todas ({totalAtivas})
          </button>
          <button onClick={() => setFiltroStatus('nova')} className={abaCls(filtroStatus === 'nova')}>
            Novas
          </button>
          <button onClick={() => setFiltroStatus('andamento')} className={abaCls(filtroStatus === 'andamento')}>
            Em Andamento
          </button>
          <button onClick={() => setFiltroStatus('pausada')} className={abaCls(filtroStatus === 'pausada')}>
            Pausadas
          </button>
          <button onClick={() => setFiltroStatus('finalizada')} className={abaCls(filtroStatus === 'finalizada')}>
            Finalizadas
          </button>
          <button onClick={() => setFiltroStatus('inativa')} className={abaCls(filtroStatus === 'inativa')}>
            Inativas
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por obra, CNO, filial ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
          />
        </div>
      </div>

      {/* Tabela de Obras com dados essenciais */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">Carregando obras...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              {erro}
            </div>
          ) : obrasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <Building2 className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium">Nenhuma obra encontrada.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold">Obra / CNO</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Filial</th>
                  <th className="px-6 py-4 font-semibold">Valor Previsto</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {obrasFiltradas.map((obra) => {
                  const statusInfo = getStatusInfo(obra);
                  const nomeCliente = obra.cliente?.tipo_pessoa === 'PJ' 
                    ? obra.cliente?.razao_social 
                    : obra.cliente?.nome || 'Não informado';

                  return (
                    <tr 
                      key={obra.id}
                      onClick={() => setObraSelecionada(obra)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-hidrotec-3 group-hover:text-hidrotec-1 transition-colors">
                          {obra.nome_obra || obra.nome || 'Sem nome'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {obra.cno ? `CNO: ${obra.cno}` : 'Sem CNO informado'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-hidrotec-4">
                        <span className="font-medium text-hidrotec-3 block truncate max-w-[200px]">
                          {nomeCliente}
                        </span>
                        <span className="text-xs text-slate-400">
                          {obra.cliente?.tipo_pessoa || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-hidrotec-4">
                        <span className="font-medium text-hidrotec-3">
                          {obra.filial?.nome || 'Não vinculada'}
                        </span>
                        {obra.filial?.cidade && (
                          <span className="text-xs text-slate-400 block">
                            {obra.filial.cidade} / {obra.filial.uf}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-hidrotec-3">
                        {formatarMoeda(obra.valor_previsto)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.cor}`}>
                          {statusInfo.rotulo}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/obras/editar/${obra.id}`);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2"
                          title="Editar Obra"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DETALHADO EXPANDIDO (MAX-W-5XL COM LETRAS MAIORES)        */}
      {/* ============================================================== */}
      {obraSelecionada && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header com tipografia destacada */}
            <div className="flex items-start justify-between p-6 sm:p-8 bg-slate-50 border-b border-slate-100">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-extra flex items-center justify-center text-hidrotec-1 shrink-0 mt-1">
                  <Building2 size={30} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusInfo(obraSelecionada).cor}`}>
                      {getStatusInfo(obraSelecionada).rotulo}
                    </span>
                    {obraSelecionada.cno && (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-lg">
                        CNO: {obraSelecionada.cno}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-hidrotec-3 leading-snug">
                    {obraSelecionada.nome_obra || obraSelecionada.nome}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 mt-1.5 flex items-center gap-2">
                    <MapPin size={16} className="shrink-0 text-hidrotec-1" />
                    {obraSelecionada.endereco_localizacao || "Endereço da obra não informado"}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setObraSelecionada(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-hidrotec-3 hover:bg-slate-200/50 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo com tipografia maior e legível */}
            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto text-base text-hidrotec-3">
              
              {/* Painel Orçamentário e Financeiro */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl p-6 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs sm:text-sm font-bold text-hidrotec-4 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={18} className="text-hidrotec-1" />
                    Balanço Orçamentário
                  </span>
                  <span className={`text-sm sm:text-base font-bold ${metricasModal.percentual > 90 ? 'text-red-500' : 'text-hidrotec-1'}`}>
                    {metricasModal.percentual}% consumido
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 mb-5 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ${metricasModal.percentual > 90 ? 'bg-red-500' : 'bg-hidrotec-1'}`}
                    style={{ width: `${Math.min(metricasModal.percentual, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                  <div className="bg-white/80 p-4 rounded-xl border border-slate-200/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Valor Previsto</p>
                    <p className="text-xl sm:text-2xl font-bold text-hidrotec-3">{formatarMoeda(metricasModal.orcamento)}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-slate-200/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Total em Notas Fiscais</p>
                    <p className="text-xl sm:text-2xl font-bold text-hidrotec-1">{formatarMoeda(metricasModal.gasto)}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-slate-200/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Saldo em Caixa</p>
                    <p className={`text-xl sm:text-2xl font-bold ${metricasModal.saldo < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      {formatarMoeda(metricasModal.saldo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Colunas: Filial e Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Filial */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-hidrotec-1 font-bold text-sm uppercase tracking-wider">
                      <Building size={18} />
                      Filial Responsável
                    </div>
                    {obraSelecionada.filial ? (
                      <div className="space-y-3.5 text-sm">
                        <div>
                          <span className="text-slate-400 block text-xs uppercase font-semibold">Nome da Filial</span>
                          <span className="font-bold text-base text-hidrotec-3">{obraSelecionada.filial.nome}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-xs uppercase font-semibold">CNPJ</span>
                          <span className="font-medium text-slate-700">{maskCNPJ(obraSelecionada.filial.cnpj)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-xs uppercase font-semibold">Localização da Unidade</span>
                          <span className="text-slate-700 block">
                            {obraSelecionada.filial.logradouro || "Logradouro N/I"}, {obraSelecionada.filial.numero || "S/N"}
                          </span>
                          <span className="text-slate-700 block font-medium">
                            {obraSelecionada.filial.cidade} / {obraSelecionada.filial.uf} - CEP: {maskCEP(obraSelecionada.filial.cep)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Nenhuma filial vinculada.</p>
                    )}
                  </div>
                </div>

                {/* Cliente */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-hidrotec-1 font-bold text-sm uppercase tracking-wider">
                      <User size={18} />
                      Cliente Proprietário
                    </div>
                    {obraSelecionada.cliente ? (
                      <div className="space-y-3.5 text-sm">
                        <div>
                          <span className="text-slate-400 block text-xs uppercase font-semibold">
                            {obraSelecionada.cliente.tipo_pessoa === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                          </span>
                          <span className="font-bold text-base text-hidrotec-3">
                            {obraSelecionada.cliente.tipo_pessoa === 'PJ' 
                              ? obraSelecionada.cliente.razao_social 
                              : obraSelecionada.cliente.nome}
                          </span>
                        </div>
                        <div className="flex gap-6">
                          <div>
                            <span className="text-slate-400 block text-xs uppercase font-semibold">Documento</span>
                            <span className="font-medium text-slate-700">
                              {obraSelecionada.cliente.tipo_pessoa === 'PJ' 
                                ? maskCNPJ(obraSelecionada.cliente.cnpj) 
                                : maskCPF(obraSelecionada.cliente.cpf)}
                            </span>
                          </div>
                          {obraSelecionada.cliente.codigo_elevor && (
                            <div>
                              <span className="text-slate-400 block text-xs uppercase font-semibold">Cód. Elevor</span>
                              <span className="font-bold text-hidrotec-1">#{obraSelecionada.cliente.codigo_elevor}</span>
                            </div>
                          )}
                        </div>
                        {(obraSelecionada.cliente.email || obraSelecionada.cliente.telefone) && (
                          <div>
                            <span className="text-slate-400 block text-xs uppercase font-semibold">Contato</span>
                            {obraSelecionada.cliente.email && (
                              <p className="flex items-center gap-2 text-slate-700 truncate mt-0.5">
                                <Mail size={14} className="text-slate-400 shrink-0" />
                                {obraSelecionada.cliente.email}
                              </p>
                            )}
                            {obraSelecionada.cliente.telefone && (
                              <p className="flex items-center gap-2 text-slate-700 mt-0.5">
                                <Phone size={14} className="text-slate-400 shrink-0" />
                                {obraSelecionada.cliente.telefone}
                              </p>
                            )}
                          </div>
                        )}
                        {(obraSelecionada.cliente.endereco || obraSelecionada.cliente.cidade) && (
                          <div>
                            <span className="text-slate-400 block text-xs uppercase font-semibold">Endereço do Cliente</span>
                            <span className="text-slate-700 block">
                              {obraSelecionada.cliente.endereco}, {obraSelecionada.cliente.numero || "S/N"} {obraSelecionada.cliente.complemento ? `(${obraSelecionada.cliente.complemento})` : ''}
                            </span>
                            <span className="text-slate-700 block font-medium">
                              {obraSelecionada.cliente.bairro ? `${obraSelecionada.cliente.bairro} - ` : ''}{obraSelecionada.cliente.cidade}/{obraSelecionada.cliente.estado}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Nenhum cliente proprietário vinculado.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Rodapé com Ações */}
            <div className="p-5 sm:p-6 px-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link 
                to={`/notas?obraId=${obraSelecionada.id}`}
                className="text-sm font-semibold text-hidrotec-1 hover:underline flex items-center gap-2"
              >
                <FileText size={17} />
                Visualizar Notas Fiscais desta Obra
                <ExternalLink size={15} />
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setObraSelecionada(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/obras/editar/${obraSelecionada.id}`)}
                  className="px-5 py-2.5 text-sm font-bold bg-hidrotec-1 hover:bg-hidrotec-2 text-white rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <Pencil size={16} />
                  Editar Obra
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}