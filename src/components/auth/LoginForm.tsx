"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from 'react-dom';
import { loginAction } from '@/app/(auth)/actions';

type Props = {
  brand?: { name?: string; logoUrl?: string };
};

export default function LoginForm({ brand }: Props) {
  // Uncontrolled form is fine; keep minimal state for UX if desired
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [state, formAction] = useActionState<{ error?: string }, FormData>(loginAction, {});

  return (
  <div className="w-full max-w-md mx-auto">
      <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur border border-neutral-200/60 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt={brand?.name ?? "Logo"}
              className="h-8 w-8 rounded-md"
            />
          ) : (
            <div className="h-8 w-8 rounded-md bg-brand" />
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Inicia sesión
            </h1>
            <p className="text-sm text-neutral-500">
              Accede al panel de ExpertooH
            </p>
          </div>
        </div>

    <form action={formAction} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none ring-0 focus:border-brand"
              placeholder=""
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none ring-0 focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
        name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 accent-brand"
              />
              Recordarme
            </label>
      <a href="#" className="text-sm link-primary">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

      {state?.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm"
            >
        {state.error}
            </div>
          )}

      <SubmitButton />
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Protegido y privado. Solo personal autorizado.
        </p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full btn btn-primary"
    >
      {pending ? "Ingresando…" : "Ingresar"}
    </button>
  );
}
