import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check, Filter, RotateCcw, Download, Paperclip, Search, AlertTriangle, List, Clock, CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NotasList() {
  const [notas, setNotas] = useState([]);
  const [obras, setObras] = useState([]);
  const [notaEditando, setNotaEditando] = useState(null);
  const [arquivoEdicao, setArquivoEdicao] = useState(null);
  const perfil = localStorage.getItem("usuarioPerfil");
  
  // Controla o popup de visualização do PDF e Aprovação
  const [notaVisualizando, setNotaVisualizando] = useState(null); 

  // Estados dos Filtros
  const [filtroStatus, setFiltroStatus] = useState(""); // "" = Todos, "0" = A Decidir, "1" = Aprovadas, "2" = Reprovadas
  const [filtroVencimento, setFiltroVencimento] = useState("");
  const [busca, setBusca] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  const carregarDados = async () => {
    try {
      const resNotas = await axios.get(`${API_URL}/notas`, config);
      setNotas(resNotas.data);
    } catch (err) {
      console.error("Erro ao buscar notas:", err);
    }
      
    try {
      const resObras = await axios.get(`${API_URL}/obras`, config);
      setObras(resObras.data);
    } catch (err) {
      console.error("Erro ao buscar obras:", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- FILTRAGEM NA TELA ---
  const notasFiltradas = notas.filter(nota => {
    const bateStatus = filtroStatus === "" || nota.status.toString() === filtroStatus;
    const bateVencimento = filtroVencimento === "" || nota.data_vencimento === filtroVencimento;
    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === "" ||
      nota.numero_nf?.toString().includes(termo) ||
      nota.fornecedor?.toLowerCase().includes(termo);
    return bateStatus && bateVencimento && bateBusca;
  });

  // Nota vencida = ainda "a decidir" (status 0) e com vencimento no passado
  function estaVencida(nota) {
    if (nota.status !== 0 || !nota.data_vencimento) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(nota.data_vencimento) < hoje;
  }

  // --- FUNÇÕES DE APROVAÇÃO ---
  const mudarStatus = async (id, novoStatus) => {
    try {
      // FIX: Enviamos JSON puro { status: novoStatus } em vez de FormData.
      // O NestJS entende isso perfeitamente e atualiza o banco sem Erro 500.
      await axios.put(`${API_URL}/notas/${id}`, { status: novoStatus }, config);
      
      alert(novoStatus === 1 ? "Nota Aprovada com sucesso!" : "Nota Reprovada com sucesso!");
      setNotaVisualizando(null); 
      carregarDados(); 
    } catch (erro) {
      console.error("Erro na aprovação:", erro);
      alert("Erro ao mudar o status da nota.");
    }
  };

  // --- EXCLUSÃO ---
  const excluirNota = async (id) => {
    if (window.confirm("Deseja realmente excluir permanentemente esta nota?")) {
      try {
        await axios.delete(`${API_URL}/notas/${id}`, config);
        alert("Excluída com sucesso!");
        carregarDados();
      } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir a nota.");
      }
    }
  };

  // --- FUNÇÕES DO MODAL DE EDIÇÃO ---
  const abrirModalEdicao = (nota) => {
    setNotaEditando({
      ...nota,
      obraId: nota.obra ? nota.obra.id : ""
    });
    setArquivoEdicao(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setNotaEditando(prev => ({ ...prev, [name]: value }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();

    try {
      // 1. Atualiza os dados de texto (JSON)
      const payload = {
        numero_nf: Number(notaEditando.numero_nf),
        fornecedor: notaEditando.fornecedor || "",
        data_vencimento: notaEditando.data_vencimento || null,
        valor_total: Number(notaEditando.valor_total),
        quant_parcelas: Number(notaEditando.quant_parcelas),
        status: Number(notaEditando.status),
        
        // ALTERAÇÃO AQUI: Enviamos diretamente o ID (string/UUID)
        // Se o seu DTO chamar "obraId", use "obraId". Se chamar "obra", use "obra".
        // Pelo erro, ele está esperando o ID, então tente:
        obra: notaEditando.obraId || null 
      };

      await axios.put(`${API_URL}/notas/${notaEditando.id}`, payload, config);

      // 2. Se houver arquivo, faz o upload na rota separada
      if (arquivoEdicao) {
        const formData = new FormData();
        formData.append("file", arquivoEdicao); // Nome do campo deve ser exatamente 'file'
        
        // Enviamos apenas o FormData e o Token. 
        // O Axios adiciona o Boundary do multipart/form-data automaticamente.
        // NÃO coloque "Content-Type" nos headers aqui, isso causa o erro 400.
        await axios.put(`${API_URL}/notas/${notaEditando.id}/upload-pdf`, formData, {
          headers: { 
            Authorization: config.headers.Authorization 
          }
        });
      }

      alert("Nota atualizada com sucesso!");
      setNotaEditando(null);
      setArquivoEdicao(null);
      carregarDados();
    } catch (erro) {
      console.error("Erro detalhado:", erro.response?.data || erro);
      alert("Erro ao atualizar: " + (erro.response?.data?.message || "Verifique o arquivo ou os dados."));
    }
  };

  // Textos para o Status
  const renderStatus = (status) => {
    if (status === 1) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-success-500">APROVADA</span>;
    if (status === 2) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-danger-500">REPROVADA</span>;
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-amber-500">A DECIDIR</span>;
  };

  const inputCls = "w-full px-3 py-2 mt-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-slate-600";

  return (
    <div className="relative">
      
      {/* CABEÇALHO SUPERIOR: ABAS DE STATUS E BOTÃO NOVA NOTA */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
        {/* Abas de Filtro de Status */}
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltroStatus("")}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              filtroStatus === "" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="w-4 h-4" /> Todas
          </button>
          <button
            onClick={() => setFiltroStatus("0")}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              filtroStatus === "0" ? "bg-amber-500 text-white shadow" : "text-slate-500 hover:text-amber-600"
            }`}
          >
            <Clock className="w-4 h-4" /> A Decidir
          </button>
          <button
            onClick={() => setFiltroStatus("1")}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              filtroStatus === "1" ? "bg-success-500 text-white shadow" : "text-slate-500 hover:text-success-600"
            }`}
          >
            <CheckCircle className="w-4 h-4" /> Aprovadas
          </button>
          <button
            onClick={() => setFiltroStatus("2")}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              filtroStatus === "2" ? "bg-danger-500 text-white shadow" : "text-slate-500 hover:text-danger-600"
            }`}
          >
            <XCircle className="w-4 h-4" /> Reprovadas
          </button>
        </div>

        <Link
          to="/notas/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors shadow-sm w-full lg:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nova Nota
        </Link>
      </div>

      {/* BARRA DE PESQUISA E VENCIMENTO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex gap-4 items-center flex-wrap shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-flow-500" />
          Refinar:
        </span>

        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar NF ou fornecedor..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Vencimento:</label>
          <input
            type="date"
            value={filtroVencimento}
            onChange={e => setFiltroVencimento(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400"
          />
        </div>

        <button
          onClick={() => { setFiltroStatus(""); setFiltroVencimento(""); setBusca(""); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors ml-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Filtros
        </button>
      </div>

      {/* TABELA DE NOTAS (Ações Rápidas Removidas) */}
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="bg-ink-800 text-white text-left">
              <th className="px-4 py-3 font-medium">NF</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Obra</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor (R$)</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Visualizar/Aprovar</th>
              <th className="px-4 py-3 font-medium text-center">Gerenciar</th>
            </tr>
          </thead>
          <tbody>
            {notasFiltradas.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">Nenhuma nota encontrada com estes filtros.</td></tr>
            ) : (
              notasFiltradas.map((nota) => (
                <tr key={nota.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{nota.numero_nf}</td>
                  <td className="px-4 py-3 text-slate-600">{nota.fornecedor || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{nota.obra?.nome_obra || "Sem obra"}</td>
                  <td className="px-4 py-3">
                    <span className={estaVencida(nota) ? "inline-flex items-center gap-1 text-danger-500 font-semibold" : "text-slate-600"}>
                      {estaVencida(nota) && <AlertTriangle className="w-3.5 h-3.5" title="Nota Vencida!" />}
                      {nota.data_vencimento ? new Date(nota.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {nota.valor_total ? `R$ ${Number(nota.valor_total).toFixed(2)}` : "-"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {renderStatus(nota.status)}
                  </td>

                  {/* VISUALIZAR PDF E APROVAR (Abre o Modal Fullscreen) */}
                  <td className="px-4 py-3 text-center">
                    {nota.tem_anexo && nota.link_pdf ? (
                      <button
                        type="button"
                        onClick={() => setNotaVisualizando(nota)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          nota.status === 0 ? "bg-flow-500 hover:bg-flow-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        {nota.status === 0 ? "Analisar PDF" : "Ver PDF"}
                      </button>
                    ) : (
                      <span title="Sem arquivo anexado" className="inline-flex items-center gap-1 text-xs text-slate-300">
                        <Paperclip className="w-3.5 h-3.5" /> Sem Anexo
                      </span>
                    )}
                  </td>

                  {/* BOTÕES DE EDITAR E EXCLUIR */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    
                    {/* Apenas Lançador, Gestor ou Root podem EDITAR */}
                    {(perfil === 'lancador' || perfil === 'gestor' || perfil === 'root') && (
                      <button
                        onClick={() => abrirModalEdicao(nota)}
                        className="inline-flex items-center gap-1 mr-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}

                    {/* Apenas Gestor ou Root podem EXCLUIR */}
                    {(perfil === 'gestor' || perfil === 'root') && (
                      <button
                        onClick={() => excluirNota(nota.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-ink-800 hover:bg-ink-700 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE VISUALIZAÇÃO DO PDF E APROVAÇÃO --- */}
      {notaVisualizando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-[1100] p-2 sm:p-6">
          <div className="bg-white rounded-xl w-full max-w-7xl h-full shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <h3 className="font-display font-bold text-lg text-slate-800">
                Análise de Nota Fiscal
              </h3>
              <button onClick={() => setNotaVisualizando(null)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo Dividido */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              
              {/* Barra Lateral Esquerda: Dados e Ações */}
              <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                
                {/* Resumo da Nota */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 uppercase tracking-wide">
                    Dados do Lançamento
                  </h4>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">Fornecedor</span>
                    <span className="block text-base font-medium text-slate-800">{notaVisualizando.fornecedor || "Não informado"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">Número NF</span>
                      <span className="block text-sm font-medium text-slate-800">{notaVisualizando.numero_nf}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">Valor Total</span>
                      <span className="block text-lg font-bold text-flow-600">
                        {notaVisualizando.valor_total ? `R$ ${Number(notaVisualizando.valor_total).toFixed(2)}` : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">Vencimento</span>
                      <span className={`block text-sm font-medium ${estaVencida(notaVisualizando) ? "text-danger-600" : "text-slate-800"}`}>
                        {notaVisualizando.data_vencimento ? new Date(notaVisualizando.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "-"}
                        {estaVencida(notaVisualizando) && " (Vencida)"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">Status Atual</span>
                      <div className="mt-1">{renderStatus(notaVisualizando.status)}</div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">Obra Vinculada</span>
                    <span className="block text-sm font-medium text-slate-800">{notaVisualizando.obra?.nome_obra || "Nenhuma"}</span>
                  </div>
                </div>

                {/* Área de Decisão (Visível apenas se o status for 0) */}
                {notaVisualizando.status === 0 ? (
                  <div className="bg-white border border-flow-200 rounded-lg p-5 shadow-sm mt-auto">
                    <h4 className="text-sm font-bold text-slate-800 text-center mb-4">Decisão do Gestor</h4>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => mudarStatus(notaVisualizando.id, 1)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-success-500 hover:bg-green-700 text-white font-bold transition-colors shadow-md"
                      >
                        <Check className="w-5 h-5" /> APROVAR PAGAMENTO
                      </button>
                      <button
                        onClick={() => mudarStatus(notaVisualizando.id, 2)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-danger-500 text-danger-600 hover:bg-danger-50 font-bold transition-colors"
                      >
                        <X className="w-5 h-5" /> REPROVAR NOTA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto p-4 bg-slate-100 rounded-lg text-center text-sm text-slate-500 font-medium">
                    Esta nota já foi avaliada e não requer decisão pendente.
                  </div>
                )}
                
                <a
                  href={notaVisualizando.link_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-center text-sm font-semibold text-flow-600 hover:text-flow-500 transition-colors"
                >
                  Abrir PDF em nova aba externa
                </a>
              </div>

              {/* Área do PDF (Viewport Principal) */}
              <div className="w-full lg:w-2/3 h-[50vh] lg:h-full bg-slate-800 flex flex-col relative">
                <iframe
                  src={`${notaVisualizando.link_pdf}#toolbar=0`}
                  title={`Nota ${notaVisualizando.numero_nf}`}
                  className="w-full h-full border-0"
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO TRADICIONAL MANTIDO AQUI (Ocultado no snippet para brevidade, mas está no seu código original) --- */}
      {/* MODAL DE EDIÇÃO */}
      {notaEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">Editar Nota {notaEditando.numero_nf}</h3>
              <button onClick={() => setNotaEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className={labelCls}>Número NF:</label>
                  <input type="number" name="numero_nf" value={notaEditando.numero_nf} onChange={handleEditChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Fornecedor:</label>
                  <input type="text" name="fornecedor" value={notaEditando.fornecedor || ''} onChange={handleEditChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor Total:</label>
                  <input type="number" step="0.01" name="valor_total" value={notaEditando.valor_total || ''} onChange={handleEditChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Vencimento:</label>
                  <input type="date" name="data_vencimento" value={notaEditando.data_vencimento ? notaEditando.data_vencimento.substring(0, 10) : ''} onChange={handleEditChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Parcelas:</label>
                  <input type="number" name="quant_parcelas" value={notaEditando.quant_parcelas || 1} onChange={handleEditChange} className={inputCls} />
                </div>
                {/* <div>
                  <label className={labelCls}>Statussss:</label>
                  <select name="status" value={notaEditando.status} onChange={handleEditChange} className={`${inputCls} bg-white`}>
                    <option value="0">A Decidir</option>
                    <option value="1">Aprovada</option>
                    <option value="2">Reprovada</option>
                  </select>
                </div> */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Trocar Obra:</label>
                  <select name="obraId" value={notaEditando.obraId} onChange={handleEditChange} className={`${inputCls} bg-white`}>
                    <option value="">-- Sem Obra --</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome_obra}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Atualizar Arquivo (Opcional):</label>
                  <input
                    type="file"
                    onChange={e => setArquivoEdicao(e.target.files[0])}
                    className="w-full mt-1 text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-flow-100 file:text-flow-600 hover:file:bg-flow-100/70"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setNotaEditando(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default NotasList;