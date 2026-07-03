// import { useState, useEffect } from 'react';
// import axios from 'axios';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// function UsuariosList() {
//   const [usuarios, setUsuarios] = useState([]);

//   // Pega o Token do cofre
//   const meuToken = localStorage.getItem('tokenHidropag');
//   const config = {
//     headers: { Authorization: `Bearer ${meuToken}` }
//   };

//   const buscarUsuarios = () => {
//     axios.get(`${API_URL}/usuarios`, config)
//       .then((resposta) => {
//         // 1. Pegamos a lista que veio do banco de dados
//         const listaBaguncada = resposta.data;

//         // 2. ordem alfabética pelo nome 
//         const listaEmOrdem = listaBaguncada.sort((a, b) => {
//           // Garante que não vai dar erro se algum usuário estiver sem nome
//           const nomeA = a.nome || "";
//           const nomeB = b.nome || "";
//           return nomeA.localeCompare(nomeB); 
//         });

//         // 3. Salva a lista já arrumadinha 
//         setUsuarios(listaEmOrdem);
//       })
//       .catch((erro) => {
//         console.error("Erro ao buscar usuários:", erro);
//         if (erro.response && erro.response.status === 401) {
//           alert("Acesso Negado! Faça login novamente.");
//         }
//       });
//   };

//   useEffect(() => {
//     buscarUsuarios();
//   }, []);

//   const deletarUsuario = (id, nome) => {
//     if (window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
//       axios.delete(`http://localhost:3000/usuarios/${id}`, config)
//         .then(() => {
//           alert("Usuário excluído com sucesso!");
//           buscarUsuarios();
//         })
//         .catch((erro) => {
//           console.error("Erro ao deletar:", erro);
//           alert("Erro ao excluir o usuário. Verifique suas permissões.");
//         });
//     }
//   };

//   const editarUsuario = (id) => {
//     const novoNome = window.prompt("Digite o novo nome para este usuário:");
//     if (!novoNome) return; 

//     // Já usando o PUT que descobrimos que funciona no seu sistema!
//     axios.put(`http://localhost:3000/usuarios/${id}`, { nome: novoNome }, config)
//       .then(() => {
//         alert("Usuário atualizado com sucesso!");
//         buscarUsuarios();
//       })
//       .catch((erro) => {
//         console.error("Erro ao atualizar:", erro);
//         alert("Erro ao atualizar. Pode ser falta de permissão.");
//       });
//   };

//   return (
//     <div>
//       <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Usuários</h3>
      
//       {usuarios.length === 0 ? (
//         <p>Nenhum usuário encontrado ou carregando...</p>
//       ) : (
//         <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
//               <th style={{ padding: '12px' }}>ID</th>
//               <th style={{ padding: '12px' }}>Nome</th>
//               <th style={{ padding: '12px' }}>E-mail</th>
//               <th style={{ padding: '12px' }}>Status</th>
//               <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {usuarios.map((user) => (
//               <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
//                 <td style={{ padding: '12px' }}>{user.id}</td>
//                 <td style={{ padding: '12px' }}>{user.nome}</td>
//                 <td style={{ padding: '12px' }}>{user.email}</td>
//                 <td style={{ padding: '12px' }}>
//                   <span style={{ 
//                     padding: '4px 8px', 
//                     borderRadius: '12px', 
//                     fontSize: '12px',
//                     color: 'white',
//                     backgroundColor: user.ativo ? '#28a745' : '#6c757d' 
//                   }}>
//                     {user.ativo ? 'Ativo' : 'Inativo'}
//                   </span>
//                 </td>
//                 <td style={{ padding: '12px', textAlign: 'center' }}>
//                   <button 
//                     onClick={() => editarUsuario(user.id)}
//                     style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
//                   >
//                     Editar
//                   </button>
//                   <button 
//                     onClick={() => deletarUsuario(user.id, user.nome)}
//                     style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
//                   >
//                     Excluir
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

// export default UsuariosList;




import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  
  // Estado para controlar o formulário de cadastro
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    perfilId: ''
  });

  // Pega o Token do cofre
  const meuToken = localStorage.getItem('tokenHidropag');
  const config = {
    headers: { Authorization: `Bearer ${meuToken}` }
  };

  const buscarUsuarios = () => {
    axios.get(`${API_URL}/usuarios`, config)
      .then((resposta) => {
        const listaBaguncada = resposta.data;
        const listaEmOrdem = listaBaguncada.sort((a, b) => {
          const nomeA = a.nome || "";
          const nomeB = b.nome || "";
          return nomeA.localeCompare(nomeB); 
        });
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

  // --- NOVA FUNÇÃO DE CADASTRO ---
  const cadastrarUsuario = (e) => {
    e.preventDefault(); // Evita que a página recarregue ao enviar o formulário

    // Monta o JSON exatamente como sua API pede
    const payload = {
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      senha: novoUsuario.senha,
      ativo: true,
      perfil: {
        id: novoUsuario.perfilId
      }
    };

    axios.post(`${API_URL}/usuarios`, payload, config)
      .then(() => {
        alert("Usuário cadastrado com sucesso!");
        buscarUsuarios(); // Atualiza a lista da tabela
        // Limpa os campos do formulário
        setNovoUsuario({ nome: '', email: '', senha: '', perfilId: '' });
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar:", erro);
        alert("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
      });
  };

  const deletarUsuario = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      axios.delete(`${API_URL}/usuarios/${id}`, config)
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

    axios.put(`${API_URL}/usuarios/${id}`, { nome: novoNome }, config)
      .then(() => {
        alert("Usuário atualizado com sucesso!");
        buscarUsuarios();
      })
      .catch((erro) => {
        console.error("Erro ao atualizar:", erro);
        alert("Erro ao atualizar. Pode ser falta de permissão.");
      });
  };

  // Função auxiliar para atualizar o estado do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoUsuario({ ...novoUsuario, [name]: value });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Usuários</h3>
      
      {/* --- FORMULÁRIO DE CADASTRO --- */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
        <h4 style={{ marginTop: 0 }}>Cadastrar Novo Usuário</h4>
        <form onSubmit={cadastrarUsuario} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nome</label>
            <input type="text" name="nome" value={novoUsuario.nome} onChange={handleInputChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>E-mail</label>
            <input type="email" name="email" value={novoUsuario.email} onChange={handleInputChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Senha</label>
            <input type="password" name="senha" value={novoUsuario.senha} onChange={handleInputChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>ID do Perfil</label>
            <input type="text" name="perfilId" value={novoUsuario.perfilId} onChange={handleInputChange} required placeholder="Ex: 6fc13eec-a3fe..." style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }} />
          </div>

          <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '9px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '35px' }}>
            Salvar
          </button>
        </form>
      </div>

      {/* --- LISTAGEM DE USUÁRIOS --- */}
      {usuarios.length === 0 ? (
        <p>Nenhum usuário encontrado ou carregando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Perfil</th>              
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
                {/* Aqui está a correção para exibir o nome do perfil */}
                <td style={{ padding: '12px' }}>{user.perfil?.nome || 'Sem perfil'}</td>
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