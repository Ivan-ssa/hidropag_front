import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- FUNÇÕES DE MÁSCARA (Ficam fora do componente) ---
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

function FiliaisList() {
  const [filiais, setFiliais] = useState([]);
  const [filialEditando, setFilialEditando] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const buscarFiliais = async () => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!tokenSalvo) {
      alert("Você não está logado! Faça o login.");
      return;
    }

    try {
      const resposta = await axios.get(`${API_URL}/filiais`, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      setFiliais(resposta.data);
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      alert("Erro ao buscar: " + erro.message);
    }
  };

  useEffect(() => {
    buscarFiliais();
  }, []);

  // FUNÇÃO PARA DELETAR
  const deletarFilial = async (id, nome) => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');
    if (window.confirm(`Tem certeza que deseja excluir a filial "${nome}"?`)) {
      try {
        await axios.delete(`${API_URL}/filiais/${id}`, {
          headers: { Authorization: `Bearer ${tokenSalvo}` }
        });
        alert("Filial excluída com sucesso!");
        buscarFiliais();
      } catch (erro) {
        console.error("Erro ao deletar:", erro);
        alert("Erro ao deletar a filial.");
      }
    }
  };

  // --- FUNÇÕES DE EDIÇÃO ---
  const abrirModalEdicao = (filial) => {
    setFilialEditando(filial);
  };

  const handleEditChange = (e) => {
    let { name, value, type, checked } = e.target;

    // Aplica as máscaras visualmente enquanto o usuário digita
    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'cep') value = maskCEP(value);

    setFilialEditando((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- BUSCA DE CEP AUTOMÁTICA ---
  const handleCepBlur = async () => {
    if (!filialEditando?.cep) return;
    
    const cepLimpo = filialEditando.cep.replace(/\D/g, ''); 
    
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (data.erro) {
          alert("CEP não encontrado!");
        } else {
          setFilialEditando(prev => ({
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

  // --- FUNÇÃO DE SALVAR CORRIGIDA E ALINHADA COM O BACKEND ---
  const salvarEdicao = async (e) => {
    e.preventDefault();
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!filialEditando.nome || !filialEditando.cidade) {
      alert("Nome e Cidade são obrigatórios!");
      return;
    }

    // Limpa a formatação, garantindo que envie NULL se estiver vazio (evita erro de UNIQUE no banco)
    let cnpjLimpo = filialEditando.cnpj ? String(filialEditando.cnpj).replace(/\D/g, '') : null;
    if (cnpjLimpo === "") cnpjLimpo = null;

    let cepLimpo = filialEditando.cep ? String(filialEditando.cep).replace(/\D/g, '') : null;
    if (cepLimpo === "") cepLimpo = null;

    // JSON montado estritamente com as colunas da sua Entidade TypeORM (email_contato e ativo removidos)
    const dadosParaAtualizar = {
      nome: filialEditando.nome,
      cidade: filialEditando.cidade,
      uf: filialEditando.uf || null,
      cep: cepLimpo,
      numero: filialEditando.numero || null,
      logradouro: filialEditando.logradouro || null,
      cnpj: cnpjLimpo
    };

    try {
      await axios.put(`${API_URL}/filiais/${filialEditando.id}`, dadosParaAtualizar, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      alert("Filial atualizada com sucesso!");
      setFilialEditando(null); // Fecha o modal
      buscarFiliais(); // Recarrega a lista
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      const msg = erro.response?.data?.message || "Erro interno do servidor (500).";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // Classes reaproveitáveis para os campos do modal
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent mb-3";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/filiais/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Filial
        </Link>
      </div>

      {filiais.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          Nenhuma filial encontrada ou carregando dados...
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Nome da Filial</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Cidade / UF</th>
                <th className="px-4 py-3 font-medium">Endereço</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filiais.map((filial) => (
                <tr key={filial.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{filial.nome || "Não informado"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {/* Renderiza o CNPJ com máscara na lista */}
                    {filial.cnpj ? maskCNPJ(String(filial.cnpj)) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {filial.cidade || "N/I"} {filial.uf ? `/ ${filial.uf}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {filial.logradouro ? (
                      <>
                        {filial.logradouro}, {filial.numero || "S/N"}<br/>
                        <small className="text-slate-400">CEP: {filial.cep ? maskCEP(String(filial.cep)) : "N/I"}</small>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button 
                      onClick={() => abrirModalEdicao(filial)}
                      className="inline-flex items-center gap-1 mr-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button 
                      onClick={() => deletarFilial(filial.id, filial.nome)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {filialEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-slate-800">Editar Filial</h3>
              <button onClick={() => setFilialEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-5">
              <label className={labelCls}>Nome da Filial: *</label>
              <input type="text" name="nome" value={filialEditando.nome || ''} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>CNPJ:</label>
              <input 
                type="text" 
                name="cnpj" 
                value={filialEditando.cnpj || ''} 
                onChange={handleEditChange} 
                placeholder="00.000.000/0000-00"
                className={inputCls} 
              />

              <label className={labelCls}>CEP: {buscandoCep && <span className="text-flow-500 text-[10px] ml-2">(Buscando...)</span>}</label>
              <input 
                type="text" 
                name="cep" 
                value={filialEditando.cep || ''} 
                onChange={handleEditChange} 
                onBlur={handleCepBlur} 
                placeholder="00000-000"
                className={inputCls} 
              />

              <label className={labelCls}>Logradouro (Rua/Av):</label>
              <input type="text" name="logradouro" value={filialEditando.logradouro || ''} onChange={handleEditChange} className={inputCls} />

              <label className={labelCls}>Número:</label>
              <input type="text" name="numero" value={filialEditando.numero || ''} onChange={handleEditChange} className={inputCls} />

              <label className={labelCls}>Cidade: *</label>
              <input type="text" name="cidade" value={filialEditando.cidade || ''} onChange={handleEditChange} className={inputCls} required />

              <label className={labelCls}>UF:</label>
              <input type="text" name="uf" value={filialEditando.uf || ''} onChange={handleEditChange} maxLength="2" className={`${inputCls} uppercase`} />

              <div className="flex justify-end gap-2 mt-5">
                <button 
                  type="button" 
                  onClick={() => setFilialEditando(null)} 
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-flow-500 hover:bg-flow-600 text-white transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FiliaisList;