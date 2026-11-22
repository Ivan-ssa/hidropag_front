// src/components/Relatorio.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Download, Printer, AlertTriangle,
  DollarSign, TrendingUp, Clock, Building2, Eye, Pencil,
  Loader2, Sparkles, Database
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- DADOS SIMULADOS PARA DEMONSTRAÇÃO DO MVP ---
const DADOS_SIMULADOS = {
  obras: [
    {
      id: 'sim-1',
      nome_obra: 'Hospital Moinhos de Vento',
      cno: '123456789012',
      valor_previsto: 4000000,
      status: 1,
      ativo: true,
      filial: { id: 1, nome: 'Filial Porto Alegre' },
      gastoSimulado: 3120000,
    },
    {
      id: 'sim-2',
      nome_obra: 'Residencial Ipiranga',
      cno: '987654321098',
      valor_previsto: 2000000,
      status: 1,
      ativo: true,
      filial: { id: 1, nome: 'Filial Porto Alegre' },
      gastoSimulado: 1880000, // 94% - Alerta de estouro
    },
    {
      id: 'sim-3',
      nome_obra: 'Viaduto Terceira Perimetral',
      cno: '456789123456',
      valor_previsto: 9420000,
      status: 1,
      ativo: true,
      filial: { id: 2, nome: 'Filial Canoas' },
      gastoSimulado: 4184230,
    },
  ],
  fornecedoresTop: [
    { nome: 'Aço & Cia Ltda', valor: 2938953, percentual: 32, cor: '#0f4c81' },
    { nome: 'Cimentos Sul S.A.', valor: 2204215, percentual: 24, cor: '#e11d48' },
    { nome: 'Concreto Rápido', valor: 1653161, percentual: 18, cor: '#0d9488' },
    { nome: 'Instalações Hidro', valor: 1285792, percentual: 14, cor: '#f59e0b' },
    { nome: 'Outros Fornecedores', valor: 1102109, percentual: 12, cor: '#64748b' },
  ],
  pendentesSimulado: 840150,
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor) || 0);
};

export default function Relatorio() {
  const navigate = useNavigate();

  // Estados de dados reais da API
  const [obrasReais, setObrasReais] = useState([]);
  const [notasReais, setNotasReais] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Alternador entre Dados Reais e Simulação MVP
  const [modoSimulacao, setModoSimulacao] = useState(false);

  // Filtros do Painel
  const [filtroFilial, setFiltroFilial] = useState('todas');
  const [filtroObra, setFiltroObra] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarDadosDaApi();
  }, []);

  const carregarDadosDaApi = async () => {
    try {
      setCarregando(true);
      const token = sessionStorage.getItem('tokenHidropag') || localStorage.getItem('tokenHidropag');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resObras, resNotas, resFiliais] = await Promise.all([
        axios.get(`${API_URL}/obras`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/notas`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/filiais`, config).catch(() => ({ data: [] })),
      ]);

      const listaObras = Array.isArray(resObras.data) ? resObras.data : (resObras.data?.data || []);
      const listaNotas = Array.isArray(resNotas.data) ? resNotas.data : (resNotas.data?.data || resNotas.data?.notas || []);
      const listaFiliais = Array.isArray(resFiliais.data) ? resFiliais.data : (resFiliais.data?.data || []);

      setObrasReais(listaObras);
      setNotasReais(listaNotas);
      setFiliais(listaFiliais);

      // Se ainda não houver obras cadastradas no banco, ativa a simulação automaticamente para o MVP
      if (listaObras.length === 0) {
        setModoSimulacao(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do BI:', error);
      setModoSimulacao(true);
    } finally {
      setCarregando(false);
    }
  };

  // --- CÁLCULOS CONSOLIDADOS DO BI ---
  const dadosPainel = useMemo(() => {
    if (modoSimulacao) {
      const obrasFiltradasSim = DADOS_SIMULADOS.obras.filter((o) => {
        if (filtroObra !== 'todas' && String(o.id) !== String(filtroObra)) return false;
        return true;
      });

      const totalPrevisto = obrasFiltradasSim.reduce((acc, o) => acc + o.valor_previsto, 0);
      const totalGasto = obrasFiltradasSim.reduce((acc, o) => acc + o.gastoSimulado, 0);
      const saldoCaixa = totalPrevisto - totalGasto;

      const obrasComMetricas = obrasFiltradasSim.map((o) => {
        const percentual = o.valor_previsto > 0 ? Math.round((o.gastoSimulado / o.valor_previsto) * 100) : 0;
        return {
          ...o,
          gasto: o.gastoSimulado,
          percentual,
        };
      });

      return {
        totalPrevisto,
        totalGasto,
        saldoCaixa,
        totalPendente: DADOS_SIMULADOS.pendentesSimulado,
        obras: obrasComMetricas,
        fornecedoresTop: DADOS_SIMULADOS.fornecedoresTop,
      };
    }

    // MODO DADOS REAIS (Cruzando GET /obras e GET /notas)
    const obrasFiltradas = obrasReais.filter((obra) => {
      if (obra.ativo === false) return false;
      if (filtroFilial !== 'todas' && String(obra.filialId || obra.filial?.id) !== String(filtroFilial)) {
        return false;
      }
      if (filtroObra !== 'todas' && String(obra.id) !== String(filtroObra)) {
        return false;
      }
      return true;
    });

    const idsObrasValidas = new Set(obrasFiltradas.map((o) => String(o.id)));

    const notasFiltradas = notasReais.filter((nota) => {
      const idObraNota = String(nota.obraId || nota.obra?.id || '');
      if (idsObrasValidas.size > 0 && !idsObrasValidas.has(idObraNota)) return false;

      if (dataInicio || dataFim) {
        const dataNota = (nota.data_emissao || nota.createdAt || '').slice(0, 10);
        if (dataInicio && dataNota && dataNota < dataInicio) return false;
        if (dataFim && dataNota && dataNota > dataFim) return false;
      }
      return true;
    });

    // Status 1 = Aprovada | Status 0 = Pendente
    const notasAprovadas = notasFiltradas.filter((n) => Number(n.status) === 1);
    const notasPendentes = notasFiltradas.filter((n) => Number(n.status) === 0);

    const totalPrevisto = obrasFiltradas.reduce((acc, o) => acc + Number(o.valor_previsto || 0), 0);
    const totalGasto = notasAprovadas.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);
    const totalPendente = notasPendentes.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);
    const saldoCaixa = totalPrevisto - totalGasto;

    // Métricas por Obra
    const obrasComMetricas = obrasFiltradas.map((obra) => {
      const gastoObra = notasAprovadas
        .filter((n) => String(n.obraId || n.obra?.id) === String(obra.id))
        .reduce((acc, n) => acc + Number(n.valor_total || 0), 0);

      const previsto = Number(obra.valor_previsto || 0);
      const percentual = previsto > 0 ? Math.round((gastoObra / previsto) * 100) : 0;

      return {
        ...obra,
        valor_previsto: previsto,
        gasto: gastoObra,
        percentual,
      };
    }).sort((a, b) => b.percentual - a.percentual);

    // Agrupamento Top 5 Fornecedores
    const mapaFornecedores = {};
    notasAprovadas.forEach((nota) => {
      const nomeForn =
        nota.fornecedor?.razao_social ||
        nota.fornecedor?.nome ||
        'Fornecedor Não Identificado';
      mapaFornecedores[nomeForn] = (mapaFornecedores[nomeForn] || 0) + Number(nota.valor_total || 0);
    });

    const cores = ['#0f4c81', '#e11d48', '#0d9488', '#f59e0b', '#64748b'];
    const rankingFornecedores = Object.entries(mapaFornecedores)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);

    const top4 = rankingFornecedores.slice(0, 4);
    const outrosValor = rankingFornecedores.slice(4).reduce((acc, f) => acc + f.valor, 0);
    if (outrosValor > 0) {
      top4.push({ nome: 'Outros Fornecedores', valor: outrosValor });
    }

    const fornecedoresTop = top4.map((item, idx) => ({
      ...item,
      percentual: totalGasto > 0 ? Math.round((item.valor / totalGasto) * 100) : 0,
      cor: cores[idx % cores.length],
    }));

    return {
      totalPrevisto,
      totalGasto,
      saldoCaixa,
      totalPendente,
      obras: obrasComMetricas,
      fornecedoresTop,
    };
  }, [modoSimulacao, obrasReais, notasReais, filtroFilial, filtroObra, dataInicio, dataFim]);

  // --- EXPORTAÇÃO PARA EXCEL (CSV COMPATÍVEL COM EXCEL BRASIL) ---
  const exportarExcel = () => {
    const cabecalho = ['Obra', 'CNO', 'Filial', 'Orcamento Previsto (R$)', 'Total Gasto (R$)', 'Saldo (R$)', 'Consumo (%)'];
    const linhas = dadosPainel.obras.map((o) => [
      `"${o.nome_obra || o.nome}"`,
      `"${o.cno || '-'}"`,
      `"${o.filial?.nome || 'N/I'}"`,
      o.valor_previsto.toFixed(2).replace('.', ','),
      o.gasto.toFixed(2).replace('.', ','),
      (o.valor_previsto - o.gasto).toFixed(2).replace('.', ','),
      `${o.percentual}%`,
    ]);

    const csvConteudo =
      '\uFEFF' + // BOM UTF-8 para acentos no Excel
      [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\n');

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Gerencial_Obras_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CÁLCULO DO GRÁFICO DE ROSCA SVG ---
  const renderizarRoscaSVG = () => {
    const lista = dadosPainel.fornecedoresTop;
    if (!lista || lista.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          Sem dados de fornecedores no período.
        </div>
      );
    }

    const raio = 65;
    const circunferencia = 2 * Math.PI * raio;
    let offsetAcumulado = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        <div className="relative w-44 h-44 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
            {lista.map((item, idx) => {
              const tamanhoArco = (item.percentual / 100) * circunferencia;
              const strokeDasharray = `${tamanhoArco} ${circunferencia}`;
              const strokeDashoffset = -offsetAcumulado;
              offsetAcumulado += tamanhoArco;

              return (
                <circle
                  key={idx}
                  cx="90"
                  cy="90"
                  r={raio}
                  fill="transparent"
                  stroke={item.cor}
                  strokeWidth="26"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-bold uppercase text-slate-400">Top 5</span>
            <span className="text-sm font-bold text-hidrotec-3">Fornecedores</span>
          </div>
        </div>

        {/* Legenda */}
        <div className="w-full space-y-2.5">
          {lista.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.cor }}
                />
                <span className="font-semibold text-hidrotec-3 truncate">{item.nome}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-hidrotec-3 mr-2">{item.percentual}%</span>
                <span className="text-slate-400">{formatarMoeda(item.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl w-full mx-auto font-body pb-12 print:p-0">
      {/* CABEÇALHO E AVISO MVP */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase">
              BUSINESS INTELLIGENCE • RELATÓRIOS GERENCIAIS
            </p>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              MVP • Em evolução com API
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <PieChart className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Painel Financeiro de Obras
          </h1>
        </div>

        {/* Botão para alternar Simulação vs Dados Reais da API */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setModoSimulacao((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              modoSimulacao
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-white text-hidrotec-3 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {modoSimulacao ? (
              <>
                <Sparkles size={15} className="text-amber-600" />
                Exibindo Dados Simulados (Clique p/ API Real)
              </>
            ) : (
              <>
                <Database size={15} className="text-hidrotec-1" />
                Conectado à API Real (Clique p/ Simular MVP)
              </>
            )}
          </button>
        </div>
      </header>

      {/* BARRA DE FILTROS GLOBAIS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
            Data Inicial (Notas)
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={modoSimulacao}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
            Data Final (Notas)
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={modoSimulacao}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
            Filial
          </label>
          <select
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            disabled={modoSimulacao}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white disabled:bg-slate-50"
          >
            <option value="todas">Todas as Filiais</option>
            {filiais.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
            Obra / Empreendimento
          </label>
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
          >
            <option value="todas">Todas as Obras</option>
            {(modoSimulacao ? DADOS_SIMULADOS.obras : obrasReais).map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome_obra || o.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm font-medium text-hidrotec-4">Consolidando indicadores financeiros...</p>
        </div>
      ) : (
        <>
          {/* 4 CARDS DE KPIs EXECUTIVOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-hidrotec-4 uppercase">Orçamento Previsto</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-hidrotec-1 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-hidrotec-3">
                {formatarMoeda(dadosPainel.totalPrevisto)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Soma das obras filtradas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-hidrotec-4 uppercase">Total Gasto Realizado</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-hidrotec-1">
                {formatarMoeda(dadosPainel.totalGasto)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Notas fiscais aprovadas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-hidrotec-4 uppercase">Saldo Orçamentário</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className={`text-2xl font-display font-bold ${dadosPainel.saldoCaixa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatarMoeda(dadosPainel.saldoCaixa)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Disponível sobre o previsto</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-hidrotec-4 uppercase">Aprovações Pendentes</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-amber-600">
                {formatarMoeda(dadosPainel.totalPendente)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Aguardando análise do gestor</p>
            </div>
          </div>

          {/* GRÁFICOS CENTRAIS (ORÇAMENTO POR OBRA + ROSCA FORNECEDORES) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Barras Horizontais de Consumo por Obra */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-display font-bold text-hidrotec-3 mb-5">
                Orçamento Consumido por Obra (%)
              </h3>

              {dadosPainel.obras.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">
                  Nenhuma obra encontrada para os filtros selecionados.
                </p>
              ) : (
                <div className="space-y-5">
                  {dadosPainel.obras.map((obra) => {
                    const alertaEstouro = obra.percentual >= 85;
                    const largura = Math.min(obra.percentual, 100);

                    return (
                      <div key={obra.id}>
                        {/* Linha superior: Nome da obra + Alerta */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-hidrotec-3 truncate">
                            {obra.nome_obra || obra.nome}
                          </span>
                          {alertaEstouro && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 shrink-0">
                              <AlertTriangle size={12} /> Estouro / Alerta
                            </span>
                          )}
                        </div>

                        {/* Linha intermediária: Valores financeiros à esquerda e % à direita */}
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500 font-medium">
                            <strong className="text-hidrotec-3">{formatarMoeda(obra.gasto)}</strong> de {formatarMoeda(obra.valor_previsto)}
                          </span>
                          <span
                            className={`font-bold ${
                              alertaEstouro ? 'text-red-600' : 'text-hidrotec-1'
                            }`}
                          >
                            {obra.percentual}%
                          </span>
                        </div>

                        {/* Barra de progresso limpa */}
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              alertaEstouro ? 'bg-red-600' : 'bg-hidrotec-1'
                            }`}
                            style={{ width: `${largura}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gráfico de Rosca - Participação por Fornecedor */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-base font-display font-bold text-hidrotec-3 mb-2">
                Participação por Fornecedor (Top 5)
              </h3>
              {renderizarRoscaSVG()}
            </div>
          </div>

          {/* TABELA DE ACOMPANHAMENTO E EXPORTAÇÃO */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-display font-bold text-hidrotec-3">
                  Detalhamento Consolidado por Obra
                </h3>
                <p className="text-xs text-slate-400">
                  Acompanhe o saldo e exporte o fechamento gerencial.
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={exportarExcel}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-hidrotec-3 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={15} className="text-emerald-600" />
                  Exportar Excel
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  Gerar PDF / Imprimir
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/60">
                    <th className="px-6 py-3.5 font-semibold">Obra</th>
                    <th className="px-6 py-3.5 font-semibold">Filial</th>
                    <th className="px-6 py-3.5 font-semibold">Orçamento</th>
                    <th className="px-6 py-3.5 font-semibold">Realizado</th>
                    <th className="px-6 py-3.5 font-semibold text-center">% Consumido</th>
                    <th className="px-6 py-3.5 font-semibold text-right print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {dadosPainel.obras.map((obra) => {
                    const critico = obra.percentual >= 85;
                    return (
                      <tr key={obra.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-hidrotec-3">
                          {obra.nome_obra || obra.nome}
                        </td>
                        <td className="px-6 py-4 text-hidrotec-4">
                          {obra.filial?.nome || 'Não vinculada'}
                        </td>
                        <td className="px-6 py-4 font-medium text-hidrotec-3">
                          {formatarMoeda(obra.valor_previsto)}
                        </td>
                        <td className="px-6 py-4 font-bold text-hidrotec-1">
                          {formatarMoeda(obra.gasto)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              critico
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {obra.percentual}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap print:hidden">
                          {!modoSimulacao && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/notas?obraId=${obra.id}`)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-hidrotec-1 hover:bg-blue-100 transition-colors mr-1.5"
                                title="Ver Notas da Obra"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/obras/editar/${obra.id}`)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                title="Editar Obra"
                              >
                                <Pencil size={15} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}