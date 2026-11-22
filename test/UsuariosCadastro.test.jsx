import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import '@testing-library/jest-dom';
import UsuariosCadastro from '../src/components/UsuariosCadastro';

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

describe('Componente UsuariosCadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('tokenHidropag', 'fake-token-123');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('deve carregar e exibir perfis e filiais ao abrir a tela', async () => {
    // Simula as respostas do backend para perfis e filiais
    axios.get.mockImplementation((url) => {
      if (url.includes('/perfis')) {
        return Promise.resolve({ data: [{ id: '1', nome: 'admin' }, { id: '2', nome: 'operador' }] });
      }
      if (url.includes('/filiais')) {
        return Promise.resolve({ data: [{ id: '10', nome: 'Matriz - Porto Alegre' }] });
      }
      return Promise.reject(new Error('URL desconhecida'));
    });

    render(
      <BrowserRouter>
        <UsuariosCadastro />
      </BrowserRouter>
    );

    // Como o código capitaliza a primeira letra ('admin' vira 'Admin'), buscamos capitalizado
    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(await screen.findByText('Operador')).toBeInTheDocument();
    expect(await screen.findByText('Matriz - Porto Alegre')).toBeInTheDocument();
  });

  test('deve preencher o formulário e enviar os dados com sucesso', async () => {
    // Simula dados retornados pelo backend para os selects
    axios.get.mockImplementation((url) => {
      if (url.includes('/perfis')) {
        return Promise.resolve({ data: [{ id: '1', nome: 'admin' }] });
      }
      if (url.includes('/filiais')) {
        return Promise.resolve({ data: [{ id: '10', nome: 'Matriz' }] });
      }
    });

    // Simula sucesso no POST de cadastro
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    // Intercepta o alert do navegador para não travar o teste
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <UsuariosCadastro />
      </BrowserRouter>
    );

    // Aguarda os dados assíncronos carregarem
    await screen.findByText('Admin');

    // Preenche os inputs de texto
    await userEvent.type(screen.getByPlaceholderText('Ex: João da Silva'), 'Maria Silva');
    await userEvent.type(screen.getByPlaceholderText('joao@empresa.com'), 'maria@empresa.com');
    await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123');

    // Seleciona o perfil no elemento <select name="perfilId">
    const selectPerfil = document.querySelector('select[name="perfilId"]');
    await userEvent.selectOptions(selectPerfil, '1');

    // Clica no botão de salvar
    const botaoSalvar = screen.getByRole('button', { name: /salvar usuário/i });
    await userEvent.click(botaoSalvar);

    // Valida se o payload enviado para a API está correto
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/usuarios'),
        expect.objectContaining({
          nome: 'Maria Silva',
          email: 'maria@empresa.com',
          senha: 'senha123',
          ativo: true,
          perfil: { id: '1' },
        }),
        expect.any(Object)
      );
    });

    // Confirma mensagem de sucesso e redirecionamento
    expect(alertSpy).toHaveBeenCalledWith('Usuário cadastrado com sucesso!');
    expect(mockedNavigate).toHaveBeenCalledWith('/usuarios');

    alertSpy.mockRestore();
  });
});