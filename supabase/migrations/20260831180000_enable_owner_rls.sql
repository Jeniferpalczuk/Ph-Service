-- Protege os dados do PH Service por usuário.
--
-- A aplicação sempre grava o user_id a partir da sessão do Supabase. Estas
-- políticas garantem no banco a mesma regra para INSERT, UPDATE, DELETE e
-- SELECT, mesmo que uma chamada venha diretamente do navegador.
--
-- A migração é idempotente: pode ser executada mais de uma vez sem recriar a
-- política com o mesmo nome. Ela não remove políticas existentes de outros
-- módulos.

BEGIN;

DO $$
DECLARE
    table_name text;
    service_tables text[] := ARRAY[
        'funcionarios',
        'clientes',
        'fornecedores',
        'boletos',
        'convenios',
        'fechamentos_caixa',
        'saidas',
        'vales',
        'marmitas',
        'folha_pagamento'
    ];
BEGIN
    FOREACH table_name IN ARRAY service_tables LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            table_name
        );

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = table_name
              AND policyname = 'ph_service_owner_all'
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I
                 FOR ALL TO authenticated
                 USING (auth.uid() = user_id)
                 WITH CHECK (auth.uid() = user_id)',
                'ph_service_owner_all',
                table_name
            );
        END IF;
    END LOOP;

    -- Preferências usam o próprio id como identificação do usuário.
    IF to_regclass('public.user_preferences') IS NOT NULL THEN
        ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'user_preferences'
              AND policyname = 'ph_service_user_preferences_owner'
        ) THEN
            CREATE POLICY ph_service_user_preferences_owner
                ON public.user_preferences
                FOR ALL TO authenticated
                USING (auth.uid() = id)
                WITH CHECK (auth.uid() = id);
        END IF;
    END IF;
END
$$;

COMMIT;
