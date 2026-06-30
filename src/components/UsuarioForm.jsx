import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function UsuarioForm() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfilId, setPerfilId] = useState(''); // Novo estado para o Perfil
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validando se o usuário preencheu tudo
    if (!nome || !email || !senha || !perfilId) {
      alert("Por favor, preencha todos os campos, incluindo o ID do Perfil!");
      return;
    }

    // Pega a chave mestra no cofre
    const meuToken = localStorage.getItem('tokenHidropag');

    // Montando o "pacote" exatamente do jeito que o seu NestJS pediu no DTO
    const dadosUsuario = {
      nome: nome,
      email: email,
      senha: senha,
      perfil: {
        id: perfilId // Mandando o ID dentro do objeto perfil!
      }
    };

    axios.post('http://localhost:3000/usuarios', dadosUsuario, {
      headers: { Authorization: `Bearer ${meuToken}` }
    })
      .then(() => {
        alert("Usuário cadastrado com sucesso!");
        navigate('/usuarios'); // Volta para o Showroom
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar:", erro);
        if (erro.response && erro.response.status === 401) {
          alert("Erro: Acesso Negado! O seu token expirou ou você não é Admin.");
        } else if (erro.response && erro.response.status === 400) {
          alert("Erro 400: O NestJS recusou os dados. Verifique se o ID do perfil está correto!");
        } else {
          alert("Ocorreu um erro ao cadastrar. Olhe o console.");
        }
      });
  };

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#0056b3', textAlign: 'center', marginBottom: '20px' }}>Cadastrar Novo Usuário</h3>
        
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome Completo: </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Ivan Silva"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>E-mail: </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: ivan@teste.com"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Senha: </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Crie uma senha forte (Ex: Admin#2026)"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* NOVO CAMPO: ID DO PERFIL */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ID do Perfil (UUID): </label>
            <input
              type="text"
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
              placeholder="Ex: 6fc13eec-a3fe-4fe4-811b-2563cb1b5f4c"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>* Cole o código UUID do perfil que este usuário terá.</small>
          </div>

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}>
            Salvar Usuário
          </button>
        </form>
      </div>
    </div>
  );
}

export default UsuarioForm;