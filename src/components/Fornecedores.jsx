// Fornecedores.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Plus, Search, Pencil, X, Save, Loader2, AlertCircle, Building, User, UserMinus, UserCheck, Check } from 'lucide-react';

const maskCNPJ = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const maskCPF = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

const maskCEP = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
};

const maskTelefone = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, '').slice(0, 11);
};

export default function Fornecedores() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarAtivos, setMostrarAtivos] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  
  const [formData, setFormData] = useState({
    tipo_pessoa: 'PJ',
    razao_social: '',
    cnpj: '',
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    complemento: '',
    cidade: '',
    estado: '',
    codigo_elevor: '',
    ativo: true
  });

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      setCarregando(true);
      const resposta = await axios.get(`${API_URL}/fornecedores`, config);
      setFornecedores(Array.isArray(resposta.data) ? resposta.data : []);
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
        tipo_pessoa: fornecedor.tipo_pessoa || 'PJ',
        razao_social: fornecedor.razao_social || '',
        cnpj: fornecedor.cnpj ? maskCNPJ(String(fornecedor.cnpj)) : '',
        nome: fornecedor.nome || '',
        cpf: fornecedor.cpf ? maskCPF(String(fornecedor.cpf)) : '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone ? maskTelefone(String(fornecedor.telefone)) : '',
        cep: fornecedor.cep ? maskCEP(String(fornecedor.cep)) : '',
        endereco: fornecedor.endereco || '',
        numero: fornecedor.numero || '',
        bairro: fornecedor.bairro || '',
        complemento: fornecedor.complemento || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        codigo_elevor: fornecedor.codigo_elevor || '',
        ativo: fornecedor.ativo !== undefined ? fornecedor.ativo : true
      });
    } else {
      setFornecedorEditando(null);
      setFormData({
        tipo_pessoa: 'PJ',
        razao_social: '',
        cnpj: '',
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        cep: '',
        endereco: '',
        numero: '',
        bairro: '',
        complemento: '',
        cidade: '',
        estado: '',
        codigo_elevor: '',
        ativo: true
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorEditando(null);
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;

    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'cpf') value = maskCPF(value);
    if (name === 'cep') value = maskCEP(value);
    if (name === 'telefone') value = maskTelefone(value);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- BUSCA AUTOMÁTICA DE CEP VIA API PÚBLICA ---
  const handleCepBlur = async () => {
    if (!formData.cep) return;
    const cepLimpo = formData.cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (data.erro) {
          alert("CEP não encontrado!");
        } else {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar ViaCEP:", error);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const salvarFornecedor = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      tipo_pessoa: formData.tipo_pessoa,
      razao_social: formData.tipo_pessoa === 'PJ' ? formData.razao_social : null,
      cnpj: formData.tipo_pessoa === 'PJ' && formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
      nome: formData.tipo_pessoa === 'PF' ? formData.nome : null,
      cpf: formData.tipo_pessoa === 'PF' && formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
      email: formData.email || null,
      telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
      cep: formData.cep ? formData.cep.replace(/\D/g, '') : null,
      endereco: formData.endereco || null,
      numero: formData.numero || null,
      bairro: formData.bairro || null,
      complemento: formData.complemento || null,
      cidade: formData.cidade || null,
      estado: formData.estado ? formData.estado.toUpperCase() : null,
      codigo_elevor: formData.codigo_elevor ? Number(formData.codigo_elevor) : null,
      ativo: formData.ativo
    };

    try {
      if (fornecedorEditando) {
        await axios.patch(`${API_URL}/fornecedores/${fornecedorEditando.id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/fornecedores`, payload, config);
      }
      carregarFornecedores();
      fecharModal();
      setAviso({ tipo: "sucesso", texto: "Fornecedor salvo com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      const msg = error.response?.data?.message || "Erro ao salvar o fornecedor.";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSalvando(false);
    }
  };

  const removerFornecedor = async (fornecedor) => {
    const nomeExibicao = fornecedor.tipo_pessoa === 'PJ' ? fornecedor.razao_social : fornecedor.nome;
    const confirmou = window.confirm(
      `Inativar o fornecedor "${nomeExibicao}"?\n\n` +
      `Ele será movido para a aba de Inativos.`
    );
    if (!confirmou) return;

    const tokenSalvo = localStorage.getItem('tokenHidropag');
    setProcessandoId(fornecedor.id);

    try {
      // Em vez de excluir (DELETE), enviamos um PATCH/PUT atualizando o ativo para false
      await axios.patch(`${API_URL}/fornecedores/${fornecedor.id}`, { ativo: false }, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      
      setAviso({ tipo: "sucesso", texto: `Fornecedor "${nomeExibicao}" foi inativado com sucesso.` });
      await carregarFornecedores();
    } catch (erro) {
      console.error("Erro ao inativar:", erro);
      const msg = erro.response?.data?.message || "Falha na operação.";
      setAviso({ tipo: "erro", texto: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setProcessandoId(null);
    }
  };

  const reativarFornecedor = async (fornecedor) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    setProcessandoId(fornecedor.id);
    const nomeExibicao = fornecedor.tipo_pessoa === 'PJ' ? fornecedor.razao_social : fornecedor.nome;

    try {
      // Reativa alterando a flag ativo para true via PATCH
      await axios.patch(`${API_URL}/fornecedores/${fornecedor.id}`, { ativo: true }, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      setAviso({ tipo: "sucesso", texto: `Fornecedor "${nomeExibicao}" reativado com sucesso!` });
      await carregarFornecedores();
    } catch (erro) {
      console.error("Erro ao reativar:", erro);
      setAviso({ tipo: "erro", texto: "Falha ao reativar o fornecedor." });
    } finally {
      setProcessandoId(null);
    }
  };

  const totalAtivos = fornecedores.filter(f => f.ativo !== false && !f.deletedAt).length;
  const totalInativos = fornecedores.length - totalAtivos;

  const fornecedoresFiltrados = fornecedores.filter(f => {
    const estaAtivo = f.ativo !== false && !f.deletedAt;
    if (estaAtivo !== mostrarAtivos) return false;

    const termo = busca.toLowerCase();
    const nome = (f.tipo_pessoa === 'PJ' ? f.razao_social : f.nome || '').toLowerCase();
    const doc = (f.cnpj || f.cpf || '').toLowerCase();
    const cidade = (f.cidade || '').toLowerCase();
    return nome.includes(termo) || doc.includes(termo) || cidade.includes(termo);
  });

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";
  const abaCls = (ativa) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
      ativa ? "bg-white text-hidrotec-3 shadow-sm" : "text-slate-500 hover:text-hidrotec-3"
    }`;

  return (
    <div className="max-w-6xl w-full mx-auto font-body pb-12">
      {aviso && (
        <div role="alert" className={`flex items-start gap-3 mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          aviso.tipo === "sucesso" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {aviso.tipo === "sucesso" ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <p className="flex-1 whitespace-pre-line">{aviso.texto}</p>
          <button type="button" onClick={() => setAviso(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">CADASTROS</p>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <Truck className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Gestão de Fornecedores
          </h1>
          <p className="text-sm text-hidrotec-4">Registe e gira os fornecedores integrados com o código Elevor.</p>
        </div>
        
        <button onClick={() => abrirModal()} className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
          <Plus size={18} /> Novo Fornecedor
        </button>
      </header>

      {/* Abas e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button type="button" onClick={() => setMostrarAtivos(true)} className={abaCls(mostrarAtivos)}>
            <Building size={16} /> Ativos ({totalAtivos})
          </button>
          <button type="button" onClick={() => setMostrarAtivos(false)} className={abaCls(!mostrarAtivos)}>
            <UserMinus size={16} /> Inativos ({totalInativos})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, documento ou cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 bg-white"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">A carregar fornecedores...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" /> {erro}
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <Truck className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium">Nenhum fornecedor {mostrarAtivos ? 'ativo' : 'inativo'} encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold">Tipo / Nome</th>
                  <th className="px-6 py-4 font-semibold">Documento</th>
                  <th className="px-6 py-4 font-semibold">Cód. Elevor</th>
                  <th className="px-6 py-4 font-semibold">Localidade</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fornecedoresFiltrados.map((forn) => {
                  const ocupado = processandoId === forn.id;
                  const nomeExibicao = forn.tipo_pessoa === 'PJ' ? forn.razao_social : forn.nome;
                  const docExibicao = forn.tipo_pessoa === 'PJ' ? (forn.cnpj ? maskCNPJ(String(forn.cnpj)) : '-') : (forn.cpf ? maskCPF(String(forn.cpf)) : '-');

                  return (
                    <tr key={forn.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-hidrotec-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${forn.tipo_pessoa === 'PJ' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {forn.tipo_pessoa || 'PJ'}
                          </span>
                          {nomeExibicao || 'Não informado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-hidrotec-4">{docExibicao}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-hidrotec-1">
                        {forn.codigo_elevor ? `#${forn.codigo_elevor}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-hidrotec-4">
                        {forn.cidade ? `${forn.cidade} / ${forn.estado || ''}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-hidrotec-4">
                        <p className="text-hidrotec-3">{forn.email || '-'}</p>
                        <span>{forn.telefone || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button onClick={() => abrirModal(forn)} disabled={ocupado} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {mostrarAtivos ? (
                          <button onClick={() => removerFornecedor(forn)} disabled={ocupado} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Inativar">
                            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button onClick={() => reativarFornecedor(forn)} disabled={ocupado} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Ativar">
                            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">{fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={fecharModal} className="text-slate-400 hover:text-hidrotec-3"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={salvarFornecedor} className="p-6">
              <div className="flex items-center gap-4 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                <button type="button" onClick={() => setFormData({ ...formData, tipo_pessoa: 'PJ' })} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo_pessoa === 'PJ' ? 'bg-white text-hidrotec-3 shadow-sm' : 'text-slate-500'}`}>
                  <Building size={16} /> Pessoa Jurídica (PJ)
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, tipo_pessoa: 'PF' })} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo_pessoa === 'PF' ? 'bg-white text-hidrotec-3 shadow-sm' : 'text-slate-500'}`}>
                  <User size={16} /> Pessoa Física (PF)
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.tipo_pessoa === 'PJ' ? (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Razão Social *</label>
                        <input type="text" name="razao_social" value={formData.razao_social} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>CNPJ</label>
                        <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className={inputCls} placeholder="00.000.000/0000-00" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Nome Completo *</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div>
                        <label className={labelCls}>CPF</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className={inputCls} placeholder="000.000.000-00" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className={labelCls}>Código Elevor</label>
                    <input type="number" name="codigo_elevor" value={formData.codigo_elevor} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone (máx. 11 dígitos)</label>
                    <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} maxLength="11" className={inputCls} placeholder="51999998888" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>
                      CEP {buscandoCep && <span className="text-hidrotec-1 text-[10px] ml-1">(Buscando...)</span>}
                    </label>
                    <input type="text" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} className={inputCls} placeholder="90000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Endereço (Rua/Av)</label>
                    <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Número</label>
                    <input type="text" name="numero" value={formData.numero} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Bairro</label>
                    <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Complemento</label>
                    <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cidade</label>
                    <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Estado (UF)</label>
                    <input type="text" name="estado" value={formData.estado} onChange={handleChange} maxLength="2" className={`${inputCls} uppercase`} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onClick={fecharModal} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600">Cancelar</button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 text-white flex items-center gap-2">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}