import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Users, UserMinus } from "lucide-react";
import { temAcesso } from "../App";

{temAcesso(['gestor', 'root']) && (
  <button onClick={() => excluirFilial(id)} className="bg-danger-500">
    Excluir
  </button>
)}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  
  // NOVO: Estado para filtrar a lista (true = mostra ativos, false = mostra inativos)
  const [mostrarAtivos, setMostrarAtivos] = useState(true);

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [listaPerfis, setListaPerfis] = useState([]);
  const [listaFiliais, setListaFiliais] = useState([]);

  const token = localStorage.getItem("tokenHidropag");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const buscarUsuarios = async () => {
    try {
      const resposta = await axios.get(`${API_URL}/usuarios`, config);
      const lista = resposta.data.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setUsuarios(lista);
    } catch (erro) {
      console.error(erro);
      if (erro.response?.status === 401) alert("Faça login novamente.");
    }
  };

  const buscarListasAuxiliares = async () => {
    try {
      const resPerfis = await axios.get(`${API_URL}/perfis`, config);
      setListaPerfis(resPerfis.data);
    } catch (erro) {
      console.error("Erro ao buscar perfis", erro);
    }

    try {
      const resFiliais = await axios.get(`${API_URL}/filiais`, config);
      setListaFiliais(resFiliais.data);
    } catch (erro) {
      console.error("Erro ao buscar filiais", erro);
    }
  };

  useEffect(() => {
    buscarUsuarios();
    buscarListasAuxiliares();
  }, []);

  // --- NOVA LÓGICA INTELIGENTE DE EXCLUSÃO ---
  const deletarUsuario = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${nome}?`)) return;

    try {
      // 1. Tenta Excluir no banco
      await axios.delete(`${API_URL}/usuarios/${id}`, config);
      alert("Usuário excluído do banco de dados com sucesso!");
      buscarUsuarios();
    } catch (erro) {
      console.error("Erro na exclusão:", erro);

      // 2. Se falhar (provavelmente por causa de chave estrangeira nas Aprovações)
      const desejaInativar = window.confirm(
        `⛔ Ação Bloqueada pelo Banco de Dados\n\n` +
        `Não é possível excluir permanentemente o usuário "${nome}" porque ele possui aprovações ou histórico vinculado.\n\n` +
        `Deseja apenas INATIVAR este usuário para que ele não consiga mais acessar o sistema?`
      );

      // 3. Se o administrador disser "Sim", dispara a inativação
      if (desejaInativar) {
        try {
          // Busca os dados atuais do usuário para não apagar o resto no PUT
          const userAtual = usuarios.find((u) => u.id === id);
          
          const payloadInativacao = {
            nome: userAtual.nome,
            email: userAtual.email,
            ativo: false, // Força o status para inativo
            perfil: userAtual.perfil?.id ? { id: userAtual.perfil.id } : null,
            filial: userAtual.filial?.id ? { id: userAtual.filial.id } : null,
          };

          await axios.put(`${API_URL}/usuarios/${id}`, payloadInativacao, config);
          alert(`Usuário ${nome} foi INATIVADO com sucesso.`);
          buscarUsuarios();
        } catch (erroInativacao) {
          console.error(erroInativacao);
          alert("Ocorreu um erro ao tentar inativar o usuário.");
        }
      }
    }
  };

  const abrirModalEdicao = (user) => {
    setUsuarioEditando({
      id: user.id,
      nome: user.nome,
      email: user.email,
      ativo: user.ativo,
      perfilId: user.perfil?.id || "",
      filialId: user.filial?.id || ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUsuarioEditando((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();

    if (!usuarioEditando.nome || !usuarioEditando.email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }

    const dadosAtualizados = {
      nome: usuarioEditando.nome,
      email: usuarioEditando.email,
      ativo: usuarioEditando.ativo,
      perfil: usuarioEditando.perfilId ? { id: usuarioEditando.perfilId } : null,
      filial: usuarioEditando.filialId ? { id: usuarioEditando.filialId } : null,
    };

    try {
      await axios.put(`${API_URL}/usuarios/${usuarioEditando.id}`, dadosAtualizados, config);
      alert("Usuário atualizado com sucesso!");
      setUsuarioEditando(null);
      buscarUsuarios();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao atualizar o usuário.");
    }
  };

  // Filtra a lista de acordo com a aba selecionada
  const usuariosFiltrados = usuarios.filter((u) => u.ativo === mostrarAtivos);

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="relative">
      {/* CABEÇALHO COM ABAS E BOTÃO NOVO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        
        {/* Abas de Filtro (Ativos / Inativos) */}
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setMostrarAtivos(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              mostrarAtivos ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            Ativos
          </button>
          
          <button
            onClick={() => setMostrarAtivos(false)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              !mostrarAtivos ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserMinus className="w-4 h-4" />
            Inativos
          </button>
        </div>

        <Link
          to="/usuarios/novo"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Link>
      </div>

      {usuariosFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm shadow-sm">
          Nenhum usuário {mostrarAtivos ? "ativo" : "inativo"} encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Filial</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{user.perfil?.nome || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{user.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.filial?.nome || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center items-center">
                      <button
                        onClick={() => abrirModalEdicao(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => deletarUsuario(user.id, user.nome)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
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
      {usuarioEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">Editar Usuário</h3>
              <button onClick={() => setUsuarioEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">
              <label className={labelCls}>Nome Completo: *</label>
              <input type="text" name="nome" value={usuarioEditando.nome || ""} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>E-mail: *</label>
              <input type="email" name="email" value={usuarioEditando.email || ""} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>Perfil de Acesso:</label>
              <select name="perfilId" value={usuarioEditando.perfilId || ""} onChange={handleEditChange} className={inputCls}>
                <option value="">Selecione um perfil...</option>
                {listaPerfis.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>

              <label className={labelCls}>Filial Associada:</label>
              <select name="filialId" value={usuarioEditando.filialId || ""} onChange={handleEditChange} className={inputCls}>
                <option value="">Selecione uma filial...</option>
                {listaFiliais.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-3 mb-2">
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={usuarioEditando.ativo} 
                  onChange={handleEditChange} 
                  className="w-4 h-4 accent-flow-500 cursor-pointer"
                />
                Usuário Ativo (Desmarque para bloquear acesso)
              </label>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => setUsuarioEditando(null)} 
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

export default UsuariosList;