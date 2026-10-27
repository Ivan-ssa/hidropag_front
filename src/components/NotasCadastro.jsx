// =====================================================================
// NotasCadastro.jsx
// Tela para lançar uma nova Nota Fiscal.
//
// O backend (NestJS) espera estes campos no POST /notas:
//   numero_nf       (número, obrigatório)
//   data_vencimento (AAAA-MM-DD, obrigatório)
//   valor_total     (número maior que zero, obrigatório)
//   quant_parcelas  (número, mínimo 1, obrigatório)
//   obra            (UUID da obra, obrigatório)
//   fornecedorId    (UUID do fornecedor, opcional)
//   file            (PDF, opcional)  <- vai junto, no mesmo envio
// =====================================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, FileText, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

// URL base do backend (vem do arquivo .env; se não existir, usa localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NotasCadastro() {
  const navigate = useNavigate();

  // -------------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------------
  const [obras, setObras] = useState([]);               // lista de obras para o select
  const [fornecedores, setFornecedores] = useState([]); // lista de fornecedores para o select
  const [arquivo, setArquivo] = useState(null);         // PDF escolhido (opcional)
  const [erro, setErro] = useState(null);               // mensagem de erro
  const [sucesso, setSucesso] = useState(null);         // mensagem de sucesso
  const [enviando, setEnviando] = useState(false);      // evita clicar duas vezes em "Salvar"

  // Campos do formulário.
  // Atenção aos nomes: "obra" e "fornecedorId" são exatamente os que o backend espera.
  const [nota, setNota] = useState({
    numero_nf: '',
    data_vencimento: '',
    valor_total: '',
    quant_parcelas: 1,
    obra: '',
    fornecedorId: '',
  });

  // Token enviado em toda requisição para provar quem é o usuário
  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('tokenHidropag')}` }
  };

  // -------------------------------------------------------------------
  // CARREGAR OBRAS E FORNECEDORES (roda uma vez, quando a tela abre)
  // -------------------------------------------------------------------
  useEffect(() => {
    // Obras: obrigatórias, então mostramos erro se falhar
    axios.get(`${API_URL}/obras`, config)
      .then(res => setObras(res.data))
      .catch(err => {
        console.error('Erro ao buscar obras:', err);
        setErro('Não foi possível carregar a lista de obras.');
      });

    // Fornecedores: opcionais, então se falhar o formulário continua funcionando
    axios.get(`${API_URL}/fornecedores`, config)
      .then(res => {
        const dados = res.data;
        setFornecedores(Array.isArray(dados) ? dados : (dados.data || []));
      })
      .catch(err => console.error('Erro ao buscar fornecedores:', err));
  }, []);

  // Devolve o nome do fornecedor para mostrar no select.
  // Tenta os nomes de campo mais comuns; se o seu for outro, ajuste aqui.
  const nomeFornecedor = (f) => {
    if (!f) return '';
    const nome = f.razao_social || f.nome_fantasia || f.nome;
    if (typeof nome === 'string') return nome;
    // Último recurso: o primeiro campo de texto do objeto
    const primeiroTexto = Object.values(f).find(v => typeof v === 'string' && v.trim() !== '');
    return primeiroTexto || 'Fornecedor sem nome';
  };

  // -------------------------------------------------------------------
  // MANIPULADORES DO FORMULÁRIO
  // -------------------------------------------------------------------

  // Atualiza o campo que o usuário digitou ou selecionou
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNota(prev => ({ ...prev, [name]: value }));
  };

  // Guarda o PDF escolhido
  const handleFileChange = (e) => {
    setArquivo(e.target.files[0] || null);
  };

  // -------------------------------------------------------------------
  // ENVIAR (botão "Salvar Nota")
  // -------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // evita recarregar a página
    setErro(null);
    setSucesso(null);

    // Validações rápidas, as mesmas que o backend faz
    if (!nota.obra || !nota.numero_nf) {
      setErro('Preencha o Número da NF e selecione uma Obra!');
      return;
    }
    if (!nota.data_vencimento) {
      setErro('Informe a data de vencimento.');
      return;
    }
    if (!nota.valor_total || Number(nota.valor_total) <= 0) {
      setErro('O valor total precisa ser maior que zero.');
      return;
    }

    try {
      setEnviando(true);

      // O backend recebe tudo num só envio (multipart/form-data), com o PDF junto.
      // Por isso usamos FormData em vez de um objeto JSON.
      const formData = new FormData();
      formData.append('numero_nf', nota.numero_nf);
      formData.append('data_vencimento', nota.data_vencimento);
      formData.append('valor_total', nota.valor_total);
      formData.append('quant_parcelas', nota.quant_parcelas);
      formData.append('obra', nota.obra); // UUID da obra

      // Só envia o fornecedor se foi escolhido (texto vazio seria recusado pelo backend)
      if (nota.fornecedorId) {
        formData.append('fornecedorId', nota.fornecedorId);
      }

      // O nome do campo do arquivo precisa ser exatamente "file"
      if (arquivo) {
        formData.append('file', arquivo);
      }

      // Não definimos o Content-Type: o axios coloca o correto sozinho ao ver um FormData.
      await axios.post(`${API_URL}/notas`, formData, config);

      setSucesso('Nota fiscal cadastrada com sucesso! A redirecionar...');

      // Espera um instante para a pessoa ver a mensagem e volta para a lista
      setTimeout(() => {
        navigate('/notas');
      }, 1500);

    } catch (error) {
      console.error('Erro ao cadastrar nota:', error);
      const msg = error.response?.data?.message;
      if (msg) {
        // O backend pode mandar uma lista de mensagens; juntamos numa só
        setErro('Erro do servidor: ' + (Array.isArray(msg) ? msg.join(' | ') : msg));
      } else {
        setErro('Erro ao cadastrar a nota. Verifique se o servidor está no ar.');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Classes de estilo reaproveitadas nos campos
  const inputCls = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3';
  const labelCls = 'block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2';

  // -------------------------------------------------------------------
  // TELA
  // -------------------------------------------------------------------
  return (
    <div className="max-w-4xl w-full mx-auto font-body pb-12">

      {/* ---------- Cabeçalho ---------- */}
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

      {/* ---------- Formulário ---------- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">

          {/* Mensagem de erro */}
          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{erro}</p>
            </div>
          )}

          {/* Mensagem de sucesso */}
          {sucesso && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-600">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{sucesso}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Número da NF (o backend exige que seja um número) */}
              <div>
                <label className={labelCls}>Número da NF: *</label>
                <input type="number" name="numero_nf" value={nota.numero_nf} onChange={handleChange} className={inputCls} required min="1" placeholder="Ex: 123456" />
              </div>

              {/* Fornecedor: agora é um select com os fornecedores cadastrados */}
              <div>
                <label className={labelCls}>Fornecedor:</label>
                <select name="fornecedorId" value={nota.fornecedorId} onChange={handleChange} className={`${inputCls} bg-white`}>
                  <option value="">-- Sem fornecedor --</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{nomeFornecedor(f)}</option>
                  ))}
                </select>
              </div>

              {/* Data de vencimento (obrigatória no backend) */}
              <div>
                <label className={labelCls}>Data de Vencimento: *</label>
                <input type="date" name="data_vencimento" value={nota.data_vencimento} onChange={handleChange} className={inputCls} required />
              </div>

              {/* Valor total (precisa ser maior que zero) */}
              <div>
                <label className={labelCls}>Valor Total (R$): *</label>
                <input type="number" step="0.01" min="0.01" name="valor_total" value={nota.valor_total} onChange={handleChange} className={inputCls} required placeholder="0.00" />
              </div>

              {/* Quantidade de parcelas (mínimo 1) */}
              <div>
                <label className={labelCls}>Qtd. de Parcelas: *</label>
                <input type="number" name="quant_parcelas" value={nota.quant_parcelas} onChange={handleChange} className={inputCls} min="1" required />
              </div>

              {/* Obra vinculada (o campo se chama "obra" no backend) */}
              <div>
                <label className={labelCls}>Vincular à Obra: *</label>
                <select name="obra" value={nota.obra} onChange={handleChange} className={`${inputCls} bg-white`} required>
                  <option value="">-- Selecione uma Obra --</option>
                  {obras.map(obra => (
                    <option key={obra.id} value={obra.id}>{obra.nome_obra || obra.nome || 'Obra sem nome'}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Upload do PDF (opcional) */}
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

          {/* Botões */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/notas" className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-hidrotec-3 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={enviando}
              className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              <Save size={18} />
              {enviando ? 'Salvando...' : 'Salvar Nota'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
