import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-950 dark:to-slate-900">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Romaneio</h1>
          <p className="text-slate-600 dark:text-slate-400">Faça login na sua conta</p>
        </div>

        <form className="space-y-4">
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

          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-slate-600 dark:text-slate-400">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-primary-600 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

        <div className="mt-4">
          <Link
            href="/auth/reset-password"
            className="text-center block text-sm text-slate-600 dark:text-slate-400 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>
    </div>
  );
}
