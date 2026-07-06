import { useEffect, useState } from "react";
import axios from "axios";

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

  // Estilos reaproveitáveis para o modal
  const inputStyle = { width: '100%', padding: '8px', marginBottom: '15px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' };

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h2 style={{ marginBottom: "20px" }}>Gerenciamento de Obras</h2>

      {obras.length === 0 ? (
        <p>Nenhuma obra encontrada.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#0056b3",
                color: "#fff",
              }}
            >
              <th style={{ padding: "12px", textAlign: "left" }}>Obra</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Filial</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Notas</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {obras.map((obra) => (
              <tr
                key={obra.id}
                style={{
                  borderBottom: "1px solid #ddd",
                }}
              >
                <td style={{ padding: "12px" }}>{obra.nome_obra}</td>

                <td style={{ padding: "12px" }}>
                  {obra.filial?.nome || "Sem filial"}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span
                    style={{
                      background: obra.ativo ? "#198754" : "#dc3545",
                      color: "#fff",
                      padding: "5px 10px",
                      borderRadius: "15px",
                      fontSize: "12px",
                    }}
                  >
                    {obra.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {obra.notas?.length || 0}
                </td>

                <td style={{ padding: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() => abrirModalEdicao(obra)}
                      style={{
                        background: "#0d6efd",
                        color: "#fff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirObra(obra.id, obra.nome_obra)}
                      style={{
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "5px",
                        cursor: "pointer",
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

      {/* --- MODAL DE EDIÇÃO --- */}
      {obraEditando && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
            width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Editar Obra</h3>
            
            <form onSubmit={salvarEdicao}>
              
              <label style={labelStyle}>Nome da Obra: *</label>
              <input 
                type="text" 
                name="nome_obra" 
                value={obraEditando.nome_obra || ''} 
                onChange={handleEditChange} 
                style={inputStyle} 
                required 
              />

              {/* --- SELECT DE FILIAIS --- */}
              <label style={labelStyle}>Vincular à Filial:</label>
              <select 
                name="filialId" 
                value={obraEditando.filialId || ''} 
                onChange={handleEditChange} 
                style={inputStyle}
              >
                <option value="">-- Sem Filial (Desvincular) --</option>
                {filiais.map((filial) => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome}
                  </option>
                ))}
              </select>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={obraEditando.ativo !== undefined ? obraEditando.ativo : true} 
                  onChange={handleEditChange} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Obra Ativa
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setObraEditando(null)} 
                  style={{ padding: '8px 16px', border: '1px solid #ccc', backgroundColor: '#f8f9fa', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 16px', border: 'none', backgroundColor: '#0056b3', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
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