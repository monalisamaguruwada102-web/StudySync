export const getLeague = (level) => {
    if (level < 5) return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
    if (level < 10) return { name: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' };
    if (level < 15) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
    if (level < 20) return { name: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' };
    if (level < 25) return { name: 'Diamond', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    return { name: 'Grandmaster', color: 'text-primary-400', bg: 'bg-primary-400/10', border: 'border-primary-400/20', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' };
};

export const LEAGUES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster'];
