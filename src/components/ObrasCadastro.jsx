
// import { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// function ObrasCadastro() {
//   const [nome, setNome] = useState('');
//   const [local, setLocal] = useState(''); // Campo de exemplo
//   const navigate = useNavigate();

//   const handleSalvar = (e) => {
//     e.preventDefault();
//     const tokenSalvo = localStorage.getItem('tokenHidropag');

//     if (!tokenSalvo) {
//       alert("Você não está logado! Faça o login.");
//       return;
//     }

//     if (!nome) {
//       alert("Por favor, preencha o nome da obra!");
//       return;
//     }

//     // Enviando para a rota de cadastro que você especificou
//     axios.post('http://localhost:3000/obras/nova', {
//       nome: nome,
//       local: local // Se a sua API TypeORM não tiver a coluna "local", você pode apagar esta linha
//     }, {
//       headers: { Authorization: `Bearer ${tokenSalvo}` }
//     })
//     .then(() => {
//       alert("Obra cadastrada com sucesso!");
//       navigate('/obras'); // Volta para a tela da lista de obras
//     })
//     .catch((erro) => {
//       console.error("Erro ao cadastrar obra:", erro);
//       alert("Erro ao cadastrar. Verifique o console para mais detalhes.");
//     });
//   };

//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
//       <div style={{ width: '100%', maxWidth: '500px', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
//         <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '20px' }}>Cadastrar Nova Obra</h2>

//         <form onSubmit={handleSalvar}>
//           <div style={{ marginBottom: '15px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Obra:</label>
//             <input
//               type="text"
//               value={nome}
//               onChange={(e) => setNome(e.target.value)}
//               placeholder="Ex: Manutenção Bloco C"
//               style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
//             />
//           </div>

//           <div style={{ marginBottom: '20px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Local / Endereço:</label>
//             <input
//               type="text"
//               value={local}
//               onChange={(e) => setLocal(e.target.value)}
//               placeholder="Ex: Av. Assis Brasil, 123"
//               style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
//             />
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <button 
//               type="button" 
//               onClick={() => navigate('/obras')} 
//               style={{ padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '48%' }}
//             >
//               Cancelar
//             </button>
//             <button 
//               type="submit" 
//               style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '48%' }}
//             >
//               Salvar Obra
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ObrasCadastro;





import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ObrasCadastro() {
  const navigate = useNavigate();

  const [nomeObra, setNomeObra] = useState("");
  const [filialId, setFilialId] = useState("");
  
  const [ativo, setAtivo] = useState(true);

  const [filiais, setFiliais] = useState([]);

  const token = localStorage.getItem("tokenHidropag");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    carregarFiliais();
  }, []);

  function carregarFiliais() {
    axios
      .get(`${API_URL}/filiais`, config)
      .then((response) => {
        const lista = response.data.sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );

        setFiliais(lista);
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao carregar as filiais.");
      });
  }

  function salvarObra(e) {
    e.preventDefault();

    if (!nomeObra || !filialId) {
      alert("Preencha todos os campos.");
      return;
    }

    const payload = {
      nome_obra: nomeObra,
      ativo: ativo,
      filialId: filialId,
    };

    axios
      .post(`${API_URL}/OBRAS`, payload, config)
      .then(() => {
        alert("Obra cadastrada com sucesso!");

        navigate("/obras");
      })
      .catch((erro) => {
        console.error(erro);

        alert("Erro ao cadastrar obra.");
      });
  }

  const inputCls = "w-full px-3 py-2.5 mt-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-flow-400 focus:border-transparent";
  const labelCls = "text-sm font-medium text-slate-700";

  return (
    <div className="flex justify-center">
      <form
        onSubmit={salvarObra}
        className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="font-display font-semibold text-lg text-slate-800 mb-5">
          Cadastro de Obras
        </h2>

        <div className="mb-4">
          <label className={labelCls}>Nome da Obra</label>

          <input
            type="text"
            value={nomeObra}
            onChange={(e) => setNomeObra(e.target.value)}
            placeholder="Ex: Hospital Moinhos de Vento"
            className={inputCls}
          />
        </div>

        <div className="mb-4">
          <label className={labelCls}>Filial</label>

          <select
            value={filialId}
            onChange={(e) => setFilialId(e.target.value)}
            className={`${inputCls} bg-white`}
          >
            <option value="">Selecione...</option>

            {filiais.map((filial) => (
              <option key={filial.id} value={filial.id}>
                {filial.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="w-4 h-4 accent-flow-500 cursor-pointer"
          />

          <label className="text-sm text-slate-700">Obra Ativa</label>
        </div>

        <div className="flex justify-between gap-3">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-success-500 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>

          <button
            type="button"
            onClick={() => navigate("/obras")}
            className="flex-1 py-2.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ObrasCadastro;
