import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-950 dark:to-slate-900">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Romaneio</h1>
          <p className="text-slate-600 dark:text-slate-400">Crie sua conta gratuitamente</p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Nome Completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="label">
              Confirmar Senha
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
              Concordo com os{' '}
              <Link href="/terms" className="text-primary-600 hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacy" className="text-primary-600 hover:underline">
                Política de Privacidade
              </Link>
            </label>
          </div>

          <button type="submit" className="btn-primary w-full">
            Cadastrar
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-slate-600 dark:text-slate-400">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
