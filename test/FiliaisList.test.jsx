import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import '@testing-library/jest-dom';
import FiliaisList from '../src/components/FiliaisList';

// Simula o Axios
vi.mock('axios');

// Simula o useNavigate do React Router DOM
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Componente FiliaisList', () => {
  const filiaisMock = [
    {
      id: '540a3781-53af-4ac5-9acc-a2a3d3a04b85',
      nome: 'Filial Matriz',
      cidade: 'Porto Alegre',
      uf: 'RS',
      cep: '94160360',
      numero: '23',
      logradouro: 'Rua A',
      deletedAt: null,
      cnpj: '32323232323232',
      obras: [],
      usuarios: []
    },
    {
      id: 'e3ef8588-a07b-4952-9103-0e677ff6a20f',
      nome: 'Filial Inativa',
      cidade: 'Gravataí',
      uf: 'RS',
      cep: '91160360',
      numero: '115',
      logradouro: 'Avenida B',
      deletedAt: '2026-11-01T03:30:33.038Z',
      cnpj: '23423423423423',
      obras: [],
      usuarios: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('tokenHidropag', 'fake-token-123');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('deve carregar e exibir a lista de filiais ativas e inativas nas abas', async () => {
    axios.get.mockResolvedValueOnce({ data: filiaisMock });

    render(
      <BrowserRouter>
        <FiliaisList />
      </BrowserRouter>
    );

    // Confere se a filial ativa aparece na aba padrão
    expect(await screen.findByText('Filial Matriz')).toBeInTheDocument();
    expect(screen.getByText('Ativas (1)')).toBeInTheDocument();
    expect(screen.getByText('Inativas (1)')).toBeInTheDocument();

    // Clica na aba de inativas para conferir se a outra filial aparece
    const abaInativas = screen.getByRole('button', { name: /inativas/i });
    await userEvent.click(abaInativas);

    expect(await screen.findByText('Filial Inativa')).toBeInTheDocument();
  });

  test('deve abrir o modal de edição ao clicar no botão de editar', async () => {
    axios.get.mockResolvedValueOnce({ data: filiaisMock });

    render(
      <BrowserRouter>
        <FiliaisList />
      </BrowserRouter>
    );

    await screen.findByText('Filial Matriz');

    // Clica no botão de editar da primeira filial
    const botaoEditar = screen.getByTitle('Editar');
    await userEvent.click(botaoEditar);

    // Confere se o modal abriu com os dados preenchidos
    expect(await screen.findByText('Editar Filial')).toBeInTheDocument();
    const inputNome = screen.getByDisplayValue('Filial Matriz');
    expect(inputNome).toBeInTheDocument();
  });

  test('deve enviar a requisição de reativação (deletedAt: null) com sucesso', async () => {
    // 1. Primeiro carrega listando a filial inativa
    axios.get.mockResolvedValueOnce({ data: filiaisMock });
    // 2. Simula sucesso no PUT de reativação
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    // 3. Simula recarregamento da lista após reativar
    axios.get.mockResolvedValueOnce({ data: filiaisMock });

    render(
      <BrowserRouter>
        <FiliaisList />
      </BrowserRouter>
    );

    await screen.findByText('Filial Matriz');
    

    // Vai para a aba de inativas
    const abaInativas = screen.getByRole('button', { name: /inativas/i });
    await userEvent.click(abaInativas);

    await screen.findByText('Filial Inativa');

    // Clica no botão de reativar (ícone de check/user-check)
    const botaoReativar = screen.getByTitle('Reativar');
    await userEvent.click(botaoReativar);

    // Confere se o axios.put foi chamado corretamente enviando deletedAt: null
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/filiais/e3ef8588-a07b-4952-9103-0e677ff6a20f'),
        expect.objectContaining({
          deletedAt: null,
        }),
        expect.any(Object)
      );
    });
  });
});
//npx vitest test/FiliaisList.test.jsx