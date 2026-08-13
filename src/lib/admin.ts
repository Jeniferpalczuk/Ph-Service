import type { User } from '@supabase/supabase-js';

const ADMIN_NAMES = ['jenifer rodrigues'];

function normalize(value: unknown) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

export function isAdminUser(user: User | null | undefined) {
    if (!user) return false;

    const metadataRole = normalize(user.app_metadata?.role || user.user_metadata?.role);
    if (metadataRole === 'adm' || metadataRole === 'admin' || metadataRole === 'administrador') {
        return true;
    }

    const profileNames = [
        user.user_metadata?.full_name,
        user.user_metadata?.fullName,
        user.user_metadata?.name,
        user.user_metadata?.nome,
        user.user_metadata?.display_name,
    ].map(normalize);

    return profileNames.some((name) => ADMIN_NAMES.includes(name));
}
