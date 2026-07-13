// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export const PrivateRoute = ({ children, allowedRoles }) => {
  const perfil = localStorage.getItem("usuarioPerfil"); // ex: 'leitor', 'gestor'

  if (!perfil) return <Navigate to="/login" replace/>;
  
  // Root acessa tudo
  if (perfil === 'root') return children;

  // Verifica se o perfil atual está na lista permitida
  if (allowedRoles.includes(perfil)) return children;

  // Se não tem permissão, volta para o início
  return <Navigate to="/" />;
};