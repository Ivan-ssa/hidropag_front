import { useEffect, useState } from "react";
import axios from "axios";

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
    <div style={{ padding: "20px" }}>
      <h2>Usuários</h2>

      {usuarios.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr style={{ background: "#0056b3", color: "#fff" }}>
              <th style={{ padding: "10px" }}>ID</th>
              <th style={{ padding: "10px" }}>Perfil</th>
              <th style={{ padding: "10px" }}>Nome</th>
              <th style={{ padding: "10px" }}>Email</th>
              <th style={{ padding: "10px" }}>Status</th>
              <th style={{ padding: "10px" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "10px" }}>{user.id}</td>
                <td style={{ padding: "10px" }}>{user.perfil?.nome || "-"}</td>
                <td style={{ padding: "10px" }}>{user.nome}</td>
                <td style={{ padding: "10px" }}>{user.email}</td>
                <td style={{ padding: "10px" }}>
                  {user.ativo ? "Ativo" : "Inativo"}
                </td>

                {/* ✅ AQUI ESTÁ O CORRETO */}
                <td style={{ padding: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => editarUsuario(user.id)}
                      style={{
                        backgroundColor: "#ffc107",
                        color: "#000",
                        border: "none",
                        padding: "6px 12px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deletarUsuario(user.id, user.nome)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsuariosList;