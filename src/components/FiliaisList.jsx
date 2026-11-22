import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Plus, Pencil, X, Building, Search, Loader2, AlertCircle, 
  Save, UserMinus, UserCheck, Check 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- FUNÇÕES DE MÁSCARA ---
const maskCNPJ = (value) => {
  if (!value) return "";
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/gi, '')
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3')
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, '.$1/$2')
    .replace(/([A-Z0-9]{4})([0-9])/, '$1-$2')
    .slice(0, 18);
};

const maskCEP = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

// A filial está ativa se o deletedAt for null
const estaAtiva = (filial) => filial.deletedAt === null;

function FiliaisList() {
  const [filiais, setFiliais] = useState([]);
  const [filialEditando, setFilialEditando] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarAtivas, setMostrarAtivas] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

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
      const lista = Array.isArray(resposta.data) ? resposta.data : [];
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setFiliais(lista);
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

  useEffect(() => {
    if (aviso?.tipo !== "sucesso") return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // ALTERAÇÃO DO STATUS (Inativar via DELETE / Reativar via PUT com deletedAt: null)
  const alterarStatus = async (filial, reativar) => {
    if (!reativar) {
      const confirmou = window.confirm(
        `Inativar a filial "${filial.nome}"?\n\n` +
        `Se ela possuir obras ou usuários vinculados, será movida para a aba Inativas.`
      );
      if (!confirmou) return;
    }

    const tokenSalvo = localStorage.getItem('tokenHidropag');
    setProcessandoId(filial.id);

    try {
      if (reativar) {
        const dadosParaReativar = {
          deletedAt: null
        };

        await axios.put(`${API_URL}/filiais/${filial.id}`, dadosParaReativar, {
          headers: { Authorization: `Bearer ${tokenSalvo}` }
        });
        setAviso({ tipo: "sucesso", texto: `Filial "${filial.nome}" reativada com sucesso!` });
      } else {
        await axios.delete(`${API_URL}/filiais/${filial.id}`, {
          headers: { Authorization: `Bearer ${tokenSalvo}` }
        });
        setAviso({ tipo: "sucesso", texto: `Filial "${filial.nome}" foi inativada com sucesso.` });
      }

      await buscarFiliais();
    } catch (erro) {
      console.error("Erro ao alterar status:", erro);
      const msg = erro.response?.data?.message || "Falha na operação.";
      const textoErro = Array.isArray(msg) ? msg.join("\n") : (typeof msg === 'string' ? msg : JSON.stringify(msg));
      setAviso({ tipo: "erro", texto: textoErro });
    } finally {
      setProcessandoId(null);
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

    let cnpjLimpo = filialEditando.cnpj ? String(filialEditando.cnpj).replace(/[^A-Za-z0-9]/g, '').toUpperCase() : null;
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
      cnpj: cnpjLimpo,
      deletedAt: filialEditando.deletedAt 
    };

    try {
      await axios.put(`${API_URL}/filiais/${filialEditando.id}`, dadosParaAtualizar, {
        headers: { Authorization: `Bearer ${tokenSalvo}` }
      });
      setAviso({ tipo: "sucesso", texto: `Filial "${filialEditando.nome}" atualizada com sucesso!` });
      setFilialEditando(null); 
      buscarFiliais(); 
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      const msg = erro.response?.data?.message || "Erro interno do servidor.";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const totalAtivas = filiais.filter(estaAtiva).length;
  const totalInativas = filiais.length - totalAtivas;

  const filiaisFiltradas = filiais.filter(f => {
    const ativa = estaAtiva(f);
    if (ativa !== mostrarAtivas) return false;

    const termo = busca.toLowerCase();
    if (!termo) return true;
    const nome = (f.nome || '').toLowerCase();
    const cidade = (f.cidade || '').toLowerCase();
    return nome.includes(termo) || cidade.includes(termo);
  });

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 bg-white";
  const labelCls = "block text-xs font-bold text-hidrotec-4 uppercase tracking-wider mb-2";

  const abaCls = (ativa) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
      ativa ? "bg-white text-hidrotec-3 shadow-sm" : "text-slate-500 hover:text-hidrotec-3"
    }`;

  return (
    <div className="max-w-5xl w-full mx-auto font-body pb-12">
      {aviso && (
        <div role="alert" className={`flex items-start gap-3 mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          aviso.tipo === "sucesso" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {aviso.tipo === "sucesso" ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <p className="flex-1 whitespace-pre-line">{aviso.texto}</p>
          <button type="button" onClick={() => setAviso(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO COM ABAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button type="button" onClick={() => setMostrarAtivas(true)} className={abaCls(mostrarAtivas)}>
            <Building size={16} /> Ativas ({totalAtivas})
          </button>
          <button type="button" onClick={() => setMostrarAtivas(false)} className={abaCls(!mostrarAtivas)}>
            <UserMinus size={16} /> Inativas ({totalInativas})
          </button>
        </div>

        <Link
          to="/filiais/nova"
          className="bg-hidrotec-1 hover:bg-hidrotec-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Nova Filial
        </Link>
      </div>

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
              <p className="font-medium mb-1">{busca ? "Nenhuma filial encontrada." : `Nenhuma filial ${mostrarAtivas ? "ativa" : "inativa"}.`}</p>
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
                {filiaisFiltradas.map((filial) => {
                  const ocupado = processandoId === filial.id;
                  const ativa = estaAtiva(filial);

                  return (
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
                          type="button"
                          onClick={() => abrirModalEdicao(filial)}
                          disabled={ocupado}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mr-2 disabled:opacity-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {ativa ? (
                          <button 
                            type="button" 
                            onClick={() => alterarStatus(filial, false)} 
                            disabled={ocupado} 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40" 
                            title="Inativar"
                          >
                            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => alterarStatus(filial, true)} 
                            disabled={ocupado} 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50" 
                            title="Reativar"
                          >
                            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <button type="button" onClick={() => setFilialEditando(null)} className="text-slate-400 hover:text-hidrotec-3 transition-colors">
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