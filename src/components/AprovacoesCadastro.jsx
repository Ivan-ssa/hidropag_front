import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Search, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function HistoricoAprovacoes() {
  const [aprovacoes, setAprovacoes] = useState([]);
  const [busca, setBusca] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("tokenHidropag")}` },
  };

  const carregarHistorico = async () => {
    try {
      const res = await axios.get(`${API_URL}/aprovacoes`, config);
      setAprovacoes(res.data);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const aprovacoesFiltradas = aprovacoes.filter(
    (a) =>
      a.nota?.numero_nf?.toString().includes(busca) ||
      a.usuario?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      a.hash_assinatura?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-slate-800">Histórico de Aprovações</h2>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="text-sm outline-none flex-1"
            placeholder="Buscar por NF, aprovador ou hash de assinatura..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">NF</th>
              <th className="px-4 py-3 text-left">Aprovador</th>
              <th className="px-4 py-3 text-center">Decisão</th>
              <th className="px-4 py-3 text-left">Assinatura / Hash</th>
              <th className="px-4 py-3 text-left">Observação</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {aprovacoesFiltradas.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {a.nota?.numero_nf || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.usuario?.nome || "Sistema"}</td>
                <td className="px-4 py-3 text-center">
                  {a.decisao === 1 ? (
                    <span className="flex items-center justify-center gap-1 text-green-600 font-bold">
                      <CheckCircle className="w-4 h-4" /> APROVADO
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1 text-red-600 font-bold">
                      <XCircle className="w-4 h-4" /> REPROVADO
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {a.hash_assinatura ? (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        {a.carimbo?.codigoAutenticacao || a.id?.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]"
                        title={`SHA-256: ${a.hash_assinatura}`}
                      >
                        {a.hash_assinatura}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Sem PDF anexado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={a.observacao}>
                  {a.observacao || "-"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {a.decidido_em ? new Date(a.decidido_em).toLocaleDateString("pt-BR") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoricoAprovacoes;