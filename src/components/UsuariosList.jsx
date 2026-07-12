import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);

  const token = localStorage.getItem("tokenHidropag");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const buscarUsuarios = () => {
    axios
      .get(`${API_URL}/usuarios`, config)
      .then((resposta) => {
        const lista = resposta.data.sort((a, b) =>
          (a.nome || "").localeCompare(b.nome || "")
        );
        setUsuarios(lista);
      })
      .catch((erro) => {
        console.error(erro);

        if (erro.response?.status === 401) {
          alert("Faça login novamente.");
        }
      });
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  function editarUsuario(id) {
    const novoNome = window.prompt("Novo nome:");

    if (!novoNome) return;

    axios
      .put(
        `${API_URL}/usuarios/${id}`,
        { nome: novoNome },
        config
      )
      .then(() => {
        alert("Usuário atualizado.");
        buscarUsuarios();
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao atualizar usuário.");
      });
  }

  function deletarUsuario(id, nome) {
    if (!window.confirm(`Excluir ${nome}?`)) return;

    axios
      .delete(`${API_URL}/usuarios/${id}`, config)
      .then(() => {
        alert("Usuário excluído.");
        buscarUsuarios();
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao excluir usuário.");
      });
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/usuarios/novo"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Link>
      </div>

      {usuarios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{user.id}</td>
                  <td className="px-4 py-3 text-slate-600">{user.perfil?.nome || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{user.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.ativo
                          ? "bg-green-100 text-success-500"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {user.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  {/* ✅ AQUI ESTÁ O CORRETO */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center items-center">
                      <button
                        onClick={() => editarUsuario(user.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      <button
                        onClick={() => deletarUsuario(user.id, user.nome)}
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
    </div>
  );
}

export default UsuariosList;
