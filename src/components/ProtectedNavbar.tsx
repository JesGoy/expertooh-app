'use client';

interface Props {
  username: string;
  onMenuToggle?: () => void;
}

export default function ProtectedNavbar({ username, onMenuToggle }: Props) {
  // Extraer iniciales del username para avatar
  const initials = username
    ? username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Botón menú hamburguesa (móvil) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Abrir menú"
        >
          <img src="/icons/menu.svg" alt="Menú" className="w-6 h-6" />
        </button>

        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-9 pl-10 pr-4 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <img 
              src="/icons/search.svg" 
              alt="" 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
            />
          </div>
        </div>

        {/* Avatar de usuario con dropdown chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <img src="/icons/chevron-down.svg" alt="" className="w-4 h-4 opacity-40" />
        </div>
      </div>
    </header>
  );
}
