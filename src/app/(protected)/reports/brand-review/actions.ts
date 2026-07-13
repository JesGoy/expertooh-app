'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { makeAgencyBrandUseCases } from '@/infra/container/auth';
import { USER_PROFILES } from '@/core/domain/constants/profiles';
import { ROUTES } from '@/lib/routes';

// Helper local (no export => no es Server Action)
function ensureAgency(
  session: { profile: string; userId: number } | null,
): asserts session is { profile: typeof USER_PROFILES.AGENCIA; userId: number } {
  if (!session) redirect(ROUTES.LOGIN);
  if (session.profile !== USER_PROFILES.AGENCIA) redirect(ROUTES.DASHBOARD);
}

export async function assignBrandAction(formData: FormData): Promise<void> {
  const session = await getSession();
  ensureAgency(session);

  const brandId = Number(formData.get('brandId'));
  if (!Number.isInteger(brandId)) return;

  const { assign } = makeAgencyBrandUseCases();
  await assign.execute(session.userId, brandId);
  revalidatePath(ROUTES.REPORT_BRAND_REVIEW);
}

export async function unassignBrandAction(formData: FormData): Promise<void> {
  const session = await getSession();
  ensureAgency(session);

  const brandId = Number(formData.get('brandId'));
  if (!Number.isInteger(brandId)) return;

  const { unassign } = makeAgencyBrandUseCases();
  await unassign.execute(session.userId, brandId);
  revalidatePath(ROUTES.REPORT_BRAND_REVIEW);
}
