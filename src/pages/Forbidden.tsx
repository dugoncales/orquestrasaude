import { Link, useLocation } from "react-router-dom";

const Forbidden = () => {
  const location = useLocation();
  const state = (location.state as { from?: string; auditId?: string } | null) ?? null;
  const from = state?.from;
  const auditId = state?.auditId;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="mb-2 text-3xl font-bold">403</h1>
        <p className="mb-3 text-lg">Acesso negado</p>
        <p className="mb-6 text-sm text-muted-foreground">
          Você não possui permissão para acessar esta área.
          {from ? ` Origem da tentativa: ${from}.` : ""}
          {auditId ? ` ID de auditoria: ${auditId}.` : ""}
        </p>
        <div className="flex gap-3">
          <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Voltar ao dashboard
          </Link>
          <Link to="/login" className="rounded-md border px-4 py-2 text-sm">
            Trocar de conta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
