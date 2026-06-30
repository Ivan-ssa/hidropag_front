import { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);

  // Pega o Token do cofre
  const meuToken = localStorage.getItem('tokenHidropag');
  const config = {
    headers: { Authorization: `Bearer ${meuToken}` }
  };

  const buscarUsuarios = () => {
    axios.get(`${API_URL}/usuarios`, config)
      .then((resposta) => {
        // 1. Pegamos a lista que veio do banco de dados
        const listaBaguncada = resposta.data;

        // 2. ordem alfabética pelo nome 
        const listaEmOrdem = listaBaguncada.sort((a, b) => {
          // Garante que não vai dar erro se algum usuário estiver sem nome
          const nomeA = a.nome || "";
          const nomeB = b.nome || "";
          return nomeA.localeCompare(nomeB); 
        });

        // 3. Salva a lista já arrumadinha 
        setUsuarios(listaEmOrdem);
      })
      .catch((erro) => {
        console.error("Erro ao buscar usuários:", erro);
        if (erro.response && erro.response.status === 401) {
          alert("Acesso Negado! Faça login novamente.");
        }
      });
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const deletarUsuario = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      axios.delete(`http://localhost:3000/usuarios/${id}`, config)
        .then(() => {
          alert("Usuário excluído com sucesso!");
          buscarUsuarios();
        })
        .catch((erro) => {
          console.error("Erro ao deletar:", erro);
          alert("Erro ao excluir o usuário. Verifique suas permissões.");
        });
    }
  };

  const editarUsuario = (id) => {
    const novoNome = window.prompt("Digite o novo nome para este usuário:");
    if (!novoNome) return; 

    // Já usando o PUT que descobrimos que funciona no seu sistema!
    axios.put(`http://localhost:3000/usuarios/${id}`, { nome: novoNome }, config)
      .then(() => {
        alert("Usuário atualizado com sucesso!");
        buscarUsuarios();
      })
      .catch((erro) => {
        console.error("Erro ao atualizar:", erro);
        alert("Erro ao atualizar. Pode ser falta de permissão.");
      });
  };

  return (
    <div>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Usuários</h3>
      
      {usuarios.length === 0 ? (
        <p>Nenhum usuário encontrado ou carregando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nome</th>
              <th style={{ padding: '12px' }}>E-mail</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{user.id}</td>
                <td style={{ padding: '12px' }}>{user.nome}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    color: 'white',
                    backgroundColor: user.ativo ? '#28a745' : '#6c757d' 
                  }}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => editarUsuario(user.id)}
                    style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deletarUsuario(user.id, user.nome)}
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

export default UsuariosList;