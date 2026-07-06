import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NotasList() {
  const [notas, setNotas] = useState([]);
  const [obras, setObras] = useState([]);
  const [notaEditando, setNotaEditando] = useState(null);
  const [arquivoEdicao, setArquivoEdicao] = useState(null);

  // Estados dos Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroVencimento, setFiltroVencimento] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  function carregarDados() {
    // Busca Notas (Rota ajustada para minúsculo)
    axios.get(`${API_URL}/notas`, config)
      .then(res => setNotas(res.data))
      .catch(err => console.error(err));
      
    // Busca Obras (Rota ajustada para minúsculo)
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // --- FILTRAGEM NA TELA ---
  const notasFiltradas = notas.filter(nota => {
    const bateStatus = filtroStatus === "" || nota.status.toString() === filtroStatus;
    const bateVencimento = filtroVencimento === "" || nota.data_vencimento === filtroVencimento;
    return bateStatus && bateVencimento;
  });

  // --- FUNÇÕES RÁPIDAS DE APROVAÇÃO ---
  function mudarStatus(id, novoStatus) {
    const formData = new FormData();
    formData.append("status", novoStatus);

    // Rota ajustada para minúsculo
    axios.put(`${API_URL}/notas/${id}`, formData, config)
      .then(() => carregarDados())
      .catch(() => alert("Erro ao mudar status."));
  }

  function excluirNota(id) {
    if (window.confirm("Deseja realmente excluir esta nota?")) {
      // Rota ajustada para minúsculo
      axios.delete(`${API_URL}/notas/${id}`, config)
        .then(() => {
          alert("Excluída com sucesso!");
          carregarDados();
        })
        .catch(() => alert("Erro ao excluir."));
    }
  }

  // --- FUNÇÕES DO MODAL DE EDIÇÃO ---
  function abrirModal(nota) {
    setNotaEditando({
      ...nota,
      obraId: nota.obra ? nota.obra.id : ""
    });
    setArquivoEdicao(null); // Reseta o arquivo no modal
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setNotaEditando(prev => ({ ...prev, [name]: value }));
  }

  function salvarEdicao(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("numero_nf", Number(notaEditando.numero_nf));
    formData.append("fornecedor", notaEditando.fornecedor || "");
    formData.append("data_vencimento", notaEditando.data_vencimento || "");
    formData.append("valor_total", Number(notaEditando.valor_total));
    formData.append("quant_parcelas", Number(notaEditando.quant_parcelas));
    formData.append("status", Number(notaEditando.status));
    
    if (notaEditando.obraId) {
      formData.append("obra", notaEditando.obraId);
    }
    
    if (arquivoEdicao) {
      formData.append("file", arquivoEdicao);
    }

    // Rota ajustada para minúsculo
    axios.put(`${API_URL}/notas/${notaEditando.id}`, formData, config)
      .then(() => {
        alert("Nota atualizada!");
        setNotaEditando(null);
        carregarDados();
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao atualizar a nota. Verifique os logs.");
      });
  }

  // Textos para o Status
  const renderStatus = (status) => {
    if (status === 1) return <span style={{ color: '#198754', fontWeight: 'bold' }}>APROVADA</span>;
    if (status === 2) return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>REPROVADA</span>;
    return <span style={{ color: '#ffc107', fontWeight: 'bold' }}>A DECIDIR</span>;
  };

  const inputStyle = { width: '100%', padding: '6px', marginBottom: '10px', boxSizing: 'border-box' };

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflowX: "hidden" }}>
      <h2>Gerenciamento de Notas Fiscais</h2>

      {/* BARRA DE FILTROS */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Filtros:</strong>
        
        <div>
          <label style={{ marginRight: '10px' }}>Status:</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '5px' }}>
            <option value="">Todos</option>
            <option value="0">A Decidir</option>
            <option value="1">Aprovadas</option>
            <option value="2">Reprovadas</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '10px' }}>Vencimento exato:</label>
          <input type="date" value={filtroVencimento} onChange={e => setFiltroVencimento(e.target.value)} style={{ padding: '5px' }} />
        </div>

        <button onClick={() => { setFiltroStatus(""); setFiltroVencimento(""); }} style={{ padding: '5px 10px', cursor: 'pointer' }}>
          Limpar Filtros
        </button>
      </div>

      {/* TABELA LARGA */}
      <div style={{ overflowX: "auto", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
        <table style={{ width: "100%", minWidth: "1200px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#343a40", color: "#fff", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>NF</th>
              <th style={{ padding: "12px" }}>Fornecedor</th>
              <th style={{ padding: "12px" }}>Obra</th>
              <th style={{ padding: "12px" }}>Vencimento</th>
              <th style={{ padding: "12px" }}>Valor (R$)</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Ações Rápidas</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Gerenciar</th>
            </tr>
          </thead>
          <tbody>
            {notasFiltradas.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>Nenhuma nota encontrada.</td></tr>
            ) : (
              notasFiltradas.map((nota) => (
                <tr key={nota.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px" }}><strong>{nota.numero_nf}</strong></td>
                  <td style={{ padding: "12px" }}>{nota.fornecedor || "-"}</td>
                  <td style={{ padding: "12px" }}>{nota.obra?.nome_obra || "Sem obra"}</td>
                  <td style={{ padding: "12px" }}>
                    {nota.data_vencimento ? new Date(nota.data_vencimento).toLocaleDateString('pt-BR') : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {nota.valor_total ? `R$ ${Number(nota.valor_total).toFixed(2)}` : "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {renderStatus(nota.status)}
                  </td>
                  
                  {/* BOTÕES DE APROVAÇÃO RÁPIDA */}
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {nota.status === 0 && (
                      <>
                        <button onClick={() => mudarStatus(nota.id, 1)} style={{ background: '#198754', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>✓ Aprovar</button>
                        <button onClick={() => mudarStatus(nota.id, 2)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>✗ Reprovar</button>
                      </>
                    )}
                  </td>

                  {/* BOTÕES DE EDITAR E EXCLUIR */}
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button onClick={() => abrirModal(nota)} style={{ background: "#0d6efd", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", marginRight: "5px" }}>Editar</button>
                    <button onClick={() => excluirNota(nota.id)} style={{ background: "#343a40", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Excluir</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {notaEditando && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
            width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3>Editar Nota {notaEditando.numero_nf}</h3>
            
            <form onSubmit={salvarEdicao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Número NF:</label>
                  <input type="number" name="numero_nf" value={notaEditando.numero_nf} onChange={handleEditChange} style={inputStyle} required />
                </div>
                <div>
                  <label>Fornecedor:</label>
                  <input type="text" name="fornecedor" value={notaEditando.fornecedor || ''} onChange={handleEditChange} style={inputStyle} />
                </div>
                <div>
                  <label>Valor Total:</label>
                  <input type="number" step="0.01" name="valor_total" value={notaEditando.valor_total || ''} onChange={handleEditChange} style={inputStyle} />
                </div>
                <div>
                  <label>Vencimento:</label>
                  <input type="date" name="data_vencimento" value={notaEditando.data_vencimento ? notaEditando.data_vencimento.substring(0, 10) : ''} onChange={handleEditChange} style={inputStyle} />
                </div>
                <div>
                  <label>Parcelas:</label>
                  <input type="number" name="quant_parcelas" value={notaEditando.quant_parcelas || 1} onChange={handleEditChange} style={inputStyle} />
                </div>
                <div>
                  <label>Status:</label>
                  <select name="status" value={notaEditando.status} onChange={handleEditChange} style={inputStyle}>
                    <option value="0">A Decidir</option>
                    <option value="1">Aprovada</option>
                    <option value="2">Reprovada</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Trocar Obra:</label>
                  <select name="obraId" value={notaEditando.obraId} onChange={handleEditChange} style={inputStyle}>
                    <option value="">-- Sem Obra --</option>
                    {obras.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome_obra}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Atualizar Arquivo (Opcional):</label>
                  <input type="file" onChange={e => setArquivoEdicao(e.target.files[0])} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setNotaEditando(null)} style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ccc', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotasList;