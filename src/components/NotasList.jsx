// =====================================================================
// NotasList.jsx
// Tela de listagem de Notas Fiscais com a canetinha antes do número e sem o #.
// =====================================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText, Plus, Search, CheckCircle, XCircle, Clock, Eye,
  AlertCircle, X, Send, Loader2, MessageSquare, Filter, RotateCcw,
  Paperclip, ExternalLink, Pencil, Building2, Trash2
} from 'lucide-react';

export default function NotasList() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const token = localStorage.getItem('tokenHidropag');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [searchParams, setSearchParams] = useSearchParams();
  const obraIdFiltro = searchParams.get('obraId');

  const nome = localStorage.getItem('usuarioNome') || 'Usuário';
  const perfil = localStorage.getItem('usuarioPerfil');
  const usuarioId = localStorage.getItem('usuarioId');
  const podeAvaliar = ['root', 'gestor'].includes(perfil);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const [notas, setNotas] = useState([]);                      
  const [obras, setObras] = useState([]);                      
  const [fornecedores, setFornecedores] = useState([]);        
  const [busca, setBusca] = useState('');                      
  const [filtroStatus, setFiltroStatus] = useState('todas');   
  const [filtroVencimento, setFiltroVencimento] = useState(''); 
  const [carregando, setCarregando] = useState(true);          
  const [erro, setErro] = useState(null);                      

  const [notasSelecionadasLote, setNotasSelecionadasLote] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [tipoAcao, setTipoAcao] = useState(null);              
  const [notaSelecionada, setNotaSelecionada] = useState(null); 
  const [mensagem, setMensagem] = useState('');                
  const [processando, setProcessando] = useState(false);        

  const [notaPdf, setNotaPdf] = useState(null);

  // Estados para Edição Completa
  const [notaEditando, setNotaEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});          
  const [arquivoEdicao, setArquivoEdicao] = useState(null);  
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoNota, setExcluindoNota] = useState(false);

  const podeEditar = ['root', 'gestor', 'lancador'].includes(perfil);

  useEffect(() => {
    carregarNotas();
    carregarObrasEFornecedores();
  }, [obraIdFiltro]);

  const carregarNotas = async () => {
    try {
      setCarregando(true);
      const resposta = await axios.get(`${API_URL}/notas`, config);
      const dados = resposta.data;
      setNotas(Array.isArray(dados) ? dados : (dados.data || dados.notas || []));
      setNotasSelecionadasLote([]);
      setErro(null);
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      setErro('Não foi possível carregar a lista de notas fiscais.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarObrasEFornecedores = async () => {
    try {
      const [resObras, resForn] = await Promise.all([
        axios.get(`${API_URL}/obras`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/fornecedores`, config).catch(() => ({ data: [] }))
      ]);
      setObras(Array.isArray(resObras.data) ? resObras.data : (resObras.data?.data || []));
      const dadosForn = resForn.data;
      setFornecedores(Array.isArray(dadosForn) ? dadosForn : (dadosForn.data || []));
    } catch (err) {
      console.error('Erro ao carregar selects auxiliares:', err);
    }
  };

  const nomeFornecedor = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return f;
    const nome = f.razao_social || f.nome_fantasia || f.nome || f.fornecedor;
    if (typeof nome === 'string') return nome;
    const primeiroTexto = Object.values(f).find(v => typeof v === 'string' && v.trim() !== '');
    return primeiroTexto || '';
  };

  const selecionarTodasPendentes = (e) => {
    if (e.target.checked) {
      const idsPendentes = notasFiltradas
        .filter(n => Number(n.status) === 0)
        .map(n => n.id);
      setNotasSelecionadasLote(idsPendentes);
    } else {
      setNotasSelecionadasLote([]);
    }
  };

  const toggleSelecionarNota = (id) => {
    setNotasSelecionadasLote(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const aprovarSelecionadasEmLote = async () => {
    if (notasSelecionadasLote.length === 0) return;

    const confirmou = window.confirm(`Deseja realmente aprovar as ${notasSelecionadasLote.length} notas selecionadas?`);
    if (!confirmou) return;

    try {
      setProcessando(true);
      await Promise.all(
        notasSelecionadasLote.map(async (idNota) => {
          const payloadAprovacao = {
            decisao: 1,
            observacao: 'Aprovação em lote',
            nota: idNota,
            usuario: usuarioId,
          };
          await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);
          await axios.put(`${API_URL}/notas/${idNota}`, { status: 1 }, config);
        })
      );

      alert('Notas selecionadas aprovadas com sucesso!');
      setNotasSelecionadasLote([]);
      carregarNotas();
    } catch (error) {
      console.error('Erro ao aprovar em lote:', error);
      alert('Ocorreu um erro ao processar a aprovação em lote.');
    } finally {
      setProcessando(false);
    }
  };

  const abrirModalAcao = (nota, acao) => {
    setNotaSelecionada(nota);
    setTipoAcao(acao);
    setMensagem('');
    setModalAberto(true);
  };

  const confirmarAcao = async (e) => {
    e.preventDefault(); 
    if (!notaSelecionada) return;

    try {
      setProcessando(true);
      const novoStatus = tipoAcao === 'aprovar' ? 1 : 2;

      const payloadAprovacao = {
        decisao: novoStatus,
        observacao: mensagem,
        nota: notaSelecionada.id,
        usuario: usuarioId,
      };
      await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);
      await axios.put(`${API_URL}/notas/${notaSelecionada.id}`, { status: novoStatus }, config);

      alert(`Nota fiscal ${tipoAcao === 'aprovar' ? 'aprovada' : 'reprovada'} com sucesso!`);
      setModalAberto(false);
      setNotaSelecionada(null);
      carregarNotas(); 
    } catch (error) {
      console.error('Erro completo da API:', error);
      if (error.response && error.response.data) {
        const msgServidor = error.response.data.message || error.response.data;
        alert(`O back-end recusou a alteração: ${JSON.stringify(msgServidor)}`);
      } else {
        alert(`Erro de rede: a rota PUT /notas/${notaSelecionada.id} falhou.`);
      }
    } finally {
      setProcessando(false);
    }
  };

  // -------------------------------------------------------------------
  // EDIÇÃO COMPLETA E EXCLUSÃO (DENTRO DO MODAL)
  // -------------------------------------------------------------------
  const abrirEdicao = (nota) => {
    setNotaEditando(nota);
    setFormEdicao({
      numero_nf: nota.numero_nf || '',
      data_vencimento: nota.data_vencimento ? String(nota.data_vencimento).slice(0, 10) : '',
      valor_total: nota.valor_total ?? '',
      quant_parcelas: nota.quant_parcelas || 1,
      obra: nota.obra?.id || '',
      fornecedorId: nota.fornecedor?.id || '',
    });
    setArquivoEdicao(null);
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setFormEdicao(prev => ({ ...prev, [name]: value }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (!notaEditando) return;

    try {
      setSalvandoEdicao(true);
      const payload = {
        numero_nf: String(formEdicao.numero_nf),
        data_vencimento: formEdicao.data_vencimento || null,
        valor_total: Number(formEdicao.valor_total),
        quant_parcelas: Number(formEdicao.quant_parcelas),
        obra: formEdicao.obra || null,
        fornecedorId: formEdicao.fornecedorId || null,
      };

      await axios.put(`${API_URL}/notas/${notaEditando.id}`, payload, config);

      if (arquivoEdicao) {
        const formData = new FormData();
        formData.append('file', arquivoEdicao);
        await axios.put(`${API_URL}/notas/${notaEditando.id}/upload-pdf`, formData, config);
      }

      alert('Nota atualizada com sucesso!');
      setNotaEditando(null);
      setArquivoEdicao(null);
      carregarNotas(); 
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      const msg = error.response?.data?.message;
      alert('Erro ao atualizar: ' + (msg ? JSON.stringify(msg) : 'verifique os dados e o arquivo.'));
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const excluirNotaNoModal = async () => {
    if (!notaEditando) return;
    const confirmou = window.confirm(`Tem certeza que deseja excluir a Nota Fiscal #${notaEditando.numero_nf}? Esta ação não pode ser desfeita.`);
    if (!confirmou) return;

    try {
      setExcluindoNota(true);
      await axios.delete(`${API_URL}/notas/${notaEditando.id}`, config);
      alert('Nota fiscal excluída com sucesso!');
      setNotaEditando(null);
      carregarNotas();
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      alert('Não foi possível excluir a nota fiscal.');
    } finally {
      setExcluindoNota(false);
    }
  };

  const notasBaseResumo = obraIdFiltro 
    ? notas.filter(n => String(n.obraId || n.obra?.id) === String(obraIdFiltro))
    : notas;

  const totalDecidir = notasBaseResumo.filter(n => Number(n.status) === 0).length;
  const totalAprovadas = notasBaseResumo.filter(n => Number(n.status) === 1).length;
  const totalLancado = notasBaseResumo.length;

  const obraAtualObj = notas.find(n => String(n.obraId || n.obra?.id) === String(obraIdFiltro))?.obra;
  const nomeObraFiltrada = obraAtualObj?.nome_obra || obraAtualObj?.nome || `Obra #${obraIdFiltro}`;

  const notasFiltradas = notas.filter(n => {
    if (obraIdFiltro) {
      const idNotaObra = String(n.obraId || n.obra?.id || '');
      if (idNotaObra !== String(obraIdFiltro)) return false;
    }

    const termo = busca.toLowerCase();
    const numero = String(n.numero_nf || '').toLowerCase();
    const fornecedor = nomeFornecedor(n.fornecedor).toLowerCase();
    const matchTexto = numero.includes(termo) || fornecedor.includes(termo);

    const matchStatus =
      filtroStatus === 'todas' ? true :
      filtroStatus === 'decidir' ? Number(n.status) === 0 :
      filtroStatus === 'aprovadas' ? Number(n.status) === 1 :
      filtroStatus === 'reprovadas' ? Number(n.status) === 2 : true;

    const matchVencimento = filtroVencimento ? n.data_vencimento?.includes(filtroVencimento) : true;

    return matchTexto && matchStatus && matchVencimento;
  });

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const renderVencimento = (dataStr, status) => {
    if (!dataStr) return '-';
    // Pega apenas os primeiros 10 caracteres (YYYY-MM-DD) para ignorar o fuso horário
    const dataSomente = String(dataStr).slice(0, 10);
    const [ano, mes, dia] = dataSomente.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Cria a data em UTC para calcular o alerta de vencimento corretamente
    const dataVenc = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));

    if (Number(status) === 0) {
      if (diffDias < 0) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200" title="Vencido!">
            {dataFormatada}
          </span>
        );
      } else if (diffDias <= 7) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Vence em breve!">
            {dataFormatada}
          </span>
        );
      }
    }

    return <span className="text-hidrotec-4">{dataFormatada}</span>;
  };

  // const renderVencimento = (dataStr, status) => {
  //   if (!dataStr) return '-';
  //   const dataVenc = new Date(dataStr);
  //   const hoje = new Date();
  //   hoje.setHours(0, 0, 0, 0);

  //   const diffDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
  //   const dataFormatada = dataVenc.toLocaleDateString('pt-BR');

  //   if (Number(status) === 0) {
  //     if (diffDias < 0) {
  //       return (
  //         <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200" title="Vencido!">
  //           {dataFormatada}
  //         </span>
  //       );
  //     } else if (diffDias <= 7) {
  //       return (
  //         <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Vence em breve!">
  //           {dataFormatada}
  //         </span>
  //       );
  //     }
  //   }

  //   return <span className="text-hidrotec-4">{dataFormatada}</span>;
  // };

  const renderStatus = (status) => {
    switch (Number(status)) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-600">
            <CheckCircle size={12} /> Aprovada
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600">
            <XCircle size={12} /> Reprovada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
            <Clock size={12} /> Pendente
          </span>
        );
    }
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white';
  const labelCls = 'block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2';

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">

      <header className="mb-6">
        <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-1">
          Notas Fiscais
        </h1>
        <p className="text-sm text-hidrotec-4">
          Listagem e gerenciamento de notas fiscais
        </p>
      </header>

      {obraIdFiltro && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Filtrando por Obra</p>
              <p className="text-sm font-semibold text-blue-900">{nomeObraFiltrada}</p>
            </div>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Mostrar Todas as Notas
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-hidrotec-3 mb-1">
          Olá, {nome}! {saudacao}.
        </h2>
        <p className="text-sm text-hidrotec-4 mb-6">
          Aqui está o resumo das suas notas fiscais e aprovações pendentes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">A DECIDIR</p>
              <p className="text-3xl font-display font-bold text-hidrotec-3">{totalDecidir}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">APROVADAS</p>
              <p className="text-3xl font-display font-bold text-hidrotec-3">{totalAprovadas}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center text-hidrotec-1 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">TOTAL LANÇADO</p>
              <p className="text-3xl font-display font-bold text-hidrotec-3">{totalLancado}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setFiltroStatus('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              filtroStatus === 'todas' ? 'bg-hidrotec-3 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltroStatus('decidir')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              filtroStatus === 'decidir' ? 'bg-amber-500 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
            }`}
          >
            A Decidir
          </button>
          <button
            onClick={() => setFiltroStatus('aprovadas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              filtroStatus === 'aprovadas' ? 'bg-green-600 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFiltroStatus('reprovadas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              filtroStatus === 'reprovadas' ? 'bg-red-600 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
            }`}
          >
            Reprovadas
          </button>
        </div>

        <Link
          to="/notas/nova"
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nova Nota
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-hidrotec-4 font-bold text-xs uppercase tracking-wider shrink-0">
          <Filter size={16} /> Filtros:
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar NF ou fornecedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-hidrotec-4 whitespace-nowrap">Vencimento:</span>
          <input
            type="date"
            value={filtroVencimento}
            onChange={(e) => setFiltroVencimento(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white text-hidrotec-3"
          />
        </div>

        <button
          onClick={() => { setBusca(''); setFiltroStatus('todas'); setFiltroVencimento(''); setSearchParams({}); }}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-hidrotec-3 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <RotateCcw size={14} /> Limpar Filtros
        </button>
      </div>

      {podeAvaliar && notasSelecionadasLote.length > 0 && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 px-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span><strong>{notasSelecionadasLote.length}</strong> nota(s) pendente(s) selecionada(s).</span>
          </div>
          <button
            onClick={aprovarSelecionadasEmLote}
            disabled={processando}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Aprovar Notas Selecionadas
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">A carregar notas fiscais...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          ) : notasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <FileText className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">Nenhuma nota fiscal encontrada.</p>
              <p className="text-sm">Tente ajustar os filtros ou clique em "Nova Nota".</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
                  {podeAvaliar && (
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={selecionarTodasPendentes}
                        checked={
                          notasFiltradas.filter(n => Number(n.status) === 0).length > 0 &&
                          notasFiltradas.filter(n => Number(n.status) === 0).every(n => notasSelecionadasLote.includes(n.id))
                        }
                        className="rounded border-slate-300 text-hidrotec-1 focus:ring-hidrotec-1 w-4 h-4 cursor-pointer"
                        title="Selecionar todas as pendentes visíveis"
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 w-12 text-center font-semibold">Editar</th>
                  <th className="px-3 py-3 font-semibold">NF</th>
                  <th className="px-3 py-3 font-semibold">Fornecedor</th>
                  <th className="px-3 py-3 font-semibold">Obra</th>
                  <th className="px-3 py-3 font-semibold">Vencimento</th>
                  <th className="px-3 py-3 font-semibold">Valor (R$)</th>
                  <th className="px-3 py-3 font-semibold text-center">Status</th>
                  <th className="px-3 py-3 font-semibold text-center">PDF</th>
                  <th className="px-3 py-3 font-semibold text-right">Gerenciar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {notasFiltradas.map((nota) => {
                  const ehPendente = Number(nota.status) === 0;
                  const estaSelecionada = notasSelecionadasLote.includes(nota.id);

                  return (
                    <tr key={nota.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                      {podeAvaliar && (
                        <td className="px-3 py-2.5 text-center">
                          {ehPendente && (
                            <input
                              type="checkbox"
                              checked={estaSelecionada}
                              onChange={() => toggleSelecionarNota(nota.id)}
                              className="rounded border-slate-300 text-hidrotec-1 focus:ring-hidrotec-1 w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                      )}
                      
                      {/* Coluna exclusiva para a caneta de edição antes do número */}
                      <td className="px-3 py-2.5 text-center">
                        {podeEditar && (
                          <button
                            onClick={() => abrirEdicao(nota)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-hidrotec-3 transition-colors mx-auto"
                            title="Editar nota"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>

                      {/* Número da NF limpo, sem o # */}
                      <td className="px-3 py-2.5 font-bold text-hidrotec-3 whitespace-nowrap">
                        {nota.numero_nf}
                      </td>

                      <td className="px-3 py-2.5 text-hidrotec-4 truncate max-w-[150px]" title={nomeFornecedor(nota.fornecedor)}>
                        {nomeFornecedor(nota.fornecedor) || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-hidrotec-3 truncate max-w-[160px]" title={nota.obra?.nome_obra || nota.obra?.nome}>
                        {nota.obra?.nome_obra || nota.obra?.nome || '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        {renderVencimento(nota.data_vencimento, nota.status)}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-hidrotec-3 whitespace-nowrap">
                        {formatarMoeda(nota.valor_total)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {renderStatus(nota.status)}
                          {nota.parecer && (
                            <span className="text-[10px] text-slate-500 italic max-w-[180px] truncate flex items-center gap-1" title={nota.parecer}>
                              <MessageSquare size={10} className="shrink-0 text-hidrotec-1" />
                              {nota.parecer}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center">
                          {nota.tem_anexo && nota.link_pdf ? (
                            <button
                              onClick={() => setNotaPdf(nota)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors"
                              title="Visualizar PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              PDF
                            </button>
                          ) : (
                            <span title="Sem anexo" className="inline-flex items-center text-xs text-slate-300">
                              <Paperclip className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {podeAvaliar && ehPendente && (
                            <>
                              <button
                                onClick={() => abrirModalAcao(nota, 'aprovar')}
                                disabled={processando}
                                className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-[11px] font-bold uppercase transition-colors"
                                title="Aprovar nota"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => abrirModalAcao(nota, 'reprovar')}
                                disabled={processando}
                                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold uppercase transition-colors"
                                title="Reprovar nota"
                              >
                                Reprovar
                              </button>
                            </>
                          )}
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

      {/* ---------- Modal de Edição Completa com Exclusão Integrada ---------- */}
      {notaEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-hidrotec-1" />
                Editar Nota Fiscal {notaEditando.numero_nf}
              </h3>
              <button onClick={() => setNotaEditando(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Número da NF *</label>
                  <input type="text" name="numero_nf" value={formEdicao.numero_nf} onChange={handleEdicaoChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Fornecedor</label>
                  <select name="fornecedorId" value={formEdicao.fornecedorId} onChange={handleEdicaoChange} className={`${inputCls} bg-white`}>
                    <option value="">-- Sem fornecedor --</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>{nomeFornecedor(f)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Data de Vencimento *</label>
                  <input type="date" name="data_vencimento" value={formEdicao.data_vencimento} onChange={handleEdicaoChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Valor Total (R$) *</label>
                  <input type="number" step="0.01" name="valor_total" value={formEdicao.valor_total} onChange={handleEdicaoChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Qtd. de Parcelas *</label>
                  <input type="number" min="1" name="quant_parcelas" value={formEdicao.quant_parcelas} onChange={handleEdicaoChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Vincular à Obra *</label>
                  <select name="obra" value={formEdicao.obra} onChange={handleEdicaoChange} className={`${inputCls} bg-white`} required>
                    <option value="">-- Selecione uma Obra --</option>
                    {obras.map(obra => (
                      <option key={obra.id} value={obra.id}>{obra.nome_obra || obra.nome || 'Obra sem nome'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
                <label className={labelCls}>Atualizar Arquivo PDF (opcional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setArquivoEdicao(e.target.files[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-extra file:text-hidrotec-1 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                {/* Botão de Excluir dentro do Modal */}
                {podeEditar && (
                  <button
                    type="button"
                    onClick={excluirNotaNoModal}
                    disabled={excluindoNota}
                    className="px-4 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {excluindoNota ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Excluir Nota
                  </button>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setNotaEditando(null)}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoEdicao}
                    className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
                  >
                    {salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {notaPdf && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-[900] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-display font-bold text-lg text-hidrotec-3 truncate">
                Nota Fiscal {notaPdf.numero_nf}
              </h3>
              <div className="flex items-center gap-4">
                <a
                  href={notaPdf.link_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
                >
                  <ExternalLink size={14} /> Abrir em nova aba
                </a>
                <button onClick={() => setNotaPdf(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100">
              <iframe
                src={`${notaPdf.link_pdf}#toolbar=0`}
                title={`PDF da nota ${notaPdf.numero_nf}`}
                className="w-full h-full border-0"
              />
            </div>

            {podeAvaliar && Number(notaPdf.status) === 0 && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => { const nota = notaPdf; setNotaPdf(null); abrirModalAcao(nota, 'reprovar'); }}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Reprovar
                </button>
                <button
                  onClick={() => { const nota = notaPdf; setNotaPdf(null); abrirModalAcao(nota, 'aprovar'); }}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Aprovar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className={`font-display font-bold text-lg flex items-center gap-2 ${tipoAcao === 'aprovar' ? 'text-green-600' : 'text-red-600'}`}>
                {tipoAcao === 'aprovar' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {tipoAcao === 'aprovar' ? 'Aprovar' : 'Reprovar'} Nota Fiscal {notaSelecionada?.numero_nf}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmarAcao} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    Parecer do Diretor {tipoAcao === 'reprovar' ? '*' : '(Opcional)'}
                  </label>
                  <textarea
                    rows="4"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder={tipoAcao === 'aprovar' ? 'Adicione um parecer opcional para esta aprovação...' : 'Descreva o motivo da recusa ou observações para o lançador...'}
                    {...(tipoAcao === 'reprovar' ? { required: true } : {})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processando}
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 ${
                    tipoAcao === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Confirmar {tipoAcao === 'aprovar' ? 'Aprovação' : 'Reprovação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// // =====================================================================
// // NotasList.jsx
// // Tela de listagem de Notas Fiscais.
// // =====================================================================

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Link, useSearchParams } from 'react-router-dom';
// import {
//   FileText, Plus, Search, CheckCircle, XCircle, Clock, Eye,
//   AlertCircle, X, Send, Loader2, MessageSquare, Filter, RotateCcw,
//   Paperclip, ExternalLink, Pencil, Building2
// } from 'lucide-react';

// export default function NotasList() {
//   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

//   const token = localStorage.getItem('tokenHidropag');
//   const config = { headers: { Authorization: `Bearer ${token}` } };

//   const [searchParams, setSearchParams] = useSearchParams();
//   const obraIdFiltro = searchParams.get('obraId');

//   const nome = localStorage.getItem('usuarioNome') || 'Usuário';
//   const perfil = localStorage.getItem('usuarioPerfil');
//   const usuarioId = localStorage.getItem('usuarioId');
//   const podeAvaliar = ['root', 'gestor'].includes(perfil);

//   const hora = new Date().getHours();
//   const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

//   const [notas, setNotas] = useState([]);                      
//   const [busca, setBusca] = useState('');                      
//   const [filtroStatus, setFiltroStatus] = useState('todas');   
//   const [filtroVencimento, setFiltroVencimento] = useState(''); 
//   const [carregando, setCarregando] = useState(true);          
//   const [erro, setErro] = useState(null);                      

//   const [notasSelecionadasLote, setNotasSelecionadasLote] = useState([]);

//   const [modalAberto, setModalAberto] = useState(false);
//   const [tipoAcao, setTipoAcao] = useState(null);              
//   const [notaSelecionada, setNotaSelecionada] = useState(null); 
//   const [mensagem, setMensagem] = useState('');                
//   const [processando, setProcessando] = useState(false);        

//   const [notaPdf, setNotaPdf] = useState(null);

//   const [notaEditando, setNotaEditando] = useState(null);
//   const [formEdicao, setFormEdicao] = useState({});          
//   const [arquivoEdicao, setArquivoEdicao] = useState(null);  
//   const [salvandoEdicao, setSalvandoEdicao] = useState(false);

//   const podeEditar = ['root', 'gestor', 'lancador'].includes(perfil);

//   useEffect(() => {
//     carregarNotas();
//   }, [obraIdFiltro]);

//   const carregarNotas = async () => {
//     try {
//       setCarregando(true);
//       const resposta = await axios.get(`${API_URL}/notas`, config);
//       const dados = resposta.data;
//       setNotas(Array.isArray(dados) ? dados : (dados.data || dados.notas || []));
//       setNotasSelecionadasLote([]);
//       setErro(null);
//     } catch (error) {
//       console.error('Erro ao buscar notas fiscais:', error);
//       setErro('Não foi possível carregar a lista de notas fiscais.');
//     } finally {
//       setCarregando(false);
//     }
//   };

//   const selecionarTodasPendentes = (e) => {
//     if (e.target.checked) {
//       const idsPendentes = notasFiltradas
//         .filter(n => Number(n.status) === 0)
//         .map(n => n.id);
//       setNotasSelecionadasLote(idsPendentes);
//     } else {
//       setNotasSelecionadasLote([]);
//     }
//   };

//   const toggleSelecionarNota = (id) => {
//     setNotasSelecionadasLote(prev => 
//       prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
//     );
//   };

//   const aprovarSelecionadasEmLote = async () => {
//     if (notasSelecionadasLote.length === 0) return;

//     const confirmou = window.confirm(`Deseja realmente aprovar as ${notasSelecionadasLote.length} notas selecionadas?`);
//     if (!confirmou) return;

//     try {
//       setProcessando(true);
//       await Promise.all(
//         notasSelecionadasLote.map(async (idNota) => {
//           const payloadAprovacao = {
//             decisao: 1,
//             observacao: 'Aprovação em lote',
//             nota: idNota,
//             usuario: usuarioId,
//           };
//           await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);
//           await axios.put(`${API_URL}/notas/${idNota}`, { status: 1 }, config);
//         })
//       );

//       alert('Notas selecionadas aprovadas com sucesso!');
//       setNotasSelecionadasLote([]);
//       carregarNotas();
//     } catch (error) {
//       console.error('Erro ao aprovar em lote:', error);
//       alert('Ocorreu um erro ao processar a aprovação em lote.');
//     } finally {
//       setProcessando(false);
//     }
//   };

//   const abrirModalAcao = (nota, acao) => {
//     setNotaSelecionada(nota);
//     setTipoAcao(acao);
//     setMensagem('');
//     setModalAberto(true);
//   };

//   const confirmarAcao = async (e) => {
//     e.preventDefault(); 
//     if (!notaSelecionada) return;

//     try {
//       setProcessando(true);
//       const novoStatus = tipoAcao === 'aprovar' ? 1 : 2;

//       const payloadAprovacao = {
//         decisao: novoStatus,
//         observacao: mensagem,
//         nota: notaSelecionada.id,
//         usuario: usuarioId,
//       };
//       await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);
//       await axios.put(`${API_URL}/notas/${notaSelecionada.id}`, { status: novoStatus }, config);

//       alert(`Nota fiscal ${tipoAcao === 'aprovar' ? 'aprovada' : 'reprovada'} com sucesso!`);
//       setModalAberto(false);
//       setNotaSelecionada(null);
//       carregarNotas(); 
//     } catch (error) {
//       console.error('Erro completo da API:', error);
//       if (error.response && error.response.data) {
//         const msgServidor = error.response.data.message || error.response.data;
//         alert(`O back-end recusou a alteração: ${JSON.stringify(msgServidor)}`);
//       } else {
//         alert(`Erro de rede: a rota PUT /notas/${notaSelecionada.id} falhou.`);
//       }
//     } finally {
//       setProcessando(false);
//     }
//   };

//   const abrirEdicao = (nota) => {
//     setNotaEditando(nota);
//     setFormEdicao({
//       numero_nf: nota.numero_nf || '',
//       data_vencimento: nota.data_vencimento ? String(nota.data_vencimento).slice(0, 10) : '',
//       valor_total: nota.valor_total ?? '',
//       quant_parcelas: nota.quant_parcelas || 1,
//     });
//     setArquivoEdicao(null);
//   };

//   const handleEdicaoChange = (e) => {
//     const { name, value } = e.target;
//     setFormEdicao(prev => ({ ...prev, [name]: value }));
//   };

//   const salvarEdicao = async (e) => {
//     e.preventDefault();
//     if (!notaEditando) return;

//     try {
//       setSalvandoEdicao(true);
//       const payload = {
//         numero_nf: String(formEdicao.numero_nf),
//         data_vencimento: formEdicao.data_vencimento || null,
//         valor_total: Number(formEdicao.valor_total),
//         quant_parcelas: Number(formEdicao.quant_parcelas),
//       };

//       await axios.put(`${API_URL}/notas/${notaEditando.id}`, payload, config);

//       if (arquivoEdicao) {
//         const formData = new FormData();
//         formData.append('file', arquivoEdicao);
//         await axios.put(`${API_URL}/notas/${notaEditando.id}/upload-pdf`, formData, config);
//       }

//       alert('Nota atualizada com sucesso!');
//       setNotaEditando(null);
//       setArquivoEdicao(null);
//       carregarNotas(); 
//     } catch (error) {
//       console.error('Erro ao atualizar nota:', error);
//       const msg = error.response?.data?.message;
//       alert('Erro ao atualizar: ' + (msg ? JSON.stringify(msg) : 'verifique os dados e o arquivo.'));
//     } finally {
//       setSalvandoEdicao(false);
//     }
//   };

//   const notasBaseResumo = obraIdFiltro 
//     ? notas.filter(n => String(n.obraId || n.obra?.id) === String(obraIdFiltro))
//     : notas;

//   const totalDecidir = notasBaseResumo.filter(n => Number(n.status) === 0).length;
//   const totalAprovadas = notasBaseResumo.filter(n => Number(n.status) === 1).length;
//   const totalLancado = notasBaseResumo.length;

//   const nomeFornecedor = (f) => {
//     if (!f) return '';
//     if (typeof f === 'string') return f;
//     const nome = f.razao_social || f.nome_fantasia || f.nome || f.fornecedor;
//     if (typeof nome === 'string') return nome;
//     const primeiroTexto = Object.values(f).find(v => typeof v === 'string' && v.trim() !== '');
//     return primeiroTexto || '';
//   };

//   const obraAtualObj = notas.find(n => String(n.obraId || n.obra?.id) === String(obraIdFiltro))?.obra;
//   const nomeObraFiltrada = obraAtualObj?.nome_obra || obraAtualObj?.nome || `Obra #${obraIdFiltro}`;

//   const notasFiltradas = notas.filter(n => {
//     if (obraIdFiltro) {
//       const idNotaObra = String(n.obraId || n.obra?.id || '');
//       if (idNotaObra !== String(obraIdFiltro)) return false;
//     }

//     const termo = busca.toLowerCase();
//     const numero = String(n.numero_nf || '').toLowerCase();
//     const fornecedor = nomeFornecedor(n.fornecedor).toLowerCase();
//     const matchTexto = numero.includes(termo) || fornecedor.includes(termo);

//     const matchStatus =
//       filtroStatus === 'todas' ? true :
//       filtroStatus === 'decidir' ? Number(n.status) === 0 :
//       filtroStatus === 'aprovadas' ? Number(n.status) === 1 :
//       filtroStatus === 'reprovadas' ? Number(n.status) === 2 : true;

//     const matchVencimento = filtroVencimento ? n.data_vencimento?.includes(filtroVencimento) : true;

//     return matchTexto && matchStatus && matchVencimento;
//   });

//   const formatarMoeda = (valor) => {
//     return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
//   };

//   const renderVencimento = (dataStr, status) => {
//     if (!dataStr) return '-';
//     const dataVenc = new Date(dataStr);
//     const hoje = new Date();
//     hoje.setHours(0, 0, 0, 0);

//     const diffDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
//     const dataFormatada = dataVenc.toLocaleDateString('pt-BR');

//     if (Number(status) === 0) {
//       if (diffDias < 0) {
//         return (
//           <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200" title="Vencido!">
//             {dataFormatada}
//           </span>
//         );
//       } else if (diffDias <= 7) {
//         return (
//           <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Vence em breve!">
//             {dataFormatada}
//           </span>
//         );
//       }
//     }

//     return <span className="text-hidrotec-4">{dataFormatada}</span>;
//   };

//   const renderStatus = (status) => {
//     switch (Number(status)) {
//       case 1:
//         return (
//           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-600">
//             <CheckCircle size={12} /> Aprovada
//           </span>
//         );
//       case 2:
//         return (
//           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600">
//             <XCircle size={12} /> Reprovada
//           </span>
//         );
//       default:
//         return (
//           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
//             <Clock size={12} /> Pendente
//           </span>
//         );
//     }
//   };

//   const inputCls = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white';
//   const labelCls = 'block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2';

//   return (
//     <div className="max-w-6xl w-full mx-auto font-body pb-12">

//       <header className="mb-6">
//         <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-1">
//           Notas Fiscais
//         </h1>
//         <p className="text-sm text-hidrotec-4">
//           Listagem e gerenciamento de notas fiscais
//         </p>
//       </header>

//       {obraIdFiltro && (
//         <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
//               <Building2 size={20} />
//             </div>
//             <div>
//               <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Filtrando por Obra</p>
//               <p className="text-sm font-semibold text-blue-900">{nomeObraFiltrada}</p>
//             </div>
//           </div>
//           <button
//             onClick={() => setSearchParams({})}
//             className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors shadow-sm"
//           >
//             Mostrar Todas as Notas
//           </button>
//         </div>
//       )}

//       <div className="mb-8">
//         <h2 className="text-2xl font-display font-bold text-hidrotec-3 mb-1">
//           Olá, {nome}! {saudacao}.
//         </h2>
//         <p className="text-sm text-hidrotec-4 mb-6">
//           Aqui está o resumo das suas notas fiscais e aprovações pendentes.
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
//             <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
//               <Clock size={24} />
//             </div>
//             <div>
//               <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">A DECIDIR</p>
//               <p className="text-3xl font-display font-bold text-hidrotec-3">{totalDecidir}</p>
//             </div>
//           </div>

//           <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
//             <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
//               <CheckCircle size={24} />
//             </div>
//             <div>
//               <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">APROVADAS</p>
//               <p className="text-3xl font-display font-bold text-hidrotec-3">{totalAprovadas}</p>
//             </div>
//           </div>

//           <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
//             <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center text-hidrotec-1 shrink-0">
//               <FileText size={24} />
//             </div>
//             <div>
//               <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">TOTAL LANÇADO</p>
//               <p className="text-3xl font-display font-bold text-hidrotec-3">{totalLancado}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
//         <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
//           <button
//             onClick={() => setFiltroStatus('todas')}
//             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
//               filtroStatus === 'todas' ? 'bg-hidrotec-3 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
//             }`}
//           >
//             Todas
//           </button>
//           <button
//             onClick={() => setFiltroStatus('decidir')}
//             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
//               filtroStatus === 'decidir' ? 'bg-amber-500 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
//             }`}
//           >
//             A Decidir
//           </button>
//           <button
//             onClick={() => setFiltroStatus('aprovadas')}
//             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
//               filtroStatus === 'aprovadas' ? 'bg-green-600 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
//             }`}
//           >
//             Aprovadas
//           </button>
//           <button
//             onClick={() => setFiltroStatus('reprovadas')}
//             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
//               filtroStatus === 'reprovadas' ? 'bg-red-600 text-white shadow-sm' : 'text-hidrotec-4 hover:text-hidrotec-3'
//             }`}
//           >
//             Reprovadas
//           </button>
//         </div>

//         <Link
//           to="/notas/nova"
//           className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
//         >
//           <Plus size={18} />
//           Nova Nota
//         </Link>
//       </div>

//       <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
//         <div className="flex items-center gap-2 text-hidrotec-4 font-bold text-xs uppercase tracking-wider shrink-0">
//           <Filter size={16} /> Filtros:
//         </div>

//         <div className="relative flex-1 w-full">
//           <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
//           <input
//             type="text"
//             placeholder="Buscar NF ou fornecedor..."
//             value={busca}
//             onChange={(e) => setBusca(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
//           />
//         </div>

//         <div className="flex items-center gap-2 w-full md:w-auto">
//           <span className="text-xs font-bold text-hidrotec-4 whitespace-nowrap">Vencimento:</span>
//           <input
//             type="date"
//             value={filtroVencimento}
//             onChange={(e) => setFiltroVencimento(e.target.value)}
//             className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white text-hidrotec-3"
//           />
//         </div>

//         <button
//           onClick={() => { setBusca(''); setFiltroStatus('todas'); setFiltroVencimento(''); setSearchParams({}); }}
//           className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-hidrotec-3 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
//         >
//           <RotateCcw size={14} /> Limpar Filtros
//         </button>
//       </div>

//       {podeAvaliar && notasSelecionadasLote.length > 0 && (
//         <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 px-5 flex items-center justify-between gap-4 shadow-sm">
//           <div className="flex items-center gap-2 text-emerald-900 text-sm font-semibold">
//             <CheckCircle className="w-5 h-5 text-emerald-600" />
//             <span><strong>{notasSelecionadasLote.length}</strong> nota(s) pendente(s) selecionada(s).</span>
//           </div>
//           <button
//             onClick={aprovarSelecionadasEmLote}
//             disabled={processando}
//             className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
//             Aprovar Notas Selecionadas
//           </button>
//         </div>
//       )}

//       <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
//         <div className="overflow-x-auto min-h-[300px]">
//           {carregando ? (
//             <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
//               <Loader2 className="w-8 h-8 animate-spin mb-4" />
//               <p className="text-sm font-medium text-hidrotec-4">A carregar notas fiscais...</p>
//             </div>
//           ) : erro ? (
//             <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
//               <AlertCircle className="w-5 h-5 mr-2" />
//               {erro}
//             </div>
//           ) : notasFiltradas.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
//               <FileText className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
//               <p className="font-medium mb-1">Nenhuma nota fiscal encontrada.</p>
//               <p className="text-sm">Tente ajustar os filtros ou clique em "Nova Nota".</p>
//             </div>
//           ) : (
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
//                   {podeAvaliar && (
//                     <th className="px-3 py-3 w-10 text-center">
//                       <input
//                         type="checkbox"
//                         onChange={selecionarTodasPendentes}
//                         checked={
//                           notasFiltradas.filter(n => Number(n.status) === 0).length > 0 &&
//                           notasFiltradas.filter(n => Number(n.status) === 0).every(n => notasSelecionadasLote.includes(n.id))
//                         }
//                         className="rounded border-slate-300 text-hidrotec-1 focus:ring-hidrotec-1 w-4 h-4 cursor-pointer"
//                         title="Selecionar todas as pendentes visíveis"
//                       />
//                     </th>
//                   )}
//                   <th className="px-3 py-3 font-semibold">NF</th>
//                   <th className="px-3 py-3 font-semibold">Fornecedor</th>
//                   <th className="px-3 py-3 font-semibold">Obra</th>
//                   <th className="px-3 py-3 font-semibold">Vencimento</th>
//                   <th className="px-3 py-3 font-semibold">Valor (R$)</th>
//                   <th className="px-3 py-3 font-semibold text-center">Status</th>
//                   <th className="px-3 py-3 font-semibold text-center">PDF</th>
//                   <th className="px-3 py-3 font-semibold text-right">Gerenciar</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {notasFiltradas.map((nota) => {
//                   const ehPendente = Number(nota.status) === 0;
//                   const estaSelecionada = notasSelecionadasLote.includes(nota.id);

//                   return (
//                     <tr key={nota.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
//                       {podeAvaliar && (
//                         <td className="px-3 py-2.5 text-center">
//                           {ehPendente && (
//                             <input
//                               type="checkbox"
//                               checked={estaSelecionada}
//                               onChange={() => toggleSelecionarNota(nota.id)}
//                               className="rounded border-slate-300 text-hidrotec-1 focus:ring-hidrotec-1 w-4 h-4 cursor-pointer"
//                             />
//                           )}
//                         </td>
//                       )}
                      
//                       {/* Número da NF e o botão de edição (lápis) ao lado */}
//                       <td className="px-3 py-2.5 font-bold text-hidrotec-3 whitespace-nowrap">
//                         <div className="flex items-center gap-2">
//                           <span>#{nota.numero_nf}</span>
//                           {podeEditar && (
//                             <button
//                               onClick={() => abrirEdicao(nota)}
//                               className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-hidrotec-3 transition-colors"
//                               title="Editar nota"
//                             >
//                               <Pencil className="w-3 h-3" />
//                             </button>
//                           )}
//                         </div>
//                       </td>

//                       <td className="px-3 py-2.5 text-hidrotec-4 truncate max-w-[150px]" title={nomeFornecedor(nota.fornecedor)}>
//                         {nomeFornecedor(nota.fornecedor) || '-'}
//                       </td>
//                       <td className="px-3 py-2.5 font-medium text-hidrotec-3 truncate max-w-[160px]" title={nota.obra?.nome_obra || nota.obra?.nome}>
//                         {nota.obra?.nome_obra || nota.obra?.nome || '-'}
//                       </td>
//                       <td className="px-3 py-2.5">
//                         {renderVencimento(nota.data_vencimento, nota.status)}
//                       </td>
//                       <td className="px-3 py-2.5 font-bold text-hidrotec-3 whitespace-nowrap">
//                         {formatarMoeda(nota.valor_total)}
//                       </td>
//                       <td className="px-3 py-2.5 text-center">
//                         <div className="flex flex-col items-center gap-0.5">
//                           {renderStatus(nota.status)}
//                           {nota.parecer && (
//                             <span className="text-[10px] text-slate-500 italic max-w-[180px] truncate flex items-center gap-1" title={nota.parecer}>
//                               <MessageSquare size={10} className="shrink-0 text-hidrotec-1" />
//                               {nota.parecer}
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2.5 text-center">
//                         <div className="flex items-center justify-center">
//                           {nota.tem_anexo && nota.link_pdf ? (
//                             <button
//                               onClick={() => setNotaPdf(nota)}
//                               className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors"
//                               title="Visualizar PDF"
//                             >
//                               <Eye className="w-3.5 h-3.5" />
//                               PDF
//                             </button>
//                           ) : (
//                             <span title="Sem anexo" className="inline-flex items-center text-xs text-slate-300">
//                               <Paperclip className="w-3.5 h-3.5" />
//                             </span>
//                           )}
//                         </div>
//                       </td>

//                       {/* Coluna de Gerenciar (Apenas Aprovar/Reprovar se pendente) */}
//                       <td className="px-3 py-2.5 text-right whitespace-nowrap">
//                         <div className="flex items-center justify-end gap-1.5">
//                           {podeAvaliar && ehPendente && (
//                             <>
//                               <button
//                                 onClick={() => abrirModalAcao(nota, 'aprovar')}
//                                 disabled={processando}
//                                 className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-[11px] font-bold uppercase transition-colors"
//                                 title="Aprovar nota"
//                               >
//                                 Aprovar
//                               </button>
//                               <button
//                                 onClick={() => abrirModalAcao(nota, 'reprovar')}
//                                 disabled={processando}
//                                 className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold uppercase transition-colors"
//                                 title="Reprovar nota"
//                               >
//                                 Reprovar
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>

//       {notaEditando && (
//         <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
//           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
//               <h3 className="font-display font-bold text-lg text-hidrotec-3 flex items-center gap-2">
//                 <Pencil className="w-5 h-5 text-hidrotec-1" />
//                 Editar Nota Fiscal #{notaEditando.numero_nf}
//               </h3>
//               <button onClick={() => setNotaEditando(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={salvarEdicao} className="p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={labelCls}>Número da NF *</label>
//                   <input type="text" name="numero_nf" value={formEdicao.numero_nf} onChange={handleEdicaoChange} className={inputCls} required />
//                 </div>
//                 <div>
//                   <label className={labelCls}>Vencimento</label>
//                   <input type="date" name="data_vencimento" value={formEdicao.data_vencimento} onChange={handleEdicaoChange} className={inputCls} />
//                 </div>
//                 <div>
//                   <label className={labelCls}>Valor Total (R$)</label>
//                   <input type="number" step="0.01" name="valor_total" value={formEdicao.valor_total} onChange={handleEdicaoChange} className={inputCls} />
//                 </div>
//                 <div>
//                   <label className={labelCls}>Qtd. de Parcelas</label>
//                   <input type="number" min="1" name="quant_parcelas" value={formEdicao.quant_parcelas} onChange={handleEdicaoChange} className={inputCls} />
//                 </div>
//               </div>

//               <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
//                 <label className={labelCls}>Atualizar Arquivo PDF (opcional)</label>
//                 <input
//                   type="file"
//                   accept="application/pdf"
//                   onChange={(e) => setArquivoEdicao(e.target.files[0] || null)}
//                   className="w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-extra file:text-hidrotec-1 cursor-pointer"
//                 />
//               </div>

//               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
//                 <button
//                   type="button"
//                   onClick={() => setNotaEditando(null)}
//                   className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
//                 >
//                   Cancelar
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={salvandoEdicao}
//                   className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
//                 >
//                   {salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
//                   Salvar Alterações
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {notaPdf && (
//         <div className="fixed inset-0 w-screen h-screen bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-[900] p-4">
//           <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
//             <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
//               <h3 className="font-display font-bold text-lg text-hidrotec-3 truncate">
//                 Nota Fiscal #{notaPdf.numero_nf}
//               </h3>
//               <div className="flex items-center gap-4">
//                 <a
//                   href={notaPdf.link_pdf}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
//                 >
//                   <ExternalLink size={14} /> Abrir em nova aba
//                 </a>
//                 <button onClick={() => setNotaPdf(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>

//             <div className="flex-1 bg-slate-100">
//               <iframe
//                 src={`${notaPdf.link_pdf}#toolbar=0`}
//                 title={`PDF da nota ${notaPdf.numero_nf}`}
//                 className="w-full h-full border-0"
//               />
//             </div>

//             {podeAvaliar && Number(notaPdf.status) === 0 && (
//               <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
//                 <button
//                   onClick={() => { const nota = notaPdf; setNotaPdf(null); abrirModalAcao(nota, 'reprovar'); }}
//                   className="px-5 py-2.5 text-sm font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
//                 >
//                   Reprovar
//                 </button>
//                 <button
//                   onClick={() => { const nota = notaPdf; setNotaPdf(null); abrirModalAcao(nota, 'aprovar'); }}
//                   className="px-5 py-2.5 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
//                 >
//                   Aprovar
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {modalAberto && (
//         <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
//           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
//               <h3 className={`font-display font-bold text-lg flex items-center gap-2 ${tipoAcao === 'aprovar' ? 'text-green-600' : 'text-red-600'}`}>
//                 {tipoAcao === 'aprovar' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
//                 {tipoAcao === 'aprovar' ? 'Aprovar' : 'Reprovar'} Nota Fiscal #{notaSelecionada?.numero_nf}
//               </h3>
//               <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={confirmarAcao} className="p-6">
//               <div className="space-y-4">
//                 <div>
//                   <label className={labelCls}>
//                     Parecer do Diretor {tipoAcao === 'reprovar' ? '*' : '(Opcional)'}
//                   </label>
//                   <textarea
//                     rows="4"
//                     value={mensagem}
//                     onChange={(e) => setMensagem(e.target.value)}
//                     className={`${inputCls} resize-none`}
//                     placeholder={tipoAcao === 'aprovar' ? 'Adicione um parecer opcional para esta aprovação...' : 'Descreva o motivo da recusa ou observações para o lançador...'}
//                     {...(tipoAcao === 'reprovar' ? { required: true } : {})}
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
//                 <button
//                   type="button"
//                   onClick={() => setModalAberto(false)}
//                   className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
//                 >
//                   Cancelar
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={processando}
//                   className={`px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 ${
//                     tipoAcao === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
//                   }`}
//                 >
//                   {processando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
//                   Confirmar {tipoAcao === 'aprovar' ? 'Aprovação' : 'Reprovação'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }