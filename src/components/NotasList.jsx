import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check, Filter, RotateCcw, Download, Paperclip, Search, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NotasList() {
  const [notas, setNotas] = useState([]);
  const [obras, setObras] = useState([]);
  const [notaEditando, setNotaEditando] = useState(null);
  const [arquivoEdicao, setArquivoEdicao] = useState(null);
  const [notaVisualizando, setNotaVisualizando] = useState(null); // controla o popup de visualização do PDF

  // Estados dos Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroVencimento, setFiltroVencimento] = useState("");
  const [busca, setBusca] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  function carregarDados() {
    // Busca Notas (Rota ajustada para minúsculo)
    axios.get(`${API_URL}/notas`, config)
      .then(res => setNotas(res.data))
      .catch(err => console.error(err));
      
    // Busca Obras (Rota ajustada para minúsculo)
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => console.error(err));
  }

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

  // --- FUNÇÕES RÁPIDAS DE APROVAÇÃO ---
  function mudarStatus(id, novoStatus) {
    const formData = new FormData();
    formData.append("status", novoStatus);

    // Rota ajustada para minúsculo
    axios.put(`${API_URL}/notas/${id}`, formData, config)
      .then(() => carregarDados())
      .catch(() => alert("Erro ao mudar status."));
  }

  function excluirNota(id) {
    if (window.confirm("Deseja realmente excluir esta nota?")) {
      // Rota ajustada para minúsculo
      axios.delete(`${API_URL}/notas/${id}`, config)
        .then(() => {
          alert("Excluída com sucesso!");
          carregarDados();
        })
        .catch(() => alert("Erro ao excluir."));
    }
  }

  // --- FUNÇÕES DO MODAL DE EDIÇÃO ---
  function abrirModal(nota) {
    setNotaEditando({
      ...nota,
      obraId: nota.obra ? nota.obra.id : ""
    });
    setArquivoEdicao(null); // Reseta o arquivo no modal
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setNotaEditando(prev => ({ ...prev, [name]: value }));
  }

  function salvarEdicao(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("numero_nf", Number(notaEditando.numero_nf));
    formData.append("fornecedor", notaEditando.fornecedor || "");
    formData.append("data_vencimento", notaEditando.data_vencimento || "");
    formData.append("valor_total", Number(notaEditando.valor_total));
    formData.append("quant_parcelas", Number(notaEditando.quant_parcelas));
    formData.append("status", Number(notaEditando.status));
    
    if (notaEditando.obraId) {
      formData.append("obra", notaEditando.obraId);
    }
    
    if (arquivoEdicao) {
      formData.append("file", arquivoEdicao);
    }

    // Rota ajustada para minúsculo
    axios.put(`${API_URL}/notas/${notaEditando.id}`, formData, config)
      .then(() => {
        alert("Nota atualizada!");
        setNotaEditando(null);
        carregarDados();
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao atualizar a nota. Verifique os logs.");
      });
  }

  // Textos para o Status
  const renderStatus = (status) => {
    if (status === 1) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-success-500">APROVADA</span>;
    if (status === 2) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-danger-500">REPROVADA</span>;
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-amber-500">A DECIDIR</span>;
  };

  const inputCls = "w-full px-3 py-2 mt-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-slate-600";

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/notas/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Nota
        </Link>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex gap-5 items-center flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-flow-500" />
          Filtros:
        </span>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por NF ou fornecedor..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 w-56"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Status:</label>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="px-2.5 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-flow-400"
          >
            <option value="">Todos</option>
            <option value="0">A Decidir</option>
            <option value="1">Aprovadas</option>
            <option value="2">Reprovadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Vencimento exato:</label>
          <input
            type="date"
            value={filtroVencimento}
            onChange={e => setFiltroVencimento(e.target.value)}
            className="px-2.5 py-1.5 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400"
          />
        </div>

        <button
          onClick={() => { setFiltroStatus(""); setFiltroVencimento(""); setBusca(""); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Filtros
        </button>

        <span className="ml-auto text-sm text-slate-400">
          {notasFiltradas.length} nota{notasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABELA LARGA */}
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="bg-ink-800 text-white text-left">
              <th className="px-4 py-3 font-medium">NF</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Obra</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor (R$)</th>
              <th className="px-4 py-3 font-medium text-center">Anexo</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Ações Rápidas</th>
              <th className="px-4 py-3 font-medium text-center">Gerenciar</th>
            </tr>
          </thead>
          <tbody>
            {notasFiltradas.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">Nenhuma nota encontrada.</td></tr>
            ) : (
              notasFiltradas.map((nota) => (
                <tr key={nota.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{nota.numero_nf}</td>
                  <td className="px-4 py-3 text-slate-600">{nota.fornecedor || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{nota.obra?.nome_obra || "Sem obra"}</td>
                  <td className="px-4 py-3">
                    <span className={estaVencida(nota) ? "inline-flex items-center gap-1 text-danger-500 font-semibold" : "text-slate-600"}>
                      {estaVencida(nota) && <AlertTriangle className="w-3.5 h-3.5" />}
                      {nota.data_vencimento ? new Date(nota.data_vencimento).toLocaleDateString('pt-BR') : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {nota.valor_total ? `R$ ${Number(nota.valor_total).toFixed(2)}` : "-"}
                  </td>

                  {/* ANEXO / VISUALIZAÇÃO DO PDF (link gerado pelo Supabase) */}
                  <td className="px-4 py-3 text-center">
                    {nota.tem_anexo && nota.link_pdf ? (
                      <button
                        type="button"
                        onClick={() => setNotaVisualizando(nota)}
                        title="Visualizar PDF da nota"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-flow-100 text-flow-600 hover:bg-flow-500 hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    ) : (
                      <span title="Sem arquivo anexado" className="inline-flex items-center gap-1 text-xs text-slate-300">
                        <Paperclip className="w-3.5 h-3.5" />
                        -
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {renderStatus(nota.status)}
                  </td>

                  {/* BOTÕES DE APROVAÇÃO RÁPIDA */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {nota.status === 0 && (
                      <>
                        <button
                          onClick={() => mudarStatus(nota.id, 1)}
                          className="inline-flex items-center gap-1 mr-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-success-500 hover:bg-green-700 text-white transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => mudarStatus(nota.id, 2)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reprovar
                        </button>
                      </>
                    )}
                  </td>

                  {/* BOTÕES DE EDITAR E EXCLUIR */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => abrirModal(nota)}
                      className="inline-flex items-center gap-1 mr-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-flow-500 hover:bg-flow-600 text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => excluirNota(nota.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-ink-800 hover:bg-ink-700 text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                <div>
                  <label className={labelCls}>Status:</label>
                  <select name="status" value={notaEditando.status} onChange={handleEditChange} className={`${inputCls} bg-white`}>
                    <option value="0">A Decidir</option>
                    <option value="1">Aprovada</option>
                    <option value="2">Reprovada</option>
                  </select>
                </div>
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
                  <label className={labelCls}>Anexo atual:</label>
                  {notaEditando.tem_anexo && notaEditando.link_pdf ? (
                    <button
                      type="button"
                      onClick={() => setNotaVisualizando(notaEditando)}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-flow-100 text-flow-600 hover:bg-flow-500 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Visualizar PDF atual
                    </button>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Nenhum arquivo anexado ainda.</p>
                  )}
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

      {/* POPUP DE VISUALIZAÇÃO DO PDF (em vez de abrir em outra aba) */}
      {notaVisualizando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1100] p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl h-[85vh] shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">
                Nota {notaVisualizando.numero_nf} — {notaVisualizando.fornecedor || "Sem fornecedor"}
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href={notaVisualizando.link_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-flow-600 hover:text-flow-500"
                >
                  Abrir em nova aba
                </a>
                <button onClick={() => setNotaVisualizando(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-b-xl overflow-hidden">
              <iframe
                src={notaVisualizando.link_pdf}
                title={`Nota ${notaVisualizando.numero_nf}`}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotasList;