import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('dralanrobertoferreira@gmail.com');
  const [password, setPassword] = useState('Admin@2026');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#7AC943] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Esperançar</h1>
          <p className="text-slate-400 text-sm">Plataforma Estratégica Política</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-[#0A2540] mb-6">Entrar na plataforma</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-[#7AC943] hover:bg-[#5DA830] text-white font-medium py-2.5 rounded-xl transition-colors"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              <strong>Senha padrão:</strong> Admin@2026
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Acesse e altere a senha em Configurações → Segurança.
            </p>
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 Esperançar — Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}