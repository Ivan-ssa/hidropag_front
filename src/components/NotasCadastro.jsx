import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NotasCadastro() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  
  const [nota, setNota] = useState({
    numero_nf: '',
    fornecedor: '',
    data_vencimento: '',
    valor_total: '',
    quant_parcelas: 1,
    status: 0, // 0 = A Decidir, 1 = Aprovada, 2 = Reprovada
    obraId: ''
  });

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('tokenHidropag')}` }
  };

  // Busca as obras para preencher o <select> (Rota ajustada para minúsculo)
  useEffect(() => {
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => console.error("Erro ao buscar obras:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNota(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nota.obraId || !nota.numero_nf) {
      alert("Preencha o Número da NF e selecione uma Obra!");
      return;
    }

    // Como lidamos com upload de arquivo, empacotamos no FormData
    const formData = new FormData();
    formData.append('numero_nf', Number(nota.numero_nf));
    formData.append('fornecedor', nota.fornecedor);
    formData.append('data_vencimento', nota.data_vencimento);
    formData.append('valor_total', Number(nota.valor_total));
    formData.append('quant_parcelas', Number(nota.quant_parcelas));
    formData.append('status', Number(nota.status));
    formData.append('obra', nota.obraId); // ID da obra vinculada
    
    if (arquivo) {
      formData.append('file', arquivo);
    }

    // Envia os dados para o backend (Rota ajustada para minúsculo)
    axios.post(`${API_URL}/notas`, formData, config)
      .then(() => {
        alert("Nota cadastrada com sucesso!");
        navigate('/notas'); // Redireciona de volta para a listagem ampla
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar nota:", erro);
        if (erro.response && erro.response.data && erro.response.data.message) {
          alert("Erro do servidor: " + JSON.stringify(erro.response.data.message));
        } else {
          alert("Erro ao cadastrar a nota. Verifique se todos os campos estão corretos.");
        }
      });
  };

  // Classes limpas para o formulário
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

            <div>
              <label className={labelCls}>Número da NF: *</label>
              <input type="number" name="numero_nf" value={nota.numero_nf} onChange={handleChange} className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Fornecedor:</label>
              <input type="text" name="fornecedor" value={nota.fornecedor} onChange={handleChange} className={inputCls} placeholder="Ex: Distribuidora Hidráulica" />
            </div>

            <div>
              <label className={labelCls}>Data de Vencimento:</label>
              <input type="date" name="data_vencimento" value={nota.data_vencimento} onChange={handleChange} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Valor Total (R$):</label>
              <input type="number" step="0.01" name="valor_total" value={nota.valor_total} onChange={handleChange} className={inputCls} placeholder="0.00" />
            </div>

            <div>
              <label className={labelCls}>Qtd. de Parcelas:</label>
              <input type="number" name="quant_parcelas" value={nota.quant_parcelas} onChange={handleChange} className={inputCls} min="1" />
            </div>

            <div>
              <label className={labelCls}>Vincular à Obra: *</label>
              <select name="obraId" value={nota.obraId} onChange={handleChange} className={`${inputCls} bg-white`} required>
                <option value="">-- Selecione uma Obra --</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Arquivo da Nota (PDF/Imagem):</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-flow-100 file:text-flow-600 hover:file:bg-flow-100/70"
              />
            </div>

          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-success-500 hover:bg-green-700 text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Nota
            </button>
            <button
              type="button"
              onClick={() => navigate('/notas')}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NotasCadastro;
