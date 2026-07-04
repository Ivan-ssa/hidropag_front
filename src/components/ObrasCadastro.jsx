import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ObrasCadastro() {
  const [nome, setNome] = useState('');
  const [local, setLocal] = useState(''); // Campo de exemplo
  const navigate = useNavigate();

  const handleSalvar = (e) => {
    e.preventDefault();
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!tokenSalvo) {
      alert("Você não está logado! Faça o login.");
      return;
    }

    if (!nome) {
      alert("Por favor, preencha o nome da obra!");
      return;
    }

    // Enviando para a rota de cadastro que você especificou
    axios.post('http://localhost:3000/obras/nova', {
      nome: nome,
      local: local // Se a sua API TypeORM não tiver a coluna "local", você pode apagar esta linha
    }, {
      headers: { Authorization: `Bearer ${tokenSalvo}` }
    })
    .then(() => {
      alert("Obra cadastrada com sucesso!");
      navigate('/obras'); // Volta para a tela da lista de obras
    })
    .catch((erro) => {
      console.error("Erro ao cadastrar obra:", erro);
      alert("Erro ao cadastrar. Verifique o console para mais detalhes.");
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div style={{ width: '100%', maxWidth: '500px', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '20px' }}>Cadastrar Nova Obra</h2>

        <form onSubmit={handleSalvar}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Obra:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Manutenção Bloco C"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Local / Endereço:</label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Av. Assis Brasil, 123"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              type="button" 
              onClick={() => navigate('/obras')} 
              style={{ padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '48%' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '48%' }}
            >
              Salvar Obra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ObrasCadastro;