export type AppModuleKey =
    | 'convenios'
    | 'boletos'
    | 'caixa'
    | 'saidas'
    | 'vales'
    | 'marmitas'
    | 'pagamentos';

export type AppModule = {
    key: AppModuleKey;
    label: string;
    shortLabel: string;
    href: string;
    description: string;
};

export const APP_MODULES: AppModule[] = [
    {
        key: 'convenios',
        label: 'Convênios',
        shortLabel: 'Convênios',
        href: '/convenios',
        description: 'Clientes conveniados, fechamentos e cobranças.',
    },
    {
        key: 'boletos',
        label: 'Boletos',
        shortLabel: 'Boletos',
        href: '/boletos',
        description: 'Títulos, vencimentos, pagamentos e importação por PDF.',
    },
    {
        key: 'caixa',
        label: 'Caixa',
        shortLabel: 'Caixa',
        href: '/caixa',
        description: 'Fechamentos de turno, entradas e saídas do caixa.',
    },
    {
        key: 'saidas',
        label: 'Saídas',
        shortLabel: 'Saídas',
        href: '/saidas',
        description: 'Despesas avulsas e saídas lançadas pelo caixa.',
    },
    {
        key: 'vales',
        label: 'Vales',
        shortLabel: 'Vales',
        href: '/vales',
        description: 'Adiantamentos e vales de funcionários.',
    },
    {
        key: 'marmitas',
        label: 'Marmitas',
        shortLabel: 'Marmitas',
        href: '/marmitas',
        description: 'Pedidos, entregas e recebimentos de marmitas.',
    },
    {
        key: 'pagamentos',
        label: 'Pagamentos',
        shortLabel: 'Folha',
        href: '/folha-pagamento',
        description: 'Folha e pagamentos de funcionários.',
    },
];

export const DEFAULT_MODULE_VISIBILITY = APP_MODULES.reduce(
    (visibility, module) => ({
        ...visibility,
        [module.key]: true,
    }),
    {} as Record<AppModuleKey, boolean>
);
