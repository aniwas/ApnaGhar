import React, { useState, useEffect } from 'react';
import { Home, Users, Sparkles, Building, Briefcase, Key, Eye, HelpCircle, Bell, Globe, Sun, Moon, Heart } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  openAIRecommendedBubble: () => void;
  currentUser?: { name: string; email: string; role: UserRole } | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  favoritesCount?: number;
}

export default function Navbar({ 
  currentRole, 
  onChangeRole, 
  openAIRecommendedBubble,
  currentUser,
  onLogout,
  onOpenAuth,
  favoritesCount = 0
}: NavbarProps) {
  const [showRoleSelectorMenu, setShowRoleSelectorMenu] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const { locale, setLocale, t } = useTranslation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'dark'; // default theme is dark glassmorphic
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const rolesList = [
    { value: UserRole.GUEST, label: 'Guest User', icon: Eye, color: 'text-indigo-400', desc: 'Browse and discover properties' },
    { value: UserRole.BUYER, label: 'Property Buyer', icon: HelpCircle, color: 'text-emerald-400', desc: 'Calculate EMIs, compare, save & buy' },
    { value: UserRole.TENANT, label: 'Tenant', icon: Key, color: 'text-cyan-400', desc: 'Search rentals & agreements' },
    { value: UserRole.OWNER, label: 'Home Owner', icon: Home, color: 'text-orange-400', desc: 'List self-owned houses' },
    { value: UserRole.AGENT, label: 'Property Agent', icon: Briefcase, color: 'text-amber-400', desc: 'Manage agencies & multiples' },
    { value: UserRole.ADMIN, label: 'Admin Executive', icon: Users, color: 'text-red-400', desc: 'Moderate, approve listings & stats' }
  ];

  const currentRoleConfig = rolesList.find(r => r.value === currentRole) || rolesList[0];

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 border border-white/15">
              <Building className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                <span className="text-blue-400 font-extrabold">Apna</span><span className="text-white font-extrabold">Ghar</span>
                <span className="text-[9px] uppercase font-mono tracking-widest bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 text-blue-300">
                  Full Stack
                </span>
              </h1>
              <p className="text-[9px] font-mono tracking-wider text-slate-400 hidden sm:block uppercase">{t('brand_subtitle')}</p>
            </div>
          </div>

          {/* Center Navigation Actions */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={openAIRecommendedBubble}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              {t('ask_ai_broker')}
            </button>
          </div>

          {/* Right Header Navigation Panel: ROLE MATRIX & AUTH */}
          <div className="flex items-center gap-3">
            
            {/* Elegant Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowRoleSelectorMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 active:scale-95 transition-all text-xs text-white font-bold cursor-pointer"
                title="Change Locale / भाषा बदलना"
              >
                <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="font-mono uppercase text-[11px] tracking-wider">
                  {locale === 'en' ? 'EN' : locale === 'hi' ? 'हिं' : 'मरा'}
                </span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-3 w-32 backdrop-blur-2xl bg-slate-900/95 rounded-2xl border border-white/15 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 divide-y divide-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setLocale('en');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold block transition-colors cursor-pointer hover:bg-white/5 ${locale === 'en' ? 'text-blue-400 font-extrabold bg-blue-500/10' : 'text-slate-300'}`}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale('hi');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold block transition-colors cursor-pointer hover:bg-white/5 ${locale === 'hi' ? 'text-blue-400 font-extrabold bg-blue-500/10' : 'text-slate-300'}`}
                  >
                    🇮🇳 हिन्दी
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale('mr');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold block transition-colors cursor-pointer hover:bg-white/5 ${locale === 'mr' ? 'text-blue-400 font-extrabold bg-blue-500/10' : 'text-slate-300'}`}
                  >
                    🇮🇳 मराठी
                  </button>
                </div>
              )}
            </div>
            
            {/* Premium Theme Switcher Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-white/5 text-slate-300 hover:text-white transition-all relative flex items-center justify-center select-none active:scale-95"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5 text-blue-500 animate-in fade-in zoom-in spin-in-12 duration-300" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-amber-500 animate-in fade-in zoom-in spin-in-12 duration-300" />
              )}
            </button>

            {/* Elegant Favorites Indicator/Badge */}
            <div className="relative group p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-white/5 text-slate-300 hover:text-white transition-all select-none active:scale-95" title="My Saved Shortcuts / Favorites">
              <Heart className="h-4.5 w-4.5 text-pink-500 fill-pink-500/25 group-hover:fill-pink-500 transition-all duration-300" />
              {favoritesCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-pink-500 text-[8px] font-black font-mono text-white flex items-center justify-center border border-slate-900 shadow-md transform scale-110 animate-bounce">
                  {favoritesCount}
                </span>
              ) : (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-slate-800 text-[8px] font-mono text-slate-400 flex items-center justify-center border border-slate-900">
                  0
                </span>
              )}
            </div>

            {/* Animated Notifications Bell */}
            <div className="relative group p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-white/5 text-slate-300 hover:text-white transition-all">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
            </div>

            {/* Registration System Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-[10px] font-extrabold text-blue-400 font-sans leading-tight">{t('namaste')}, {currentUser.name}!</span>
                  <span className="text-[8px] font-mono text-slate-400 capitalize">{currentUser.role.toLowerCase()} Account</span>
                </div>
                <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-sans font-black flex items-center justify-center text-xs shadow-md border border-white/10" title={currentUser.email}>
                  {currentUser.name.charAt(0)}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 transition-all cursor-pointer"
                  >
                    {t('logout')}
                  </button>
                )}
              </div>
            ) : (
              onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-black text-white shrink-0 cursor-pointer shadow transition-all duration-200"
                >
                  🔑 {t('register_account')}
                </button>
              )
            )}

            {/* Dynamic Roles Controller Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleSelectorMenu(!showRoleSelectorMenu);
                  setShowLangMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full bg-current ${currentRoleConfig.color} animate-ping`}></span>
                <span className="text-slate-400 hidden sm:inline">Role:</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  {currentRoleConfig.label}
                </span>
              </button>

              {/* Roles Dropdown List Menu */}
              {showRoleSelectorMenu && (
                <div className="absolute right-0 mt-3 w-72 backdrop-blur-2xl bg-slate-900/95 rounded-2xl border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold uppercase">
                      {t('switch_workspace')}
                    </span>
                    {currentUser && currentUser.role !== UserRole.ADMIN ? (
                      <p className="text-[9px] text-amber-500 mt-1 font-bold">🔒 {t('roles_managed_admin')}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">{t('explore_perspectives')}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                    {rolesList.map((roleOpt) => {
                      const Icon = roleOpt.icon;
                      const isSelected = roleOpt.value === currentRole;
                      const isLocked = currentUser && currentUser.role !== UserRole.ADMIN && roleOpt.value !== currentRole;

                      return (
                        <button
                          key={roleOpt.value}
                          disabled={isLocked}
                          onClick={() => {
                            onChangeRole(roleOpt.value);
                            setShowRoleSelectorMenu(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                          <div className={`p-2 rounded-lg bg-slate-800 ${roleOpt.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {roleOpt.label}
                              {isSelected && (
                                <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono uppercase">
                                  Current
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[8px] bg-slate-950/40 text-slate-400 border border-white/5 px-1.5 py-0.2 rounded font-mono uppercase font-black">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {roleOpt.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
