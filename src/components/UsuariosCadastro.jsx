import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UsuariosCadastro() {
  const [usuario, setUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    perfilId: "",
    filialId: ""
  });

  const [listaPerfis, setListaPerfis] = useState([]);
  const [listaFiliais, setListaFiliais] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Busca Perfis e Filiais no banco de dados assim que a tela abre
  useEffect(() => {
    const buscarDadosAuxiliares = async () => {
      // Busca os Perfis (Rota corrigida para plural: /perfis)
      try {
        const resPerfis = await axios.get(`${API_URL}/perfis`, config);
        setListaPerfis(resPerfis.data);
      } catch (erro) {
        console.error("Erro ao carregar perfis:", erro);
      }

      // Busca as Filiais (Rota /filiais)
      try {
        const resFiliais = await axios.get(`${API_URL}/filiais`, config);
        setListaFiliais(resFiliais.data);
      } catch (erro) {
        console.error("Erro ao carregar filiais:", erro);
      }
    };
    
    if (token) buscarDadosAuxiliares();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario.nome || !usuario.email || !usuario.senha || !usuario.perfilId) {
      alert("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const payload = {
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      ativo: true,
      perfil: { id: usuario.perfilId },
      filial: usuario.filialId ? { id: usuario.filialId } : null
    };

    try {
      await axios.post(`${API_URL}/usuarios`, payload, config);
      alert("Usuário cadastrado com sucesso!");
      navigate("/usuarios");
    } catch (erro) {
      console.error(erro);
      const msg = erro.response?.data?.message || "Erro ao cadastrar usuário.";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const inputCls = "w-full px-3 py-2.5 mt-1 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-sm font-semibold text-slate-700 block";

  return (
    <div className="flex justify-center py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="font-display font-semibold text-xl text-slate-800 mb-6 border-b border-slate-100 pb-3">
          Cadastrar Novo Usuário
        </h2>

        {/* NOME */}
        <div className="mb-4">
          <label className={labelCls}>Nome Completo: *</label>
          <input
            type="text"
            name="nome"
            value={usuario.nome}
            onChange={handleChange}
            className={inputCls}
            placeholder="Ex: João da Silva"
          />
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className={labelCls}>E-mail: *</label>
          <input
            type="email"
            name="email"
            value={usuario.email}
            onChange={handleChange}
            className={inputCls}
            placeholder="joao@empresa.com"
          />
        </div>

        {/* SENHA */}
        <div className="mb-4">
          <label className={labelCls}>Senha: *</label>
          <input
            type="password"
            name="senha"
            value={usuario.senha}
            onChange={handleChange}
            className={inputCls}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {/* PERFIL */}
        <div className="mb-4">
          <label className={labelCls}>Perfil de Acesso: *</label>
          <select
            name="perfilId"
            value={usuario.perfilId}
            onChange={handleChange}
            className={`${inputCls} bg-white`}
          >
            <option value="">Selecione um perfil...</option>
            {listaPerfis.map((p) => (
              <option key={p.id} value={p.id}>
                {/* Capitaliza a primeira letra para ficar bonito na tela (ex: 'gestor' vira 'Gestor') */}
                {p.nome.charAt(0).toUpperCase() + p.nome.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* FILIAL */}
        <div className="mb-8">
          <label className={labelCls}>Filial (Opcional):</label>
          <select
            name="filialId"
            value={usuario.filialId}
            onChange={handleChange}
            className={`${inputCls} bg-white`}
          >
            <option value="">Selecione a filial associada...</option>
            {listaFiliais.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÕES */}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Usuário
          </button>

          <button
            type="button"
            onClick={() => navigate("/usuarios")}
            className="w-full py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default UsuariosCadastro;