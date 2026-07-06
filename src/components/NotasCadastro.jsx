import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NotasCadastro() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  
  const [nota, setNota] = useState({
    numero_nf: '',
    fornecedor: '',
    data_vencimento: '',
    valor_total: '',
    quant_parcelas: 1,
    status: 0, // 0 = A Decidir, 1 = Aprovada, 2 = Reprovada
    obraId: ''
  });

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('tokenHidropag')}` }
  };

  // Busca as obras para preencher o <select> (Rota ajustada para minúsculo)
  useEffect(() => {
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => console.error("Erro ao buscar obras:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNota(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nota.obraId || !nota.numero_nf) {
      alert("Preencha o Número da NF e selecione uma Obra!");
      return;
    }

    // Como lidamos com upload de arquivo, empacotamos no FormData
    const formData = new FormData();
    formData.append('numero_nf', Number(nota.numero_nf));
    formData.append('fornecedor', nota.fornecedor);
    formData.append('data_vencimento', nota.data_vencimento);
    formData.append('valor_total', Number(nota.valor_total));
    formData.append('quant_parcelas', Number(nota.quant_parcelas));
    formData.append('status', Number(nota.status));
    formData.append('obra', nota.obraId); // ID da obra vinculada
    
    if (arquivo) {
      formData.append('file', arquivo);
    }

    // Envia os dados para o backend (Rota ajustada para minúsculo)
    axios.post(`${API_URL}/notas`, formData, config)
      .then(() => {
        alert("Nota cadastrada com sucesso!");
        navigate('/notas'); // Redireciona de volta para a listagem ampla
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar nota:", erro);
        if (erro.response && erro.response.data && erro.response.data.message) {
          alert("Erro do servidor: " + JSON.stringify(erro.response.data.message));
        } else {
          alert("Erro ao cadastrar a nota. Verifique se todos os campos estão corretos.");
        }
      });
  };

  // Estilos limpos para o formulário
  const inputStyle = { width: '100%', padding: '8px', marginBottom: '15px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Cadastrar Nova Nota (NF)</h2>
      
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div>
            <label style={labelStyle}>Número da NF: *</label>
            <input type="number" name="numero_nf" value={nota.numero_nf} onChange={handleChange} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>Fornecedor:</label>
            <input type="text" name="fornecedor" value={nota.fornecedor} onChange={handleChange} style={inputStyle} placeholder="Ex: Distribuidora Hidráulica" />
          </div>

          <div>
            <label style={labelStyle}>Data de Vencimento:</label>
            <input type="date" name="data_vencimento" value={nota.data_vencimento} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Valor Total (R$):</label>
            <input type="number" step="0.01" name="valor_total" value={nota.valor_total} onChange={handleChange} style={inputStyle} placeholder="0.00" />
          </div>

          <div>
            <label style={labelStyle}>Qtd. de Parcelas:</label>
            <input type="number" name="quant_parcelas" value={nota.quant_parcelas} onChange={handleChange} style={inputStyle} min="1" />
          </div>

          <div>
            <label style={labelStyle}>Vincular à Obra: *</label>
            <select name="obraId" value={nota.obraId} onChange={handleChange} style={inputStyle} required>
              <option value="">-- Selecione uma Obra --</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Arquivo da Nota (PDF/Imagem):</label>
            <input type="file" onChange={handleFileChange} style={{ ...inputStyle, border: 'none', padding: '4px 0' }} />
          </div>

        </div>

        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Salvar Nota
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/notas')}
            style={{ padding: '10px 20px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default NotasCadastro;
