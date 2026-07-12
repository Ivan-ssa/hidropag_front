import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ObrasList() {
  const [obras, setObras] = useState([]);
  
  // Novo estado para guardar as filiais para o <select> do Modal
  const [filiais, setFiliais] = useState([]);
  
  // Estado para controlar a obra que está sendo editada
  const [obraEditando, setObraEditando] = useState(null);

  const token = localStorage.getItem("tokenHidropag");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // BUSCA AS OBRAS
  function buscarObras() {
    axios
      .get(`${API_URL}/OBRAS`, config)
      .then((response) => {
        const lista = response.data.sort((a, b) =>
          (a.nome_obra || "").localeCompare(b.nome_obra || "")
        );
        setObras(lista);
      })
      .catch((erro) => {
        console.error("Erro ao buscar obras:", erro);
        alert("Erro ao buscar obras.");
      });
  }

  // BUSCA AS FILIAIS (Para preencher o Select do Modal)
  function buscarFiliais() {
    axios
      .get(`${API_URL}/filiais`, config)
      .then((response) => {
        setFiliais(response.data);
      })
      .catch((erro) => {
        console.error("Erro ao buscar filiais:", erro);
      });
  }

  useEffect(() => {
    buscarObras();
    buscarFiliais(); // Carrega as filiais assim que a tela abre
  }, []);

  // --- FUNÇÕES DE EDIÇÃO ---

  // 1. Abre o modal e prepara o ID da filial
  function abrirModalEdicao(obra) {
    // Nós preparamos o objeto da edição e já salvamos o 'filialId' para o <select> entender
    setObraEditando({
      ...obra,
      filialId: obra.filial ? obra.filial.id : ""
    });
  }

  // 2. Atualiza o estado conforme o usuário digita, marca checkboxes ou escolhe no select
  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    setObraEditando((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // 3. Salva a edição chamando o PUT
  function salvarEdicao(e) {
    e.preventDefault();

    if (!obraEditando.nome_obra) {
      alert("O nome da obra é obrigatório!");
      return;
    }

    // Objeto limpo apenas com o que a API aceita atualizar
    const dadosParaAtualizar = {
      nome_obra: obraEditando.nome_obra,
      ativo: obraEditando.ativo !== undefined ? obraEditando.ativo : true,
      // A mágica acontece aqui: mandamos como um objeto "filial" com o "id" dentro
      filial: obraEditando.filialId ? { id: obraEditando.filialId } : null, 
    };
    axios
      .put(`${API_URL}/OBRAS/${obraEditando.id}`, dadosParaAtualizar, config)
      .then(() => {
        alert("Obra atualizada com sucesso!");
        setObraEditando(null); // Fecha o modal
        buscarObras(); // Recarrega a lista
      })
      .catch((erro) => {
        console.error("Erro ao atualizar:", erro);
        if (erro.response && erro.response.data && erro.response.data.message) {
          alert("Erro do servidor: " + JSON.stringify(erro.response.data.message));
        } else {
          alert("Erro ao atualizar a obra.");
        }
      });
  }

  // FUNÇÃO DE EXCLUIR MANTIDA
  function excluirObra(id, nome) {
    if (!window.confirm(`Deseja excluir a obra "${nome}"?`)) return;

    axios
      .delete(`${API_URL}/OBRAS/${id}`, config)
      .then(() => {
        alert("Obra excluída com sucesso!");
        buscarObras();
      })
      .catch((erro) => {
        console.error("Erro ao excluir:", erro);
        alert("Erro ao excluir obra.");
      });
  }

  // Classes reaproveitáveis para o modal
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/obras/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Obra
        </Link>
      </div>

      {obras.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          Nenhuma obra encontrada.
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
              {obras.map((obra) => (
                <tr key={obra.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{obra.nome_obra}</td>

                  <td className="px-4 py-3 text-slate-600">
                    {obra.filial?.nome || "Sem filial"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${
                        obra.ativo ? "bg-success-500" : "bg-danger-500"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-flow-500 hover:bg-flow-600 text-white transition-colors"
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

              {/* --- SELECT DE FILIAIS --- */}
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
                Obra Ativa
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