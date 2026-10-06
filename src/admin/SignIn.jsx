import { useState } from 'react';
import { Button, Field, inputClass } from './ui';

/**
 * Sign-in for the admin.
 *
 * The server answers a wrong email and a wrong password identically, so this
 * shows whatever it was told rather than guessing which field was at fault —
 * a form that says "no such user" tells an attacker which addresses exist.
 */
export default function SignIn({ onSignIn, configured }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">The Vows and Visuals</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Website content</p>
        </div>

        {!configured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <strong className="block font-medium">Sign-in is not set up on this server.</strong>
            <p className="mt-1.5">
              Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{' '}
              <code className="rounded bg-amber-100 px-1">.env</code>, then run{' '}
              <code className="rounded bg-amber-100 px-1">npm run admin:password</code> and restart.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-4">
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" disabled={busy} className="justify-center">
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-neutral-500">
          Forgotten your password? It can be reset from the server for now; a self-service reset
          comes with the move to Cloudflare.
        </p>
      </div>
    </div>
  );
}
