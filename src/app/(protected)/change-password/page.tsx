import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import dynamic from "next/dynamic";

export const runtime = 'nodejs';
export const metadata = {
  title: "Cambiar Contraseña — ExpertooH",
};

const ChangePasswordSection = dynamic(() => import("./ChangePasswordForm"), {
  loading: () => (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="animate-pulse">
        <div className="h-20 w-40 bg-neutral-200 rounded-lg mx-auto mb-6" />
        <div className="h-10 w-3/4 bg-neutral-200 rounded-lg mx-auto mb-2" />
        <div className="h-6 w-1/2 bg-neutral-200 rounded-lg mx-auto mb-8" />
        <div className="bg-white rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="h-12 bg-neutral-200 rounded-2xl" />
          <div className="h-12 bg-neutral-200 rounded-2xl" />
          <div className="h-12 bg-neutral-200 rounded-2xl" />
          <div className="h-12 bg-neutral-200 rounded-2xl" />
        </div>
      </div>
    </div>
  )
});

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <main className="min-h-[100dvh] grid md:grid-cols-2">
      <div className="grid place-items-center p-6">
        <ChangePasswordSection />
      </div>
      <div className="hidden md:block relative overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-[url('/images/loginbackground.jpg')] bg-cover bg-center opacity-50 blur-sm"></div>
        <div className="absolute left-20 bottom-0 p-8">
          <h1 className="text-[8rem] leading-[1.0] font-black tracking-tight">
            <span className="text-white block">YOU KNOW</span>
            <span className="text-white block">THAT</span>
            <span className="text-[#FF6B00] block">WE</span>
            <span className="text-[#FF6B00] block">KNOW</span>
          </h1>
        </div>
      </div>
    </main>
  );
}
