import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const FEATURES = [
  { icon: '📋', label: 'Registro de Eventos', desc: 'Flujo paso a paso por MD con 8 preguntas y foto de puntos' },
  { icon: '⬆️', label: 'Sistema de Ascensos', desc: 'Promoción a Aspirante con menú de selección de tipo y usuario' },
  { icon: '⚠️', label: 'Warns & Sanciones', desc: '/warn, /delwarn e /historial con sanciones automáticas por acumulado' },
  { icon: '🔴', label: 'Sanciones Automáticas', desc: '2 warns → aislamiento 3d · 4 → 1 semana + bajada de rango · 6 → expulsión · 8 → ban' },
  { icon: '👋', label: 'Bienvenida Automática', desc: 'Embed en canal + MD personalizado a cada nuevo miembro' },
];

function StatusDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
    </span>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-4 py-16 font-sans">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div className="w-24 h-24 rounded-full bg-[#9C1F1F] flex items-center justify-center text-5xl shadow-lg shadow-[#9C1F1F]/30">
          ⚔️
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Kairon Bot</h1>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-950/60 border border-green-800/50">
          <StatusDot />
          <span className="text-sm text-green-400 font-medium">En línea</span>
        </div>
        <p className="text-gray-400 text-center max-w-md text-sm leading-relaxed">
          Bot oficial de <span className="text-[#c0282880] font-semibold text-white">Kairon Group</span>.
          Gestiona registros de eventos, ascensos, sanciones y bienvenidas automáticamente.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="bg-[#181818] border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-[#9C1F1F]/50 transition-colors"
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="font-semibold text-sm text-white">{f.label}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-14 text-xs text-gray-700">
        Kairon Group · Bot v1.0
      </p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

export default App;
