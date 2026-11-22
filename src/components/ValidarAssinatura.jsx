import { useState } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  UploadCloud,
  Loader2,
  FileCheck2,
  Hash,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ValidarAssinatura() {
  const [modo, setModo] = useState('arquivo'); // 'arquivo' | 'hash'
  const [hash, setHash] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('tokenHidropag')}` },
  };

  const limparEstado = () => {
    setErro(null);
    setResultado(null);
  };

  const verificarPorHash = async (e) => {
    e.preventDefault();
    if (!hash.trim()) return;

    try {
      setVerificando(true);
      limparEstado();
      const res = await axios.get(`${API_URL}/aprovacoes/validar/${hash.trim()}`, config);
      setResultado(res.data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Hash não encontrado no sistema.');
    } finally {
      setVerificando(false);
    }
  };

  const verificarPorArquivo = async (e) => {
    e.preventDefault();
    if (!arquivo) return;

    try {
      setVerificando(true);
      limparEstado();
      const formData = new FormData();
      formData.append('file', arquivo);

      const res = await axios.post(`${API_URL}/aprovacoes/validar-arquivo`, formData, config);
      setResultado(res.data);
    } catch (err) {
      setErro(
        err.response?.data?.message ||
          'Este arquivo PDF não bate com nenhum documento assinado pelo HidroPag.'
      );
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 font-body">
      <h2 className="text-2xl font-display font-bold text-slate-800 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-7 h-7 text-emerald-600" />
        Auditoria e Validação de PDF
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Verifique se uma Nota Fiscal aprovada é autêntica e se o arquivo não sofreu alterações.
      </p>

      {/* Seletor de Modo */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setModo('arquivo'); limparEstado(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
            modo === 'arquivo'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Validar Arquivo PDF
        </button>
        <button
          type="button"
          onClick={() => { setModo('hash'); limparEstado(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
            modo === 'hash'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Hash className="w-4 h-4" />
          Validar Código Hash
        </button>
      </div>

      {/* Formulário: Upload de PDF */}
      {modo === 'arquivo' ? (
        <form onSubmit={verificarPorArquivo} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Selecione o PDF da Nota Fiscal carimbada:
          </label>
          <div className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 mb-4">
            <UploadCloud className="w-6 h-6 text-emerald-600 shrink-0" />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => { setArquivo(e.target.files[0] || null); limparEstado(); }}
              className="w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-emerald-50 file:text-emerald-700 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={!arquivo || verificando}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {verificando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verificar Integridade do PDF
          </button>
        </form>
      ) : (
        /* Formulário: Código Hash */
        <form onSubmit={verificarPorHash} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Código Assinatura SHA-256 (rodapé da nota):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hash}
              onChange={(e) => { setHash(e.target.value.toUpperCase()); limparEstado(); }}
              placeholder="Ex: 9F8A7B6C5D4E3F2A1B0C9D8E7F6A"
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm uppercase focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={!hash.trim() || verificando}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {verificando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar
            </button>
          </div>
        </form>
      )}

      {/* Resultado: Inválido / Adulterado */}
      {erro && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Documento Não Autenticado</p>
            <p className="text-xs mt-1 leading-relaxed">{erro}</p>
          </div>
        </div>
      )}

      {/* Resultado: Autêntico */}
      {resultado?.autentico && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <div>
              <p>{resultado.mensagem}</p>
              <p className="text-[11px] font-normal text-emerald-600">
                {resultado.tipoValidacao === 'INTEGRIDADE_ARQUIVO'
                  ? 'Integridade bit a bit confirmada: o PDF não sofreu nenhuma alteração após a assinatura.'
                  : 'Registro localizado na base oficial de aprovações.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-100">
            <div>
              <span className="text-slate-400 block">Decisão Oficial</span>
              <strong className="text-slate-800">{resultado.dadosOficiais.decisao}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Data/Hora da Aprovação</span>
              <strong className="text-slate-800">
                {new Date(resultado.dadosOficiais.dataHora).toLocaleString('pt-BR')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Gestor Responsável</span>
              <strong className="text-slate-800">{resultado.dadosOficiais.gestor.nome}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Nota Fiscal / Valor</span>
              <strong className="text-slate-800">
                NF {resultado.dadosOficiais.notaFiscal.numero_nf} — R${' '}
                {Number(resultado.dadosOficiais.notaFiscal.valor_total).toFixed(2)}
              </strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Fornecedor / Obra</span>
              <strong className="text-slate-800">
                {resultado.dadosOficiais.notaFiscal.fornecedor} ({resultado.dadosOficiais.notaFiscal.obra})
              </strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Parecer Registrado</span>
              <strong className="text-slate-800">{resultado.dadosOficiais.observacao}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}