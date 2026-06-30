import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function FilialForm() {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nome || !cidade) {
      alert("Por favor, preencha o Nome e a Cidade da filial!");
      return;
    }

    // PEGA O TOKEN DO COFRE DO NAVEGADOR
    const meuToken = localStorage.getItem('tokenHidropag');

    // Manda o Token junto na requisição de cadastro (POST)
    axios.post(`${API_URL}/filiais`, 
      { nome: nome, cidade: cidade },
      { headers: { Authorization: `Bearer ${meuToken}` } }
    )
      .then(() => {
        alert("Filial cadastrada com sucesso!");
        navigate('/filiais');
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar:", erro);
        if (erro.response && erro.response.status === 401) {
          alert("Erro: Você precisa fazer Login primeiro!");
        } else {
          alert("Ocorreu um erro ao cadastrar a filial. Verifique as permissões.");
        }
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Cadastrar Nova Filial</h3>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nome da Filial: </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Filial Centro"
            style={{ width: '100%', padding: '8px', maxWidth: '400px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Cidade: </label>
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Ex: Porto Alegre"
            style={{ width: '100%', padding: '8px', maxWidth: '400px' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Salvar Filial
        </button>
      </form>
    </div>
  );
}

export default FilialForm;