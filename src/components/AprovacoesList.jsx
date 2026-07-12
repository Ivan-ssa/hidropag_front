import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, X, Filter, RotateCcw, Search, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AprovacoesList() {
  const [aprovacoes, setAprovacoes] = useState([]);
  const [aprovacaoEditando, setAprovacaoEditando] = useState(null);

  // Estados dos filtros
  const [filtroDecisao, setFiltroDecisao] = useState("");
  const [busca, setBusca] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  function carregarDados() {
    axios.get(`${API_URL}/aprovacoes`, config)
      .then(res => setAprovacoes(res.data))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // --- FILTRAGEM NA TELA ---
  const aprovacoesFiltradas = aprovacoes.filter(aprovacao => {
    const bateDecisao = filtroDecisao === "" || aprovacao.decisao?.toString() === filtroDecisao;

    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === "" ||
      aprovacao.nota?.numero_nf?.toString().includes(termo) ||
      aprovacao.usuario?.nome?.toLowerCase().includes(termo);

    return bateDecisao && bateBusca;
  });

  // --- FUNÇÕES DO MODAL DE EDIÇÃO ---
  function abrirModal(aprovacao) {
    setAprovacaoEditando({ ...aprovacao });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setAprovacaoEditando(prev => ({ ...prev, [name]: value }));
  }

  function salvarEdicao(e) {
    e.preventDefault();

    const payload = {
      decisao: Number(aprovacaoEditando.decisao),
      observacao: aprovacaoEditando.observacao || "",
    };

    axios.put(`${API_URL}/aprovacoes/${aprovacaoEditando.id}`, payload, config)
      .then(() => {
        alert("Aprovação atualizada!");
        setAprovacaoEditando(null);
        carregarDados();
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao atualizar a aprovação. Verifique os logs.");
      });
  }

  // Badge da decisão
  const renderDecisao = (decisao) => {
    if (decisao === 1) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-success-500">APROVADO</span>;
    if (decisao === 2) return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-danger-500">REPROVADO</span>;
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-slate-400">-</span>;
  };

  const inputCls = "w-full px-3 py-2 mt-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-slate-600";

  return (
    <div>
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
            placeholder="Buscar por NF ou usuário..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 w-56"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Decisão:</label>
          <select
            value={filtroDecisao}
            onChange={e => setFiltroDecisao(e.target.value)}
            className="px-2.5 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-flow-400"
          >
            <option value="">Todas</option>
            <option value="1">Aprovadas</option>
            <option value="2">Reprovadas</option>
          </select>
        </div>

        <button
          onClick={() => { setFiltroDecisao(""); setBusca(""); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Filtros
        </button>

        <span className="ml-auto text-sm text-slate-400">
          {aprovacoesFiltradas.length} registro{aprovacoesFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABELA */}
      {aprovacoesFiltradas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          Nenhuma aprovação encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Nota Fiscal</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium text-center">Decisão</th>
                <th className="px-4 py-3 font-medium">Observação</th>
                <th className="px-4 py-3 font-medium">Decidido em</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {aprovacoesFiltradas.map((aprovacao) => (
                <tr key={aprovacao.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {aprovacao.nota?.numero_nf || "-"}
                    </span>
                    <p className="text-xs text-slate-400">{aprovacao.nota?.fornecedor || "Sem fornecedor"}</p>
                  </td>

                  <td className="px-4 py-3 text-slate-600">{aprovacao.usuario?.nome || "-"}</td>

                  <td className="px-4 py-3 text-center">
                    {renderDecisao(aprovacao.decisao)}
                  </td>

                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={aprovacao.observacao}>
                    {aprovacao.observacao || "-"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {aprovacao.decidido_em
                      ? new Date(aprovacao.decidido_em).toLocaleString('pt-BR')
                      : "-"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirModal(aprovacao)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-flow-500 hover:bg-flow-600 text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {aprovacaoEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">
                Editar Aprovação — NF {aprovacaoEditando.nota?.numero_nf}
              </h3>
              <button onClick={() => setAprovacaoEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">
              <div className="mb-3">
                <label className={labelCls}>Fornecedor:</label>
                <p className="text-sm text-slate-700 mt-1">{aprovacaoEditando.nota?.fornecedor || "-"}</p>
              </div>

              <div className="mb-3">
                <label className={labelCls}>Usuário responsável:</label>
                <p className="text-sm text-slate-700 mt-1">{aprovacaoEditando.usuario?.nome || "-"}</p>
              </div>

              <label className={labelCls}>Decisão:</label>
              <select
                name="decisao"
                value={aprovacaoEditando.decisao}
                onChange={handleEditChange}
                className={`${inputCls} bg-white mb-3`}
              >
                <option value="1">Aprovado</option>
                <option value="2">Reprovado</option>
              </select>

              <label className={labelCls}>Observação:</label>
              <textarea
                name="observacao"
                value={aprovacaoEditando.observacao || ''}
                onChange={handleEditChange}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="Ex: Valor de acordo com o contrato"
              />

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setAprovacaoEditando(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AprovacoesList;
