import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ShieldCheck,
  Copy,
  Check,
  Eye,
  Pencil,
  RotateCcw,
  FileText,
  Send,
  X,
  Loader2,
  ExternalLink,
  Paperclip,
  DollarSign,
  Ban,
  ClipboardCheck,
} from 'lucide-react';
import ValidarAssinatura from './ValidarAssinatura';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AprovacoesList() {
  const token = localStorage.getItem('tokenHidropag') || sessionStorage.getItem('tokenHidropag');
  const usuarioId = localStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioId');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [abaAtiva, setAbaAtiva] = useState('historico'); // 'historico' | 'fila' | 'validar'
  const [aprovacoes, setAprovacoes] = useState([]);
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros do Histórico
  const [busca, setBusca] = useState('');
  const [filtroDecisao, setFiltroDecisao] = useState('todas'); // 'todas' | '1' | '2'
  const [hashCopiado, setHashCopiado] = useState(null);

  // Modal de Visualização de PDF
  const [pdfModal, setPdfModal] = useState(null); // { numero_nf, link_pdf, statusTexto }

  // Modal de Retificação (PUT /aprovacoes/:id)
  const [aprovacaoEditando, setAprovacaoEditando] = useState(null);
  const [formRetificacao, setFormRetificacao] = useState({ decisao: 1, observacao: '' });
  const [salvandoRetificacao, setSalvandoRetificacao] = useState(false);

  // Modal de Nova Assinatura na Fila (POST /aprovacoes)
  const [notaAnalisando, setNotaAnalisando] = useState(null);
  const [observacaoNova, setObservacaoNova] = useState('');
  const [processandoFila, setProcessandoFila] = useState(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resAprovacoes, resNotas] = await Promise.all([
        axios.get(`${API_URL}/aprovacoes`, config),
        axios.get(`${API_URL}/notas`, config),
      ]);

      setAprovacoes(Array.isArray(resAprovacoes.data) ? resAprovacoes.data : []);
      const listaNotas = Array.isArray(resNotas.data)
        ? resNotas.data
        : resNotas.data?.data || [];
      setNotas(listaNotas);
    } catch (err) {
      console.error('Erro ao carregar central de aprovações:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Mapa rápido de notas por ID para cruzar link_pdf, fornecedor e obra
  const notasMap = notas.reduce((acc, nota) => {
    acc[nota.id] = nota;
    return acc;
  }, {});

  const nomeFornecedor = (f) => {
    if (!f) return '-';
    if (typeof f === 'string') return f;
    return f.razao_social || f.nome_fantasia || f.nome || '-';
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);

  const copiarHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setHashCopiado(hash);
    setTimeout(() => setHashCopiado(null), 2000);
  };

  // --- MÉTRICAS DE AUDITORIA ---
  const totalLiberado = aprovacoes
    .filter((a) => Number(a.decisao) === 1)
    .reduce((soma, a) => soma + Number(a.nota?.valor_total || notasMap[a.nota?.id]?.valor_total || 0), 0);

  const totalBloqueado = aprovacoes
    .filter((a) => Number(a.decisao) === 2)
    .reduce((soma, a) => soma + Number(a.nota?.valor_total || notasMap[a.nota?.id]?.valor_total || 0), 0);

  const totalAssinados = aprovacoes.filter((a) => Boolean(a.hash_assinatura)).length;
  const notasPendentes = notas.filter((n) => Number(n.status) === 0);

  // --- RETIFICAR PARECER (PUT /aprovacoes/:id) ---
  const abrirRetificacao = (aprovacao) => {
    setAprovacaoEditando(aprovacao);
    setFormRetificacao({
      decisao: Number(aprovacao.decisao),
      observacao: aprovacao.observacao || '',
    });
  };

  const salvarRetificacao = async (e) => {
    e.preventDefault();
    if (!aprovacaoEditando) return;

    try {
      setSalvandoRetificacao(true);
      await axios.put(
        `${API_URL}/aprovacoes/${aprovacaoEditando.id}`,
        {
          decisao: Number(formRetificacao.decisao),
          observacao: formRetificacao.observacao,
        },
        config,
      );
      alert('Parecer retificado e carimbo do PDF atualizado com sucesso!');
      setAprovacaoEditando(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao retificar parecer:', err);
      alert('Erro ao retificar: ' + JSON.stringify(err.response?.data?.message || err.message));
    } finally {
      setSalvandoRetificacao(false);
    }
  };

  // --- ESTORNAR / REVOGAR APROVAÇÃO (DELETE /aprovacoes/:id) ---
  const estornarAprovacao = async (aprovacao) => {
    const numNf = aprovacao.nota?.numero_nf || '';
    const confirmou = window.confirm(
      `Deseja realmente ESTORNAR o parecer da NF ${numNf}?\n\nO carimbo será removido do PDF original e a nota voltará para Pendente.`,
    );
    if (!confirmou) return;

    try {
      await axios.delete(`${API_URL}/aprovacoes/${aprovacao.id}`, config);
      alert('Aprovação estornada! O PDF original foi restaurado.');
      carregarDados();
    } catch (err) {
      console.error('Erro ao estornar aprovação:', err);
      alert('Não foi possível estornar a aprovação.');
    }
  };

  // --- ASSINAR NOTA DA FILA (POST /aprovacoes) ---
  const processarParecerFila = async (decisao) => {
    if (!notaAnalisando) return;
    if (decisao === 2 && !observacaoNova.trim()) {
      alert('Informe o motivo da reprovação no campo de parecer.');
      return;
    }

    try {
      setProcessandoFila(true);
      await axios.post(
        `${API_URL}/aprovacoes`,
        {
          decisao: Number(decisao),
          observacao: observacaoNova,
          nota: notaAnalisando.id,
          usuario: usuarioId,
        },
        config,
      );

      alert(
        decisao === 1
          ? 'Nota aprovada e carimbada digitalmente!'
          : 'Nota reprovada e carimbada com parecer!',
      );
      setNotaAnalisando(null);
      setObservacaoNova('');
      carregarDados();
    } catch (err) {
      console.error('Erro ao registrar parecer:', err);
      alert('Erro ao gravar aprovação: ' + JSON.stringify(err.response?.data?.message || err.message));
    } finally {
      setProcessandoFila(false);
    }
  };

  // --- FILTRAGEM DO HISTÓRICO ---
  const aprovacoesFiltradas = aprovacoes
    .filter((a) => {
      if (filtroDecisao !== 'todas' && String(a.decisao) !== filtroDecisao) {
        return false;
      }

      const notaCompleta = notasMap[a.nota?.id] || a.nota || {};
      const termo = busca.toLowerCase();

      return (
        String(notaCompleta.numero_nf || '').toLowerCase().includes(termo) ||
        String(a.usuario?.nome || '').toLowerCase().includes(termo) ||
        nomeFornecedor(notaCompleta.fornecedor).toLowerCase().includes(termo) ||
        String(a.hash_assinatura || '').toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => new Date(b.decidido_em || 0) - new Date(a.decidido_em || 0));

  const inputCls =
    'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white';

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">
      {/* Cabeçalho */}
      <header className="mb-6">
        <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-1 flex items-center gap-2.5">
          <ClipboardCheck className="w-8 h-8 text-hidrotec-1" />
          Central de Aprovações e Auditoria
        </h1>
        <p className="text-sm text-hidrotec-4">
          Controle de assinaturas eletrônicas, histórico de decisões, retificações e validação de integridade.
        </p>
      </header>

      {/* Cards de Governança Financeira */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">
              TOTAL LIBERADO
            </p>
            <p className="text-lg font-display font-bold text-green-700 truncate">
              {formatarMoeda(totalLiberado)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <Ban size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">
              TOTAL BLOQUEADO
            </p>
            <p className="text-lg font-display font-bold text-red-700 truncate">
              {formatarMoeda(totalBloqueado)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">
              PDFs CARIMBADOS
            </p>
            <p className="text-2xl font-display font-bold text-hidrotec-3">{totalAssinados}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">
              FILA PENDENTE
            </p>
            <p className="text-2xl font-display font-bold text-hidrotec-3">{notasPendentes.length}</p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm mb-6 w-fit">
        <button
          onClick={() => setAbaAtiva('historico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all ${
            abaAtiva === 'historico'
              ? 'bg-hidrotec-3 text-white shadow-sm'
              : 'text-hidrotec-4 hover:text-hidrotec-3'
          }`}
        >
          <ShieldCheck size={15} />
          Histórico & Carimbos ({aprovacoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('fila')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all ${
            abaAtiva === 'fila'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-hidrotec-4 hover:text-hidrotec-3'
          }`}
        >
          <Clock size={15} />
          Fila de Assinatura ({notasPendentes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('validar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all ${
            abaAtiva === 'validar'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-hidrotec-4 hover:text-hidrotec-3'
          }`}
        >
          <CheckCircle size={15} />
          Validar PDF / Hash
        </button>
      </div>

      {/* =================================================================== */}
      {/* ABA 1: HISTÓRICO DE AUDITORIA E CARIMBOS                            */}
      {/* =================================================================== */}
      {abaAtiva === 'historico' && (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por NF, gestor, fornecedor ou hash SHA-256..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filtroDecisao}
                onChange={(e) => setFiltroDecisao(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-hidrotec-3 focus:outline-none focus:border-hidrotec-2"
              >
                <option value="todas">Todas as Decisões</option>
                <option value="1">Somente Aprovadas</option>
                <option value="2">Somente Reprovadas</option>
              </select>

              <button
                onClick={carregarDados}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-hidrotec-3 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Atualizar lista"
              >
                <RotateCcw size={14} /> Atualizar
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {carregando ? (
                <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm text-hidrotec-4">Carregando registros de auditoria...</p>
                </div>
              ) : aprovacoesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
                  <ShieldCheck className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
                  <p className="font-medium">Nenhum registro de aprovação encontrado.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/60">
                      <th className="px-4 py-3 font-semibold">Nota / Fornecedor</th>
                      <th className="px-4 py-3 font-semibold">Valor</th>
                      <th className="px-4 py-3 font-semibold">Gestor / Data</th>
                      <th className="px-4 py-3 font-semibold text-center">Decisão</th>
                      <th className="px-4 py-3 font-semibold">Assinatura Eletrônica</th>
                      <th className="px-4 py-3 font-semibold">Parecer</th>
                      <th className="px-4 py-3 font-semibold text-right">Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aprovacoesFiltradas.map((a) => {
                      const notaCompleta = notasMap[a.nota?.id] || a.nota || {};
                      const aprovado = Number(a.decisao) === 1;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-hidrotec-3">
                              NF {notaCompleta.numero_nf || '-'}
                            </p>
                            <p
                              className="text-xs text-hidrotec-4 truncate max-w-[160px]"
                              title={nomeFornecedor(notaCompleta.fornecedor)}
                            >
                              {nomeFornecedor(notaCompleta.fornecedor)}
                            </p>
                          </td>

                          <td className="px-4 py-3 font-bold text-hidrotec-3 whitespace-nowrap">
                            {formatarMoeda(notaCompleta.valor_total)}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-700">{a.usuario?.nome || 'Gestor'}</p>
                            <p className="text-[11px] text-slate-400">
                              {a.decidido_em
                                ? new Date(a.decidido_em).toLocaleString('pt-BR')
                                : '-'}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {aprovado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-green-50 text-green-700">
                                <CheckCircle size={12} /> Aprovado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-red-50 text-red-700">
                                <XCircle size={12} /> Reprovado
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {a.hash_assinatura ? (
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700">
                                    <ShieldCheck size={13} />
                                    {a.carimbo?.codigoAutenticacao ||
                                      String(a.id).slice(0, 8).toUpperCase()}
                                  </span>
                                  <p
                                    className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]"
                                    title={a.hash_assinatura}
                                  >
                                    {a.hash_assinatura}
                                  </p>
                                </div>
                                <button
                                  onClick={() => copiarHash(a.hash_assinatura)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors"
                                  title="Copiar Hash SHA-256"
                                >
                                  {hashCopiado === a.hash_assinatura ? (
                                    <Check size={13} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sem anexo PDF</span>
                            )}
                          </td>

                          <td
                            className="px-4 py-3 text-xs text-slate-600 truncate max-w-[160px]"
                            title={a.observacao}
                          >
                            {a.observacao || '-'}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {notaCompleta.link_pdf && (
                                <button
                                  onClick={() =>
                                    setPdfModal({
                                      numero_nf: notaCompleta.numero_nf,
                                      link_pdf: notaCompleta.link_pdf,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                  title="Ver PDF com Carimbo"
                                >
                                  <Eye size={15} />
                                </button>
                              )}

                              <button
                                onClick={() => abrirRetificacao(a)}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                title="Retificar Parecer / Decisão"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                onClick={() => estornarAprovacao(a)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Estornar Aprovação (Remover Carimbo)"
                              >
                                <RotateCcw size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* ABA 2: FILA RÁPIDA DE ASSINATURA                                    */}
      {/* =================================================================== */}
      {abaAtiva === 'fila' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {notasPendentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" strokeWidth={1.5} />
              <p className="font-medium text-slate-700">Tudo em dia!</p>
              <p className="text-sm">Não há notas fiscais aguardando assinatura no momento.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/60">
                  <th className="px-4 py-3 font-semibold">NF</th>
                  <th className="px-4 py-3 font-semibold">Fornecedor</th>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold text-center">Anexo PDF</th>
                  <th className="px-4 py-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notasPendentes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-hidrotec-3">{n.numero_nf}</td>
                    <td className="px-4 py-3 text-slate-600">{nomeFornecedor(n.fornecedor)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {n.obra?.nome_obra || n.obra?.nome || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-hidrotec-3">
                      {formatarMoeda(n.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {n.tem_anexo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <FileText size={12} /> Pronto p/ carimbo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Paperclip size={12} /> Sem PDF
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setNotaAnalisando(n);
                          setObservacaoNova('');
                        }}
                        className="px-3.5 py-1.5 bg-hidrotec-1 hover:bg-hidrotec-2 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Analisar & Assinar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 3: VALIDADOR DE PDF / HASH INTEGRADO                            */}
      {/* =================================================================== */}
      {abaAtiva === 'validar' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2">
          <ValidarAssinatura />
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: VISUALIZAR PDF CARIMBADO                                     */}
      {/* =================================================================== */}
      {pdfModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">
                Documento Auditado — NF {pdfModal.numero_nf}
              </h3>
              <div className="flex items-center gap-4">
                <a
                  href={pdfModal.link_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink size={14} /> Abrir / Baixar PDF
                </a>
                <button
                  onClick={() => setPdfModal(null)}
                  className="text-slate-400 hover:text-hidrotec-3"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={`${pdfModal.link_pdf}#toolbar=1`}
                title={`PDF NF ${pdfModal.numero_nf}`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: RETIFICAR PARECER (PUT /aprovacoes/:id)                      */}
      {/* =================================================================== */}
      {aprovacaoEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Retificar Parecer — NF {aprovacaoEditando.nota?.numero_nf}
              </h3>
              <button
                onClick={() => setAprovacaoEditando(null)}
                className="text-slate-400 hover:text-hidrotec-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarRetificacao} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Nova Decisão
                </label>
                <select
                  value={formRetificacao.decisao}
                  onChange={(e) =>
                    setFormRetificacao((prev) => ({ ...prev, decisao: Number(e.target.value) }))
                  }
                  className={inputCls}
                >
                  <option value={1}>1 — Aprovado para Pagamento</option>
                  <option value={2}>2 — Reprovado pelo Gestor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Observação / Justificativa da Retificação
                </label>
                <textarea
                  rows="4"
                  value={formRetificacao.observacao}
                  onChange={(e) =>
                    setFormRetificacao((prev) => ({ ...prev, observacao: e.target.value }))
                  }
                  className={`${inputCls} resize-none`}
                  required={Number(formRetificacao.decisao) === 2}
                  placeholder="Informe o parecer atualizado que será reimpresso no PDF..."
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                Ao salvar, o sistema substituirá automaticamente a faixa de assinatura no PDF e gerará um novo Hash SHA-256.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAprovacaoEditando(null)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRetificacao}
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white flex items-center gap-2 disabled:opacity-60"
                >
                  {salvandoRetificacao ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Atualizar Carimbo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ANALISAR & ASSINAR NOTA DA FILA                              */}
      {/* =================================================================== */}
      {notaAnalisando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/75 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-hidrotec-3">
                  NF {notaAnalisando.numero_nf} — {nomeFornecedor(notaAnalisando.fornecedor)}
                </h3>
                <p className="text-xs text-hidrotec-4">
                  Valor: <strong>{formatarMoeda(notaAnalisando.valor_total)}</strong> • Obra:{' '}
                  {notaAnalisando.obra?.nome_obra || '-'}
                </p>
              </div>
              <button
                onClick={() => setNotaAnalisando(null)}
                className="text-slate-400 hover:text-hidrotec-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              <div className="w-full md:w-2/3 bg-slate-100 h-1/2 md:h-full">
                {notaAnalisando.link_pdf ? (
                  <iframe
                    src={`${notaAnalisando.link_pdf}#toolbar=0`}
                    title="Pré-visualização NF"
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <FileText className="w-12 h-12 mb-2" />
                    <p className="text-sm">Esta nota fiscal não possui PDF anexado.</p>
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/3 p-6 flex flex-col gap-4 bg-slate-50 border-l border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-hidrotec-4">
                  Parecer do Gestor:
                </label>
                <textarea
                  className={`${inputCls} h-36 resize-none`}
                  placeholder="Escreva o parecer que será gravado no carimbo do PDF (obrigatório ao reprovar)..."
                  value={observacaoNova}
                  onChange={(e) => setObservacaoNova(e.target.value)}
                />

                <div className="flex gap-2 mt-auto">
                  <button
                    type="button"
                    disabled={processandoFila}
                    onClick={() => processarParecerFila(2)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" /> Reprovar
                  </button>
                  <button
                    type="button"
                    disabled={processandoFila}
                    onClick={() => processarParecerFila(1)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {processandoFila ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}