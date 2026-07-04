import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Cadastrar Usuário
        </h2>

        {/* NOME */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* EMAIL */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* SENHA */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* PERFIL */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold" }}>Perfil</label>

          <select
            value={perfilId}
            onChange={(e) => setPerfilId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
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
          style={{
            width: "100%",
            padding: "12px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Salvar
        </button>

        {/* BOTÃO CANCELAR */}
        <button
          type="button"
          onClick={() => navigate("/usuarios")}
          style={{
            width: "100%",
            padding: "12px",
            background: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default UsuariosCadastro;