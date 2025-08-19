import dynamic from "next/dynamic";

export const metadata = {
  title: "Login — ExpertooH",
};

const LoginSection = dynamic(async () => {
  const LoginForm = (await import("@/components/auth/LoginForm")).default;
  return function Section() {
  return <LoginForm brand={{ name: "ExpertooH" }} />;
  };
});

export default function LoginPage() {
  return (
  <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Una mirada al futuro del Marketing OOH
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Accede a tu panel para optimizar tus campañas OOH
          </p>
        </div>
        <div className="grid place-items-center">
          <LoginSection />
        </div>
      </div>
    </main>
  );
}
