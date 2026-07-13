'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import { reportsForProfile } from '@/app/(protected)/reports/registry';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface Props {
  profile: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  withActiveBorder?: boolean;
  onClick?: () => void;
}

function NavLink({ href, icon, label, isActive, withActiveBorder = true, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors',
        isActive
          ? cn('text-brand bg-brand/5 font-medium', withActiveBorder && 'border-r-2 border-brand')
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
      )}
    >
      <img src={icon} alt="" className="w-5 h-5" />
      {label}
    </Link>
  );
}

export default function ProtectedSidebar({ profile, isOpen = false, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const hasReports = reportsForProfile(profile).length > 0;

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
      <aside
        className={cn(
          'w-64 lg:w-72 h-screen bg-white border-r border-neutral-200 flex flex-col fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="h-16 lg:h-20 px-6 flex items-center justify-between border-b border-neutral-200">
          <Link href={ROUTES.DASHBOARD} className="flex items-center" onClick={onClose}>
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
          <NavLink
            href={ROUTES.DASHBOARD}
            icon="/icons/home.svg"
            label="Dashboard"
            isActive={isActive(ROUTES.DASHBOARD)}
            onClick={onClose}
          />
          {hasReports && (
            <NavLink
              href={ROUTES.REPORTS}
              icon="/icons/document.svg"
              label="Reportes"
              isActive={isActive(ROUTES.REPORTS)}
              onClick={onClose}
            />
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200">
          <NavLink
            href={ROUTES.CHANGE_PASSWORD}
            icon="/icons/settings.svg"
            label="Configuración"
            isActive={isActive(ROUTES.CHANGE_PASSWORD)}
            withActiveBorder={false}
            onClick={onClose}
          />

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
