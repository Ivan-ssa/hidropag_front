import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !senha) {
      alert("Por favor, preencha o e-mail e a senha!");
      return;
    }

    axios.post('http://localhost:3000/usuarios/login', { 
      email: email, 
      senha: senha 
    })
      .then((resposta) => {
        // A variável correta agora é tokenRecebido
        const tokenRecebido = resposta.data.token;
        
        // Guardando no cofre do navegador
        localStorage.setItem('tokenHidropag', tokenRecebido);
        
        alert("Login realizado com sucesso!");
        navigate('/filiais'); 
      })
      .catch((erro) => {
        console.error("🔍 Erro ao logar:", erro.response);
        
        if (erro.response && erro.response.data && erro.response.data.erro) {
          alert("Erro do Servidor: " + erro.response.data.erro);
        } else {
          alert("E-mail ou senha incorretos!");
        }
      });
  }; // <--- Aqui fechamos a função handleLogin corretamente

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '20px' }}>Acesso ao Sistema</h2>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@hidropag.com"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Senha:</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;