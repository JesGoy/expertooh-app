'use client';

import { useActionState } from 'react';
import { changePasswordAction, type ChangePasswordState } from './actions';

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <div className="rounded border bg-white p-6">
      {state.success && (
        <div className="mb-4 rounded bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          ✓ Contraseña actualizada correctamente
        </div>
      )}

      {state.error && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Contraseña Actual
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {state.fieldErrors?.currentPassword && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.currentPassword[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Nueva Contraseña
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            required
            minLength={8}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {state.fieldErrors?.newPassword && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.newPassword[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Confirmar Nueva Contraseña
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`w-full px-4 py-2 rounded text-sm font-medium transition ${
            pending
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              : 'bg-brand text-white hover:opacity-90'
          }`}
        >
          {pending ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
  );
}
