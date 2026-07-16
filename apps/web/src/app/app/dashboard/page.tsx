import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { title: 'Total de Questões', value: '0', icon: '📝' },
            { title: 'Taxa de Acerto', value: '0%', icon: '✅' },
            { title: 'Horas de Estudo', value: '0h', icon: '⏱️' },
            { title: 'Sequência', value: '0 dias', icon: '🔥' },
          ].map((stat) => (
            <div key={stat.title} className="card p-6">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stat.title}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Evolução</h2>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
              <p className="text-slate-500">Gráfico de evolução (em desenvolvimento)</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Desempenho por Matéria</h2>
            <div className="space-y-4">
              {['Português', 'Matemática', 'História'].map((subject) => (
                <div key={subject}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{subject}</span>
                    <span className="text-sm text-slate-500">0%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 card p-6">
          <h2 className="text-2xl font-bold mb-4">Atividades Recentes</h2>
          <p className="text-slate-600 dark:text-slate-400">Nenhuma atividade ainda</p>
        </div>
      </div>
    </div>
  );
}
