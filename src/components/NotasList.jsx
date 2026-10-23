
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  Plus, Pencil, Trash2, X, Check, Filter, RotateCcw, 
  Download, Paperclip, Search, AlertTriangle, List, 
  Clock, CheckCircle, XCircle, Receipt 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NotasList() {
  const [notas, setNotas] = useState([]);
  const [obras, setObras] = useState([]);
  const [notaEditando, setNotaEditando] = useState(null);
  const [arquivoEdicao, setArquivoEdicao] = useState(null);
  const perfil = localStorage.getItem("usuarioPerfil");
  
  const [notaVisualizando, setNotaVisualizando] = useState(null); 

  const [filtroStatus, setFiltroStatus] = useState(""); 
  const [filtroVencimento, setFiltroVencimento] = useState("");
  const [busca, setBusca] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  const nomeCompleto = localStorage.getItem('usuarioNome') || 'Utilizador';
  const primeiroNome = nomeCompleto.split(' ')[0];
  const horaAtual = new Date().getHours();
  const saudacao = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  const carregarDados = async () => {
    try {
      // CORREÇÃO 1: Rota ajustada para /notas-fiscais
      const resNotas = await axios.get(`${API_URL}/notas-fiscais`, config);
      setNotas(resNotas.data);
    } catch (err) {
      console.error("Erro ao buscar notas:", err);
    }
      
    try {
      const resObras = await axios.get(`${API_URL}/obras`, config);
      setObras(resObras.data);
    } catch (err) {
      console.error("Erro ao buscar obras:", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const notasFiltradas = notas.filter(nota => {
    const bateStatus = filtroStatus === "" || nota.status?.toString() === filtroStatus;
    const bateVencimento = filtroVencimento === "" || nota.data_vencimento === filtroVencimento;
    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === "" ||
      nota.numero_nf?.toString().includes(termo) ||
      nota.fornecedor?.toLowerCase().includes(termo);
    return bateStatus && bateVencimento && bateBusca;
  });

  function estaVencida(nota) {
    if (nota.status !== 0 || !nota.data_vencimento) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(nota.data_vencimento) < hoje;
  }

  const mudarStatus = async (id, novoStatus) => {
    try {
      // CORREÇÃO 2: Rota /notas-fiscais e método PATCH
      await axios.patch(`${API_URL}/notas-fiscais/${id}`, { status: novoStatus }, config);
      alert(novoStatus === 1 ? "Nota Aprovada com sucesso!" : "Nota Reprovada com sucesso!");
      setNotaVisualizando(null); 
      carregarDados(); 
    } catch (erro) {
      console.error("Erro na aprovação:", erro);
      alert("Erro ao mudar o status da nota.");
    }
  };

  const excluirNota = async (id) => {
    if (window.confirm("Deseja realmente excluir permanentemente esta nota?")) {
      try {
        // CORREÇÃO 3: Rota /notas-fiscais
        await axios.delete(`${API_URL}/notas-fiscais/${id}`, config);
        alert("Excluída com sucesso!");
        carregarDados();
      } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir a nota.");
      }
    }
  };

  const abrirModalEdicao = (nota) => {
    setNotaEditando({
      ...nota,
      obraId: nota.obra ? nota.obra.id : ""
    });
    setArquivoEdicao(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setNotaEditando(prev => ({ ...prev, [name]: value }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        numero_nf: Number(notaEditando.numero_nf),
        fornecedor: notaEditando.fornecedor || "",
        data_vencimento: notaEditando.data_vencimento || null,
        valor_total: Number(notaEditando.valor_total),
        quant_parcelas: Number(notaEditando.quant_parcelas),
        status: Number(notaEditando.status),
        obraId: notaEditando.obraId || null 
      };

      // CORREÇÃO 4: Rota /notas-fiscais e método PATCH
      await axios.patch(`${API_URL}/notas-fiscais/${notaEditando.id}`, payload, config);

      if (arquivoEdicao) {
        const formData = new FormData();
        formData.append("file", arquivoEdicao); 
        
        // CORREÇÃO 5: Rota /notas-fiscais/:id/arquivos e método PATCH
        await axios.patch(`${API_URL}/notas-fiscais/${notaEditando.id}/arquivos`, formData, {
          headers: { Authorization: config.headers.Authorization }
        });
      }

      alert("Nota atualizada com sucesso!");
      setNotaEditando(null);
      setArquivoEdicao(null);
      carregarDados();
    } catch (erro) {
      console.error("Erro detalhado:", erro.response?.data || erro);
      alert("Erro ao atualizar: " + (erro.response?.data?.message || "Verifique os dados e tente novamente."));
    }
  };

  const renderStatus = (status) => {
    if (status === 1) return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-green-600 bg-green-50 border border-green-100">APROVADA</span>;
    if (status === 2) return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-red-600 bg-red-50 border border-red-100">REPROVADA</span>;
    return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-orange-600 bg-orange-50 border border-orange-100">A DECIDIR</span>;
  };

  const inputCls = "w-full px-4 py-2.5 mt-1.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-hidrotec-2 focus:border-hidrotec-2 transition-all text-hidrotec-3";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider";

  const pendentes = notas.filter(n => n.status === 0).length; 
  const aprovadas = notas.filter(n => n.status === 1).length;

  return (
    <div className="max-w-7xl w-full mx-auto font-body pb-12">
      
      <header className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2">
          Olá, {primeiroNome}! {saudacao}.
        </h1>
        <p className="text-sm text-hidrotec-4">
          Aqui está o resumo das suas notas fiscais e aprovações pendentes.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">A Decidir</p>
            <h3 className="text-2xl font-display font-bold text-hidrotec-3">{pendentes}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Aprovadas</p>
            <h3 className="text-2xl font-display font-bold text-hidrotec-3">{aprovadas}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-extra flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-hidrotec-1" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Lançado</p>
            <h3 className="text-2xl font-display font-bold text-hidrotec-3">{notas.length}</h3>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto">
          <button onClick={() => setFiltroStatus("")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${filtroStatus === "" ? "bg-hidrotec-3 text-white shadow" : "text-slate-500 hover:text-hidrotec-3 hover:bg-slate-50"}`}>
            <List className="w-4 h-4" /> Todas
          </button>
          <button onClick={() => setFiltroStatus("0")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${filtroStatus === "0" ? "bg-orange-500 text-white shadow" : "text-slate-500 hover:text-orange-600 hover:bg-orange-50"}`}>
            <Clock className="w-4 h-4" /> A Decidir
          </button>
          <button onClick={() => setFiltroStatus("1")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${filtroStatus === "1" ? "bg-green-500 text-white shadow" : "text-slate-500 hover:text-green-600 hover:bg-green-50"}`}>
            <CheckCircle className="w-4 h-4" /> Aprovadas
          </button>
          <button onClick={() => setFiltroStatus("2")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${filtroStatus === "2" ? "bg-red-500 text-white shadow" : "text-slate-500 hover:text-red-600 hover:bg-red-50"}`}>
            <XCircle className="w-4 h-4" /> Reprovadas
          </button>
        </div>
        <Link to="/notas/nova" className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm w-full lg:w-auto">
          <Plus size={18} /> Nova Nota
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex gap-4 items-center flex-wrap shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-hidrotec-3 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-hidrotec-2" /> Filtros:
        </span>
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar NF ou fornecedor..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-600">Vencimento:</label>
          <input type="date" value={filtroVencimento} onChange={e => setFiltroVencimento(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 text-slate-600" />
        </div>
        <button onClick={() => { setFiltroStatus(""); setFiltroVencimento(""); setBusca(""); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors ml-auto">
          <RotateCcw className="w-4 h-4" /> Limpar Filtros
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-slate-50/50">
              <th className="px-6 py-4 font-semibold">NF</th>
              <th className="px-6 py-4 font-semibold">Fornecedor</th>
              <th className="px-6 py-4 font-semibold">Obra</th>
              <th className="px-6 py-4 font-semibold">Vencimento</th>
              <th className="px-6 py-4 font-semibold">Valor (R$)</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-center">PDF / Avaliar</th>
              <th className="px-6 py-4 font-semibold text-center">Gerenciar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {notasFiltradas.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 font-medium">Nenhuma nota encontrada.</td></tr>
            ) : (
              notasFiltradas.map((nota) => (
                <tr key={nota.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-hidrotec-3">{nota.numero_nf}</td>
                  <td className="px-6 py-4 text-sm font-medium text-hidrotec-3">{nota.fornecedor || "-"}</td>
                  <td className="px-6 py-4 text-xs text-hidrotec-4">{nota.obra?.nome_obra || "Sem obra"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={estaVencida(nota) ? "inline-flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md" : "text-hidrotec-4"}>
                      {estaVencida(nota) && <AlertTriangle className="w-4 h-4" title="Nota Vencida!" />}
                      {nota.data_vencimento ? new Date(nota.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-hidrotec-3">
                    {nota.valor_total ? `R$ ${Number(nota.valor_total).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">{renderStatus(nota.status)}</td>
                  <td className="px-6 py-4 text-center">
                    {nota.tem_anexo && nota.link_pdf ? (
                      <button onClick={() => setNotaVisualizando(nota)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${nota.status === 0 ? "bg-hidrotec-1 hover:bg-hidrotec-2 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>
                        <Download className="w-4 h-4" /> {nota.status === 0 ? "Analisar PDF" : "Ver PDF"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium"><Paperclip className="w-4 h-4" /> Sem Anexo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {(perfil === 'lancador' || perfil === 'gestor' || perfil === 'root') && (
                      <button onClick={() => abrirModalEdicao(nota)} className="inline-flex items-center gap-1 mr-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                    {(perfil === 'gestor' || perfil === 'root') && (
                      <button onClick={() => excluirNota(nota.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {notaVisualizando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 sm:p-8">
          <div className="bg-white rounded-2xl w-full max-w-7xl h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <h3 className="font-display font-bold text-xl text-hidrotec-3">Análise de Nota Fiscal</h3>
              <button onClick={() => setNotaVisualizando(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-hidrotec-3 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-hidrotec-4 border-b border-slate-100 pb-2 mb-2 uppercase tracking-wider">Dados do Lançamento</h4>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fornecedor</span><span className="block text-base font-bold text-hidrotec-3">{notaVisualizando.fornecedor || "Não informado"}</span></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número NF</span><span className="block text-sm font-bold text-hidrotec-3">{notaVisualizando.numero_nf}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Total</span><span className="block text-lg font-bold text-hidrotec-1">{notaVisualizando.valor_total ? `R$ ${Number(notaVisualizando.valor_total).toFixed(2)}` : "-"}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vencimento</span><span className={`block text-sm font-bold ${estaVencida(notaVisualizando) ? "text-red-600" : "text-hidrotec-3"}`}>{notaVisualizando.data_vencimento ? new Date(notaVisualizando.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "-"}{estaVencida(notaVisualizando) && " (Vencida)"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Atual</span><div className="mt-1">{renderStatus(notaVisualizando.status)}</div></div>
                  </div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Obra Vinculada</span><span className="block text-sm font-bold text-hidrotec-3">{notaVisualizando.obra?.nome_obra || "Nenhuma"}</span></div>
                </div>
                {notaVisualizando.status === 0 ? (
                  <div className="bg-white border border-hidrotec-1/20 rounded-xl p-5 shadow-sm mt-auto">
                    <h4 className="text-xs font-bold text-hidrotec-1 uppercase tracking-wider text-center mb-4">Decisão do Gestor</h4>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => mudarStatus(notaVisualizando.id, 1)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-md"><Check className="w-5 h-5" /> APROVAR PAGAMENTO</button>
                      <button onClick={() => mudarStatus(notaVisualizando.id, 2)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold transition-all"><X className="w-5 h-5" /> REPROVAR NOTA</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto p-4 bg-slate-100 rounded-xl text-center text-sm text-slate-500 font-medium">Esta nota já foi avaliada e não requer decisão.</div>
                )}
                <a href={notaVisualizando.link_pdf} target="_blank" rel="noopener noreferrer" className="mt-2 text-center text-sm font-bold text-hidrotec-2 hover:text-hidrotec-1 transition-colors">Abrir PDF no navegador</a>
              </div>
              <div className="w-full lg:w-2/3 h-[50vh] lg:h-full bg-slate-200 flex flex-col relative">
                <iframe src={`${notaVisualizando.link_pdf}#toolbar=0`} title={`Nota ${notaVisualizando.numero_nf}`} className="w-full h-full border-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {notaEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-[1200] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display font-bold text-xl text-hidrotec-3">Editar Nota {notaEditando.numero_nf}</h3>
              <button onClick={() => setNotaEditando(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-hidrotec-3 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={salvarEdicao} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div><label className={labelCls}>Número NF</label><input type="number" name="numero_nf" value={notaEditando.numero_nf} onChange={handleEditChange} className={inputCls} required /></div>
                <div><label className={labelCls}>Fornecedor</label><input type="text" name="fornecedor" value={notaEditando.fornecedor || ''} onChange={handleEditChange} className={inputCls} /></div>
                <div><label className={labelCls}>Valor Total</label><input type="number" step="0.01" name="valor_total" value={notaEditando.valor_total || ''} onChange={handleEditChange} className={inputCls} /></div>
                <div><label className={labelCls}>Vencimento</label><input type="date" name="data_vencimento" value={notaEditando.data_vencimento ? notaEditando.data_vencimento.substring(0, 10) : ''} onChange={handleEditChange} className={inputCls} /></div>
                <div><label className={labelCls}>Parcelas</label><input type="number" name="quant_parcelas" value={notaEditando.quant_parcelas || 1} onChange={handleEditChange} className={inputCls} /></div>
                <div><label className={labelCls}>Status</label><select name="status" value={notaEditando.status} onChange={handleEditChange} className={`${inputCls} bg-white`}><option value="0">A Decidir</option><option value="1">Aprovada</option><option value="2">Reprovada</option></select></div>
                <div className="sm:col-span-2"><label className={labelCls}>Trocar Obra</label><select name="obraId" value={notaEditando.obraId} onChange={handleEditChange} className={`${inputCls} bg-white`}><option value="">-- Sem Obra --</option>{obras.map((o) => (<option key={o.id} value={o.id}>{o.nome_obra}</option>))}</select></div>
                <div className="sm:col-span-2 mt-2"><label className={labelCls}>Atualizar Arquivo PDF (Opcional)</label><input type="file" onChange={e => setArquivoEdicao(e.target.files[0])} className="w-full mt-2 text-sm text-slate-600 file:mr-4 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-extra file:text-hidrotec-1 hover:file:bg-hidrotec-2 hover:file:text-white file:transition-colors cursor-pointer" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setNotaEditando(null)} className="px-6 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default NotasList;