import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Search, Pencil, Trash2, X, Save, Loader2, AlertCircle, Building, User } from 'lucide-react';

export default function Clientes() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  
  // Estado do formulário com o código Elevor incluído
  const [formData, setFormData] = useState({
    tipo_pessoa: 'PJ',
    razao_social: '',
    cnpj: '',
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    complemento: '',
    codigo_elevor: '',
    ativo: true
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setCarregando(true);
      const resposta = await axios.get(`${API_URL}/clientes`, config);
      setClientes(resposta.data);
      setErro(null);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setErro('Não foi possível carregar a lista de clientes.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (cliente = null) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({
        tipo_pessoa: cliente.tipo_pessoa || 'PJ',
        razao_social: cliente.razao_social || '',
        cnpj: cliente.cnpj || '',
        nome: cliente.nome || '',
        cpf: cliente.cpf || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        complemento: cliente.complemento || '',
        codigo_elevor: cliente.codigo_elevor || '',
        ativo: cliente.ativo !== undefined ? cliente.ativo : true
      });
    } else {
      setClienteEditando(null);
      setFormData({ 
        tipo_pessoa: 'PJ', razao_social: '', cnpj: '', nome: '', cpf: '', 
        email: '', telefone: '', endereco: '', complemento: '', codigo_elevor: '', ativo: true 
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setClienteEditando(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvarCliente = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      ...formData,
      codigo_elevor: formData.codigo_elevor ? Number(formData.codigo_elevor) : null
    };

    if (payload.tipo_pessoa === 'PJ') {
      payload.nome = null;
      payload.cpf = null;
    } else {
      payload.razao_social = null;
      payload.cnpj = null;
    }

    try {
      if (clienteEditando) {
        await axios.patch(`${API_URL}/clientes/${clienteEditando.id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/clientes`, payload, config);
      }
      carregarClientes();
      fecharModal();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar o cliente. Verifique se o CPF/CNPJ já existe.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirCliente = async (id) => {
    if (window.confirm("Tem a certeza que deseja excluir este cliente?")) {
      try {
        await axios.delete(`${API_URL}/clientes/${id}`, config);
        carregarClientes();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir o cliente. Pode estar vinculado a alguma obra.");
      }
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    const nomeBusca = (c.razao_social || c.nome || '').toLowerCase();
    const docBusca = (c.cnpj || c.cpf || '').toLowerCase();
    return nomeBusca.includes(termo) || docBusca.includes(termo);
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
              <Users className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Gestão de Clientes
          </h1>
          <p className="text-sm text-hidrotec-4">
            Registe e gira os clientes (PF e PJ) proprietários das obras e integração ERP.
          </p>
        </div>
        
        <button 
          onClick={() => abrirModal()}
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </header>

      {/* Tabela de Clientes */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Nome, Razão Social, CPF ou CNPJ..."
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
              <p className="text-sm font-medium text-hidrotec-4">A carregar clientes...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <Users className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">Nenhum cliente encontrado.</p>
              <p className="text-sm">Clique em "Novo Cliente" para começar.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-white">
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Nome / Razão Social</th>
                  <th className="px-6 py-4 font-semibold">Documento</th>
                  <th className="px-6 py-4 font-semibold">Cód. Elevor</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        cliente.tipo_pessoa === 'PJ' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600'
                      }`}>
                        {cliente.tipo_pessoa === 'PJ' ? <Building size={12} /> : <User size={12} />}
                        {cliente.tipo_pessoa}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-hidrotec-3">
                      {cliente.tipo_pessoa === 'PJ' ? cliente.razao_social : cliente.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {cliente.tipo_pessoa === 'PJ' ? cliente.cnpj : cliente.cpf}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-hidrotec-1">
                      {cliente.codigo_elevor ? `#${cliente.codigo_elevor}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-hidrotec-3">{cliente.email || '-'}</p>
                      <p className="text-xs text-slate-400">{cliente.telefone || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cliente.ativo !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {cliente.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => abrirModal(cliente)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirCliente(cliente.id)}
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

      {/* Modal Flutuante para Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">
                {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={fecharModal} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarCliente} className="p-6">
              
              <div className="flex items-center gap-4 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_pessoa: 'PJ' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.tipo_pessoa === 'PJ' ? 'bg-white text-hidrotec-3 shadow-sm' : 'text-slate-500 hover:text-hidrotec-3'
                  }`}
                >
                  <Building size={16} /> Pessoa Jurídica (PJ)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_pessoa: 'PF' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.tipo_pessoa === 'PF' ? 'bg-white text-hidrotec-3 shadow-sm' : 'text-slate-500 hover:text-hidrotec-3'
                  }`}
                >
                  <User size={16} /> Pessoa Física (PF)
                </button>
              </div>

              <div className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {formData.tipo_pessoa === 'PJ' ? (
                    <>
                      <div>
                        <label className={labelCls}>Razão Social *</label>
                        <input type="text" name="razao_social" value={formData.razao_social} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>CNPJ (Apenas números)</label>
                        <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} maxLength="14" className={inputCls} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Nome Completo *</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>CPF (Apenas números)</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength="11" className={inputCls} />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone / Celular</label>
                    <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Endereço Completo</label>
                    <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputCls} placeholder="Rua, Número, Bairro, Cidade" />
                  </div>
                  <div>
                    <label className={labelCls}>Complemento</label>
                    <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} className={inputCls} placeholder="Sala, Apto..." />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Código Elevor (Integração ERP)</label>
                  <input type="number" name="codigo_elevor" value={formData.codigo_elevor} onChange={handleChange} className={inputCls} placeholder="Código no ERP" />
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="w-5 h-5 border-2 border-slate-300 rounded text-hidrotec-2 focus:ring-hidrotec-2 transition-colors cursor-pointer" />
                    <span className="text-sm font-bold text-hidrotec-3 group-hover:text-hidrotec-1 transition-colors">Cliente Ativo no Sistema</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onClick={fecharModal} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}