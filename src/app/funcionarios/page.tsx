'use client';

import { useDeferredValue, useEffect, useRef, useState, type FormEvent } from 'react';
import { LuBriefcaseBusiness, LuEye, LuPlus, LuSearch, LuUsersRound, LuX, LuPencil, LuTrash2, LuChevronLeft, LuChevronRight, LuRotateCw } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { isAdminUser } from '@/lib/admin';
import { MoneyInput } from '@/components/MoneyInput';
import { useFuncionariosList, useFuncionariosOverview, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario } from '@/hooks/cadastros/useFuncionarios';
import { createFuncionarioSchema } from '@/lib/validations/funcionarios';
import type { Funcionario } from '@/types';
import './funcionarios.css';

type Situacao = 'ativos' | 'desligados' | 'todos';
const statusFilters: { key: Situacao; label: string; count: 'ativos' | 'desligados' | 'total' }[] = [
    { key: 'ativos', label: 'Ativos', count: 'ativos' },
    { key: 'desligados', label: 'Desligados', count: 'desligados' },
    { key: 'todos', label: 'Todos', count: 'total' },
];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const isActive = (employee: Funcionario) => employee.ativo && !employee.dataDemissao;
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).filter((_, i, parts) => i === 0 || i === parts.length - 1).map(part => part[0]).join('').toLocaleUpperCase('pt-BR');
const dateInput = (date?: Date) => date ? new Date(date).toISOString().slice(0, 10) : '';
const displayDate = (date?: Date) => date ? new Date(date).toLocaleDateString('pt-BR') : 'Não informada';
const remuneration = (employee: Funcionario) => employee.salarioBase == null ? 'Não informada' : currency.format(employee.salarioBase);
// The existing cadastro identifies daily workers by their cargo; there is no period field.
const period = (cargo: string) => cargo.trim().toLocaleLowerCase('pt-BR') === 'diarista' ? '/dia' : '/mês';

export default function FuncionariosPage() {
    const [situacao, setSituacao] = useState<Situacao>('ativos');
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [cargo, setCargo] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<{ employee: Funcionario | null; mode: 'view' | 'edit' | 'create' } | null>(null);
    const params = { page, pageSize: 12, search: deferredSearch, situacao, cargo: cargo || undefined };
    const employees = useFuncionariosList(params);
    const overview = useFuncionariosOverview();
    const data = employees.data;
    const totalPages = Math.max(1, data?.totalPages ?? 1);
    const currentPage = Math.min(page, totalPages);
    // A deletion or status change can remove the last item on the current page.
    if (data && page > totalPages) setPage(totalPages);
    const filtering = Boolean(search || cargo || situacao !== 'ativos');

    function clearFilters() { setSearch(''); setCargo(''); setSituacao('ativos'); setPage(1); }

    return (
        <section className="employees-page" aria-labelledby="employees-title">
            <header className="employees-heading">
                <div className="employees-title-group">
                    <span className="employees-page-icon" aria-hidden="true"><LuUsersRound size={25} /></span>
                    <div><h1 id="employees-title">Funcionários</h1><p>Gestão da equipe</p></div>
                </div>
                <button type="button" className="employees-primary" onClick={() => setModal({ employee: null, mode: 'create' })}><LuPlus size={19} /> Novo funcionário</button>
            </header>

            <div className="employees-toolbar">
                <div className="employees-filters" role="group" aria-label="Situação dos funcionários">
                    {statusFilters.map(filter => <button type="button" key={filter.key} className={situacao === filter.key ? 'is-selected' : ''} aria-pressed={situacao === filter.key} onClick={() => { setSituacao(filter.key); setPage(1); }}>
                        {filter.label}<span>{overview.data?.[filter.count] ?? '—'}</span>
                    </button>)}
                </div>
                <label className="employees-search"><LuSearch size={19} aria-hidden="true" /><span className="employees-sr-only">Buscar por nome ou cargo</span><input type="search" placeholder="Buscar funcionário..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
                <label className="employees-cargo"><LuBriefcaseBusiness size={18} aria-hidden="true" /><span className="employees-sr-only">Filtrar por cargo</span><select value={cargo} onChange={event => { setCargo(event.target.value); setPage(1); }}><option value="">Todos os cargos</option>{overview.data?.cargos.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            </div>

            {overview.isError && <p className="employees-filter-error" role="alert">Não foi possível carregar as contagens e os cargos. <button type="button" onClick={() => overview.refetch()}>Tentar novamente</button></p>}

            {employees.isPending ? <div className="employees-grid" role="status" aria-label="Carregando funcionários">{Array.from({ length: 6 }, (_, i) => <div className="employee-skeleton" key={i}><span /><span /><span /></div>)}</div>
                : employees.isError ? <div className="employees-empty" role="alert"><LuUsersRound size={32} /><h2>Não foi possível carregar a equipe</h2><p>Verifique sua conexão e tente novamente.</p><button type="button" className="employees-outline" onClick={() => employees.refetch()}><LuRotateCw size={17} /> Tentar novamente</button></div>
                : data?.data.length ? <>
                    <div className="employees-grid" aria-busy={employees.isFetching || deferredSearch !== search}>
                        {data.data.map(employee => <article key={employee.id} className="employee-card">
                            <div className="employee-card-heading">
                                <span className={`employee-avatar ${!isActive(employee) ? 'is-inactive' : ''}`} aria-hidden="true">{initials(employee.nome)}</span>
                                <div className="employee-identity"><h2>{employee.nome}</h2><p>{employee.cargo}</p></div>
                                <EmployeeStatus employee={employee} />
                            </div>
                            <div className="employee-pay"><span>Remuneração</span><strong>{remuneration(employee)}{employee.salarioBase != null && <small>{period(employee.cargo)}</small>}</strong></div>
                            <button type="button" className="employee-view" aria-label={`Ver cadastro de ${employee.nome}`} onClick={() => setModal({ employee, mode: 'view' })}><LuEye size={18} /> Ver cadastro</button>
                        </article>)}
                    </div>
                    <footer className="employees-footer"><p role="status">{data.count} {data.count === 1 ? 'funcionário encontrado' : 'funcionários encontrados'}</p>{totalPages > 1 && <nav className="employees-pagination" aria-label="Páginas de funcionários"><button type="button" disabled={currentPage <= 1 || employees.isFetching} aria-label="Página anterior" onClick={() => setPage(value => value - 1)}><LuChevronLeft size={18} /></button><span>Página {currentPage} de {totalPages}</span><button type="button" disabled={currentPage >= totalPages || employees.isFetching} aria-label="Próxima página" onClick={() => setPage(value => value + 1)}><LuChevronRight size={18} /></button></nav>}</footer>
                </> : <div className="employees-empty"><LuUsersRound size={36} /><h2>{filtering ? 'Nenhum funcionário encontrado' : 'Sua equipe começa aqui'}</h2><p>{filtering ? 'Ajuste a busca ou os filtros para encontrar um cadastro.' : 'Cadastre o primeiro funcionário para organizar sua equipe.'}</p><button type="button" className="employees-outline" onClick={filtering ? clearFilters : () => setModal({ employee: null, mode: 'create' })}>{filtering ? 'Limpar filtros' : 'Cadastrar funcionário'}</button></div>}

            {modal && <EmployeeDialog key={`${modal.employee?.id ?? 'new'}-${modal.mode}`} employee={modal.employee} mode={modal.mode} onClose={() => setModal(null)} onEdit={() => setModal({ ...modal, mode: 'edit' })} />}
        </section>
    );
}

function EmployeeStatus({ employee }: { employee: Funcionario }) {
    return <span className={`employee-status ${isActive(employee) ? 'is-active' : 'is-inactive'}`}><span aria-hidden="true" />{isActive(employee) ? 'Ativo' : 'Desligado'}</span>;
}

function EmployeeDialog({ employee, mode, onClose, onEdit }: { employee: Funcionario | null; mode: 'view' | 'edit' | 'create'; onClose: () => void; onEdit: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const { user } = useAuth();
    const create = useCreateFuncionario();
    const update = useUpdateFuncionario();
    const remove = useDeleteFuncionario();
    const saving = create.isPending || update.isPending || remove.isPending;
    const busy = useRef(false);
    const [form, setForm] = useState({ nome: employee?.nome ?? '', cargo: employee?.cargo ?? '', telefone: employee?.telefone ?? '', salarioBase: employee?.salarioBase?.toString() ?? '', dataAdmissao: dateInput(employee?.dataAdmissao), dataDemissao: dateInput(employee?.dataDemissao), ativo: employee ? Boolean(isActive(employee)) : true });
    const [error, setError] = useState('');
    useEffect(() => {
        const element = dialog.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        element?.showModal();
        return () => { element?.close(); document.body.style.overflow = previousOverflow; };
    }, []);

    const close = () => { if (!busy.current) onClose(); };
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy.current) return;
        const toDate = (value: string) => value ? new Date(`${value}T12:00:00`) : null;
        const parsed = createFuncionarioSchema.safeParse({ ...form, salarioBase: form.salarioBase === '' ? null : Number(form.salarioBase), dataAdmissao: toDate(form.dataAdmissao), dataDemissao: toDate(form.dataDemissao), ativo: form.ativo && !form.dataDemissao });
        if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
        if (form.dataAdmissao && form.dataDemissao && form.dataDemissao < form.dataAdmissao) { setError('O desligamento deve ocorrer na data de admissão ou depois dela.'); return; }
        busy.current = true;
        setError('');
        try {
            if (employee) await update.mutateAsync({ id: employee.id, updates: parsed.data });
            else await create.mutateAsync(parsed.data);
            toast.success(employee ? 'Cadastro atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!');
            onClose();
        } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar o cadastro. Tente novamente.'); }
        finally { busy.current = false; }
    }

    async function deleteEmployee() {
        if (!employee || busy.current || !window.confirm(`Excluir permanentemente o cadastro de ${employee.nome}? O histórico financeiro pode ser afetado.`)) return;
        busy.current = true;
        setError('');
        try { await remove.mutateAsync(employee.id); toast.success('Funcionário excluído.'); onClose(); }
        catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível excluir o cadastro.'); }
        finally { busy.current = false; }
    }

    return <dialog ref={dialog} className="employee-dialog" aria-labelledby="employee-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <div className="employee-dialog-inner">
            <header className="employee-dialog-header"><div><h2 id="employee-dialog-title">{mode === 'view' ? 'Cadastro do funcionário' : mode === 'edit' ? 'Editar funcionário' : 'Novo funcionário'}</h2><p>{mode === 'view' ? 'Informações da equipe' : 'Preencha as informações do cadastro.'}</p></div><button type="button" className="employee-close" onClick={close} disabled={saving} aria-label="Fechar cadastro"><LuX size={21} /></button></header>
            {mode === 'view' && employee ? <>
                <div className="employee-detail-content"><div className="employee-detail-identity"><span className="employee-avatar" aria-hidden="true">{initials(employee.nome)}</span><div><h3>{employee.nome}</h3><p>{employee.cargo}</p></div><EmployeeStatus employee={employee} /></div>
                    <dl className="employee-details"><div><dt>Remuneração base</dt><dd>{remuneration(employee)}{employee.salarioBase != null && period(employee.cargo)}</dd></div><div><dt>Telefone</dt><dd>{employee.telefone ? <a href={`tel:${employee.telefone.replace(/[^\d+]/g, '')}`}>{employee.telefone}</a> : 'Não informado'}</dd></div><div><dt>Data de admissão</dt><dd>{displayDate(employee.dataAdmissao)}</dd></div>{!isActive(employee) && <div><dt>Data de desligamento</dt><dd>{displayDate(employee.dataDemissao)}</dd></div>}</dl>
                    {error && <p className="employee-form-error" role="alert">{error}</p>}
                </div>
                <footer className="employee-dialog-actions">{isAdminUser(user) && <button type="button" className="employee-delete" disabled={saving} onClick={deleteEmployee}><LuTrash2 size={17} /> {remove.isPending ? 'Excluindo...' : 'Excluir cadastro'}</button>}<button type="button" className="employees-primary" disabled={saving} onClick={onEdit}><LuPencil size={17} /> Editar cadastro</button></footer>
            </> : <form onSubmit={save}>
                <div className="employee-form-fields">
                    <label htmlFor="employee-name">Nome completo <span>*</span><input id="employee-name" required minLength={2} maxLength={100} autoComplete="name" value={form.nome} onChange={event => setForm({ ...form, nome: event.target.value })} /></label>
                    <div className="employee-form-row"><label htmlFor="employee-role">Cargo / função <span>*</span><input id="employee-role" required minLength={2} maxLength={50} value={form.cargo} onChange={event => setForm({ ...form, cargo: event.target.value })} /></label><label htmlFor="employee-pay">Remuneração base (R$)<MoneyInput id="employee-pay" value={form.salarioBase} onChange={value => setForm({ ...form, salarioBase: value.toString() })} /><small>{period(form.cargo) === '/dia' ? 'Valor por dia para diaristas.' : 'Valor mensal.'}</small></label></div>
                    <div className="employee-form-row"><label htmlFor="employee-phone">Telefone<input id="employee-phone" type="tel" autoComplete="tel" maxLength={20} value={form.telefone} onChange={event => setForm({ ...form, telefone: event.target.value })} /></label><label htmlFor="employee-status">Situação<select id="employee-status" value={form.ativo ? 'ativo' : 'desligado'} onChange={event => setForm({ ...form, ativo: event.target.value === 'ativo', dataDemissao: event.target.value === 'ativo' ? '' : form.dataDemissao })}><option value="ativo">Ativo</option><option value="desligado">Desligado</option></select></label></div>
                    <div className="employee-form-row"><label htmlFor="employee-start">Data de admissão<input id="employee-start" type="date" value={form.dataAdmissao} onChange={event => setForm({ ...form, dataAdmissao: event.target.value })} /></label><label htmlFor="employee-end">Data de desligamento<input id="employee-end" type="date" min={form.dataAdmissao || undefined} value={form.dataDemissao} onChange={event => setForm({ ...form, dataDemissao: event.target.value, ativo: event.target.value ? false : form.ativo })} /></label></div>
                    {error && <p className="employee-form-error" role="alert">{error}</p>}
                </div>
                <footer className="employee-dialog-actions"><button type="button" className="employees-outline" onClick={close} disabled={saving}>Cancelar</button><button type="submit" className="employees-primary" disabled={saving}>{saving ? 'Salvando...' : employee ? 'Salvar alterações' : 'Cadastrar funcionário'}</button></footer>
            </form>}
        </div>
    </dialog>;
}
