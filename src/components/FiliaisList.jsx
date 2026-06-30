
import { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function FiliaisList() {
  const [filiais, setFiliais] = useState([]);
  //

  // Função para buscar as filiais da API
  const buscarFiliais = () => {
    // Buscamos o token no cofre na hora que a função é chamada
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

  // Isso faz a busca acontecer automaticamente quando a tela abre
  useEffect(() => {
    buscarFiliais();
  }, []);

  // FUNÇÃO PARA DELETAR
  const deletarFilial = (id, nome) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    if (window.confirm(`Tem certeza que deseja excluir a filial "${nome}"?`)) {
      axios.delete(`http://localhost:3000/filiais/${id}`, {
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

  // FUNÇÃO PARA EDITAR
  const editarFilial = (id) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    const novoNome = window.prompt("Digite o novo nome para esta filial:");
    
    if (!novoNome) return; 

    axios.put(`http://localhost:3000/filiais/${id}`, { nome: novoNome }, {
      headers: { Authorization: `Bearer ${tokenSalvo}` }
    })
    .then(() => {
      alert("Filial atualizada com sucesso!");
      buscarFiliais();
    })
    .catch((erro) => {
      console.error("Erro ao atualizar:", erro);
      alert("Erro ao atualizar a filial.");
    });
  };

  return (
    <div>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>Gerenciamento de Filiais</h3>
      
      {filiais.length === 0 ? (
        <p>Nenhuma filial encontrada ou carregando dados...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#0056b3', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nome da Filial</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filiais.map((filial) => (
              <tr key={filial.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{filial.id}</td>
                <td style={{ padding: '12px' }}>{filial.nome}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => editarFilial(filial.id)}
                    style={{ backgroundColor: '#ffc107', padding: '6px 12px', marginRight: '10px', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deletarFilial(filial.id, filial.nome)}
                    style={{ backgroundColor: '#dc3545', color: 'white', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}
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

export default FiliaisList;

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