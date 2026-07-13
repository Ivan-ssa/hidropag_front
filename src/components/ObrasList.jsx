import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, FileText, CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ObrasList() {
  const [obras, setObras] = useState([]);
  const [filiais, setFiliais] = useState([]);
  
  // NOVO: Estado para filtrar a lista (true = mostra obras ativas, false = inativas)
  const [mostrarAtivas, setMostrarAtivas] = useState(true);
  
  const [obraEditando, setObraEditando] = useState(null);

  const token = localStorage.getItem("tokenHidropag");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // --- BUSCAS COM ASYNC/AWAIT ---
  const buscarObras = async () => {
    try {
      const response = await axios.get(`${API_URL}/OBRAS`, config);
      const lista = response.data.sort((a, b) =>
        (a.nome_obra || "").localeCompare(b.nome_obra || "")
      );
      setObras(lista);
    } catch (erro) {
      console.error("Erro ao buscar obras:", erro);
      alert("Erro ao buscar obras.");
    }
  };

  const buscarFiliais = async () => {
    try {
      const response = await axios.get(`${API_URL}/filiais`, config);
      setFiliais(response.data);
    } catch (erro) {
      console.error("Erro ao buscar filiais:", erro);
    }
  };

  useEffect(() => {
    buscarObras();
    buscarFiliais();
  }, []);

  // --- NOVA LÓGICA INTELIGENTE DE EXCLUSÃO ---
  const excluirObra = async (id, nome) => {
    if (!window.confirm(`Deseja excluir a obra "${nome}"?`)) return;

    try {
      // 1. Tenta excluir no banco de dados
      await axios.delete(`${API_URL}/OBRAS/${id}`, config);
      alert("Obra excluída com sucesso!");
      buscarObras();
    } catch (erro) {
      console.error("Erro ao excluir:", erro);

      // 2. Se o banco bloquear (devido a notas lançadas nessa obra), sugere inativar
      const desejaInativar = window.confirm(
        `⛔ Ação Bloqueada pelo Banco de Dados\n\n` +
        `Não é possível excluir permanentemente a obra "${nome}" porque existem Notas ou Históricos vinculados a ela.\n\n` +
        `Deseja apenas INATIVAR esta obra para que ela deixe de aparecer para novos lançamentos?`
      );

      // 3. Se o administrador aceitar, dispara o PUT inativando a obra
      if (desejaInativar) {
        try {
          const obraAtual = obras.find((o) => o.id === id);
          const payloadInativacao = {
            nome_obra: obraAtual.nome_obra,
            ativo: false, // Força a inativação
            filial: obraAtual.filial?.id ? { id: obraAtual.filial.id } : null,
          };

          await axios.put(`${API_URL}/OBRAS/${id}`, payloadInativacao, config);
          alert(`Obra "${nome}" foi INATIVADA com sucesso.`);
          buscarObras();
        } catch (erroInativacao) {
          console.error(erroInativacao);
          alert("Ocorreu um erro ao tentar inativar a obra.");
        }
      }
    }
  };

  // --- FUNÇÕES DE EDIÇÃO ---
  const abrirModalEdicao = (obra) => {
    setObraEditando({
      ...obra,
      filialId: obra.filial ? obra.filial.id : ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setObraEditando((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();

    if (!obraEditando.nome_obra) {
      alert("O nome da obra é obrigatório!");
      return;
    }

    const dadosParaAtualizar = {
      nome_obra: obraEditando.nome_obra,
      ativo: obraEditando.ativo !== undefined ? obraEditando.ativo : true,
      filial: obraEditando.filialId ? { id: obraEditando.filialId } : null, 
    };

    try {
      await axios.put(`${API_URL}/OBRAS/${obraEditando.id}`, dadosParaAtualizar, config);
      alert("Obra atualizada com sucesso!");
      setObraEditando(null);
      buscarObras();
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      if (erro.response?.data?.message) {
        alert("Erro do servidor: " + JSON.stringify(erro.response.data.message));
      } else {
        alert("Erro ao atualizar a obra.");
      }
    }
  };

  // Filtra as obras para exibir apenas a aba selecionada
  const obrasFiltradas = obras.filter((o) => o.ativo === mostrarAtivas);

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="relative">
      
      {/* CABEÇALHO COM ABAS E BOTÃO NOVA OBRA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        
        {/* Abas de Filtro */}
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setMostrarAtivas(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              mostrarAtivas ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Obras Ativas
          </button>
          
          <button
            onClick={() => setMostrarAtivas(false)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              !mostrarAtivas ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Obras Inativas
          </button>
        </div>

        <Link
          to="/obras/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nova Obra
        </Link>
      </div>

      {obrasFiltradas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm shadow-sm">
          Nenhuma obra {mostrarAtivas ? "ativa" : "inativa"} encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Obra</th>
                <th className="px-4 py-3 font-medium">Filial</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-center">Notas</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {obrasFiltradas.map((obra) => (
                <tr key={obra.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{obra.nome_obra}</td>

                  <td className="px-4 py-3 text-slate-600">
                    {obra.filial?.nome || "Sem filial"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        obra.ativo ? "bg-green-100 text-success-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {obra.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {obra.notas?.length || 0}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => abrirModalEdicao(obra)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      <button
                        onClick={() => excluirObra(obra.id, obra.nome_obra)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {obraEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">Editar Obra</h3>
              <button onClick={() => setObraEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">

              <label className={labelCls}>Nome da Obra: *</label>
              <input
                type="text"
                name="nome_obra"
                value={obraEditando.nome_obra || ''}
                onChange={handleEditChange}
                className={inputCls}
                required
              />

              <label className={labelCls}>Vincular à Filial:</label>
              <select
                name="filialId"
                value={obraEditando.filialId || ''}
                onChange={handleEditChange}
                className={`${inputCls} bg-white`}
              >
                <option value="">-- Sem Filial (Desvincular) --</option>
                {filiais.map((filial) => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2 mb-1">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={obraEditando.ativo !== undefined ? obraEditando.ativo : true}
                  onChange={handleEditChange}
                  className="w-4 h-4 accent-flow-500 cursor-pointer"
                />
                Obra Ativa (Desmarque para inativar)
              </label>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setObraEditando(null)}
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

export default ObrasList;