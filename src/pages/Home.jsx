// Página inicial redirecionada para Central de Inteligência
// Este arquivo existe apenas como fallback — a rota "/" em App.jsx já aponta para InteligenciaEleitoral

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}