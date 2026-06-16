import { WorkspaceStatusBadge } from "@/components/layout/workspace-status-badge";

type HeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  readyDocuments?: number;
  aiConfigured?: boolean;
};

export function Header({
  title,
  description,
  action,
  readyDocuments,
  aiConfigured,
}: HeaderProps) {
  const showStatus =
    readyDocuments !== undefined && aiConfigured !== undefined;

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 sm:line-clamp-1">
              {description}
            </p>
          ) : null}
        </div>

        {(showStatus || action) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {showStatus ? (
              <WorkspaceStatusBadge
                readyDocuments={readyDocuments}
                aiConfigured={aiConfigured}
              />
            ) : null}
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
