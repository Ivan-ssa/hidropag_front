import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Check, X, FileText, Search, RotateCcw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AprovacoesPendenteList() {
  const [notas, setNotas] = useState([]);
  const [notaVisualizando, setNotaVisualizando] = useState(null);
  const [observacao, setObservacao] = useState("");
  const [busca, setBusca] = useState("");

  const usuarioId = localStorage.getItem("usuarioId");
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` } };

  const carregarPendentes = async () => {
    try {
      const res = await axios.get(`${API_URL}/notas`, config);
      // Filtra apenas as pendentes (status 0)
      setNotas(res.data.filter(n => n.status === 0));
    } catch (err) {
      console.error("Erro ao buscar pendentes:", err);
    }
  };

  useEffect(() => { carregarPendentes(); }, []);

  const processarParecer = async (decisao) => {
    try {
      // O payload agora segue exatamente o formato que o seu DTO exige
      const payloadAprovacao = {
        decisao: Number(decisao),
        observacao: observacao,
        nota: notaVisualizando.id,      // Deve ser apenas a string UUID
        usuario: Number(usuarioId)     // Deve ser apenas o número inteiro
      };

      console.log("Enviando para o banco:", payloadAprovacao);

      // 1. POST na rota de aprovações
      await axios.post(`${API_URL}/aprovacoes`, payloadAprovacao, config);
      
      // 2. PUT na nota para atualizar o status
      await axios.put(`${API_URL}/notas/${notaVisualizando.id}`, { 
        status: Number(decisao) 
      }, config);
      
      alert("Parecer registrado com sucesso!");
      setNotaVisualizando(null);
      setObservacao("");
      carregarPendentes();
    } catch (err) {
      console.error("Erro no POST:", err.response?.data);
      alert("Erro ao gravar aprovação: " + JSON.stringify(err.response?.data?.message || err.message));
    }
  };

  const notasFiltradas = notas.filter(n => 
    n.numero_nf?.toString().includes(busca) || 
    n.fornecedor?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <Clock className="w-6 h-6 text-amber-500" /> Aprovação de Notas (Pendentes)
      </h2>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            className="text-sm outline-none flex-1"
            placeholder="Buscar nota pendente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">NF</th>
              <th className="px-4 py-3 text-left">Fornecedor</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            {notasFiltradas.map(n => (
              <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-800">{n.numero_nf}</td>
                <td className="px-4 py-3 text-slate-600">{n.fornecedor}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">R$ {Number(n.valor_total).toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => setNotaVisualizando(n)}
                    className="px-3 py-1 bg-flow-500 text-white rounded-md text-xs font-bold hover:bg-flow-600"
                  >
                    Analisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Análise */}
      {notaVisualizando && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-[1100] p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-lg">NF {notaVisualizando.numero_nf} - {notaVisualizando.fornecedor}</h3>
              <button onClick={() => setNotaVisualizando(null)} className="text-slate-500 hover:text-black font-bold">FECHAR</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-2/3 bg-slate-100">
                <iframe src={`${notaVisualizando.link_pdf}#toolbar=0`} className="w-full h-full" />
              </div>
              <div className="w-1/3 p-6 flex flex-col gap-4 bg-slate-50">
                <label className="text-xs font-bold uppercase text-slate-500">Parecer:</label>
                <textarea 
                  className="w-full p-3 border rounded-lg text-sm h-32"
                  placeholder="Escreva sua observação aqui..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => processarParecer(2)} className="flex-1 bg-danger-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Reprovar
                  </button>
                  <button onClick={() => processarParecer(1)} className="flex-1 bg-success-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Aprovar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AprovacoesPendenteList;