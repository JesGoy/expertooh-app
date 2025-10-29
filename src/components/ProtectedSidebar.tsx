'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';

interface Props {
  profile: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ProtectedSidebar({ profile, isOpen = false, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      {/* Overlay (móvil) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 lg:w-72 h-screen bg-white border-r border-neutral-200 flex flex-col fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-16 lg:h-20 px-6 flex items-center justify-between border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center" onClick={onClose}>
            <Image
              src="/icons/logo-no-claim.svg"
              alt="ExpertooH"
              width={160}
              height={48}
              className="h-10 lg:h-12 w-auto"
              priority
            />
          </Link>
          {/* Botón cerrar (móvil) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <img src="/icons/close.svg" alt="Cerrar" className="w-5 h-5" />
          </button>
        </div>

      

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto py-4">
      

        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
            isActive('/dashboard')
              ? 'text-brand bg-brand/5 border-r-2 border-brand font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <img src="/icons/home.svg" alt="" className="w-5 h-5" />
          Dashboard
        </Link>

       

        {/* Reportes */}
        <Link
          href="/reports"
          onClick={onClose}
          className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
            isActive('/reports')
              ? 'text-brand bg-brand/5 border-r-2 border-brand font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <img src="/icons/document.svg" alt="" className="w-5 h-5" />
          Reportes
        </Link>

        {/* Brand Review (solo agencia) */}
        {profile === 'agencia' && (
          <Link
            href="/brand-review"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              isActive('/brand-review')
                ? 'text-brand bg-brand/5 border-r-2 border-brand font-medium'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <img src="/icons/clipboard-check.svg" alt="" className="w-5 h-5" />
            Brand Review
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200">
        {/* Configuración */}
        <Link
          href="/change-password"
          onClick={onClose}
          className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
            isActive('/change-password')
              ? 'text-brand bg-brand/5 font-medium'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <img src="/icons/settings.svg" alt="" className="w-5 h-5" />
          Configuración
        </Link>

        {/* Cerrar sesión */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-6 py-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <img src="/icons/logout.svg" alt="" className="w-5 h-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
    </>
  );
}
