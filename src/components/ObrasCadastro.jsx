// src/pages/ObrasCadastro.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Building2, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const maskCEP = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export default function ObrasCadastro() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = Boolean(id);

  const [formData, setFormData] = useState({
    nome_obra: '',
    cno: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    valor_previsto: '',
    status: 0,
    ativo: true,
    filialId: '',
    clienteId: ''
  });
  
  const [filiais, setFiliais] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erro, setErro] = useState(null);

  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    carregarFiliais();
    carregarClientes();

    if (editando) {
      carregarObraParaEdicao();
    }
  }, [id]);

  const carregarFiliais = async () => {
    try {
      const response = await axios.get(`${API_URL}/filiais`, config);
      const lista = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setFiliais(lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
    } catch (error) {
      console.error("Erro ao carregar filiais:", error);
      setErro("Não foi possível carregar a lista de filiais.");
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`, config);
      let lista = [];
      if (Array.isArray(response.data)) {
        lista = response.data;
      } else if (Array.isArray(response.data?.data)) {
        lista = response.data.data;
      } else if (Array.isArray(response.data?.items)) {
        lista = response.data.items;
      }

      const ordenados = lista.sort((a, b) => {
        const nomeA = a.razao_social || a.razaoSocial || a.nome || '';
        const nomeB = b.razao_social || b.razaoSocial || b.nome || '';
        return nomeA.localeCompare(nomeB);
      });

      setClientes(ordenados);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setErro("Não foi possível carregar a lista de clientes.");
    }
  };

  const carregarObraParaEdicao = async () => {
    try {
      setCarregandoDados(true);
      const response = await axios.get(`${API_URL}/obras/${id}`, config);
      const obra = response.data;

      setFormData({
        nome_obra: obra.nome_obra || obra.nome || '',
        cno: obra.cno || '',
        cep: obra.cep ? maskCEP(obra.cep) : '',
        logradouro: obra.logradouro || obra.endereco_localizacao || '',
        numero: obra.numero || '',
        bairro: obra.bairro || '',
        cidade: obra.cidade || '',
        estado: obra.estado || obra.uf || '',
        valor_previsto: obra.valor_previsto !== undefined ? obra.valor_previsto : '',
        status: obra.status !== undefined ? Number(obra.status) : 0,
        ativo: obra.ativo !== undefined ? obra.ativo : true,
        filialId: obra.filialId || obra.filial?.id || '',
        clienteId: obra.clienteId || obra.cliente?.id || ''
      });
    } catch (error) {
      console.error("Erro ao carregar dados da obra:", error);
      setErro("Não foi possível carregar os dados para edição.");
    } finally {
      setCarregandoDados(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Regra estrita: CNO somente números, máximo 12 dígitos
    if (name === 'cno') {
      const apenasNumeros = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({
        ...prev,
        cno: apenasNumeros
      }));
      return;
    }

    if (name === 'cep') {
      setFormData(prev => ({
        ...prev,
        cep: maskCEP(value)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Busca automática do CEP da Obra via ViaCEP
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
            logradouro: data.logradouro || prev.logradouro,
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

  const salvarObra = async (e) => {
    e.preventDefault();

    if (!formData.nome_obra || !formData.filialId) {
      setErro("Preencha todos os campos obrigatórios (Nome da Obra e Filial).");
      return;
    }

    // Validação de regra de negócio: se preenchido, deve ter obrigatoriamente 12 números
    if (formData.cno && formData.cno.length !== 12) {
      setErro(`O CNO deve conter exatamente 12 números (atualmente possui ${formData.cno.length}).`);
      return;
    }

    setCarregando(true);
    setErro(null);

    // Monta o endereço completo unificado para o campo atual da API (endereco_localizacao)
    const partesEndereco = [];
    if (formData.logradouro) {
      partesEndereco.push(formData.numero ? `${formData.logradouro}, ${formData.numero}` : formData.logradouro);
    }
    if (formData.bairro) partesEndereco.push(formData.bairro);
    if (formData.cidade) {
      partesEndereco.push(formData.estado ? `${formData.cidade}/${formData.estado.toUpperCase()}` : formData.cidade);
    }
    if (formData.cep) partesEndereco.push(`CEP: ${formData.cep}`);

    const enderecoFormatado = partesEndereco.join(' - ');

    const payload = {
      nome_obra: formData.nome_obra.trim(),
      endereco_localizacao: enderecoFormatado || null,
      valor_previsto: formData.valor_previsto !== '' ? Number(formData.valor_previsto) : 0,
      status: Number(formData.status),
      ativo: Boolean(formData.ativo),
      filialId: Number(formData.filialId) || formData.filialId,
      clienteId: formData.clienteId ? (Number(formData.clienteId) || formData.clienteId) : null,
      cno: formData.cno ? formData.cno : null
    };

    try {
      if (editando) {
        await axios.put(`${API_URL}/obras/${id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/obras`, payload, config);
      }
      navigate("/obras");
    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      const detalhes = error.response?.data?.message;
      if (Array.isArray(detalhes)) {
        setErro(detalhes.join(" | "));
      } else if (typeof detalhes === "string") {
        setErro(detalhes);
      } else {
        setErro("Erro ao salvar obra. Verifique os dados e tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";

  if (carregandoDados) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium text-hidrotec-4">Carregando dados da obra...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto font-body pb-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            to="/obras" 
            className="inline-flex items-center gap-2 text-sm font-medium text-hidrotec-4 hover:text-hidrotec-1 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Voltar para lista
          </Link>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <Building2 className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            {editando ? 'Editar Obra' : 'Nova Obra'}
          </h1>
          <p className="text-sm text-hidrotec-4">
            Preencha todos os dados técnicos, endereço e informações financeiras do empreendimento.
          </p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={salvarObra} className="p-8">
          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{erro}</p>
            </div>
          )}

          <div className="space-y-6">
            
            {/* Nome da Obra e CNO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className={labelCls}>Nome da Obra *</label>
                <input
                  type="text"
                  name="nome_obra"
                  required
                  value={formData.nome_obra}
                  onChange={handleChange}
                  placeholder="Ex: Hospital Moinhos de Vento"
                  className={inputCls}
                />
              </div>
              
              <div>
                <label className={labelCls}>
                  CNO (12 números) {formData.cno && `(${formData.cno.length}/12)`}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="cno"
                  maxLength={12}
                  value={formData.cno}
                  onChange={handleChange}
                  placeholder="000000000000"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Seção de Endereço Completo com ViaCEP */}
            <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-4">
              <div className="text-xs font-bold text-hidrotec-1 uppercase tracking-wider mb-2">
                Endereço e Localização da Obra
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>
                    CEP {buscandoCep && <span className="text-hidrotec-1 text-[10px] ml-1">(Buscando...)</span>}
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    onBlur={handleCepBlur}
                    placeholder="90000-000"
                    maxLength={9}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Logradouro (Rua / Av)</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    placeholder="Ex: Rua Ramiro Barcelos"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Número</label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="Ex: 910"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    placeholder="Ex: Floresta"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Ex: Porto Alegre"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Estado (UF)</label>
                  <input
                    type="text"
                    name="estado"
                    maxLength={2}
                    value={formData.estado}
                    onChange={handleChange}
                    placeholder="RS"
                    className={`${inputCls} uppercase`}
                  />
                </div>
              </div>
            </div>

            {/* Vínculo de Cliente e Filial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
              <div>
                <label className={labelCls}>Cliente Proprietário</label>
                <select
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Selecione um cliente (Opcional)...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social || cliente.razaoSocial || cliente.nome || `Cliente #${cliente.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Filial Responsável *</label>
                <select
                  name="filialId"
                  required
                  value={formData.filialId}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Selecione uma filial...</option>
                  {filiais.map((filial) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valor Previsto e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Valor Previsto (R$)</label>
                <input
                  type="number"
                  name="valor_previsto"
                  step="0.01"
                  min="0"
                  value={formData.valor_previsto}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Status da Obra</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value={0}>0 - Nova</option>
                  <option value={1}>1 - Em Andamento</option>
                  <option value={2}>2 - Pausada</option>
                  <option value={3}>3 - Finalizada</option>
                </select>
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center mt-4 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="w-5 h-5 border-2 border-slate-300 rounded text-hidrotec-2 focus:ring-hidrotec-2 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span className="text-sm font-medium text-hidrotec-3 group-hover:text-hidrotec-1 transition-colors">
                  Registro Ativo no sistema
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/obras"
              className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-hidrotec-3 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={carregando}
              className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  A salvar...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Obra
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}