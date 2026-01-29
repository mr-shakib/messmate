import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMessStore } from '../../store/messStore';
import type { MemberRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: MemberRole | MemberRole[];
  requireMess?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireRole,
  requireMess = false,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const currentMess = useMessStore((state) => state.currentMess);

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Redirect to login page, preserving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if mess context is required
  if (requireMess && !currentMess) {
    // Redirect to mess selection/creation page
    return <Navigate to="/messes" replace />;
  }

  // Check role requirements if specified
  if (requireRole && currentMess) {
    const userMember = currentMess.members.find(
      (member) => member.userId === user.id
    );

    if (!userMember) {
      // User is not a member of the current mess
      return <Navigate to="/messes" replace />;
    }

    const userRole = userMember.role;
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];

    // Check if user has one of the required roles
    const hasRequiredRole = allowedRoles.includes(userRole);

    if (!hasRequiredRole) {
      // User doesn't have the required role
      return <Navigate to="/dashboard" replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};
