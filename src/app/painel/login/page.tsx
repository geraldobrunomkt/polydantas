"use client";

import { useState, useTransition } from "react";
import { checkName, setFirstPin, login } from "./actions";

type Step =
  | { kind: "name" }
  | { kind: "create_pin"; name: string }
  | { kind: "confirm_pin"; name: string; firstPin: string }
  | { kind: "enter_pin"; name: string };

const PIN_MAX = 6;
const PIN_MIN = 4;

export default function LoginPage() {
  const [step, setStep] = useState<Step>({ kind: "name" });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await checkName(name);
      if (result.status === "error") {
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

  function backToName() {
    setStep({ kind: "name" });
    setError(null);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-white px-5 py-10">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-violet-900">Poly Dantas</h1>
          <p className="text-sm text-slate-500 mt-1">Painel interno da equipe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          {step.kind === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Seu nome
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Camila"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-violet-600 text-white py-3.5 font-medium text-base active:scale-[0.98] transition hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {step.kind === "create_pin" && (
            <PinStep
              key="create"
              title={`Primeiro acesso, ${step.name.split(" ")[0]}!`}
              subtitle="Crie um PIN de 4 a 6 números."
              error={error}
              onBack={backToName}
              onComplete={(pin) => {
                setError(null);
                setStep({ kind: "confirm_pin", name: step.name, firstPin: pin });
              }}
            />
          )}

          {step.kind === "confirm_pin" && (
            <PinStep
              key="confirm"
              title="Repita o PIN"
              subtitle="Só pra confirmar que não errou nada."
              error={error}
              onBack={() => setStep({ kind: "create_pin", name: step.name })}
              onComplete={(pin) => {
                if (pin !== step.firstPin) {
                  setError("Os PINs não são iguais.");
                  setStep({ kind: "create_pin", name: step.name });
                  return;
                }
                setError(null);
                startTransition(async () => {
                  const result = await setFirstPin(step.name, pin);
                  if (result?.error) {
                    setError(result.error);
                    setStep({ kind: "create_pin", name: step.name });
                  }
                });
              }}
              pending={isPending}
            />
          )}

          {step.kind === "enter_pin" && (
            <PinStep
              key="enter"
              title={`Olá, ${step.name.split(" ")[0]}!`}
              subtitle="Digite seu PIN."
              error={error}
              onBack={backToName}
              onComplete={(pin) => {
                setError(null);
                startTransition(async () => {
                  const result = await login(step.name, pin);
                  if (result?.error) setError(result.error);
                });
              }}
              pending={isPending}
            />
          )}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Depois de entrar, o app fica logado neste aparelho.
        </p>
      </div>
    </div>
  );
}

function PinStep({
  title,
  subtitle,
  error,
  onBack,
  onComplete,
  pending,
}: {
  title: string;
  subtitle: string;
  error: string | null;
  onBack: () => void;
  onComplete: (pin: string) => void;
  pending?: boolean;
}) {
  const [pin, setPin] = useState("");

  function press(digit: string) {
    if (pending) return;
    if (pin.length >= PIN_MAX) return;
    setPin((p) => p + digit);
  }

  function backspace() {
    if (pending) return;
    setPin((p) => p.slice(0, -1));
  }

  function confirm() {
    if (pending || pin.length < PIN_MIN) return;
    onComplete(pin);
    setPin("");
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-medium text-slate-800">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex justify-center gap-2.5">
        {Array.from({ length: PIN_MAX }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border-2 transition-all ${
              i < pin.length
                ? "bg-violet-600 border-violet-600 scale-110"
                : "border-slate-300"
            }`}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="grid grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadButton key={d} onClick={() => press(d)}>
            {d}
          </PadButton>
        ))}
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl py-3.5 text-sm font-medium text-slate-400 active:bg-slate-100 transition"
        >
          Voltar
        </button>
        <PadButton onClick={() => press("0")}>0</PadButton>
        <button
          type="button"
          onClick={backspace}
          aria-label="Apagar"
          className="rounded-2xl py-3.5 text-lg text-slate-500 active:bg-slate-100 transition"
        >
          ⌫
        </button>
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={pending || pin.length < PIN_MIN}
        className="w-full rounded-xl bg-violet-600 text-white py-3.5 font-medium text-base active:scale-[0.98] transition hover:bg-violet-700 disabled:opacity-40"
      >
        {pending ? "Entrando..." : "Confirmar"}
      </button>
    </div>
  );
}

function PadButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-slate-50 py-3.5 text-lg font-semibold text-slate-700 active:bg-violet-100 active:text-violet-700 transition"
    >
      {children}
    </button>
  );
}
