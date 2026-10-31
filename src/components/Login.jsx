import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Droplets } from 'lucide-react';
import { jwtDecode } from "jwt-decode"; // Mantido do seu código

const API_URL = import.meta.env.VITE_API_URL; // Mantido do seu código

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarAjudaSenha, setMostrarAjudaSenha] = useState(false);
  const [erro, setErro] = useState('');

  // Lógica original preservada: Verifica se já está logado
  useEffect(() => {
    const tokenExistente = localStorage.getItem('tokenHidropag');
    if (tokenExistente) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setErro(''); // Limpa erros antigos

    // LÓGICA DE BACK-END ORIGINAL MANTIDA AQUI
    axios.post(`${API_URL}/usuarios/login`, { 
      email: email, 
      senha: senha 
    })
    .then((resposta) => {
      const tokenRecebido = resposta.data.token;
      const decoded = jwtDecode(tokenRecebido);
      
      localStorage.setItem('tokenHidropag', tokenRecebido);
      localStorage.setItem('usuarioId', decoded.id); 
      localStorage.setItem("usuarioNome", decoded.nome);
      localStorage.setItem("usuarioPerfil", decoded.perfil.nome);

      navigate("/");
    })
    .catch((erroAxios) => {
      console.error("🔍 Erro ao logar:", erroAxios.response);
      if (erroAxios.response && erroAxios.response.data && erroAxios.response.data.erro) {
        setErro("Erro do Servidor: " + erroAxios.response.data.erro);
      } else {
        setErro("E-mail ou senha incorretos!");
      }
    });
  };

  return (
    // INÍCIO DO VISUAL NOVO (Figma Hidrotec)
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden font-body">
      
      {/* Efeito de fundo */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--color-extra)_0%,_transparent_50%)] opacity-30 pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md relative z-10 border border-slate-100">
        
        {/* Cabeçalho / Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-8 h-8 text-hidrotec-2 fill-extra" strokeWidth={2} />
            <h1 className="text-3xl font-display font-bold text-hidrotec-1 tracking-tight">
              Hidro<span className="text-hidrotec-2">Pag</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold tracking-widest text-hidrotec-4 uppercase">
            Gestão Financeira Inteligente
          </p>
        </div>

        {/* Título de Boas-vindas */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-semibold text-hidrotec-3 mb-2">
            Acesse sua conta
          </h2>
          <p className="text-sm text-hidrotec-4">
            Bem-vindo de volta. Insira seus dados para continuar.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          {erro && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium">
              {erro}
            </div>
          )}

          {/* Campo E-mail */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-hidrotec-3 ml-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-hidrotec-4">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@empresa.com"
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-hidrotec-3 ml-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-hidrotec-4">
                <Lock size={18} />
              </div>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-hidrotec-2 focus:ring-1 focus:ring-hidrotec-2 transition-all text-hidrotec-3 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(atual => !atual)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-hidrotec-4 hover:text-hidrotec-3 transition-colors"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Link Esqueci a senha */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setMostrarAjudaSenha(atual => !atual)}
                className="text-xs font-medium text-hidrotec-4 hover:text-hidrotec-1 transition-colors cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
            {mostrarAjudaSenha && (
              <p className="text-xs text-hidrotec-4 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 leading-relaxed">
                Para redefinir sua senha, peça a quem administra o sistema. Essa pessoa pode definir uma nova senha na tela de Usuários.
              </p>
            )}
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            className="w-full bg-hidrotec-1 hover:bg-hidrotec-2 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 shadow-sm hover:shadow-md cursor-pointer"
          >
            Entrar no Sistema
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-xs text-hidrotec-4">
            Ambiente seguro • HidroPag © 2026
          </p>
        </div>

      </div>
    </div>
  );
}