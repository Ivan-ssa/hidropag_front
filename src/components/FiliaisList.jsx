import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

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


  // Classes reaproveitáveis para os campos do modal
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/filiais/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Filial
        </Link>
      </div>

      {filiais.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          Nenhuma filial encontrada ou carregando dados...
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Nome da Filial</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Cidade / UF</th>
                <th className="px-4 py-3 font-medium">Endereço</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filiais.map((filial) => (
                <tr key={filial.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{filial.nome || "Não informado"}</span>
                    {/* Se quiser mostrar se está inativa na lista, deixei um aviso vermelho aqui */}
                    {filial.ativo === false && <span className="ml-2 text-xs text-danger-500 font-medium">(Inativa)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {filial.cnpj || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {filial.cidade || "N/I"} {filial.uf ? `/ ${filial.uf}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {filial.logradouro ? (
                      <>
                        {filial.logradouro}, {filial.numero || "S/N"}<br/>
                        <small className="text-slate-400">CEP: {filial.cep || "N/I"}</small>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button 
                      onClick={() => abrirModalEdicao(filial)}
                      className="inline-flex items-center gap-1 mr-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button 
                      onClick={() => deletarFilial(filial.id, filial.nome)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">Editar Filial</h3>
              <button onClick={() => setFilialEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">
              <label className={labelCls}>Nome da Filial: *</label>
              <input type="text" name="nome" value={filialEditando.nome || ''} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>CNPJ:</label>
              <input type="text" name="cnpj" value={filialEditando.cnpj || ''} onChange={handleEditChange} className={inputCls} />

              {/* <label style={labelStyle}>E-mail de Contato:</label>
              <input type="email" name="email_contato" value={filialEditando.email_contato || ''} onChange={handleEditChange} style={inputStyle} placeholder="Ex: contato@empresa.com" /> */}

              <label className={labelCls}>Logradouro (Rua/Av):</label>
              <input type="text" name="logradouro" value={filialEditando.logradouro || ''} onChange={handleEditChange} className={inputCls} />

              <label className={labelCls}>Número:</label>
              <input type="text" name="numero" value={filialEditando.numero || ''} onChange={handleEditChange} className={inputCls} />

              <label className={labelCls}>CEP:</label>
              <input type="text" name="cep" value={filialEditando.cep || ''} onChange={handleEditChange} className={inputCls} />

              <label className={labelCls}>Cidade: *</label>
              <input type="text" name="cidade" value={filialEditando.cidade || ''} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>UF:</label>
              <input type="text" name="uf" value={filialEditando.uf || ''} onChange={handleEditChange} maxLength="2" className={`${inputCls} uppercase`} />

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2 mb-1">
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={filialEditando.ativo !== undefined ? filialEditando.ativo : true} 
                  onChange={handleEditChange} 
                  className="w-4 h-4 accent-flow-500 cursor-pointer"
                />
                Filial Ativa (Desmarque para inativar)
              </label>

              <div className="flex justify-end gap-2 mt-5">
                <button 
                  type="button" 
                  onClick={() => setFilialEditando(null)} 
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
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