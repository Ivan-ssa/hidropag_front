import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Building2, AlertCircle, Loader2 } from 'lucide-react';

export default function ObrasCadastro() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Estado único para todos os campos baseados na sua entidade NestJS
  const [formData, setFormData] = useState({
    nome_obra: '',
    cno: '',
    endereco_localizacao: '',
    valor_previsto: '',
    orcamento_previsto: '',
    status: 1, // 1 (Em Andamento), 2 (Pausada), 3 (Finalizada)
    ativo: true,
    filialId: '',
    clienteId: ''
  });
  
  const [filiais, setFiliais] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const token = localStorage.getItem("tokenHidropag");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    carregarFiliais();
    carregarClientes();
  }, []);

  const carregarFiliais = async () => {
    try {
      const response = await axios.get(`${API_URL}/filiais`, config);
      setFiliais(response.data.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar a lista de filiais.");
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`, config);
      setClientes(response.data.sort((a, b) => {
        const nomeA = a.razaoSocial || a.nome || '';
        const nomeB = b.razaoSocial || b.nome || '';
        return nomeA.localeCompare(nomeB);
      }));
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar a lista de clientes.");
    }
  };

  // Função genérica para atualizar qualquer campo do formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvarObra = async (e) => {
    e.preventDefault();

    if (!formData.nome_obra || !formData.filialId) {
      setErro("Preencha todos os campos obrigatórios (Nome e Filial).");
      return;
    }

    setCarregando(true);
    setErro(null);

    // Formatação do payload exatamente como a sua API espera
    const payload = {
      ...formData,
      valor_previsto: Number(formData.valor_previsto) || 0,
      orcamento_previsto: Number(formData.orcamento_previsto) || 0,
      status: Number(formData.status),
      clienteId: formData.clienteId || null, // Trata cliente vazio
    };

    try {
      await axios.post(`${API_URL}/obras`, payload, config);
      navigate("/obras");
    } catch (error) {
      console.error("Erro ao cadastrar obra:", error);
      setErro("Erro ao cadastrar obra. Verifique os dados e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

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
            Nova Obra
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
            
            {/* Bloco 1: Identificação */}
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
                  CNO
                </label>
                <input
                  type="text"
                  name="cno"
                  value={formData.cno}
                  onChange={handleChange}
                  placeholder="Ex: 12.345.67890/12"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3"
                />
              </div>
            </div>

            {/* Bloco 2: Endereço */}
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

            {/* Bloco 3: Relacionamentos (Cliente e Filial) */}
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
                      {cliente.razaoSocial || cliente.nome}
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

            {/* Bloco 4: Financeiro e Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Orçamento Previsto (R$)
                </label>
                <input
                  type="number"
                  name="orcamento_previsto"
                  step="0.01"
                  min="0"
                  value={formData.orcamento_previsto}
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

            {/* Checkbox Ativo */}
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
                  Registo Ativo no sistema
                </span>
              </label>
            </div>
            
          </div>

          {/* Botões */}
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