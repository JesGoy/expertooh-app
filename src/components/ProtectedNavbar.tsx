import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
interface Props {
  username: string;
  profile: string;
}
export default function ProtectedNavbar({ username, profile }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-brand" />
            <span className="text-sm font-semibold text-ink">ExpertooH</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 ml-4 text-sm">
            <Link className="text-neutral-600 hover:text-ink" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-neutral-600 hover:text-ink" href="/reports">
              Reportes
            </Link>
            {profile === "agencia" && (
              <Link
                href="/brand-review"
                className="text-neutral-600 hover:text-ink"
              >
                Brand Review
              </Link>
            )}
            <Link className="text-neutral-600 hover:text-ink" href="/change-password">
              Cambiar Contraseña
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 hidden sm:inline">
            {username || "Usuario"}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="btn btn-primary text-xs px-3 py-1.5"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
