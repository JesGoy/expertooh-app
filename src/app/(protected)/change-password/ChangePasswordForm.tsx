'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changePasswordAction, type ChangePasswordState } from './actions';
import { Button, Input } from '@/components/ui';

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const { pending } = useFormStatus();

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="text-center mb-6">
        <img
          src="/icons/logo-no-claim.svg"
          alt="ExpertooH"
          className="h-16 sm:h-20 md:h-[84px] w-auto mx-auto mb-6"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
          Cambiar contraseña
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 mt-2 mb-2">
          Ingresa y confirma tu nueva contraseña
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6">
        {state.success && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            ✓ Contraseña actualizada correctamente
          </div>
        )}

        {state.error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-3 sm:space-y-4">
          <Input
            type="password"
            id="currentPassword"
            name="currentPassword"
            label=""
            placeholder="Contraseña actual"
            required
            icon="/icons/key.svg"
            iconAlt="Contraseña"
            iconOpacity={0.45}
            error={state.fieldErrors?.currentPassword?.[0]}
          />

          <Input
            type="password"
            id="newPassword"
            name="newPassword"
            label=""
            placeholder="Nueva contraseña"
            required
            minLength={8}
            icon="/icons/key.svg"
            iconAlt="Contraseña"
            iconOpacity={0.45}
            error={state.fieldErrors?.newPassword?.[0]}
          />

          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            label=""
            placeholder="Confirmar nueva contraseña"
            required
            icon="/icons/key.svg"
            iconAlt="Contraseña"
            iconOpacity={0.45}
            error={state.fieldErrors?.confirmPassword?.[0]}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={pending}
          >
            Cambiar Contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}
