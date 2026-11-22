import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, X, Users, UserMinus, UserCheck, Search,
  Loader2, AlertCircle, Check, Eye, EyeOff, Save,
} from "lucide-react";
import { temAcesso } from "../App"; // confere o perfil guardado no login

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
// const API_URL = "http://localhost:3000";
const SENHA_MIN = 6; 

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
});

const mensagemDeErro = (erro, padrao) => {
  if (!erro?.response) return "Não foi possível se comunicar com o servidor. Verifique a conexão.";
  const { status, data } = erro.response;
  if (status >= 500) return padrao;

  const motivo = data?.message ?? data?.erro;
  if (Array.isArray(motivo) && motivo.length > 0) return motivo.join("\n");
  if (typeof motivo === "string" && motivo.trim() !== "") return motivo;

  if (status === 401) return "Sua sessão expirou. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  return padrao;
};

const capitalizar = (texto = "") => texto.charAt(0).toUpperCase() + texto.slice(1);
const estaAtivo = (usuario) => usuario.ativo !== false;

const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
const labelCls = "block text-sm font-semibold text-hidrotec-3 mb-1.5";

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [busca, setBusca] = useState("");
  const [mostrarAtivos, setMostrarAtivos] = useState(true);
  const [aviso, setAviso] = useState(null); 
  const [processandoId, setProcessandoId] = useState(null);

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [listaPerfis, setListaPerfis] = useState([]);
  const [listaFiliais, setListaFiliais] = useState([]);

  // Perfis que podem editar. O 'leitor' não passa aqui.
  const editavel = temAcesso(["root", "gestor", "lancador"]);
  const meuId = localStorage.getItem("usuarioId");

  const buscarUsuarios = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/usuarios`, authConfig());
      const lista = Array.isArray(data) ? data : [];
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setUsuarios(lista);
      setErroLista(null);
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
      setErroLista(mensagemDeErro(erro, "Não foi possível carregar a lista de usuários."));
    } finally {
      setCarregando(false);
    }
  };

  const buscarListasAuxiliares = async () => {
    const [perfis, filiais] = await Promise.allSettled([
      axios.get(`${API_URL}/perfis`, authConfig()),
      axios.get(`${API_URL}/filiais`, authConfig()),
    ]);

    if (perfis.status === "fulfilled") setListaPerfis(perfis.value.data);
    if (filiais.status === "fulfilled") setListaFiliais(filiais.value.data);
  };

  useEffect(() => {
    buscarUsuarios();
    buscarListasAuxiliares();
  }, []);

  useEffect(() => {
    if (aviso?.tipo !== "sucesso") return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // ALTERAÇÃO DO STATUS (Inativar / Reativar)
  const alterarStatus = async (usuario, novoStatus) => {
    if (!novoStatus) {
      const confirmou = window.confirm(`Inativar o usuário "${usuario.nome}"?\n\nEle será movido para a aba Inativos e não poderá acessar o sistema.`);
      if (!confirmou) return;
    }

    setProcessandoId(usuario.id);
    try {
      await axios.put(`${API_URL}/usuarios/${usuario.id}`, { ativo: novoStatus }, authConfig());
      setAviso({ tipo: "sucesso", texto: `Usuário "${usuario.nome}" ${novoStatus ? "reativado" : "inativado"}.` });
      await buscarUsuarios();
    } catch (erro) {
      console.error("Erro ao alterar status:", erro);
      setAviso({ tipo: "erro", texto: mensagemDeErro(erro, "Falha na operação.") });
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalEdicao = (usuario) => {
    setErroModal("");
    setMostrarSenha(false);
    setUsuarioEditando({
      id: usuario.id,
      nome: usuario.nome || "",
      email: usuario.email || "",
      ativo: estaAtivo(usuario),
      perfilId: usuario.perfil?.id || "",
      filialId: usuario.filial?.id || "",
      novaSenha: "",
    });
  };

  const fecharModal = () => {
    if (salvando) return;
    setUsuarioEditando(null);
    setErroModal("");
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUsuarioEditando((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    const nome = usuarioEditando.nome.trim();
    const email = usuarioEditando.email.trim();
    const { novaSenha } = usuarioEditando;

    if (!nome || !email || !usuarioEditando.perfilId) {
      setErroModal("Nome, email e perfil são obrigatórios.");
      return;
    }
    if (novaSenha && novaSenha.length < SENHA_MIN) {
      setErroModal(`A nova senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
      return;
    }

    const dados = {
      nome, email, ativo: usuarioEditando.ativo,
      perfil: { id: usuarioEditando.perfilId },
      filial: usuarioEditando.filialId ? { id: usuarioEditando.filialId } : null,
    };
    
    if (novaSenha) dados.senha = novaSenha;

    setSalvando(true);
    setErroModal("");
    
    try {
      await axios.put(`${API_URL}/usuarios/${usuarioEditando.id}`, dados, authConfig());
      setUsuarioEditando(null);
      setAviso({ tipo: "sucesso", texto: `Usuário "${nome}" atualizado.` });
      await buscarUsuarios();
    } catch (erro) {
      console.error(erro);
      setErroModal(mensagemDeErro(erro, "Erro ao salvar as alterações."));
    } finally {
      setSalvando(false);
    }
  };

  const totalAtivos = usuarios.filter(estaAtivo).length;
  const totalInativos = usuarios.length - totalAtivos;
  const termo = busca.trim().toLowerCase();

  const usuariosFiltrados = usuarios.filter((u) => {
    if (estaAtivo(u) !== mostrarAtivos) return false;
    if (!termo) return true;
    return [u.nome, u.email, u.perfil?.nome, u.filial?.nome].some((campo) =>
      (campo || "").toLowerCase().includes(termo)
    );
  });

  const editandoAMimMesmo = usuarioEditando && String(usuarioEditando.id) === meuId;

  const abaCls = (ativa) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
      ativa ? "bg-white text-hidrotec-3 shadow-sm" : "text-slate-500 hover:text-hidrotec-3"
    }`;

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">
      {aviso && (
        <div role="alert" className={`flex items-start gap-3 mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          aviso.tipo === "sucesso" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {aviso.tipo === "sucesso" ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <p className="flex-1 whitespace-pre-line">{aviso.texto}</p>
          <button type="button" onClick={() => setAviso(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button type="button" onClick={() => setMostrarAtivos(true)} className={abaCls(mostrarAtivos)}>
            <Users size={16} /> Ativos ({totalAtivos})
          </button>
          <button type="button" onClick={() => setMostrarAtivos(false)} className={abaCls(!mostrarAtivos)}>
            <UserMinus size={16} /> Inativos ({totalInativos})
          </button>
        </div>

        {editavel && (
          <Link to="/usuarios/novo" className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
            <Plus size={18} /> Novo usuário
          </Link>
        )}
      </div>

      {/* TABELA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar por nome, e-mail, perfil ou filial..." value={busca} onChange={(e) => setBusca(e.target.value)} className={`${inputCls} pl-10`} />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">Carregando usuários...</p>
            </div>
          ) : erroLista ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500 bg-red-50/50 px-6 text-center">
              <div className="flex items-center font-medium"><AlertCircle className="w-5 h-5 mr-2 shrink-0" />{erroLista}</div>
              <button type="button" onClick={() => { setCarregando(true); buscarUsuarios(); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-red-200 bg-white hover:bg-red-50 transition-colors">
                Tentar de novo
              </button>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4 px-6 text-center">
              <Users className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">{termo ? "Nenhum usuário encontrado." : `Nenhum usuário ${mostrarAtivos ? "ativo" : "inativo"}.`}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-hidrotec-4 bg-white">
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                  <th className="px-6 py-4 font-semibold">Perfil</th>
                  <th className="px-6 py-4 font-semibold">Filial</th>
                  {editavel && <th className="px-6 py-4 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuariosFiltrados.map((usuario) => {
                  const souEu = String(usuario.id) === meuId;
                  const ocupado = processandoId === usuario.id;

                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-extra text-hidrotec-1 flex items-center justify-center text-xs font-bold">
                            {(usuario.nome || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-hidrotec-3">{usuario.nome} {souEu && <span className="text-xs font-medium text-hidrotec-4">(você)</span>}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-hidrotec-3">{usuario.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-extra/60 text-hidrotec-1">
                          {capitalizar(usuario.perfil?.nome || "Sem perfil")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-hidrotec-3">{usuario.filial?.nome || "-"}</td>
                      {editavel && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => abrirModalEdicao(usuario)} disabled={ocupado} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2 disabled:opacity-50" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {estaAtivo(usuario) ? (
                            <button type="button" onClick={() => alterarStatus(usuario, false)} disabled={ocupado || souEu} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40" title="Inativar">
                              {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button type="button" onClick={() => alterarStatus(usuario, true)} disabled={ocupado} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50" title="Reativar">
                              {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {usuarioEditando && (
        <div role="dialog" className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">Editar usuário</h3>
              <button type="button" onClick={fecharModal} className="text-slate-400 hover:text-hidrotec-3"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={salvarEdicao} className="p-6">
              {erroModal && (
                <div role="alert" className="flex items-start gap-2 mb-5 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p className="whitespace-pre-line">{erroModal}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nome completo *</label>
                  <input type="text" name="nome" value={usuarioEditando.nome} onChange={handleEditChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>E-mail *</label>
                  <input type="email" name="email" value={usuarioEditando.email} onChange={handleEditChange} className={inputCls} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Perfil de acesso *</label>
                    <select name="perfilId" value={usuarioEditando.perfilId} onChange={handleEditChange} className={inputCls} required>
                      <option value="">Selecione...</option>
                      {listaPerfis.map((p) => <option key={p.id} value={p.id}>{capitalizar(p.nome)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Filial</label>
                    <select name="filialId" value={usuarioEditando.filialId} onChange={handleEditChange} className={inputCls}>
                      <option value="">Sem filial</option>
                      {listaFiliais.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nova senha</label>
                  <div className="relative">
                    <input type={mostrarSenha ? "text" : "password"} name="novaSenha" value={usuarioEditando.novaSenha} onChange={handleEditChange} placeholder="Deixe em branco para manter a atual" className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute inset-y-0 right-0 pr-4 text-hidrotec-4 hover:text-hidrotec-3">
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-hidrotec-4">Mínimo de {SENHA_MIN} caracteres.</p>
                </div>
                <div className="pt-1">
                  <label className={`flex items-center gap-3 ${editandoAMimMesmo ? "opacity-60" : "cursor-pointer"}`}>
                    <input type="checkbox" name="ativo" checked={usuarioEditando.ativo} onChange={handleEditChange} disabled={editandoAMimMesmo} className="w-5 h-5 accent-hidrotec-1 cursor-pointer disabled:cursor-not-allowed" />
                    <span className="text-sm font-semibold text-hidrotec-3">Usuário ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onClick={fecharModal} disabled={salvando} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
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



// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";
// import { Plus, Pencil, Trash2, X, Users, UserMinus } from "lucide-react";
// import { temAcesso } from "../App";


// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// function UsuariosList() {
//   const [usuarios, setUsuarios] = useState([]);
//   const podeAcessar = temAcesso(['root']);
//   // NOVO: Estado para filtrar a lista (true = mostra ativos, false = mostra inativos)
//   const [mostrarAtivos, setMostrarAtivos] = useState(true);

//   const [usuarioEditando, setUsuarioEditando] = useState(null);
//   const [listaPerfis, setListaPerfis] = useState([]);
//   const [listaFiliais, setListaFiliais] = useState([]);

//   const token = localStorage.getItem("tokenHidropag");
//   const config = {
//     headers: { Authorization: `Bearer ${token}` },
//   };

//   const buscarUsuarios = async () => {
//     try {
//       const resposta = await axios.get(`${API_URL}/usuarios`, config);
//       const lista = resposta.data.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
//       setUsuarios(lista);
//     } catch (erro) {
//       console.error(erro);
//       if (erro.response?.status === 401) alert("Faça login novamente.");
//     }
//   };

//   const buscarListasAuxiliares = async () => {
//     try {
//       const resPerfis = await axios.get(`${API_URL}/perfis`, config);
//       setListaPerfis(resPerfis.data);
//     } catch (erro) {
//       console.error("Erro ao buscar perfis", erro);
//     }

//     try {
//       const resFiliais = await axios.get(`${API_URL}/filiais`, config);
//       setListaFiliais(resFiliais.data);
//     } catch (erro) {
//       console.error("Erro ao buscar filiais", erro);
//     }
//   };

//   useEffect(() => {
//     buscarUsuarios();
//     buscarListasAuxiliares();
//   }, []);

//   // --- NOVA LÓGICA INTELIGENTE DE EXCLUSÃO ---
//   const deletarUsuario = async (id, nome) => {
//     if (!window.confirm(`Tem certeza que deseja excluir o usuário ${nome}?`)) return;

//     try {
//       // 1. Tenta Excluir no banco
//       await axios.delete(`${API_URL}/usuarios/${id}`, config);
//       alert("Usuário excluído do banco de dados com sucesso!");
//       buscarUsuarios();
//     } catch (erro) {
//       console.error("Erro na exclusão:", erro);

//       // 2. Se falhar (provavelmente por causa de chave estrangeira nas Aprovações)
//       const desejaInativar = window.confirm(
//         `⛔ Ação Bloqueada pelo Banco de Dados\n\n` +
//         `Não é possível excluir permanentemente o usuário "${nome}" porque ele possui aprovações ou histórico vinculado.\n\n` +
//         `Deseja apenas INATIVAR este usuário para que ele não consiga mais acessar o sistema?`
//       );

//       // 3. Se o administrador disser "Sim", dispara a inativação
//       if (desejaInativar) {
//         try {
//           // Busca os dados atuais do usuário para não apagar o resto no PUT
//           const userAtual = usuarios.find((u) => u.id === id);
          
//           const payloadInativacao = {
//             nome: userAtual.nome,
//             email: userAtual.email,
//             ativo: false, // Força o status para inativo
//             perfil: userAtual.perfil?.id ? { id: userAtual.perfil.id } : null,
//             filial: userAtual.filial?.id ? { id: userAtual.filial.id } : null,
//           };

//           await axios.put(`${API_URL}/usuarios/${id}`, payloadInativacao, config);
//           alert(`Usuário ${nome} foi INATIVADO com sucesso.`);
//           buscarUsuarios();
//         } catch (erroInativacao) {
//           console.error(erroInativacao);
//           alert("Ocorreu um erro ao tentar inativar o usuário.");
//         }
//       }
//     }
//   };

//   const abrirModalEdicao = (user) => {
//     setUsuarioEditando({
//       id: user.id,
//       nome: user.nome,
//       email: user.email,
//       ativo: user.ativo,
//       perfilId: user.perfil?.id || "",
//       filialId: user.filial?.id || ""
//     });
//   };

//   const handleEditChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setUsuarioEditando((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const salvarEdicao = async (e) => {
//     e.preventDefault();

//     if (!usuarioEditando.nome || !usuarioEditando.email) {
//       alert("Nome e Email são obrigatórios.");
//       return;
//     }

//     const dadosAtualizados = {
//       nome: usuarioEditando.nome,
//       email: usuarioEditando.email,
//       ativo: usuarioEditando.ativo,
//       perfil: usuarioEditando.perfilId ? { id: usuarioEditando.perfilId } : null,
//       filial: usuarioEditando.filialId ? { id: usuarioEditando.filialId } : null,
//     };

//     try {
//       await axios.put(`${API_URL}/usuarios/${usuarioEditando.id}`, dadosAtualizados, config);
//       alert("Usuário atualizado com sucesso!");
//       setUsuarioEditando(null);
//       buscarUsuarios();
//     } catch (erro) {
//       console.error(erro);
//       alert("Erro ao atualizar o usuário.");
//     }
//   };

//   // Filtra a lista de acordo com a aba selecionada
//   const usuariosFiltrados = usuarios.filter((u) => u.ativo === mostrarAtivos);

//   const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
//   const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

//   return (
//     <div className="relative">
//       {/* CABEÇALHO COM ABAS E BOTÃO NOVO */}
//       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        
//         {/* Abas de Filtro (Ativos / Inativos) */}
//         <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
//           <button
//             onClick={() => setMostrarAtivos(true)}
//             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
//               mostrarAtivos ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
//             }`}
//           >
//             <Users className="w-4 h-4" />
//             Ativos
//           </button>
          
//           <button
//             onClick={() => setMostrarAtivos(false)}
//             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
//               !mostrarAtivos ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-800"
//             }`}
//           >
//             <UserMinus className="w-4 h-4" />
//             Inativos
//           </button>
//         </div>

//         <Link
//           to="/usuarios/novo"
//           className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors shadow-sm w-full sm:w-auto justify-center"
//         >
//           <Plus className="w-4 h-4" />
//           Novo Usuário
//         </Link>
//       </div>

//       {usuariosFiltrados.length === 0 ? (
//         <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm shadow-sm">
//           Nenhum usuário {mostrarAtivos ? "ativo" : "inativo"} encontrado.
//         </div>
//       ) : (
//         <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="bg-ink-800 text-white text-left">
//                 <th className="px-4 py-3 font-medium">Perfil</th>
//                 <th className="px-4 py-3 font-medium">Nome</th>
//                 <th className="px-4 py-3 font-medium">Email</th>
//                 <th className="px-4 py-3 font-medium">Filial</th>
//                 <th className="px-4 py-3 font-medium text-center">Ações</th>
//               </tr>
//             </thead>
//             <tbody>
//               {usuariosFiltrados.map((user) => (
//                 <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
//                   <td className="px-4 py-3 text-slate-600">{user.perfil?.nome || "-"}</td>
//                   <td className="px-4 py-3 font-semibold text-slate-800">{user.nome}</td>
//                   <td className="px-4 py-3 text-slate-600">{user.email}</td>
//                   <td className="px-4 py-3 text-slate-600">{user.filial?.nome || "-"}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex gap-2 justify-center items-center">
//                       <button
//                         onClick={() => abrirModalEdicao(user)}
//                         className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
//                       >
//                         <Pencil className="w-3.5 h-3.5" /> Editar
//                       </button>
//                       <button
//                         onClick={() => deletarUsuario(user.id, user.nome)}
//                         className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
//                       >
//                         <Trash2 className="w-3.5 h-3.5" /> Excluir
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* --- MODAL DE EDIÇÃO --- */}
//       {usuarioEditando && (
//         <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
//           <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
//             <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
//               <h3 className="font-display font-semibold text-slate-800">Editar Usuário</h3>
//               <button onClick={() => setUsuarioEditando(null)} className="text-slate-400 hover:text-slate-600">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={salvarEdicao} className="p-5">
//               <label className={labelCls}>Nome Completo: *</label>
//               <input type="text" name="nome" value={usuarioEditando.nome || ""} onChange={handleEditChange} className={inputCls} required />

//               <label className={labelCls}>E-mail: *</label>
//               <input type="email" name="email" value={usuarioEditando.email || ""} onChange={handleEditChange} className={inputCls} required />

//               <label className={labelCls}>Perfil de Acesso:</label>
//               <select name="perfilId" value={usuarioEditando.perfilId || ""} onChange={handleEditChange} className={inputCls}>
//                 <option value="">Selecione um perfil...</option>
//                 {listaPerfis.map(p => (
//                   <option key={p.id} value={p.id}>{p.nome}</option>
//                 ))}
//               </select>

//               <label className={labelCls}>Filial Associada:</label>
//               <select name="filialId" value={usuarioEditando.filialId || ""} onChange={handleEditChange} className={inputCls}>
//                 <option value="">Selecione uma filial...</option>
//                 {listaFiliais.map(f => (
//                   <option key={f.id} value={f.id}>{f.nome}</option>
//                 ))}
//               </select>

//               <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-3 mb-2">
//                 <input 
//                   type="checkbox" 
//                   name="ativo" 
//                   checked={usuarioEditando.ativo} 
//                   onChange={handleEditChange} 
//                   className="w-4 h-4 accent-flow-500 cursor-pointer"
//                 />
//                 Usuário Ativo (Desmarque para bloquear acesso)
//               </label>

//               <div className="flex justify-end gap-2 mt-6">
//                 <button 
//                   type="button" 
//                   onClick={() => setUsuarioEditando(null)} 
//                   className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
//                 >
//                   Cancelar
//                 </button>
//                 <button 
//                   type="submit" 
//                   className="px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
//                 >
//                   Salvar Alterações
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default UsuariosList;