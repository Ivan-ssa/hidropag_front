import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Plus, Search, Pencil, Trash2, X, Save, Loader2, AlertCircle } from 'lucide-react';

export default function Fornecedores() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  
  // Estado do formulário incluindo o código Elevor
  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '',
    codigo_elevor: '',
    ativo: true
  });

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      setCarregando(true);
      // Ajuste para a rota correta de fornecedores no seu back-end, se necessário
      const resposta = await axios.get(`${API_URL}/fornecedores`, config);
      setFornecedores(resposta.data);
      setErro(null);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      setErro('Não foi possível carregar a lista de fornecedores.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (fornecedor = null) => {
    if (fornecedor) {
      setFornecedorEditando(fornecedor);
      setFormData({
        razaoSocial: fornecedor.razaoSocial || fornecedor.nome || '',
        cnpj: fornecedor.cnpj || fornecedor.documento || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        codigo_elevor: fornecedor.codigo_elevor || '',
        ativo: fornecedor.ativo !== undefined ? fornecedor.ativo : true
      });
    } else {
      setFornecedorEditando(null);
      setFormData({ razaoSocial: '', cnpj: '', email: '', telefone: '', codigo_elevor: '', ativo: true });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorEditando(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvarFornecedor = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      ...formData,
      codigo_elevor: formData.codigo_elevor ? Number(formData.codigo_elevor) : null
    };

    try {
      if (fornecedorEditando) {
        await axios.patch(`${API_URL}/fornecedores/${fornecedorEditando.id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/fornecedores`, payload, config);
      }
      carregarFornecedores();
      fecharModal();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      alert("Erro ao salvar o fornecedor. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirFornecedor = async (id) => {
    if (window.confirm("Tem a certeza que deseja excluir este fornecedor?")) {
      try {
        await axios.delete(`${API_URL}/fornecedores/${id}`, config);
        carregarFornecedores();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir o fornecedor.");
      }
    }
  };

  const fornecedoresFiltrados = fornecedores.filter(f => {
    const termo = busca.toLowerCase();
    const nome = (f.razaoSocial || f.nome || '').toLowerCase();
    const cnpj = (f.cnpj || '').toLowerCase();
    return nome.includes(termo) || cnpj.includes(termo);
  });

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-5xl w-full mx-auto font-body pb-12">
      
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
            CONFIGURAÇÕES
          </p>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <Truck className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Gestão de Fornecedores
          </h1>
          <p className="text-sm text-hidrotec-4">
            Registe e gira os fornecedores integrados com o código Elevor e notas fiscais.
          </p>
        </div>
        
        <button 
          onClick={() => abrirModal()}
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Novo Fornecedor
        </button>
      </header>

      {/* Tabela de Fornecedores */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">A carregar fornecedores...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <Truck className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">Nenhum fornecedor encontrado.</p>
              <p className="text-sm">Clique em "Novo Fornecedor" para começar.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-white">
                  <th className="px-6 py-4 font-semibold">Razão Social / Nome</th>
                  <th className="px-6 py-4 font-semibold">CNPJ</th>
                  <th className="px-6 py-4 font-semibold">Cód. Elevor</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fornecedoresFiltrados.map((fornecedor) => (
                  <tr key={fornecedor.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-hidrotec-3">
                      {fornecedor.razaoSocial || fornecedor.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {fornecedor.cnpj || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-hidrotec-1">
                      {fornecedor.codigo_elevor ? `#${fornecedor.codigo_elevor}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-hidrotec-3">{fornecedor.email || '-'}</p>
                      <p className="text-xs text-slate-400">{fornecedor.telefone || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        fornecedor.ativo !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {fornecedor.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => abrirModal(fornecedor)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirFornecedor(fornecedor.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Flutuante para Criar/Editar Fornecedor */}
      {modalAberto && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">
                {fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button onClick={fecharModal} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarFornecedor} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Razão Social / Nome *</label>
                  <input type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} className={inputCls} required placeholder="Ex: Distribuidora de Materiais" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>CNPJ</label>
                    <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} maxLength="14" className={inputCls} placeholder="Apenas números" />
                  </div>
                  <div>
                    <label className={labelCls}>Código Elevor</label>
                    <input type="number" name="codigo_elevor" value={formData.codigo_elevor} onChange={handleChange} className={inputCls} placeholder="Ex: 1045" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="w-5 h-5 border-2 border-slate-300 rounded text-hidrotec-2 focus:ring-hidrotec-2 transition-colors cursor-pointer" />
                    <span className="text-sm font-bold text-hidrotec-3 group-hover:text-hidrotec-1 transition-colors">Fornecedor Ativo no Sistema</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onClick={fecharModal} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Search, Edit2, Trash2, Loader2 } from 'lucide-react';

// export default function Fornecedores() {
//   const [busca, setBusca] = useState('');
  
//   // Nossos novos estados para controlar a API
//   const [fornecedores, setFornecedores] = useState([]);
//   const [carregando, setCarregando] = useState(true);
//   const [erro, setErro] = useState(null);

//   const API_URL = import.meta.env.VITE_API_URL;

//   // Este hook roda assim que a tela abre
//   useEffect(() => {
//     carregarFornecedores();
//   }, []);

//   const carregarFornecedores = async () => {
//     try {
//       setCarregando(true);
//       const token = localStorage.getItem('tokenHidropag');
      
//       // Fazemos a chamada à sua API NestJS
//       const resposta = await axios.get(`${API_URL}/fornecedores`, {
//         headers: {
//           Authorization: `Bearer ${token}` // Enviamos o crachá de segurança
//         }
//       });
      
//       // Guardamos os dados reais que vieram do Supabase
//       setFornecedores(resposta.data);
//       setErro(null);
//     } catch (error) {
//       console.error("🔍 Erro ao buscar fornecedores:", error);
//       setErro('Não foi possível carregar a lista de fornecedores.');
//     } finally {
//       setCarregando(false);
//     }
//   };

//   // Filtro de busca na tela (funciona com os dados reais)
//   const fornecedoresFiltrados = fornecedores.filter(forn => {
//     const termoBusca = busca.toLowerCase();
//     // Usa razaoSocial ou razao (dependendo de como você criou na API)
//     const nomeFornecedor = (forn.razaoSocial || forn.razao || '').toLowerCase();
//     const cnpjFornecedor = (forn.cnpj || '').toLowerCase();
    
//     return nomeFornecedor.includes(termoBusca) || cnpjFornecedor.includes(termoBusca);
//   });

//   return (
//     <div className="max-w-6xl w-full mx-auto font-body">
      
//       <header className="mb-8">
//         <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
//           CADASTROS
//         </p>
//         <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2">
//           Fornecedores
//         </h1>
//         <p className="text-sm text-hidrotec-4">
//           Consulte e gerencie os fornecedores cadastrados.
//         </p>
//       </header>

//       <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
//         <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
//           <div className="relative flex-1 max-w-md">
//             <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               placeholder="Buscar por Razão Social ou CNPJ"
//               value={busca}
//               onChange={(e) => setBusca(e.target.value)}
//               className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 placeholder:text-slate-400 bg-white"
//             />
//           </div>
//           <span className="text-xs font-medium text-hidrotec-4">
//             {fornecedoresFiltrados.length} fornecedores cadastrados
//           </span>
//         </div>

//         <div className="overflow-x-auto min-h-[300px]">
//           {/* Mostra um ícone a girar enquanto a API responde */}
//           {carregando ? (
//             <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
//               <Loader2 className="w-8 h-8 animate-spin mb-4" />
//               <p className="text-sm font-medium text-hidrotec-4">A carregar dados do Supabase...</p>
//             </div>
//           ) : erro ? (
//             /* Mostra erro se o back-end estiver desligado ou der problema */
//             <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
//               {erro}
//             </div>
//           ) : fornecedoresFiltrados.length === 0 ? (
//             <div className="flex items-center justify-center h-64 text-hidrotec-4 font-medium">
//               Nenhum fornecedor encontrado.
//             </div>
//           ) : (
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-white">
//                   <th className="px-6 py-4 font-semibold">Razão Social</th>
//                   <th className="px-6 py-4 font-semibold">CNPJ</th>
//                   <th className="px-6 py-4 font-semibold">Telefone de Contato</th>
//                   <th className="px-6 py-4 font-semibold text-center">Status</th>
//                   <th className="px-6 py-4 font-semibold text-right">Ações</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {fornecedoresFiltrados.map((forn) => {
//                   // Prepara os dados para evitar erros se a API retornar algo nulo
//                   const razao = forn.razaoSocial || forn.razao || 'Sem Nome';
//                   const inicial = razao.charAt(0).toUpperCase();
//                   const status = forn.status === undefined ? 'Ativo' : (forn.status ? 'Ativo' : 'Inativo');

//                   return (
//                     <tr key={forn.id} className="hover:bg-slate-50/50 transition-colors group">
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 rounded-full bg-extra text-hidrotec-1 flex items-center justify-center text-xs font-bold">
//                             {inicial}
//                           </div>
//                           <span className="text-sm font-medium text-hidrotec-3">
//                             {razao}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-hidrotec-4">
//                         {forn.cnpj || '-'}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-hidrotec-4">
//                         {forn.telefone || '-'}
//                       </td>
//                       <td className="px-6 py-4 text-center">
//                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
//                           status === 'Ativo' 
//                             ? 'bg-green-50 text-green-600 border border-green-100' 
//                             : 'bg-slate-100 text-slate-500 border border-slate-200'
//                         }`}>
//                           {status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button className="p-1.5 text-slate-400 hover:text-hidrotec-1 hover:bg-extra rounded-lg transition-colors">
//                             <Edit2 className="w-4 h-4" />
//                           </button>
//                           <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }