create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('repository', 'pull_request')),
  owner text not null,
  repository text not null,
  pull_number integer,
  title text not null,
  url text not null,
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  total_findings integer not null default 0,
  include_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  filename text not null,
  line integer not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  category text not null,
  description text not null,
  suggestion text not null,
  source text not null check (source in ('static', 'ai')),
  created_at timestamptz not null default now()
);

create index if not exists analyses_created_at_idx on analyses(created_at desc);
create index if not exists findings_analysis_id_idx on findings(analysis_id);
