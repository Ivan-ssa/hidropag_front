import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ObrasList() {
  const [obras, setObras] = useState([]);

  const buscarObras = () => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!tokenSalvo) {
      alert("Você não está logado! Faça o login.");
      return;
    }

    axios.get('http://localhost:3000/obras', {
      headers: { Authorization: `Bearer ${tokenSalvo}` }
    })
    .then((resposta) => {
      setObras(resposta.data);
    })
    .catch((erro) => {
      console.error("Erro na requisição:", erro);
      alert("Erro ao buscar as obras: " + erro.message);
    });
  };

  useEffect(() => {
    buscarObras();
  }, []);

  const deletarObra = (id, nome) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    if (window.confirm(`Tem certeza que deseja excluir a obra "${nome}"?`)) {
      axios.delete(`http://localhost:3000/obras/${id}`, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      })
      .then(() => {
        alert("Obra excluída com sucesso!");
        buscarObras();
      })
      .catch((erro) => {
        console.error("Erro ao deletar:", erro);
        alert("Erro ao deletar a obra.");
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#333' }}>Gerenciamento de Obras</h3>
        
        {/* Botão que leva para a tela de Cadastro */}
        <Link to="/obras/nova" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 15px', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          + Nova Obra
        </Link>
      </div>
      
      {obras.length === 0 ? (
        <p>Nenhuma obra encontrada ou carregando dados...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nome da Obra</th>
              {/* Adicione mais colunas do seu banco de dados aqui (ex: Data, Status) */}
              <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {obras.map((obra) => (
              <tr key={obra.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{obra.id}</td>
                <td style={{ padding: '12px' }}>{obra.nome}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => deletarObra(obra.id, obra.nome)}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ObrasList;