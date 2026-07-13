import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- FUNÇÕES DE MÁSCARA (Apenas para o visual do usuário) ---
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

const maskCEP = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

function FilialForm() {
  const [filial, setFilial] = useState({
    nome: '',
    cnpj: '',
    cidade: '',
    uf: '',
    cep: '',
    logradouro: '',
    numero: ''
  });
  
  const [buscandoCep, setBuscandoCep] = useState(false);
  const navigate = useNavigate();

  // Função única que lida com a digitação e aplica as máscaras
  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'cep') value = maskCEP(value);

    setFilial((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value
    }));
  };

  // --- BUSCA DE CEP AUTOMÁTICA ---
  const handleCepBlur = async () => {
    if (!filial.cep) return;
    
    const cepLimpo = filial.cep.replace(/\D/g, ''); 
    
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (data.erro) {
          alert("CEP não encontrado!");
        } else {
          setFilial(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar ViaCEP:", error);
        alert("Erro ao consultar o CEP.");
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  // --- ENVIO DOS DADOS (POST) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!filial.nome || !filial.cidade) {
      alert("Por favor, preencha o Nome e a Cidade da filial!");
      return;
    }

    // Limpa a formatação, garantindo que envie NULL se estiver vazio para o banco
    let cnpjLimpo = filial.cnpj ? String(filial.cnpj).replace(/\D/g, '') : null;
    if (cnpjLimpo === "") cnpjLimpo = null;

    let cepLimpo = filial.cep ? String(filial.cep).replace(/\D/g, '') : null;
    if (cepLimpo === "") cepLimpo = null;

    // Objeto limpo, respeitando as colunas da Entidade Filiais
    const dadosParaCriar = {
      nome: filial.nome,
      cidade: filial.cidade,
      uf: filial.uf || null,
      cep: cepLimpo,
      logradouro: filial.logradouro || null,
      numero: filial.numero || null,
      cnpj: cnpjLimpo
    };

    const meuToken = localStorage.getItem('tokenHidropag');

    try {
      await axios.post(`${API_URL}/filiais`, dadosParaCriar, {
        headers: { Authorization: `Bearer ${meuToken}` }
      });
      alert("Filial cadastrada com sucesso!");
      navigate('/filiais'); // Redireciona de volta para a lista
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
      if (erro.response && erro.response.status === 401) {
        alert("Erro: Você precisa fazer Login primeiro!");
      } else if (erro.response && erro.response.data) {
        const msg = erro.response.data.message || "Erro interno do servidor.";
        alert("Erro do servidor: " + JSON.stringify(msg));
      } else {
        alert("Ocorreu um erro ao cadastrar a filial.");
      }
    }
  };

  // Classes padrão para reaproveitar nos inputs
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

          {/* NOME E CNPJ */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome da Filial: *</label>
            <input
              type="text"
              name="nome"
              value={filial.nome}
              onChange={handleChange}
              placeholder="Ex: Filial Centro"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>CNPJ: </label>
            <input
              type="text"
              name="cnpj"
              value={filial.cnpj}
              onChange={handleChange}
              placeholder="Ex: 00.000.000/0000-00"
              className={inputCls}
            />
          </div>

          {/* CEP */}
          <div>
            <label className={labelCls}>CEP: {buscandoCep && <span className="text-flow-500 text-[10px] ml-2">(Buscando...)</span>}</label>
            <input
              type="text"
              name="cep"
              value={filial.cep}
              onChange={handleChange}
              onBlur={handleCepBlur}
              placeholder="Ex: 90000-000"
              className={inputCls}
            />
          </div>

          {/* ENDEREÇO */}
          <div>
            <label className={labelCls}>Logradouro (Rua/Av): </label>
            <input
              type="text"
              name="logradouro"
              value={filial.logradouro}
              onChange={handleChange}
              placeholder="Ex: Av. Assis Brasil"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Número: </label>
            <input
              type="text"
              name="numero"
              value={filial.numero}
              onChange={handleChange}
              placeholder="Ex: 1234"
              className={inputCls}
            />
          </div>

          {/* CIDADE E UF */}
          <div>
            <label className={labelCls}>Cidade: *</label>
            <input
              type="text"
              name="cidade"
              value={filial.cidade}
              onChange={handleChange}
              placeholder="Ex: Porto Alegre"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>UF: </label>
            <input
              type="text"
              name="uf"
              value={filial.uf}
              onChange={handleChange}
              placeholder="Ex: RS"
              maxLength="2"
              className={`${inputCls} max-w-[100px] uppercase`}
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-success-500 hover:bg-green-700 text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Filial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FilialForm;