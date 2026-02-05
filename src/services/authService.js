import { supabase } from "./supabase";

export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;

    // Fetch profile data to include in return
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    const user = { ...data.user, ...profile };
    localStorage.setItem('user', JSON.stringify(user));
    return user;
};

export const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;

    // Trigger Sidebar XP Update
    window.dispatchEvent(new CustomEvent('study-sync-auth'));
    return data.user;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('user');
    window.location.reload();
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    return { ...session.user, ...profile };
};

export const isUserAuthorized = async (user) => {
    return !!user;
};

export const updateUserXP = async (amount) => {
    const user = await getCurrentUser();
    if (!user) return null;

    const newXP = (user.xp || 0) + amount;
    let newLevel = user.level || 1;
    let badges = [...(user.badges || [])];

    // Level up logic
    while (newXP >= newLevel * 1000) {
        newLevel += 1;
        const levelBadge = `Level ${newLevel} Pro`;
        if (!badges.includes(levelBadge)) {
            badges.push(levelBadge);
        }
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({ xp: newXP, level: newLevel, badges })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Failed to update XP in Supabase:', error);
        return null;
    }

    // Update local storage
    localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
    return { user: data, levelUp: newLevel > user.level };
};
