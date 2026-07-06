
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

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <form
        onSubmit={salvarObra}
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 3px 10px rgba(0,0,0,.15)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0056b3",
            marginBottom: "25px",
          }}
        >
          Cadastro de Obras
        </h2>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            Nome da Obra
          </label>

          <input
            type="text"
            value={nomeObra}
            onChange={(e) => setNomeObra(e.target.value)}
            placeholder="Ex: Hospital Moinhos de Vento"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            Filial
          </label>

          <select
            value={filialId}
            onChange={(e) => setFilialId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Selecione...</option>

            {filiais.map((filial) => (
              <option key={filial.id} value={filial.id}>
                {filial.nome}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginBottom: "25px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />

          <label>Obra Ativa</label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            type="submit"
            style={{
              background: "#198754",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Salvar
          </button>

          <button
            type="button"
            onClick={() => navigate("/obras")}
            style={{
              background: "#6c757d",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ObrasCadastro;
