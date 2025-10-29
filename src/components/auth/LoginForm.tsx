"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from 'react-dom';
import { loginAction } from '@/app/(auth)/actions';
import { Button, Input, Checkbox } from "@/components/ui";

export default function LoginForm() {
  // Uncontrolled form is fine; keep minimal state for UX if desired
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [state, formAction] = useActionState<{ error?: string }, FormData>(loginAction, {});

  return (
  <div className="w-full max-w-xl mx-auto px-4">
    <div className="text-center mb-6">
      <img
        src="/icons/logo-no-claim.svg/"
        alt="ExpertooH"
        className="h-16 sm:h-20 md:h-[84px] w-auto mx-auto mb-6"
      />
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
        Iniciar sesión
      </h1>
      <p className="text-base sm:text-lg text-neutral-600 mt-2 mb-2">
        Continúa con usuario y contraseña
      </p>
    </div>
    <div className="bg-white rounded-2xl p-4 sm:p-6">

    <form action={formAction} className="space-y-3 sm:space-y-4" noValidate>
          <Input
            id="username"
            name="username"
            label=""
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de Usuario"
            icon="/icons/sms.svg"
            iconAlt="Usuario"
            iconOpacity={1}
          />

          <Input
            id="password"
            name="password"
            label=""
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon="/icons/key.svg"
            iconAlt="Contraseña"
            iconOpacity={0.45}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              name="remember"
              label="Recordarme"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
      <a href="#" className="text-sm text-[#FF6B00] hover:underline">
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

        <div className="mt-8 text-center text-sm">
          <span className="text-neutral-600">¿No tienes cuenta? </span>
          <a href="#" className="text-neutral-900 hover:underline font-semibold">
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      fullWidth
      isLoading={pending}
    >
      Ingresar
    </Button>
  );
}
