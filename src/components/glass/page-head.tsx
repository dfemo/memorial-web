import type { ReactNode } from "react";

export function PageHead({
  title,
  sub,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  /** Actions shown on the right. */
  children?: ReactNode;
}) {
  return (
    <div className="gl-page-head">
      <div>
        <h1 className="gl-page-title">{title}</h1>
        {sub && <p className="gl-page-sub">{sub}</p>}
      </div>
      {children && <div className="gl-page-actions">{children}</div>}
    </div>
  );
}

export function Note({ kind, children }: { kind?: "error" | "status"; children: ReactNode }) {
  return (
    <div className="gl-card gl-note" data-kind={kind} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
