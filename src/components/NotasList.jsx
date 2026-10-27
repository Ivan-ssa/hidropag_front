// =====================================================================
// NotasList.jsx
// Tela de listagem de Notas Fiscais.
// Mostra os cards de resumo, filtros, a tabela de notas e o modal de
// aprovação/reprovação.
// =====================================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Search, CheckCircle, XCircle, Clock, Eye,
  AlertCircle, X, Send, Loader2, MessageSquare, Filter, RotateCcw,
  Paperclip, ExternalLink, Pencil
} from 'lucide-react';

export default function NotasList() {
  // -------------------------------------------------------------------
  // CONFIGURAÇÃO DA API
  // -------------------------------------------------------------------
  // URL base do backend (vem do arquivo .env; se não existir, usa localhost)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Token salvo no login. É enviado em toda requisição para provar quem é o usuário.
  const token = localStorage.getItem('tokenHidropag');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // -------------------------------------------------------------------
  // DADOS DO USUÁRIO LOGADO (salvos no localStorage durante o login)
  // -------------------------------------------------------------------
  const nome = localStorage.getItem('usuarioNome') || 'Usuário';
  const perfil = localStorage.getItem('usuarioPerfil');

  // ID do usuário logado. É enviado no registro da aprovação.
  // ATENÇÃO: confirme se o Login.jsx salva com o nome "usuarioId".
  const usuarioId = localStorage.getItem('usuarioId');

  // Só estes perfis veem os botões de Aprovar/Reprovar.
  // ATENÇÃO: essa regra é uma sugestão. Ajuste a lista se a regra do sistema for outra.
  const podeAvaliar = ['root', 'gestor'].includes(perfil);

  // Saudação de acordo com a hora do dia
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // -------------------------------------------------------------------
  // ESTADOS (dados que a tela guarda e que, ao mudar, atualizam a tela)
  // -------------------------------------------------------------------
  const [notas, setNotas] = useState([]);                       // lista de notas vinda da API
  const [busca, setBusca] = useState('');                       // texto digitado na busca
  const [filtroStatus, setFiltroStatus] = useState('todas');    // aba selecionada
  const [filtroVencimento, setFiltroVencimento] = useState(''); // data escolhida no filtro
  const [carregando, setCarregando] = useState(true);           // true enquanto busca na API
  const [erro, setErro] = useState(null);                       // mensagem de erro, se houver

  // Estados do modal de Aprovar / Reprovar
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoAcao, setTipoAcao] = useState(null);               // 'aprovar' ou 'reprovar'
  const [notaSelecionada, setNotaSelecionada] = useState(null); // nota que está sendo avaliada
  const [mensagem, setMensagem] = useState('');                 // parecer digitado
  const [processando, setProcessando] = useState(false);        // true enquanto envia a decisão

  // Modal de visualização do PDF: guarda a nota que está sendo visualizada
  // (null = modal fechado)
  const [notaPdf, setNotaPdf] = useState(null);

  // Modal de edição da nota (caneta): guarda a nota sendo editada (null = fechado)
  const [notaEditando, setNotaEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});          // campos do formulário de edição
  const [arquivoEdicao, setArquivoEdicao] = useState(null);  // novo PDF escolhido (opcional)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Perfis que podem editar notas.
  // ATENÇÃO: sugestão minha. Ajuste a lista se a regra do sistema for outra.
  const podeEditar = ['root', 'gestor', 'lancador'].includes(perfil);

  // -------------------------------------------------------------------
  // CARREGAR NOTAS
  // Roda uma vez, quando a tela abre.
  // -------------------------------------------------------------------
  useEffect(() => {
    carregarNotas();
  }, []);

  const carregarNotas = async () => {
    try {
      setCarregando(true);
      // IMPORTANTE: a rota certa no backend é /notas (NÃO /notas-fiscais, que dava 404)
      const resposta = await axios.get(`${API_URL}/notas`, config);
      // Aceita lista direta ou objeto com a lista dentro (ex: { data: [...] })
      const dados = resposta.data;
      setNotas(Array.isArray(dados) ? dados : (dados.data || dados.notas || []));
      setErro(null);
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      setErro('Não foi possível carregar a lista de notas fiscais.');
    } finally {
      setCarregando(false);
    }
  };

  // -------------------------------------------------------------------
  // MODAL DE AÇÃO
  // -------------------------------------------------------------------

  // Abre o modal para aprovar ou reprovar uma nota específica
  const abrirModalAcao = (nota, acao) => {
    setNotaSelecionada(nota);
    setTipoAcao(acao);
    setMensagem('');
    setModalAberto(true);
  };

  // Envia a decisão (aprovar/reprovar) para o backend
  const confirmarAcao = async (e) => {
    e.preventDefault(); // evita recarregar a página ao enviar o formulário
    if (!notaSelecionada) return;

    try {
      setProcessando(true);

      // Status: 0 = pendente, 1 = aprovada, 2 = reprovada
      const novoStatus = tipoAcao === 'aprovar' ? 1 : 2;

      // Mesmo fluxo da tela de Aprovações, em dois passos:

      // 1) Registra a decisão e o parecer na rota /aprovacoes.
      //    O backend espera exatamente estes nomes de campo:
      //    decisao (1 = aprovada, 2 = reprovada), observacao (o parecer),
      //    nota (UUID da nota) e usuario (UUID de quem decidiu).
      const payloadAprovacao = {
        decisao: novoStatus,
        observacao: mensagem,
        nota: notaSelecionada.id,
        usuario: usuarioId, // é um UUID (texto), não converta para número
      };
      await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);

      // 2) Atualiza só o status da nota. Usamos PUT porque o PATCH dava
      //    "erro de rede" (o CORS do backend não libera esse método) e
      //    porque esta rota não aceita o campo "parecer".
      await axios.put(`${API_URL}/notas/${notaSelecionada.id}`, { status: novoStatus }, config);

      alert(`Nota fiscal ${tipoAcao === 'aprovar' ? 'aprovada' : 'reprovada'} com sucesso!`);
      setModalAberto(false);
      setNotaSelecionada(null);
      carregarNotas(); // recarrega a lista para mostrar o novo status
    } catch (error) {
      console.error('Erro completo da API:', error);
      if (error.response && error.response.data) {
        // O servidor respondeu com um erro: mostra a mensagem dele
        const msgServidor = error.response.data.message || error.response.data;
        alert(`O back-end recusou a alteração: ${JSON.stringify(msgServidor)}`);
      } else {
        // Nem chegou resposta do servidor (rede, CORS ou servidor fora do ar)
        alert(`Erro de rede: a rota PUT /notas/${notaSelecionada.id} falhou. Verifique o CORS ou se o servidor está no ar.`);
      }
    } finally {
      setProcessando(false);
    }
  };

  // -------------------------------------------------------------------
  // EDIÇÃO DE NOTA (caneta)
  // -------------------------------------------------------------------

  // Abre o modal já preenchido com os dados atuais da nota
  const abrirEdicao = (nota) => {
    setNotaEditando(nota);
    setFormEdicao({
      numero_nf: nota.numero_nf || '',
      // O campo de data precisa do formato AAAA-MM-DD
      data_vencimento: nota.data_vencimento ? String(nota.data_vencimento).slice(0, 10) : '',
      valor_total: nota.valor_total ?? '',
      quant_parcelas: nota.quant_parcelas || 1,
    });
    setArquivoEdicao(null);
  };

  // Atualiza o campo digitado no formulário de edição
  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setFormEdicao(prev => ({ ...prev, [name]: value }));
  };

  // Salva as alterações no backend
  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (!notaEditando) return;

    try {
      setSalvandoEdicao(true);

      // Só enviamos campos que sabemos que existem na tabela "notas".
      // Fornecedor e obra ficaram de fora porque ainda não confirmamos os nomes
      // que o backend aceita.
      const payload = {
        numero_nf: String(formEdicao.numero_nf),
        data_vencimento: formEdicao.data_vencimento || null,
        valor_total: Number(formEdicao.valor_total),
        quant_parcelas: Number(formEdicao.quant_parcelas),
      };

      // 1) Atualiza os dados da nota
      await axios.put(`${API_URL}/notas/${notaEditando.id}`, payload, config);

      // 2) Se escolheu um novo PDF, envia na rota de upload (a mesma da versão antiga).
      //    O nome do campo precisa ser exatamente "file".
      if (arquivoEdicao) {
        const formData = new FormData();
        formData.append('file', arquivoEdicao);
        await axios.put(`${API_URL}/notas/${notaEditando.id}/upload-pdf`, formData, config);
      }

      alert('Nota atualizada com sucesso!');
      setNotaEditando(null);
      setArquivoEdicao(null);
      carregarNotas(); // recarrega a lista com os dados novos
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      const msg = error.response?.data?.message;
      alert('Erro ao atualizar: ' + (msg ? JSON.stringify(msg) : 'verifique os dados e o arquivo.'));
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // -------------------------------------------------------------------
  // CONTADORES DOS CARDS DE RESUMO
  // -------------------------------------------------------------------
  const totalDecidir = notas.filter(n => Number(n.status) === 0).length;
  const totalAprovadas = notas.filter(n => Number(n.status) === 1).length;
  const totalLancado = notas.length;

  // -------------------------------------------------------------------
  // NOME DO FORNECEDOR
  // O backend pode mandar o fornecedor como texto OU como objeto
  // (ex: { id: 1, razao_social: "ABC Ltda" }). Esta função devolve sempre
  // um texto. Precisa ficar ANTES da filtragem, que a utiliza.
  // -------------------------------------------------------------------
  const nomeFornecedor = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return f;
    // Tenta os nomes de campo mais comuns
    const nome = f.razao_social || f.nome_fantasia || f.nome || f.fornecedor;
    if (typeof nome === 'string') return nome;
    // Último recurso: pega o primeiro campo de texto que existir no objeto
    const primeiroTexto = Object.values(f).find(v => typeof v === 'string' && v.trim() !== '');
    return primeiroTexto || '';
  };

  // -------------------------------------------------------------------
  // FILTRAGEM DA TABELA
  // Combina três filtros: texto, status (abas) e vencimento.
  // -------------------------------------------------------------------
  const notasFiltradas = notas.filter(n => {
    // 1) Busca por texto: número da NF ou nome do fornecedor
    const termo = busca.toLowerCase();
    const numero = String(n.numero_nf || '').toLowerCase();
    const fornecedor = nomeFornecedor(n.fornecedor).toLowerCase();
    const matchTexto = numero.includes(termo) || fornecedor.includes(termo);

    // 2) Aba de status
    const matchStatus =
      filtroStatus === 'todas' ? true :
      filtroStatus === 'decidir' ? Number(n.status) === 0 :
      filtroStatus === 'aprovadas' ? Number(n.status) === 1 :
      filtroStatus === 'reprovadas' ? Number(n.status) === 2 : true;

    // 3) Data de vencimento (compara o texto da data, ex: "2026-10-26")
    const matchVencimento = filtroVencimento ? n.data_vencimento?.includes(filtroVencimento) : true;

    return matchTexto && matchStatus && matchVencimento;
  });

  // -------------------------------------------------------------------
  // FUNÇÕES AUXILIARES DE EXIBIÇÃO
  // -------------------------------------------------------------------

  // Formata número como moeda brasileira (ex: 1500 -> R$ 1.500,00)
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  // Desenha a etiqueta colorida de status
  const renderStatus = (status) => {
    switch (Number(status)) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-50 text-green-600">
            <CheckCircle size={14} /> Aprovada
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600">
            <XCircle size={14} /> Reprovada
          </span>
        );
      default:
        // qualquer outro valor (0) é tratado como pendente
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
            <Clock size={14} /> Pendente
          </span>
        );
    }
  };

  // Classes de estilo reaproveitadas nos campos do modal
  const inputCls = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white';
  const labelCls = 'block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2';

  // -------------------------------------------------------------------
  // TELA (o que aparece no navegador)
  // -------------------------------------------------------------------
  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">

      {/* ---------- Cabeçalho da página ---------- */}
      <header className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-1">
          Notas Fiscais
        </h1>
        <p className="text-sm text-hidrotec-4">
          Listagem e gerenciamento de notas fiscais
        </p>
      </header>

      {/* ---------- Saudação e cards de resumo ---------- */}
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-hidrotec-3 mb-1">
          Olá, {nome}! {saudacao}.
        </h2>
        <p className="text-sm text-hidrotec-4 mb-6">
          Aqui está o resumo das suas notas fiscais e aprovações pendentes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Card: notas aguardando decisão */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">A DECIDIR</p>
              <p className="text-3xl font-display font-bold text-hidrotec-3">{totalDecidir}</p>
            </div>
          </div>

          {/* Card: notas aprovadas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-hidrotec-4">APROVADAS</p>
              <p className="text-3xl font-display font-bold text-hidrotec-3">{totalAprovadas}</p>
            </div>
          </div>

          {/* Card: total de notas lançadas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
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

      {/* ---------- Abas de filtro rápido + botão "Nova Nota" ---------- */}
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

        {/* CORRIGIDO: era "/notas/novo", mas a rota no App.jsx é "/notas/nova" */}
        <Link
          to="/notas/nova"
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nova Nota
        </Link>
      </div>

      {/* ---------- Barra de filtros avançados ---------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-hidrotec-4 font-bold text-xs uppercase tracking-wider shrink-0">
          <Filter size={16} /> Filtros:
        </div>

        {/* Campo de busca por NF ou fornecedor */}
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

        {/* Filtro por data de vencimento */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-hidrotec-4 whitespace-nowrap">Vencimento:</span>
          <input
            type="date"
            value={filtroVencimento}
            onChange={(e) => setFiltroVencimento(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white text-hidrotec-3"
          />
        </div>

        {/* Limpa todos os filtros de uma vez */}
        <button
          onClick={() => { setBusca(''); setFiltroStatus('todas'); setFiltroVencimento(''); }}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-hidrotec-3 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <RotateCcw size={14} /> Limpar Filtros
        </button>
      </div>

      {/* ---------- Tabela de notas ---------- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">

          {/* Três situações possíveis: carregando, erro, vazio ou tabela com dados */}
          {carregando ? (
            // 1) Ainda buscando na API
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">A carregar notas fiscais...</p>
            </div>
          ) : erro ? (
            // 2) A busca falhou
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          ) : notasFiltradas.length === 0 ? (
            // 3) Buscou, mas nenhuma nota passou nos filtros
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <FileText className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">Nenhuma nota fiscal encontrada.</p>
              <p className="text-sm">Tente ajustar os filtros ou clique em "Nova Nota".</p>
            </div>
          ) : (
            // 4) Tem notas para mostrar
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold">NF</th>
                  <th className="px-6 py-4 font-semibold">Fornecedor</th>
                  <th className="px-6 py-4 font-semibold">Obra</th>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold">Valor (R$)</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">PDF</th>
                  <th className="px-6 py-4 font-semibold text-right">Gerenciar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Uma linha da tabela para cada nota filtrada */}
                {notasFiltradas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-slate-50/50 transition-colors group">

                    {/* Número da nota */}
                    <td className="px-6 py-4 font-bold text-hidrotec-3">
                      #{nota.numero_nf}
                    </td>

                    {/* Fornecedor */}
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {nomeFornecedor(nota.fornecedor) || '-'}
                    </td>

                    {/* Obra (o backend pode mandar como nome_obra ou nome) */}
                    <td className="px-6 py-4 text-sm font-medium text-hidrotec-3">
                      {nota.obra?.nome_obra || nota.obra?.nome || '-'}
                    </td>

                    {/* Data de vencimento no formato brasileiro */}
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {nota.data_vencimento ? new Date(nota.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                    </td>

                    {/* Valor total em reais */}
                    <td className="px-6 py-4 text-sm font-bold text-hidrotec-3">
                      {formatarMoeda(nota.valor_total)}
                    </td>

                    {/* Status + parecer (se existir) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {renderStatus(nota.status)}
                        {nota.parecer && (
                          <span className="text-[11px] text-slate-500 italic max-w-xs truncate flex items-center gap-1" title={nota.parecer}>
                            <MessageSquare size={12} className="shrink-0 text-hidrotec-1" />
                            {nota.parecer}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PDF: o backend manda "tem_anexo" (true/false) e "link_pdf" (URL completa).
                        Se tiver os dois, mostra o botão que abre o modal com o PDF. */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {nota.tem_anexo && nota.link_pdf ? (
                          <button
                            onClick={() => setNotaPdf(nota)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors"
                            title="Visualizar PDF"
                          >
                            <Eye className="w-4 h-4" />
                            {Number(nota.status) === 0 ? 'Analisar PDF' : 'Ver PDF'}
                          </button>
                        ) : (
                          <span title="Sem arquivo anexado" className="inline-flex items-center gap-1 text-xs text-slate-300">
                            <Paperclip className="w-3.5 h-3.5" /> Sem anexo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Botões Aprovar/Reprovar: só para perfis autorizados e notas pendentes */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Caneta: abre o modal de edição da nota */}
                        {podeEditar && (
                          <button
                            onClick={() => abrirEdicao(nota)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-hidrotec-3 transition-colors"
                            title="Editar nota"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        {podeAvaliar && Number(nota.status) === 0 && (
                          <>
                            <button
                              onClick={() => abrirModalAcao(nota, 'aprovar')}
                              disabled={processando}
                              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-bold uppercase transition-colors"
                              title="Aprovar nota"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => abrirModalAcao(nota, 'reprovar')}
                              disabled={processando}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold uppercase transition-colors"
                              title="Reprovar nota"
                            >
                              Reprovar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------- Modal de edição da nota (caneta) ---------- */}
      {/* Aparece quando notaEditando tem uma nota */}
      {notaEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">

            {/* Título e botão de fechar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-hidrotec-1" />
                Editar Nota Fiscal #{notaEditando.numero_nf}
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
                  <label className={labelCls}>Vencimento</label>
                  <input type="date" name="data_vencimento" value={formEdicao.data_vencimento} onChange={handleEdicaoChange} className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Valor Total (R$)</label>
                  <input type="number" step="0.01" name="valor_total" value={formEdicao.valor_total} onChange={handleEdicaoChange} className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Qtd. de Parcelas</label>
                  <input type="number" min="1" name="quant_parcelas" value={formEdicao.quant_parcelas} onChange={handleEdicaoChange} className={inputCls} />
                </div>
              </div>

              {/* Troca do PDF (opcional) */}
              <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
                <label className={labelCls}>Atualizar Arquivo PDF (opcional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setArquivoEdicao(e.target.files[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-extra file:text-hidrotec-1 cursor-pointer"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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
            </form>
          </div>
        </div>
      )}

      {/* ---------- Modal de visualização do PDF ---------- */}
      {/* Aparece quando notaPdf tem uma nota. O PDF é mostrado dentro de um iframe. */}
      {notaPdf && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-[900] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">

            {/* Topo: título, link para abrir em nova aba e botão de fechar */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-display font-bold text-lg text-hidrotec-3 truncate">
                Nota Fiscal #{notaPdf.numero_nf}
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

            {/* Área principal: o PDF. "#toolbar=0" esconde a barra do leitor de PDF. */}
            <div className="flex-1 bg-slate-100">
              <iframe
                src={`${notaPdf.link_pdf}#toolbar=0`}
                title={`PDF da nota ${notaPdf.numero_nf}`}
                className="w-full h-full border-0"
              />
            </div>

            {/* Rodapé: Aprovar/Reprovar direto da visualização (só perfis autorizados e nota pendente).
                Fecha este modal e abre o modal de parecer. */}
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

      {/* ---------- Modal de aprovação / reprovação ---------- */}
      {/* Só é desenhado quando modalAberto é true */}
      {modalAberto && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">

            {/* Título do modal (verde para aprovar, vermelho para reprovar) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className={`font-display font-bold text-lg flex items-center gap-2 ${tipoAcao === 'aprovar' ? 'text-green-600' : 'text-red-600'}`}>
                {tipoAcao === 'aprovar' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {tipoAcao === 'aprovar' ? 'Aprovar' : 'Reprovar'} Nota Fiscal #{notaSelecionada?.numero_nf}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmarAcao} className="p-6">
              <div className="space-y-4">
                <div>
                  {/* Parecer: opcional ao aprovar, obrigatório ao reprovar */}
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

              {/* Botões do modal */}
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
