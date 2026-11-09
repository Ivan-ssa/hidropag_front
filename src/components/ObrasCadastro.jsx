import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Building2, AlertCircle, Loader2 } from 'lucide-react';

export default function ObrasCadastro() {
  const navigate = useNavigate();
  const { id } = useParams(); // Se houver ID na rota, estamos editando
  const editando = Boolean(id);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [formData, setFormData] = useState({
    nome_obra: '',
    cno: '',
    endereco_localizacao: '',
    valor_previsto: '',
    status: 1,
    ativo: true,
    filialId: '',
    clienteId: ''
  });
  
  const [filiais, setFiliais] = useState([]);
  const [clientes, setClientes] = useState([]);
  
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
        endereco_localizacao: obra.endereco_localizacao || '',
        valor_previsto: obra.valor_previsto !== undefined ? obra.valor_previsto : '',
        status: obra.status !== undefined ? Number(obra.status) : 1,
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

    if (name === 'cno') {
      const apenasNumeros = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({
        ...prev,
        cno: apenasNumeros
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvarObra = async (e) => {
    e.preventDefault();

    if (!formData.nome_obra || !formData.filialId) {
      setErro("Preencha todos os campos obrigatórios (Nome da Obra e Filial).");
      return;
    }

    if (formData.cno && formData.cno.length !== 12) {
      setErro("O CNO deve conter exatamente 12 números (atualmente tem " + formData.cno.length + ").");
      return;
    }

    setCarregando(true);
    setErro(null);

    const payload = {
      nome_obra: formData.nome_obra.trim(),
      endereco_localizacao: formData.endereco_localizacao?.trim() || null,
      valor_previsto: formData.valor_previsto !== '' ? Number(formData.valor_previsto) : 0,
      status: Number(formData.status),
      ativo: Boolean(formData.ativo),
      filialId: Number(formData.filialId) || formData.filialId,
      clienteId: formData.clienteId ? (Number(formData.clienteId) || formData.clienteId) : null,
      cno: formData.cno ? formData.cno : null
    };

    try {
      if (editando) {
        await axios.patch(`${API_URL}/obras/${id}`, payload, config);
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
            Preencha todos os dados técnicos e financeiros do empreendimento.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Nome da Obra *
                </label>
                <input
                  type="text"
                  name="nome_obra"
                  required
                  value={formData.nome_obra}
                  onChange={handleChange}
                  placeholder="Ex: Hospital Moinhos de Vento"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  CNO (12 números) {formData.cno && `(${formData.cno.length}/12)`}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="cno"
                  maxLength={12}
                  value={formData.cno}
                  onChange={handleChange}
                  placeholder="Ex: 000000000000"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                Endereço e Localização
              </label>
              <input
                type="text"
                name="endereco_localizacao"
                value={formData.endereco_localizacao}
                onChange={handleChange}
                placeholder="Rua, Número, Bairro - Cidade/UF"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Cliente Proprietário
                </label>
                <select
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white"
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
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Filial Responsável *
                </label>
                <select
                  name="filialId"
                  required
                  value={formData.filialId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Valor Previsto (R$)
                </label>
                <input
                  type="number"
                  name="valor_previsto"
                  step="0.01"
                  min="0"
                  value={formData.valor_previsto}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2">
                  Status da Obra
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white"
                >
                  <option value={1}>1 - Em Andamento</option>
                  <option value={2}>2 - Pausada</option>
                  <option value={3}>3 - Finalizada</option>
                </select>
              </div>
            </div>

            <div className="flex items-center mt-4 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    className="w-5 h-5 border-2 border-slate-300 rounded text-hidrotec-2 focus:ring-hidrotec-2 focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                </div>
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