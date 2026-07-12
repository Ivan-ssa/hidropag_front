import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

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

  // Classes padrão para reaproveitar nos inputs
  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

          {/* NOME E CNPJ */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome da Filial: *</label>
            <input
              type="text"
              name="nome"
              value={filial.nome}
              onChange={handleChange}
              placeholder="Ex: Filial Centro"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>CNPJ: </label>
            <input
              type="text"
              name="cnpj"
              value={filial.cnpj}
              onChange={handleChange}
              placeholder="Ex: 00.000.000/0000-00"
              className={inputCls}
            />
          </div>

          {/* ENDEREÇO */}
          <div>
            <label className={labelCls}>Logradouro (Rua/Av): </label>
            <input
              type="text"
              name="logradouro"
              value={filial.logradouro}
              onChange={handleChange}
              placeholder="Ex: Av. Assis Brasil"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Número: </label>
            <input
              type="text"
              name="numero"
              value={filial.numero}
              onChange={handleChange}
              placeholder="Ex: 1234"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>CEP: </label>
            <input
              type="text"
              name="cep"
              value={filial.cep}
              onChange={handleChange}
              placeholder="Ex: 90000-000"
              className={inputCls}
            />
          </div>

          {/* CIDADE E UF */}
          <div>
            <label className={labelCls}>Cidade: *</label>
            <input
              type="text"
              name="cidade"
              value={filial.cidade}
              onChange={handleChange}
              placeholder="Ex: Porto Alegre"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>UF: </label>
            <input
              type="text"
              name="uf"
              value={filial.uf}
              onChange={handleChange}
              placeholder="Ex: RS"
              maxLength="2"
              className={`${inputCls} max-w-[100px] uppercase`}
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-success-500 hover:bg-green-700 text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Filial
            </button>
          </div>
        </form>
      </div>
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