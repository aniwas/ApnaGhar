import React from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';
import { UserRole } from '../types';

interface RouteGuardProps {
  currentUser: { email: string; name: string; role: UserRole } | null;
  targetRole: UserRole;
  onOpenAuth: () => void;
  onLogIncident: (targetRole: string, message: string) => void;
  children: React.ReactNode;
}

export default function RouteGuard({
  currentUser,
  targetRole,
  onOpenAuth,
  onLogIncident,
  children
}: RouteGuardProps) {
  // 1. If trying to see simple guest/public view, always approved
  if (targetRole === UserRole.GUEST) {
    return <>{children}</>;
  }

  // 2. If the user is GUEST but needs authorization for some dashboard panel
  if (!currentUser) {
    React.useEffect(() => {
      onLogIncident(targetRole, 'Unauthenticated guest user tried accessing restricted dashboard panels.');
    }, [targetRole]);

    return (
      <div className="p-8 md:p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-6 max-w-xl mx-auto my-12 animate-in fade-in duration-300 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <ShieldAlert className="h-8 w-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-black text-white font-sans uppercase tracking-wider text-center">Authentication Required</h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans text-center">
          You are trying to access the <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase font-bold">{targetRole}</span> Workspace, but no authenticated session was detected.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer active:scale-95"
        >
          <LogIn className="h-4 w-4" />
          Sign In / Authenticate Session
        </button>
      </div>
    );
  }

  // 3. User is logged in. Do they have the right privileges?
  const isAuthorized = currentUser.role === UserRole.ADMIN || currentUser.role === targetRole;

  if (!isAuthorized) {
    React.useEffect(() => {
      onLogIncident(targetRole, `User ${currentUser.email} with role [${currentUser.role}] attempted unauthorized manual path elevation to target role [${targetRole}].`);
    }, [currentUser.email, currentUser.role, targetRole]);

    return (
      <div className="p-8 md:p-12 bg-red-950/20 border border-red-500/30 rounded-3xl text-center space-y-6 max-w-xl mx-auto my-12 animate-in fade-in duration-300 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/25">
          <ShieldAlert className="h-8 w-8 text-red-400 animate-pulse animate-bounce" />
        </div>
        <h3 className="text-lg font-black text-red-400 font-sans uppercase tracking-wider text-center">Access Blocked: Privileges Violation</h3>
        <p className="text-xs text-red-200/60 leading-relaxed font-sans text-center">
          Your current authenticated clearance is restricted to role <span className="font-mono text-white bg-red-500/20 px-1.5 py-0.5 rounded font-black">{currentUser.role}</span>. You do not have permissions to access the <span className="font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase font-bold">{targetRole}</span> workspace.
        </p>
        <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] text-red-400/80 font-mono text-left space-y-1">
          <div>INCIDENT CODE: ERR_AUTH_ELEVATION_TAMPER</div>
          <div>TIMESTAMP: {new Date().toISOString()}</div>
          <div>EMAIL SIGNATURE: {currentUser.email}</div>
          <div className="text-red-400/50 italic mt-1 font-sans text-xs">For security auditing purposes, this unauthorized attempt statement has been transmitted to server security logs.</div>
        </div>
      </div>
    );
  }

  // 4. Privileges are correct! Render target dashboard
  return <>{children}</>;
}
