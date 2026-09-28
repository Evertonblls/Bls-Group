-- Link do formulário (ClickUp) enviado ao cliente no onboarding.
-- Rode depois do 0008_financeiro.sql (Supabase Dashboard > SQL Editor, ou `supabase db push`).

insert into public.app_settings (key, value)
values (
  'onboarding_formulario_cliente_url',
  'https://forms.clickup.com/9013216100/f/8ckngv4-12173/XNBHFJDLPKHBSB39M9'
)
on conflict (key) do nothing;

-- Quem usa o onboarding (colaborador) também precisa ler esse link.
create policy "equipe vê link do formulário do cliente"
  on public.app_settings for select
  to authenticated
  using (
    key = 'onboarding_formulario_cliente_url'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'colaborador')
    )
  );

create policy "admin e colaborador editam link do formulário do cliente"
  on public.app_settings for update
  to authenticated
  using (
    key = 'onboarding_formulario_cliente_url'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'colaborador')
    )
  )
  with check (
    key = 'onboarding_formulario_cliente_url'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'colaborador')
    )
  );
