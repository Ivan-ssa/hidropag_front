import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Building, Search, Loader2, AlertCircle, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- FUNÇÕES DE MÁSCARA ---
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
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarFiliais = async () => {
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!tokenSalvo) {
      alert("Você não está logado! Faça o login.");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await axios.get(`${API_URL}/filiais`, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      setFiliais(resposta.data);
      setErro(null);
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      setErro("Não foi possível carregar a lista de filiais.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarFiliais();
  }, []);

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
        alert("Erro ao deletar a filial. Ela pode estar vinculada a obras ou utilizadores.");
      }
    }
  };

  const abrirModalEdicao = (filial) => {
    setFilialEditando({
      ...filial,
      cnpj: filial.cnpj ? maskCNPJ(String(filial.cnpj)) : '',
      cep: filial.cep ? maskCEP(String(filial.cep)) : ''
    });
  };

  const handleEditChange = (e) => {
    let { name, value, type, checked } = e.target;

    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'cep') value = maskCEP(value);

    setFilialEditando((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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

  const salvarEdicao = async (e) => {
    e.preventDefault();
    const tokenSalvo = localStorage.getItem('tokenHidropag');

    if (!filialEditando.nome || !filialEditando.cidade) {
      alert("Nome e Cidade são obrigatórios!");
      return;
    }

    let cnpjLimpo = filialEditando.cnpj ? String(filialEditando.cnpj).replace(/\D/g, '') : null;
    if (cnpjLimpo === "") cnpjLimpo = null;

    let cepLimpo = filialEditando.cep ? String(filialEditando.cep).replace(/\D/g, '') : null;
    if (cepLimpo === "") cepLimpo = null;

    const dadosParaAtualizar = {
      nome: filialEditando.nome,
      cidade: filialEditando.cidade,
      uf: filialEditando.uf ? filialEditando.uf.toUpperCase() : null,
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
      setFilialEditando(null); 
      buscarFiliais(); 
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      const msg = erro.response?.data?.message || "Erro interno do servidor.";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const filiaisFiltradas = filiais.filter(f => {
    const termo = busca.toLowerCase();
    const nome = (f.nome || '').toLowerCase();
    const cidade = (f.cidade || '').toLowerCase();
    return nome.includes(termo) || cidade.includes(termo);
  });

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-5xl w-full mx-auto font-body pb-12">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-1 uppercase mb-1">
            CONFIGURAÇÕES
          </p>
          <h1 className="text-3xl font-display font-semibold text-hidrotec-3 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-extra flex items-center justify-center">
              <Building className="w-5 h-5 text-hidrotec-1" strokeWidth={2} />
            </div>
            Gestão de Filiais
          </h1>
          <p className="text-sm text-hidrotec-4">
            Registe e gira as unidades operacionais da empresa.
          </p>
        </div>
        
        <Link
          to="/filiais/nova"
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nova Filial
        </Link>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome da filial ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-1">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-hidrotec-4">A carregar filiais...</p>
            </div>
          ) : erro ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-medium bg-red-50/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          ) : filiaisFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-hidrotec-4">
              <Building className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium mb-1">Nenhuma filial encontrada.</p>
              <p className="text-sm">Clique em "Nova Filial" para começar.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-hidrotec-4 bg-white">
                  <th className="px-6 py-4 font-semibold">Nome da Filial</th>
                  <th className="px-6 py-4 font-semibold">CNPJ</th>
                  <th className="px-6 py-4 font-semibold">Cidade / UF</th>
                  <th className="px-6 py-4 font-semibold">Endereço</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filiaisFiltradas.map((filial) => (
                  <tr key={filial.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-hidrotec-3">
                      {filial.nome || "Não informado"}
                    </td>
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {filial.cnpj ? maskCNPJ(String(filial.cnpj)) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-hidrotec-4">
                      {filial.cidade || "N/I"} {filial.uf ? `/ ${filial.uf}` : ""}
                    </td>
                    <td className="px-6 py-4 text-xs text-hidrotec-4">
                      {filial.logradouro ? (
                        <>
                          {filial.logradouro}, {filial.numero || "S/N"}<br/>
                          <span className="text-slate-400">CEP: {filial.cep ? maskCEP(String(filial.cep)) : "N/I"}</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => abrirModalEdicao(filial)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deletarFilial(filial.id, filial.nome)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- MODAL DE EDIÇÃO --- */}
      {filialEditando && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-hidrotec-3">Editar Filial</h3>
              <button onClick={() => setFilialEditando(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-6">
              <div className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Nome da Filial: *</label>
                    <input type="text" name="nome" value={filialEditando.nome || ''} onChange={handleEditChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>CNPJ:</label>
                    <input type="text" name="cnpj" value={filialEditando.cnpj || ''} onChange={handleEditChange} placeholder="00.000.000/0000-00" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelCls}>
                      CEP: {buscandoCep && <span className="text-hidrotec-1 text-[10px] ml-2">(A buscar...)</span>}
                    </label>
                    <input type="text" name="cep" value={filialEditando.cep || ''} onChange={handleEditChange} onBlur={handleCepBlur} placeholder="00000-000" className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Logradouro (Rua/Av):</label>
                    <input type="text" name="logradouro" value={filialEditando.logradouro || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelCls}>Número:</label>
                    <input type="text" name="numero" value={filialEditando.numero || ''} onChange={handleEditChange} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Cidade: *</label>
                    <input type="text" name="cidade" value={filialEditando.cidade || ''} onChange={handleEditChange} className={inputCls} required />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>UF:</label>
                  <input type="text" name="uf" value={filialEditando.uf || ''} onChange={handleEditChange} maxLength="2" className={`${inputCls} uppercase`} />
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onClick={() => setFilialEditando(null)} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold rounded-xl bg-hidrotec-1 hover:bg-hidrotec-2 text-white transition-all shadow-sm flex items-center gap-2">
                  <Save size={16} /> Salvar Alterações
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