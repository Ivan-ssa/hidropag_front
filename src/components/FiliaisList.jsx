import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function FiliaisList() {
  const [filiais, setFiliais] = useState([]);
  
  // Estado para controlar a filial que está sendo editada (se null, o modal fica fechado)
  const [filialEditando, setFilialEditando] = useState(null);

  const buscarFiliais = () => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!tokenSalvo) {
      alert("Você não está logado! Faça o login.");
      return;
    }

    axios.get(`${API_URL}/filiais`, {
      headers: { Authorization: `Bearer ${tokenSalvo}` }
    })
    .then((resposta) => {
      setFiliais(resposta.data);
    })
    .catch((erro) => {
      console.error("Erro na requisição:", erro);
      alert("Erro ao buscar: " + erro.message);
    });
  };

  useEffect(() => {
    buscarFiliais();
  }, []);

  // FUNÇÃO PARA DELETAR
  const deletarFilial = (id, nome) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    if (window.confirm(`Tem certeza que deseja excluir a filial "${nome}"?`)) {
      axios.delete(`${API_URL}/filiais/${id}`, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      })
      .then(() => {
        alert("Filial excluída com sucesso!");
        buscarFiliais();
      })
      .catch((erro) => {
        console.error("Erro ao deletar:", erro);
        alert("Erro ao deletar a filial.");
      });
    }
  };

  // --- FUNÇÕES DE EDIÇÃO ---

  // 1. Abre o modal e coloca os dados da filial clicada no estado
  const abrirModalEdicao = (filial) => {
    setFilialEditando(filial);
  };

  // 2. Atualiza os campos do formulário de edição conforme o usuário digita
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilialEditando((prev) => ({
      ...prev,
      // Se for um checkbox, pega se tá marcado (checked), se não, pega o texto (value)
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 3. Envia os dados atualizados para a API
  const salvarEdicao = (e) => {
    e.preventDefault();
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!filialEditando.nome || !filialEditando.cidade) {
      alert("Nome e Cidade são obrigatórios!");
      return;
    }

    // Objeto limpo apenas com os dados que a API aceita
    const dadosParaAtualizar = {
      nome: filialEditando.nome,
      cnpj: filialEditando.cnpj || null,
      cidade: filialEditando.cidade,
      uf: filialEditando.uf || null,
      cep: filialEditando.cep || null,
      logradouro: filialEditando.logradouro || null,
      numero: filialEditando.numero || null,
      // email_contato: filialEditando.email_contato || null,
      // ativo: filialEditando.ativo !== undefined ? filialEditando.ativo : true
    };

    axios.put(`${API_URL}/filiais/${filialEditando.id}`, dadosParaAtualizar, {
      headers: { Authorization: `Bearer ${tokenSalvo}` }
    })
    .then(() => {
      alert("Filial atualizada com sucesso!");
      setFilialEditando(null); // Fecha o modal
      buscarFiliais(); // Recarrega a lista
    })
    .catch((erro) => {
      console.error("Erro ao atualizar:", erro);
      if (erro.response && erro.response.data && erro.response.data.message) {
        alert("Erro do servidor: " + JSON.stringify(erro.response.data.message));
      } else {
        alert("Erro ao atualizar a filial.");
      }
    });
  };

  
  // Estilos reaproveitáveis para o modal
  const inputStyle = { width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' };

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Filiais</h3>
      
      {filiais.length === 0 ? (
        <p>Nenhuma filial encontrada ou carregando dados...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Nome da Filial</th>
                <th style={{ padding: '12px' }}>CNPJ</th>
                <th style={{ padding: '12px' }}>Cidade / UF</th>
                <th style={{ padding: '12px' }}>Endereço</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filiais.map((filial) => (
                <tr key={filial.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{filial.nome || "Não informado"}</strong>
                    {/* Se quiser mostrar se está inativa na lista, deixei um aviso vermelho aqui */}
                    {filial.ativo === false && <span style={{ color: 'red', fontSize: '12px', marginLeft: '8px' }}>(Inativa)</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {filial.cnpj || "-"}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {filial.cidade || "N/I"} {filial.uf ? `/ ${filial.uf}` : ""}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {filial.logradouro ? (
                      <>
                        {filial.logradouro}, {filial.numero || "S/N"}<br/>
                        <small style={{ color: '#666' }}>CEP: {filial.cep || "N/I"}</small>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button 
                      onClick={() => abrirModalEdicao(filial)}
                      style={{ backgroundColor: '#ffc107', border: 'none', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => deletarFilial(filial.id, filial.nome)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {filialEditando && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
            width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Editar Filial</h3>
            
            <form onSubmit={salvarEdicao}>
              <label style={labelStyle}>Nome da Filial: *</label>
              <input type="text" name="nome" value={filialEditando.nome || ''} onChange={handleEditChange} style={inputStyle} required />

              <label style={labelStyle}>CNPJ:</label>
              <input type="text" name="cnpj" value={filialEditando.cnpj || ''} onChange={handleEditChange} style={inputStyle} />

              {/* <label style={labelStyle}>E-mail de Contato:</label>
              <input type="email" name="email_contato" value={filialEditando.email_contato || ''} onChange={handleEditChange} style={inputStyle} placeholder="Ex: contato@empresa.com" /> */}

              <label style={labelStyle}>Logradouro (Rua/Av):</label>
              <input type="text" name="logradouro" value={filialEditando.logradouro || ''} onChange={handleEditChange} style={inputStyle} />

              <label style={labelStyle}>Número:</label>
              <input type="text" name="numero" value={filialEditando.numero || ''} onChange={handleEditChange} style={inputStyle} />

              <label style={labelStyle}>CEP:</label>
              <input type="text" name="cep" value={filialEditando.cep || ''} onChange={handleEditChange} style={inputStyle} />

              <label style={labelStyle}>Cidade: *</label>
              <input type="text" name="cidade" value={filialEditando.cidade || ''} onChange={handleEditChange} style={inputStyle} required />

              <label style={labelStyle}>UF:</label>
              <input type="text" name="uf" value={filialEditando.uf || ''} onChange={handleEditChange} maxLength="2" style={{ ...inputStyle, textTransform: 'uppercase' }} />

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={filialEditando.ativo !== undefined ? filialEditando.ativo : true} 
                  onChange={handleEditChange} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Filial Ativa (Desmarque para inativar)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setFilialEditando(null)} 
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

export default FiliaisList;




// import { useState, useEffect } from 'react';
// import axios from 'axios';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// function FiliaisList() {
//   const [filiais, setFiliais] = useState([]);
//   //

//   // Função para buscar as filiais da API
//   const buscarFiliais = () => {
//     // Buscamos o token no cofre na hora que a função é chamada
//     const tokenSalvo = localStorage.getItem('tokenHidropag');

//     if (!tokenSalvo) {
//       alert("Você não está logado! Faça o login.");
//       return;
//     }

//     axios.get(`${API_URL}/filiais`, {
//       headers: { Authorization: `Bearer ${tokenSalvo}` }
//     })
//     .then((resposta) => {
//       setFiliais(resposta.data);
//     })
//     .catch((erro) => {
//       console.error("Erro na requisição:", erro);
//       alert("Erro ao buscar: " + erro.message);
//     });
//   };

//   // Isso faz a busca acontecer automaticamente quando a tela abre
//   useEffect(() => {
//     buscarFiliais();
//   }, []);

//   // FUNÇÃO PARA DELETAR
//   const deletarFilial = (id, nome) => {
//     const tokenSalvo = localStorage.getItem('tokenHidropag');
//     if (window.confirm(`Tem certeza que deseja excluir a filial "${nome}"?`)) {
//       axios.delete(`http://localhost:3000/filiais/${id}`, {
//         headers: { Authorization: `Bearer ${tokenSalvo}` }
//       })
//       .then(() => {
//         alert("Filial excluída com sucesso!");
//         buscarFiliais();
//       })
//       .catch((erro) => {
//         console.error("Erro ao deletar:", erro);
//         alert("Erro ao deletar a filial.");
//       });
//     }
//   };

//   // FUNÇÃO PARA EDITAR
//   const editarFilial = (id) => {
//     const tokenSalvo = localStorage.getItem('tokenHidropag');
//     const novoNome = window.prompt("Digite o novo nome para esta filial:");
    
//     if (!novoNome) return; 

//     axios.put(`http://localhost:3000/filiais/${id}`, { nome: novoNome }, {
//       headers: { Authorization: `Bearer ${tokenSalvo}` }
//     })
//     .then(() => {
//       alert("Filial atualizada com sucesso!");
//       buscarFiliais();
//     })
//     .catch((erro) => {
//       console.error("Erro ao atualizar:", erro);
//       alert("Erro ao atualizar a filial.");
//     });
//   };

//   return (
//     <div>
//       <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Filiais</h3>
      
//       {filiais.length === 0 ? (
//         <p>Nenhuma filial encontrada ou carregando dados...</p>
//       ) : (
//         <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
//               <th style={{ padding: '12px' }}>ID</th>
//               <th style={{ padding: '12px' }}>Nome da Filial</th>
//               <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filiais.map((filial) => (
//               <tr key={filial.id} style={{ borderBottom: '1px solid #ddd' }}>
//                 <td style={{ padding: '12px' }}>{filial.id}</td>
//                 <td style={{ padding: '12px' }}>{filial.nome}</td>
//                 <td style={{ padding: '12px', textAlign: 'center' }}>
//                   <button 
//                     onClick={() => editarFilial(filial.id)}
//                     style={{ backgroundColor: '#ffc107', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px' }}
//                   >
//                     Editar
//                   </button>
//                   <button 
//                     onClick={() => deletarFilial(filial.id, filial.nome)}
//                     style={{ backgroundColor: '#dc3545', color: 'white', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}
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

// export default FiliaisList;

// import { useState, useEffect } from 'react';
// import axios from 'axios';

// function FiliaisList() {
//   const [filiais, setFiliais] = useState([]);

//   // Função para buscar as filiais da API
//   const buscarFiliais = () => {

//     axios.get('http://localhost:3000/filiais')
//       .then((resposta) => {
//         setFiliais(resposta.data);
//       })
//       .catch((erro) => {
//         console.error("Erro ao buscar as filiais:", erro);
//       });
//   };

//   // Busca as filiais assim que a tela abre
//   useEffect(() => {
//     buscarFiliais();
//   }, []);

//   // FUNÇÃO PARA DELETAR (O "D" do CRUD)
//   const deletarFilial = (id, nome) => {
//     if (window.confirm(`Tem certeza que deseja excluir a filial "${nome}"?`)) {
//       axios.delete(`http://localhost:3000/filiais/${id}`)
//         .then(() => {
//           alert("Filial excluída com sucesso!");
//           buscarFiliais(); // Atualiza a lista na tela após deletar
//         })
//         .catch((erro) => {
//           console.error("Erro ao deletar:", erro);
//           alert("Erro ao deletar a filial.");
//         });
//     }
//   };

//   // FUNÇÃO PARA EDITAR (O "U" do CRUD - Update)
//   const editarFilial = (id) => {
//     const novoNome = window.prompt("Digite o novo nome para esta filial:");
    
//     // Validação para não aceitar nome em branco
//     if (novoNome === null) return; // Se clicou em cancelar
//     if (!novoNome.trim()) {
//       alert("O nome da filial não pode ser vazio!");
//       return;
//     }

//     axios.patch(`http://localhost:3000/filiais/${id}`, { nome: novoNome })
//       .then(() => {
//         alert("Filial atualizada com sucesso!");
//         buscarFiliais(); // Atualiza a lista na tela
//       })
//       .catch((erro) => {
//         console.error("Erro ao atualizar:", erro);
//         alert("Erro ao atualizar a filial.");
//       });
//   };

//   return (
//     <div>
//       <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Filiais</h3>
      
//       {filiais.length === 0 ? (
//         <p>Nenhuma filial encontrada ou carregando dados...</p>
//       ) : (
//         <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
//               <th style={{ padding: '12px' }}>ID</th>
//               <th style={{ padding: '12px' }}>Nome da Filial</th>
//               <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filiais.map((filial) => (
//               <tr key={filial.id} style={{ borderBottom: '1px solid #ddd' }}>
//                 <td style={{ padding: '12px' }}>{filial.id}</td>
//                 <td style={{ padding: '12px' }}>{filial.nome}</td>
//                 <td style={{ padding: '12px', textAlign: 'center' }}>
//                   <button 
//                     onClick={() => editarFilial(filial.id)}
//                     style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
//                   >
//                     Editar
//                   </button>
//                   <button 
//                     onClick={() => deletarFilial(filial.id, filial.nome)}
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

// export default FiliaisList;