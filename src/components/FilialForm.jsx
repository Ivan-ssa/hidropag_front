import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function FilialForm() {
  // Substituímos os vários states por um único objeto para facilitar
  const [filial, setFilial] = useState({
    nome: '',
    cnpj: '',
    cidade: '',
    uf: '',
    cep: '',
    logradouro: '',
    numero: ''
  });

  const navigate = useNavigate();

  // Função única que lida com a digitação em qualquer campo
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilial((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação básica
    if (!filial.nome || !filial.cidade) {
      alert("Por favor, preencha o Nome e a Cidade da filial!");
      return;
    }

    const meuToken = localStorage.getItem('tokenHidropag');

    // Manda o objeto 'filial' inteiro no corpo da requisição
    axios.post(`${API_URL}/filiais`, 
      filial,
      { headers: { Authorization: `Bearer ${meuToken}` } }
    )
      .then(() => {
        alert("Filial cadastrada com sucesso!");
        navigate('/filiais');
      })
      .catch((erro) => {
        console.error("Erro ao cadastrar:", erro);
        if (erro.response && erro.response.status === 401) {
          alert("Erro: Você precisa fazer Login primeiro!");
        } else {
          alert("Ocorreu um erro ao cadastrar a filial. Verifique as permissões.");
        }
      });
  };

  // Estilo padrão para reaproveitar nos inputs
  const inputStyle = { width: '100%', padding: '8px', maxWidth: '400px', boxSizing: 'border-box' };
  const divStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#333' }}>Cadastrar Nova Filial</h3>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        
        {/* NOME E CNPJ */}
        <div style={divStyle}>
          <label style={labelStyle}>Nome da Filial: *</label>
          <input
            type="text"
            name="nome"
            value={filial.nome}
            onChange={handleChange}
            placeholder="Ex: Filial Centro"
            style={inputStyle}
          />
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>CNPJ: </label>
          <input
            type="text"
            name="cnpj"
            value={filial.cnpj}
            onChange={handleChange}
            placeholder="Ex: 00.000.000/0000-00"
            style={inputStyle}
          />
        </div>

        {/* ENDEREÇO */}
        <div style={divStyle}>
          <label style={labelStyle}>Logradouro (Rua/Av): </label>
          <input
            type="text"
            name="logradouro"
            value={filial.logradouro}
            onChange={handleChange}
            placeholder="Ex: Av. Assis Brasil"
            style={inputStyle}
          />
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>Número: </label>
          <input
            type="text"
            name="numero"
            value={filial.numero}
            onChange={handleChange}
            placeholder="Ex: 1234"
            style={inputStyle}
          />
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>CEP: </label>
          <input
            type="text"
            name="cep"
            value={filial.cep}
            onChange={handleChange}
            placeholder="Ex: 90000-000"
            style={inputStyle}
          />
        </div>

        {/* CIDADE E UF */}
        <div style={divStyle}>
          <label style={labelStyle}>Cidade: *</label>
          <input
            type="text"
            name="cidade"
            value={filial.cidade}
            onChange={handleChange}
            placeholder="Ex: Porto Alegre"
            style={inputStyle}
          />
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>UF: </label>
          <input
            type="text"
            name="uf"
            value={filial.uf}
            onChange={handleChange}
            placeholder="Ex: RS"
            maxLength="2"
            style={{ ...inputStyle, maxWidth: '80px', textTransform: 'uppercase' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer', 
            borderRadius: '4px',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          Salvar Filial
        </button>
      </form>
    </div>
  );
}

export default FilialForm;



// import { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// function FilialForm() {
//   const [nome, setNome] = useState('');
//   const [cidade, setCidade] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!nome || !cidade) {
//       alert("Por favor, preencha o Nome e a Cidade da filial!");
//       return;
//     }

//     // PEGA O TOKEN DO COFRE DO NAVEGADOR
//     const meuToken = localStorage.getItem('tokenHidropag');

//     // Manda o Token junto na requisição de cadastro (POST)
//     axios.post(`${API_URL}/filiais`, 
//       { nome: nome, cidade: cidade },
//       { headers: { Authorization: `Bearer ${meuToken}` } }
//     )
//       .then(() => {
//         alert("Filial cadastrada com sucesso!");
//         navigate('/filiais');
//       })
//       .catch((erro) => {
//         console.error("Erro ao cadastrar:", erro);
//         if (erro.response && erro.response.status === 401) {
//           alert("Erro: Você precisa fazer Login primeiro!");
//         } else {
//           alert("Ocorreu um erro ao cadastrar a filial. Verifique as permissões.");
//         }
//       });
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h3>Cadastrar Nova Filial</h3>
//       <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        
//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>Nome da Filial: </label>
//           <input
//             type="text"
//             value={nome}
//             onChange={(e) => setNome(e.target.value)}
//             placeholder="Ex: Filial Centro"
//             style={{ width: '100%', padding: '8px', maxWidth: '400px' }}
//           />
//         </div>

//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>Cidade: </label>
//           <input
//             type="text"
//             value={cidade}
//             onChange={(e) => setCidade(e.target.value)}
//             placeholder="Ex: Porto Alegre"
//             style={{ width: '100%', padding: '8px', maxWidth: '400px' }}
//           />
//         </div>

//         <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
//           Salvar Filial
//         </button>
//       </form>
//     </div>
//   );
// }

// export default FilialForm;