import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function UsuariosCadastro() {
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    perfilId: '6fc13eec-a3fe-4fe4-811b-2563cb1b5f4c' // ID padrão: leitor
  });

  const meuToken = localStorage.getItem('tokenHidropag');
  const config = {
    headers: { Authorization: `Bearer ${meuToken}` }
  };

  const cadastrarUsuario = (e) => {
    e.preventDefault(); 

    const payload = {
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      senha: novoUsuario.senha,
      ativo: true,
      perfil: {
        id: novoUsuario.perfilId
      }
    };

    axios.post(`${API_URL}/usuarios`, payload, config)
      .then(() => {
        alert("Usuário cadastrado com sucesso!");
        setNovoUsuario({ 
          nome: '', 
          email: '', 
          senha: '', 
          perfilId: '6fc13eec-a3fe-4fe4-811b-2563cb1b5f4c' 
        });
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar:", erro);
        alert("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoUsuario({ ...novoUsuario, [name]: value });
  };

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', maxWidth: '600px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Cadastrar Novo Usuário</h3>
        
        <form onSubmit={cadastrarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Nome</label>
            <input type="text" name="nome" value={novoUsuario.nome} onChange={handleInputChange} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>E-mail</label>
            <input type="email" name="email" value={novoUsuario.email} onChange={handleInputChange} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Senha</label>
            <input type="password" name="senha" value={novoUsuario.senha} onChange={handleInputChange} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Perfil</label>
            <select 
              name="perfilId" 
              value={novoUsuario.perfilId} 
              onChange={handleInputChange} 
              required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white' }}
            >
              <option value="354ea3ae-2584-40dc-94df-fb2d3c71f105">Root</option>
              <option value="e036fc61-5d05-41d2-9be5-bcecb6f53e37">Gestor</option>
              <option value="38633f75-0343-413e-bd5e-09b72cf0d344">Lançador</option>
              <option value="6fc13eec-a3fe-4fe4-811b-2563cb1b5f4c">Leitor</option>
            </select>
          </div>

          <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}

export default UsuariosCadastro;