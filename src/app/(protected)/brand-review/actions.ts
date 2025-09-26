'use server';

import { getSession } from '@/infra/security/session';
import { makeAgencyBrandUseCases } from '@/infra/container/auth';
import { redirect } from 'next/navigation';

// Helper local (no export => no es Server Action)
function ensureAgency(session: { profile: string; userId: number } | null): asserts session is { profile: 'agencia'; userId: number } {
  if (!session) redirect('/login');
  if (session.profile !== 'agencia') redirect('/dashboard');
}

export async function assignBrandAction(formData: FormData): Promise<void> {
  const session = await getSession();
  ensureAgency(session);

  const brandId = Number(formData.get('brandId'));
  if (!Number.isInteger(brandId)) return;

  const { assign } = makeAgencyBrandUseCases();
  await assign.execute(session.userId, brandId);
}

export async function unassignBrandAction(formData: FormData): Promise<void> {
  const session = await getSession();
  ensureAgency(session);

  const brandId = Number(formData.get('brandId'));
  if (!Number.isInteger(brandId)) return;

  const { unassign } = makeAgencyBrandUseCases();
  await unassign.execute(session.userId, brandId);
}