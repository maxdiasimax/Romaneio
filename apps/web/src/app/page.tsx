import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">Romaneio</div>
          <div className="flex gap-4">
            {session ? (
              <>
                <Link
                  href="/app/dashboard"
                  className="btn-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="btn-secondary"
                >
                  Sair
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary">
                  Entrar
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            Prepare-se para Concursos com IA
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Questões geradas por inteligência artificial, simulados personalizados, flashcards e
            muito mais para sua preparação ser 100% eficaz.
          </p>
          {!session && (
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="btn-primary py-3 px-8 text-lg">
                Começar Grátis
              </Link>
              <Link href="#features" className="btn-secondary py-3 px-8 text-lg">
                Ver Features
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 dark:bg-slate-800/50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Funcionalidades</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Questões por IA',
                description: 'Questões geradas por inteligência artificial obedecendo seus parâmetros',
                icon: '🤖',
              },
              {
                title: 'Simulados Completos',
                description: 'Simule provas completas com timer e análise detalhada',
                icon: '📝',
              },
              {
                title: 'Flashcards Inteligentes',
                description: 'Revise com spaced repetition para máxima retenção',
                icon: '📚',
              },
              {
                title: 'Dashboard Avançado',
                description: 'Acompanhe sua evolução com gráficos e KPIs em tempo real',
                icon: '📊',
              },
              {
                title: 'Múltiplas Bancas',
                description: 'Questões de ENEM, OAB, CESPE, VUNESP, FCC e mais',
                icon: '🏦',
              },
              {
                title: 'Planos Flexíveis',
                description: 'Escolha entre Free, Pro ou Premium e pague com PIX',
                icon: '💳',
              },
            ].map((feature, idx) => (
              <div key={idx} className="card p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Crie sua conta gratuitamente e comece a estudar agora
          </p>
          {!session && (
            <Link href="/auth/register" className="btn-primary py-3 px-8 text-lg inline-block">
              Criar Conta Grátis
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-6 text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2024 Romaneio. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
