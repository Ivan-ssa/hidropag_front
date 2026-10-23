import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, FileText, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NotasCadastro() {
  const navigate = useNavigate();
  
  const [obras, setObras] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  
  const [nota, setNota] = useState({
    numero_nf: '',
    fornecedor: '',
    data_vencimento: '',
    valor_total: '',
    quant_parcelas: 1,
    status: 0,
    obraId: ''
  });

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('tokenHidropag')}` }
  };

  useEffect(() => {
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => {
        console.error("Erro ao buscar obras:", err);
        setErro("Não foi possível carregar a lista de obras.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNota(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!nota.obraId || !nota.numero_nf) {
      setErro("Preencha o Número da NF e selecione uma Obra!");
      return;
    }

    try {
      const payload = {
        numero_nf: String(nota.numero_nf),
        fornecedor: nota.fornecedor,
        data_vencimento: nota.data_vencimento || null,
        valor_total: Number(nota.valor_total),
        quant_parcelas: Number(nota.quant_parcelas),
        status: Number(nota.status),
        obraId: nota.obraId
      };

      const resNota = await axios.post(`${API_URL}/notas-fiscais`, payload, config);
      const notaCriadaId = resNota.data.id;

      if (arquivo && notaCriadaId) {
        const fileData = new FormData();
        fileData.append("file", arquivo);
        
        await axios.patch(`${API_URL}/notas-fiscais/${notaCriadaId}/arquivos`, fileData, {
          headers: { Authorization: config.headers.Authorization }
        });
      }

      setSucesso("Nota fiscal cadastrada com sucesso! A redirecionar...");
      
      setTimeout(() => {
        navigate('/notas');
      }, 1500);

    } catch (erro) {
      console.error("Erro ao cadastrar nota:", erro);
      if (erro.response && erro.response.data && erro.response.data.message) {
        setErro("Erro do servidor: " + JSON.stringify(erro.response.data.message));
      } else {
        setErro("Erro ao cadastrar a nota. Verifique se todos os campos estão corretos.");
      }
    }
  };

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl w-full mx-auto font-body pb-12">
      
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            to="/notas" 
            className="inline-flex items-center gap-2 text-sm font-medium text-hidrotec-4 hover:text-hidrotec-1 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Voltar para listagem
          </Link>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <FileText className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Lançar Nova Nota
          </h1>
          <p className="text-sm text-hidrotec-4">
            Registe os dados da nota fiscal e anexe o comprovativo.
          </p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          
          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-600">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{sucesso}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className={labelCls}>Número da NF: *</label>
                <input type="text" name="numero_nf" value={nota.numero_nf} onChange={handleChange} className={inputCls} required placeholder="Ex: 123456" />
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
                    <option key={obra.id} value={obra.id}>{obra.nome_obra || obra.nome || 'Obra sem nome'}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed mt-4">
              <label className={labelCls}>Arquivo da Nota (PDF):</label>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-10 h-10 rounded-full bg-hidrotec-1/10 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-hidrotec-1" />
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-extra file:text-hidrotec-1 hover:file:bg-hidrotec-2 hover:file:text-white file:transition-colors cursor-pointer"
                />
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/notas" className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-hidrotec-3 transition-colors">
              Cancelar
            </Link>
            <button type="submit" className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm">
              <Save size={18} />
              Salvar Nota
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}