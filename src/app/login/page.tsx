"use client";

import { useState, useTransition } from "react";
import { checkName, bootstrapMaster, setFirstPin, login } from "./actions";

type Step =
  | { kind: "name" }
  | { kind: "bootstrap"; name: string }
  | { kind: "create_pin"; name: string }
  | { kind: "enter_pin"; name: string };

export default function LoginPage() {
  const [step, setStep] = useState<Step>({ kind: "name" });
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await checkName(name);
      if (result.status === "bootstrap") {
        setStep({ kind: "bootstrap", name });
      } else if (result.status === "error") {
        setError(result.message);
      } else if (result.status === "not_found") {
        setError("Nome não encontrado. Peça para o admin te cadastrar.");
      } else if (result.status === "needs_pin") {
        setStep({ kind: "create_pin", name: result.name });
      } else {
        setStep({ kind: "enter_pin", name: result.name });
      }
    });
  }

  function handleBootstrapSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pin !== pin2) {
      setError("Os PINs não são iguais.");
      return;
    }
    startTransition(async () => {
      const result = await bootstrapMaster(name, pin);
      if (result?.error) setError(result.error);
    });
  }

  function handleCreatePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pin !== pin2) {
      setError("Os PINs não são iguais.");
      return;
    }
    startTransition(async () => {
      const result = await setFirstPin(name, pin);
      if (result?.error) setError(result.error);
    });
  }

  function handleEnterPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login(name, pin);
      if (result?.error) setError(result.error);
    });
  }

  function backToName() {
    setStep({ kind: "name" });
    setPin("");
    setPin2("");
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-violet-900">Poly Dantas</h1>
          <p className="text-sm text-slate-500 mt-1">Painel interno da equipe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {step.kind === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Seu nome
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Camila"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {step.kind === "bootstrap" && (
            <form onSubmit={handleBootstrapSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                Ainda não há ninguém cadastrado. <strong>{name}</strong> será o
                administrador master do sistema.
              </p>
              <PinField label="Crie um PIN (4 a 6 números)" value={pin} onChange={setPin} />
              <PinField label="Repita o PIN" value={pin2} onChange={setPin2} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Criando..." : "Criar conta master"}
              </button>
              <BackLink onClick={backToName} />
            </form>
          )}

          {step.kind === "create_pin" && (
            <form onSubmit={handleCreatePinSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                Primeiro acesso, <strong>{name}</strong>! Crie seu PIN.
              </p>
              <PinField label="Crie um PIN (4 a 6 números)" value={pin} onChange={setPin} />
              <PinField label="Repita o PIN" value={pin2} onChange={setPin2} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Salvando..." : "Salvar PIN e entrar"}
              </button>
              <BackLink onClick={backToName} />
            </form>
          )}

          {step.kind === "enter_pin" && (
            <form onSubmit={handleEnterPinSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                Olá, <strong>{name}</strong>! Digite seu PIN.
              </p>
              <PinField label="PIN" value={pin} onChange={setPin} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Entrando..." : "Entrar"}
              </button>
              <BackLink onClick={backToName} />
            </form>
          )}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Depois de entrar, o app fica logado neste aparelho.
        </p>
      </div>
    </div>
  );
}

function PinField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
        required
        autoFocus
      />
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
    >
      Voltar
    </button>
  );
}
