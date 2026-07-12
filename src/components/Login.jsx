import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock } from 'lucide-react';

// 1. Criamos a variável que puxa o link da Vercel ou usa o localhost se estiver no seu PC
const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  // Se o usuário já tem um token salvo (já está logado), não faz sentido
  // ficar na tela de login: manda direto para o sistema.
  useEffect(() => {
    const tokenExistente = localStorage.getItem('tokenHidropag');
    if (tokenExistente) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !senha) {
      alert("Por favor, preencha o e-mail e a senha!");
      return;
    }

    // 2. Trocamos o texto fixo por nossa variável dinâmica usando crase (`)
    axios.post(`${API_URL}/usuarios/login`, { 
      email: email, 
      senha: senha 
    })
      .then((resposta) => {
        // A variável correta agora é tokenRecebido
        const tokenRecebido = resposta.data.token;
        
        // Guardando no cofre do navegador
        localStorage.setItem('tokenHidropag', tokenRecebido);
        
        alert("Login realizado com sucesso!");
        navigate('/');
      })
      .catch((erro) => {
        console.error("🔍 Erro ao logar:", erro.response);
        
        if (erro.response && erro.response.data && erro.response.data.erro) {
          alert("Erro do Servidor: " + erro.response.data.erro);
        } else {
          alert("E-mail ou senha incorretos!");
        }
      });
  }; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-800 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <div className="w-12 h-12 rounded-xl bg-flow-100 flex items-center justify-center mb-4 mx-auto">
          <Droplets className="w-6 h-6 text-flow-600" />
        </div>
        <h2 className="font-display font-semibold text-xl text-slate-800 text-center mb-1">
          Acesso ao Sistema
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Entre com suas credenciais do HidroPag
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@hidropag.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-semibold transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
