// src/components/Relatorio.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Download, Printer, AlertTriangle, CheckCircle2,
  DollarSign, TrendingUp, Building2, Eye, Pencil,
  Loader2, FilterX, FileText, BarChart3, ShieldAlert, Layers
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor) || 0);
};

const formatarMoedaCompacta = (valor) => {
  const num = Number(valor) || 0;
  if (num >= 1_000_000) return `R$ ${(num / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (num >= 1_000) return `R$ ${(num / 1_000).toFixed(0)}k`;
  return formatarMoeda(num);
};

export default function Relatorio() {
  const navigate = useNavigate();

  // Estados de dados reais da API (GETs)
  const [obrasReais, setObrasReais] = useState([]);
  const [notasReais, setNotasReais] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState(null);

  // Filtros do Painel
  const [filtroFilial, setFiltroFilial] = useState('todas');
  const [filtroObra, setFiltroObra] = useState('todas');
  const [filtroStatusSaude, setFiltroStatusSaude] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarDadosDaApi();
  }, []);

  const carregarDadosDaApi = async () => {
    try {
      setCarregando(true);
      setErroApi(null);
      const token = sessionStorage.getItem('tokenHidropag') || localStorage.getItem('tokenHidropag');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resObras, resNotas, resFiliais] = await Promise.all([
        axios.get(`${API_URL}/obras`, config),
        axios.get(`${API_URL}/notas`, config),
        axios.get(`${API_URL}/filiais`, config),
      ]);

      const listaObras = Array.isArray(resObras.data) ? resObras.data : (resObras.data?.data || []);
      const listaNotas = Array.isArray(resNotas.data) ? resNotas.data : (resNotas.data?.data || resNotas.data?.notas || []);
      const listaFiliais = Array.isArray(resFiliais.data) ? resFiliais.data : (resFiliais.data?.data || []);

      setObrasReais(listaObras);
      setNotasReais(listaNotas);
      setFiliais(listaFiliais);
    } catch (error) {
      console.error('Erro ao carregar dados do BI:', error);
      setErroApi('Não foi possível sincronizar os dados com o servidor. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  };

  // Obras disponíveis no select (encadeadas com a Filial selecionada)
  const obrasDisponiveisFiltro = useMemo(() => {
    return obrasReais.filter((o) => {
      if (o.ativo === false) return false;
      if (filtroFilial !== 'todas' && String(o.filialId || o.filial?.id) !== String(filtroFilial)) {
        return false;
      }
      return true;
    });
  }, [obrasReais, filtroFilial]);

  // --- MOTOR ANALÍTICO CONSOLIDADO COM FOCO EM OBRAS ---
  const dadosPainel = useMemo(() => {
    // 1. Filtra Obras base
    const obrasBase = obrasReais.filter((obra) => {
      if (obra.ativo === false) return false;
      if (filtroFilial !== 'todas' && String(obra.filialId || obra.filial?.id) !== String(filtroFilial)) {
        return false;
      }
      if (filtroObra !== 'todas' && String(obra.id) !== String(filtroObra)) {
        return false;
      }
      return true;
    });

    const idsObrasValidas = new Set(obrasBase.map((o) => String(o.id)));

    // 2. Filtra Notas pelo escopo de obras e período
    const notasFiltradas = notasReais.filter((nota) => {
      const idObraNota = String(nota.obraId || nota.obra?.id || '');
      if (!idsObrasValidas.has(idObraNota)) return false;

      if (dataInicio || dataFim) {
        const dataNota = (nota.data_emissao || nota.createdAt || '').slice(0, 10);
        if (dataInicio && (!dataNota || dataNota < dataInicio)) return false;
        if (dataFim && (!dataNota || dataNota > dataFim)) return false;
      }
      return true;
    });

    // Status 1 = Aprovada/Paga | Status 0 = Em Aprovação (secundário)
    const notasAprovadas = notasFiltradas.filter((n) => Number(n.status) === 1);
    const notasPendentes = notasFiltradas.filter((n) => Number(n.status) === 0);

    // 3. Calcula métricas detalhadas por Obra
    const obrasCalculadas = obrasBase.map((obra) => {
      const notasDaObraAprovadas = notasAprovadas.filter(
        (n) => String(n.obraId || n.obra?.id) === String(obra.id)
      );
      const notasDaObraPendentes = notasPendentes.filter(
        (n) => String(n.obraId || n.obra?.id) === String(obra.id)
      );

      const gasto = notasDaObraAprovadas.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);
      const pendente = notasDaObraPendentes.reduce((acc, n) => acc + Number(n.valor_total || 0), 0);
      const previsto = Number(obra.valor_previsto || 0);
      const saldo = previsto - gasto;
      const percentual = previsto > 0 ? Math.round((gasto / previsto) * 100) : 0;
      const percentualComprometido = previsto > 0 ? Math.round(((gasto + pendente) / previsto) * 100) : 0;
      const qtdNotas = notasDaObraAprovadas.length;
      const qtdPendentes = notasDaObraPendentes.length;
      const ticketMedioNota = qtdNotas > 0 ? gasto / qtdNotas : 0;

      // Classificação de Saúde Orçamentária da Obra
      let saude = 'saudavel'; // < 75%
      if (percentual >= 90 || saldo < 0) saude = 'critico';
      else if (percentual >= 75) saude = 'atencao';

      return {
        ...obra,
        nomeExibicao: obra.nome_obra || obra.nome || 'Obra sem identificação',
        nomeCliente: obra.cliente?.razao_social || obra.cliente?.nome || null,
        nomeFilial: obra.filial?.nome || 'Não vinculada',
        valor_previsto: previsto,
        gasto,
        pendente,
        saldo,
        percentual,
        percentualComprometido,
        qtdNotas,
        qtdPendentes,
        ticketMedioNota,
        saude,
      };
    });

    // Aplica filtro de Saúde Orçamentária se ativo
    const obrasFinais = obrasCalculadas
      .filter((o) => filtroStatusSaude === 'todos' || o.saude === filtroStatusSaude)
      .sort((a, b) => b.percentual - a.percentual);

    // Recalcula KPIs globais com base nas obras finais exibidas
    const idsObrasFinais = new Set(obrasFinais.map((o) => String(o.id)));
    const notasAprovadasFinais = notasAprovadas.filter((n) => idsObrasFinais.has(String(n.obraId || n.obra?.id || '')));
    const notasPendentesFinais = notasPendentes.filter((n) => idsObrasFinais.has(String(n.obraId || n.obra?.id || '')));

    const totalPrevisto = obrasFinais.reduce((acc, o) => acc + o.valor_previsto, 0);
    const totalGasto = obrasFinais.reduce((acc, o) => acc + o.gasto, 0);
    const totalPendente = obrasFinais.reduce((acc, o) => acc + o.pendente, 0);
    const saldoCaixa = totalPrevisto - totalGasto;
    const mediaExecutadaPorObra = obrasFinais.length > 0 ? totalGasto / obrasFinais.length : 0;

    // 4. Ranking Top 5 Obras por Volume Orçamentário (Previsto vs Executado)
    const topObrasVolume = [...obrasFinais]
      .sort((a, b) => b.valor_previsto - a.valor_previsto)
      .slice(0, 5);
    const maiorOrcamentoTop = topObrasVolume.reduce(
      (max, o) => Math.max(max, o.valor_previsto, o.gasto),
      0
    );

    // 5. Ranking Top 5 Fornecedores
    const mapaFornecedores = {};
    notasAprovadasFinais.forEach((nota) => {
      const nomeForn =
        nota.fornecedor?.razao_social ||
        nota.fornecedor?.nome ||
        'Fornecedor Não Identificado';
      mapaFornecedores[nomeForn] = (mapaFornecedores[nomeForn] || 0) + Number(nota.valor_total || 0);
    });

    const cores = ['#0f4c81', '#0d9488', '#f59e0b', '#e11d48', '#64748b'];
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

    // Contadores de saúde para semáforo executivo
    const resumoSaude = {
      criticas: obrasCalculadas.filter((o) => o.saude === 'critico').length,
      atencao: obrasCalculadas.filter((o) => o.saude === 'atencao').length,
      saudaveis: obrasCalculadas.filter((o) => o.saude === 'saudavel').length,
    };

    return {
      totalPrevisto,
      totalGasto,
      saldoCaixa,
      totalPendente,
      qtdNotasAprovadas: notasAprovadasFinais.length,
      qtdNotasPendentes: notasPendentesFinais.length,
      mediaExecutadaPorObra,
      obras: obrasFinais,
      topObrasVolume,
      maiorOrcamentoTop,
      fornecedoresTop,
      resumoSaude,
    };
  }, [obrasReais, notasReais, filtroFilial, filtroObra, filtroStatusSaude, dataInicio, dataFim]);

  const limparFiltros = () => {
    setFiltroFilial('todas');
    setFiltroObra('todas');
    setFiltroStatusSaude('todos');
    setDataInicio('');
    setDataFim('');
  };

  const temFiltroAtivo =
    filtroFilial !== 'todas' ||
    filtroObra !== 'todas' ||
    filtroStatusSaude !== 'todos' ||
    dataInicio !== '' ||
    dataFim !== '';

  // Resumo dos filtros para o cabeçalho oficial da folha A4
  const resumoFiltrosImpressao = useMemo(() => {
    const nomeFilial = filtroFilial === 'todas'
      ? 'Todas as Filiais'
      : filiais.find((f) => String(f.id) === String(filtroFilial))?.nome || 'Filial Selecionada';

    const nomeObra = filtroObra === 'todas'
      ? 'Todas as Obras'
      : obrasReais.find((o) => String(o.id) === String(filtroObra))?.nome_obra || 'Obra Selecionada';

    const periodo = dataInicio || dataFim
      ? `${dataInicio ? dataInicio.split('-').reverse().join('/') : 'Início'} até ${dataFim ? dataFim.split('-').reverse().join('/') : 'Hoje'}`
      : 'Período Completo';

    return { nomeFilial, nomeObra, periodo };
  }, [filtroFilial, filtroObra, dataInicio, dataFim, filiais, obrasReais]);

  const percentualGeralConsumo = dadosPainel.totalPrevisto > 0
    ? Math.round((dadosPainel.totalGasto / dadosPainel.totalPrevisto) * 100)
    : 0;

  // --- EXPORTAÇÃO PARA EXCEL (CSV FOCADO EM OBRAS) ---
  const exportarExcel = () => {
    const cabecalho = [
      'Obra',
      'CNO',
      'Cliente',
      'Filial',
      'Status Saude',
      'Qtd Notas Pagas',
      'Orcamento Previsto (R$)',
      'Total Executado (R$)',
      'Em Aprovacao (R$)',
      'Saldo Disponivel (R$)',
      'Consumo (%)',
    ];

    const mapStatusTexto = {
      critico: 'CRITICO (>=90%)',
      atencao: 'ATENCAO (75-89%)',
      saudavel: 'SAUDAVEL (<75%)',
    };

    const linhas = dadosPainel.obras.map((o) => [
      `"${o.nomeExibicao}"`,
      `"${o.cno || '-'}"`,
      `"${o.nomeCliente || '-'}"`,
      `"${o.nomeFilial}"`,
      `"${mapStatusTexto[o.saude]}"`,
      o.qtdNotas,
      o.valor_previsto.toFixed(2).replace('.', ','),
      o.gasto.toFixed(2).replace('.', ','),
      o.pendente.toFixed(2).replace('.', ','),
      o.saldo.toFixed(2).replace('.', ','),
      `${o.percentual}%`,
    ]);

    const csvConteudo =
      '\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\n');

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Carteira_Obras_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- GRÁFICO COMPARATIVO: TOP 5 OBRAS POR VOLUME ORÇAMENTÁRIO (PREVISTO VS EXECUTADO) ---
  const renderizarComparativoObras = () => {
    const lista = dadosPainel.topObrasVolume;
    if (!lista || lista.length === 0) {
      return (
        <div className="flex items-center justify-center h-44 text-xs text-slate-400">
          Nenhuma obra ativa para comparação no filtro atual.
        </div>
      );
    }

    return (
      <div className="space-y-3 print:space-y-2 pt-1">
        {lista.map((obra) => {
          const pctBarraPrevisto = dadosPainel.maiorOrcamentoTop > 0
            ? Math.max(Math.round((obra.valor_previsto / dadosPainel.maiorOrcamentoTop) * 100), 4)
            : 0;
          const pctBarraGasto = dadosPainel.maiorOrcamentoTop > 0
            ? Math.min(Math.round((obra.gasto / dadosPainel.maiorOrcamentoTop) * 100), 100)
            : 0;

          return (
            <div key={obra.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs print:text-[10px]">
                <span className="font-bold text-hidrotec-3 truncate" title={obra.nomeExibicao}>
                  {obra.nomeExibicao}
                </span>
                <span className="text-[11px] print:text-[9px] text-slate-500 shrink-0 whitespace-nowrap">
                  <strong className="text-hidrotec-1">{formatarMoedaCompacta(obra.gasto)}</strong> / {formatarMoedaCompacta(obra.valor_previsto)}
                </span>
              </div>

              {/* Barra dupla sobreposta: Orçamento (fundo azul claro) vs Executado (sólido) */}
              <div className="w-full bg-slate-100 rounded-md h-3.5 print:h-2.5 relative overflow-hidden">
                <div
                  className="h-full bg-blue-100 rounded-md transition-all duration-700"
                  style={{ width: `${pctBarraPrevisto}%` }}
                  title={`Orçamento Previsto: ${formatarMoeda(obra.valor_previsto)}`}
                />
                <div
                  className={`h-full rounded-md absolute top-0 left-0 transition-all duration-700 ${
                    obra.saude === 'critico' ? 'bg-red-600' : 'bg-hidrotec-1'
                  }`}
                  style={{ width: `${pctBarraGasto}%` }}
                  title={`Executado: ${formatarMoeda(obra.gasto)} (${obra.percentual}%)`}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-4 pt-1 text-[10px] print:text-[8.5px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-100 border border-blue-200 inline-block" /> Orçamento Previsto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-hidrotec-1 inline-block" /> Executado (Pago)
          </span>
        </div>
      </div>
    );
  };

  // --- GRÁFICO DE ROSCA SVG (TOP 5 FORNECEDORES) ---
  const renderizarRoscaSVG = () => {
    const lista = dadosPainel.fornecedoresTop;
    if (!lista || lista.length === 0) {
      return (
        <div className="flex items-center justify-center h-44 text-xs text-slate-400">
          Sem dados de fornecedores no período.
        </div>
      );
    }

    const raio = 62;
    const circunferencia = 2 * Math.PI * raio;
    let offsetAcumulado = 0;

    return (
      <div className="flex flex-col sm:flex-row print:flex-row items-center gap-6 print:gap-4 py-1 w-full min-w-0">
        <div className="relative w-36 h-36 print:w-28 print:h-28 shrink-0">
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
            <span className="text-[9px] font-bold uppercase text-slate-400">Top 5</span>
            <span className="text-xs font-bold text-hidrotec-3">Fornecedores</span>
          </div>
        </div>

        <div className="w-full flex-1 min-w-0 space-y-2 print:space-y-1">
          {lista.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 text-xs print:text-[10px] border-b border-slate-50 pb-1.5 last:border-b-0 last:pb-0 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.cor }}
                />
                <span
                  className="font-semibold text-hidrotec-3 truncate block"
                  title={item.nome}
                >
                  {item.nome}
                </span>
              </div>
              <div className="text-right shrink-0 whitespace-nowrap">
                <span className="font-bold text-hidrotec-3 mr-2">{item.percentual}%</span>
                <span className="text-slate-500 font-medium">{formatarMoeda(item.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBadgeSaude = (saude, percentual) => {
    if (saude === 'critico') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] print:text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert size={11} /> Crítico ({percentual}%)
        </span>
      );
    }
    if (saude === 'atencao') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] print:text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={11} /> Atenção ({percentual}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] print:text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} /> Saudável ({percentual}%)
      </span>
    );
  };

  return (
    <div id="painel-relatorio-a4" className="max-w-7xl w-full mx-auto font-body pb-12 print:pb-0 print:max-w-none print:w-full">
      {/* REGRAS DE IMPRESSÃO A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, nav, [class*="sidebar"], [class*="Sidebar"], [class*="navbar"], [class*="Navbar"] {
            display: none !important;
          }
          #root, #root > div, main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            overflow: visible !important;
          }
          #painel-relatorio-a4 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO A4 */}
      <div className="hidden print:flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            HIDROTEC • ENGENHARIA E GESTÃO DE OBRAS
          </p>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Relatório Gerencial da Carteira de Obras
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-slate-600">
            <span><strong>Filial:</strong> {resumoFiltrosImpressao.nomeFilial}</span>
            <span><strong>Obra:</strong> {resumoFiltrosImpressao.nomeObra}</span>
            <span><strong>Período:</strong> {resumoFiltrosImpressao.periodo}</span>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-500 shrink-0">
          <p className="font-bold text-slate-800">Documento Oficial A4</p>
          <p>
            Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* CABEÇALHO DA TELA */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
            BUSINESS INTELLIGENCE • CONTROLADORIA DE OBRAS
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-hidrotec-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            <span>Painel Gerencial de Obras</span>
          </h1>
        </div>

        {/* Semáforo rápido de saúde das obras */}
        {!carregando && (
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm text-xs">
            <span className="text-slate-400 font-semibold mr-1">Saúde das Obras:</span>
            <button
              type="button"
              onClick={() => setFiltroStatusSaude(filtroStatusSaude === 'critico' ? 'todos' : 'critico')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                filtroStatusSaude === 'critico' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {dadosPainel.resumoSaude.criticas} Críticas
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatusSaude(filtroStatusSaude === 'atencao' ? 'todos' : 'atencao')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                filtroStatusSaude === 'atencao' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {dadosPainel.resumoSaude.atencao} Atenção
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatusSaude(filtroStatusSaude === 'saudavel' ? 'todos' : 'saudavel')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                filtroStatusSaude === 'saudavel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {dadosPainel.resumoSaude.saudaveis} Saudáveis
            </button>
          </div>
        )}
      </header>

      {/* ALERTA DE ERRO DE API (SE HOUVER) */}
      {erroApi && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between print:hidden">
          <span className="font-medium">{erroApi}</span>
          <button
            type="button"
            onClick={carregarDadosDaApi}
            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS GLOBAIS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
              Data Inicial (Notas)
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2"
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
              Filial
            </label>
            <select
              value={filtroFilial}
              onChange={(e) => {
                setFiltroFilial(e.target.value);
                setFiltroObra('todas');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
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
              <option value="todas">Todas as Obras ({obrasDisponiveisFiltro.length})</option>
              {obrasDisponiveisFiltro.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome_obra || o.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-hidrotec-4 uppercase tracking-wider mb-1">
              Saúde Orçamentária
            </label>
            <div className="flex gap-2">
              <select
                value={filtroStatusSaude}
                onChange={(e) => setFiltroStatusSaude(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="critico">Crítico (≥ 90%)</option>
                <option value="atencao">Atenção (75% - 89%)</option>
                <option value="saudavel">Saudável (&lt; 75%)</option>
              </select>

              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  title="Limpar todos os filtros"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                >
                  <FilterX size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm font-medium text-hidrotec-4">Consolidando indicadores das obras...</p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* 4 CARDS DE KPIs COM FOCO NA CARTEIRA DE OBRAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-5 print:gap-3 print:break-inside-avoid">
            <div className="bg-white border border-slate-200 rounded-2xl print:rounded-xl p-5 print:p-3 shadow-sm print:shadow-none">
              <div className="flex items-center justify-between mb-2 print:mb-1">
                <span className="text-xs print:text-[9px] font-bold text-hidrotec-4 uppercase">Orçamento da Carteira</span>
                <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-blue-50 text-hidrotec-1 flex items-center justify-center">
                  <Building2 size={15} />
                </div>
              </div>
              <p className="text-2xl print:text-base font-display font-bold text-hidrotec-3">
                {formatarMoeda(dadosPainel.totalPrevisto)}
              </p>
              <p className="text-[11px] print:text-[9px] text-slate-400 mt-1">
                {dadosPainel.obras.length} {dadosPainel.obras.length === 1 ? 'obra ativa filtrada' : 'obras ativas filtradas'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl print:rounded-xl p-5 print:p-3 shadow-sm print:shadow-none">
              <div className="flex items-center justify-between mb-2 print:mb-1">
                <span className="text-xs print:text-[9px] font-bold text-hidrotec-4 uppercase">Total Executado (Pago)</span>
                <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp size={15} />
                </div>
              </div>
              <p className="text-2xl print:text-base font-display font-bold text-hidrotec-1">
                {formatarMoeda(dadosPainel.totalGasto)}
              </p>
              <p className="text-[11px] print:text-[9px] text-slate-400 mt-1">
                {percentualGeralConsumo}% do orçamento • {dadosPainel.qtdNotasAprovadas} notas pagas
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl print:rounded-xl p-5 print:p-3 shadow-sm print:shadow-none">
              <div className="flex items-center justify-between mb-2 print:mb-1">
                <span className="text-xs print:text-[9px] font-bold text-hidrotec-4 uppercase">Saldo Orçamentário</span>
                <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={15} />
                </div>
              </div>
              <p className={`text-2xl print:text-base font-display font-bold ${dadosPainel.saldoCaixa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatarMoeda(dadosPainel.saldoCaixa)}
              </p>
              <p className="text-[11px] print:text-[9px] text-slate-400 mt-1">
                {dadosPainel.totalPendente > 0 ? (
                  <span>
                    Em aprovação: <strong className="text-amber-600">{formatarMoedaCompacta(dadosPainel.totalPendente)}</strong> ({dadosPainel.qtdNotasPendentes})
                  </span>
                ) : (
                  'Sem notas pendentes de aprovação'
                )}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl print:rounded-xl p-5 print:p-3 shadow-sm print:shadow-none">
              <div className="flex items-center justify-between mb-2 print:mb-1">
                <span className="text-xs print:text-[9px] font-bold text-hidrotec-4 uppercase">Média por Obra</span>
                <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers size={15} />
                </div>
              </div>
              <p className="text-2xl print:text-base font-display font-bold text-hidrotec-3">
                {formatarMoeda(dadosPainel.mediaExecutadaPorObra)}
              </p>
              <p className="text-[11px] print:text-[9px] text-slate-400 mt-1">
                Desembolso médio por empreendimento
              </p>
            </div>
          </div>

          {/* GRID VISUAL: PESO ORÇAMENTÁRIO POR OBRA + TOP 5 FORNECEDORES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6 print:gap-3 print:break-inside-avoid">
            {/* COMPARATIVO PREVISTO VS EXECUTADO DAS PRINCIPAIS OBRAS */}
            <div className="w-full min-w-0 bg-white border border-slate-200 rounded-2xl print:rounded-xl p-6 print:p-4 shadow-sm print:shadow-none">
              <div className="mb-3">
                <h3 className="text-base print:text-xs font-display font-bold text-hidrotec-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-hidrotec-1" />
                  Maiores Obras por Volume Orçamentário
                </h3>
                <p className="text-[11px] print:text-[9px] text-slate-400">
                  Comparativo entre orçamento previsto e valor já executado
                </p>
              </div>
              {renderizarComparativoObras()}
            </div>

            {/* CONCENTRAÇÃO POR FORNECEDOR */}
            <div className="w-full min-w-0 bg-white border border-slate-200 rounded-2xl print:rounded-xl p-6 print:p-4 shadow-sm print:shadow-none">
              <div className="mb-2">
                <h3 className="text-base print:text-xs font-display font-bold text-hidrotec-3">
                  Concentração por Fornecedor (Top 5)
                </h3>
                <p className="text-[11px] print:text-[9px] text-slate-400">
                  Participação sobre o total executado nas obras filtradas
                </p>
              </div>
              {renderizarRoscaSVG()}
            </div>
          </div>

          {/* BLOCO DE EXECUÇÃO DETALHADA POR OBRA */}
          <div className="w-full min-w-0 overflow-hidden bg-white border border-slate-200 rounded-2xl print:rounded-xl p-6 print:p-4 shadow-sm print:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 print:mb-3">
              <div>
                <h3 className="text-base print:text-xs font-display font-bold text-hidrotec-3">
                  Evolução Orçamentária por Empreendimento
                </h3>
                <p className="text-[11px] print:text-[9px] text-slate-400">
                  Percentual consumido do orçamento previsto, saldo disponível e alerta de teto
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] print:text-[9px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-hidrotec-1 inline-block" /> Executado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" /> Crítico (≥90%)
                </span>
                {dadosPainel.totalPendente > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Em Aprovação
                  </span>
                )}
              </div>
            </div>

            {dadosPainel.obras.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Nenhuma obra encontrada para os filtros selecionados.
              </p>
            ) : (
              <div className="space-y-5 print:space-y-3">
                {dadosPainel.obras.map((obra) => {
                  const larguraAprovada = Math.min(obra.percentual, 100);
                  const larguraPendente = Math.min(
                    Math.max(obra.percentualComprometido - obra.percentual, 0),
                    100 - larguraAprovada
                  );

                  return (
                    <div key={obra.id} className="print:break-inside-avoid">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm print:text-xs font-bold text-hidrotec-3 truncate">
                            {obra.nomeExibicao}
                          </span>
                          <span className="text-[11px] print:text-[9px] text-slate-400 hidden sm:inline truncate">
                            • {obra.nomeFilial} {obra.nomeCliente ? `(${obra.nomeCliente})` : ''}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {renderBadgeSaude(obra.saude, obra.percentual)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs print:text-[10px] mb-1.5 print:mb-1">
                        <span className="text-slate-500 font-medium">
                          Executado: <strong className="text-hidrotec-3">{formatarMoeda(obra.gasto)}</strong> de {formatarMoeda(obra.valor_previsto)}
                          <span className="text-slate-400 ml-2">({obra.qtdNotas} {obra.qtdNotas === 1 ? 'nota' : 'notas'})</span>
                          {obra.pendente > 0 && (
                            <span className="text-amber-600 ml-2 text-[11px] print:text-[9px]">
                              • +{formatarMoeda(obra.pendente)} em aprovação
                            </span>
                          )}
                        </span>
                        <span className="text-slate-500">
                          Saldo livre: <strong className={obra.saldo < 0 ? 'text-red-600' : 'text-emerald-700'}>{formatarMoeda(obra.saldo)}</strong>
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3 print:h-2 overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-700 ${
                            obra.saude === 'critico' ? 'bg-red-600' : 'bg-hidrotec-1'
                          }`}
                          style={{ width: `${larguraAprovada}%` }}
                        />
                        {larguraPendente > 0 && (
                          <div
                            className="h-full bg-amber-400 transition-all duration-700"
                            style={{ width: `${larguraPendente}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TABELA ANALÍTICA CONSOLIDADA DAS OBRAS */}
          <div className="w-full bg-white border border-slate-200 rounded-2xl print:rounded-xl shadow-sm print:shadow-none overflow-hidden">
            <div className="p-5 print:p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base print:text-xs font-display font-bold text-hidrotec-3 flex items-center gap-2">
                  <FileText size={16} className="text-hidrotec-1" />
                  Demonstrativo Consolidado por Obra
                </h3>
                <p className="text-xs print:text-[10px] text-slate-400">
                  Posição orçamentária, volume de notas, executado e saldo disponível por empreendimento.
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
                  Imprimir A4 / PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] print:text-[8.5px] uppercase tracking-wider text-hidrotec-4 bg-slate-50">
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold">Obra / CNO</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold">Filial / Cliente</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold text-center">Notas</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold text-right">Orçamento</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold text-right">Executado (Pago)</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold text-right">Saldo Livre</th>
                    <th className="px-4 print:px-2.5 py-3 print:py-2 font-semibold text-center">Saúde</th>
                    <th className="px-4 py-3 font-semibold text-right print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs print:text-[10px]">
                  {dadosPainel.obras.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">
                        Nenhuma obra cadastrada para exibição com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    dadosPainel.obras.map((obra) => (
                      <tr key={obra.id} className="hover:bg-slate-50/70 transition-colors print:break-inside-avoid">
                        <td className="px-4 print:px-2.5 py-3 print:py-2">
                          <p className="font-bold text-hidrotec-3">{obra.nomeExibicao}</p>
                          <p className="text-[10px] print:text-[8.5px] text-slate-400">CNO: {obra.cno || 'Não informado'}</p>
                        </td>
                        <td className="px-4 print:px-2.5 py-3 print:py-2">
                          <p className="font-medium text-hidrotec-4">{obra.nomeFilial}</p>
                          {obra.nomeCliente && (
                            <p className="text-[10px] print:text-[8.5px] text-slate-400 truncate max-w-[180px]">
                              {obra.nomeCliente}
                            </p>
                          )}
                        </td>
                        <td className="px-4 print:px-2.5 py-3 print:py-2 text-center">
                          <span className="font-bold text-slate-700">{obra.qtdNotas}</span>
                          {obra.qtdNotas > 0 && (
                            <p className="text-[10px] print:text-[8px] text-slate-400">
                              Média {formatarMoedaCompacta(obra.ticketMedioNota)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 print:px-2.5 py-3 print:py-2 font-medium text-hidrotec-3 text-right whitespace-nowrap">
                          {formatarMoeda(obra.valor_previsto)}
                        </td>
                        <td className="px-4 print:px-2.5 py-3 print:py-2 text-right whitespace-nowrap">
                          <p className="font-bold text-hidrotec-1">{formatarMoeda(obra.gasto)}</p>
                          {obra.pendente > 0 && (
                            <p className="text-[10px] print:text-[8px] text-amber-600 font-medium">
                              + {formatarMoeda(obra.pendente)} em aprovação
                            </p>
                          )}
                        </td>
                        <td className={`px-4 print:px-2.5 py-3 print:py-2 font-bold text-right whitespace-nowrap ${obra.saldo < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {formatarMoeda(obra.saldo)}
                        </td>
                        <td className="px-4 print:px-2.5 py-3 print:py-2 text-center whitespace-nowrap">
                          {renderBadgeSaude(obra.saude, obra.percentual)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                          <button
                            type="button"
                            onClick={() => navigate(`/notas?obraId=${obra.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-hidrotec-1 hover:bg-blue-100 transition-colors mr-1.5 cursor-pointer"
                            title="Ver Notas da Obra"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/obras/editar/${obra.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                            title="Editar Obra"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dadosPainel.obras.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs print:text-[10px] text-hidrotec-3">
                      <td colSpan={2} className="px-4 print:px-2.5 py-3 print:py-2 uppercase">
                        Total Consolidado ({dadosPainel.obras.length} {dadosPainel.obras.length === 1 ? 'obra' : 'obras'})
                      </td>
                      <td className="px-4 print:px-2.5 py-3 print:py-2 text-center">
                        {dadosPainel.qtdNotasAprovadas}
                      </td>
                      <td className="px-4 print:px-2.5 py-3 print:py-2 text-right whitespace-nowrap">
                        {formatarMoeda(dadosPainel.totalPrevisto)}
                      </td>
                      <td className="px-4 print:px-2.5 py-3 print:py-2 text-right whitespace-nowrap">
                        <span className="text-hidrotec-1">{formatarMoeda(dadosPainel.totalGasto)}</span>
                        {dadosPainel.totalPendente > 0 && (
                          <span className="block text-[10px] print:text-[8px] text-amber-600 font-semibold">
                            + {formatarMoeda(dadosPainel.totalPendente)} em aprovação
                          </span>
                        )}
                      </td>
                      <td className={`px-4 print:px-2.5 py-3 print:py-2 text-right whitespace-nowrap ${dadosPainel.saldoCaixa < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {formatarMoeda(dadosPainel.saldoCaixa)}
                      </td>
                      <td className="px-4 print:px-2.5 py-3 print:py-2 text-center">
                        {percentualGeralConsumo}%
                      </td>
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* RODAPÉ DE ASSINATURA / CONFERÊNCIA NA FOLHA A4 */}
          <div className="hidden print:flex justify-between items-end mt-8 pt-4 text-[10px] text-slate-500 break-inside-avoid">
            <div>
              <p>Relatório gerado eletronicamente pelo sistema Hidropag / Hidrotec.</p>
              <p>Valores consolidados a partir das notas fiscais aprovadas e pagas por obra.</p>
            </div>
            <div className="text-center w-56">
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                Visto da Diretoria / Engenharia
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}