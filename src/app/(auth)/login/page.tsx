import dynamic from "next/dynamic";

export const metadata = {
  title: "Login — ExpertooH",
};

const LoginSection = dynamic(async () => {
  const LoginForm = (await import("@/components/auth/LoginForm")).default;
  return function Section() {
  return <LoginForm />;
  };
});

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] grid md:grid-cols-2">
      <div className="grid place-items-center p-6">
        <LoginSection />
      </div>
      <div className="hidden md:block relative overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-[url('/images/loginbackground.jpg')] bg-cover bg-center opacity-50 blur-sm
        "></div>
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
  