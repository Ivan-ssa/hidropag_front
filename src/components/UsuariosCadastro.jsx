import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PERFIS = [
  { id: "e036fc61-5d05-41d2-9be5-bcecb6f53e37", nome: "Gestor" },
  { id: "38633f75-0343-413e-bd5e-09b72cf0d344", nome: "Lançador" },
  { id: "6fc13eec-a3fe-4fe4-811b-2563cb1b5f4c", nome: "Leitor" },
];

function UsuariosCadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilId, setPerfilId] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("tokenHidropag");

  const inputCls = "w-full px-3 py-2.5 mt-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-sm font-medium text-slate-700";

  function handleSubmit(e) {
    e.preventDefault();

    if (!nome || !email || !senha || !perfilId) {
      alert("Preencha todos os campos!");
      return;
    }

    const payload = {
      nome,
      email,
      senha,
      ativo: true,
      perfil: { id: perfilId },
    };

    axios
      .post(`${API_URL}/usuarios`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Usuário cadastrado com sucesso!");

        setNome("");
        setEmail("");
        setSenha("");
        setPerfilId("");

        navigate("/usuarios");
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao cadastrar usuário");
      });
  }

  return (
    <div className="flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="font-display font-semibold text-lg text-slate-800 mb-5">
          Cadastrar Usuário
        </h2>

        {/* NOME */}
        <div className="mb-4">
          <label className={labelCls}>Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className={labelCls}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* SENHA */}
        <div className="mb-4">
          <label className={labelCls}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* PERFIL */}
        <div className="mb-5">
          <label className={labelCls}>Perfil</label>

          <select
            value={perfilId}
            onChange={(e) => setPerfilId(e.target.value)}
            className={`${inputCls} bg-white`}
          >
            <option value="">Selecione um perfil</option>
            {PERFIS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÃO SALVAR */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-success-500 hover:bg-green-700 text-white text-sm font-semibold transition-colors mb-2.5"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>

        {/* BOTÃO CANCELAR */}
        <button
          type="button"
          onClick={() => navigate("/usuarios")}
          className="w-full py-2.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default UsuariosCadastro;
