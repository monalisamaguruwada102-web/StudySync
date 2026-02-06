import{j as r,m as e}from"./vendor-BHBgCXd7.js";const b=({children:t,variant:a="primary",className:o="",...i})=>{const s="px-6 py-3 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden transition-all duration-300 tracking-wide",d={primary:`
            bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700
            text-white 
            shadow-[0_8px_20px_-6px_rgba(99,102,241,0.4)]
            hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.5)]
            border-t border-white/20 border-b border-black/10
            hover:scale-[1.02] active:scale-[0.98]
        `,secondary:`
            bg-white dark:bg-slate-800/80 backdrop-blur-md
            text-slate-700 dark:text-slate-200 
            border border-slate-200 dark:border-white/10
            shadow-sm hover:shadow-md
            hover:bg-slate-50 dark:hover:bg-slate-700/80
            hover:border-slate-300 dark:hover:border-white/20
        `,accent:`
            bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 
            text-white 
            shadow-[0_8px_20px_-6px_rgba(236,72,153,0.4)]
            hover:shadow-[0_12px_28px_-6px_rgba(236,72,153,0.5)]
            border-t border-white/20 border-b border-black/10
        `,ghost:`
            bg-transparent 
            text-slate-600 dark:text-slate-400 
            hover:bg-slate-100/50 dark:hover:bg-white/5
            hover:text-primary-600 dark:hover:text-primary-400
            border border-transparent hover:border-slate-200/50 dark:hover:border-white/5
        `,danger:`
            bg-gradient-to-br from-red-500 to-red-600 
            text-white 
            shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)]
            border-t border-white/20 border-b border-black/10
        `};return r.jsxs(e.button,{className:`${s} ${d[a]} ${o} group`,whileHover:{scale:1.05,y:-2},whileTap:{scale:.97},transition:{type:"spring",stiffness:400,damping:17},...i,children:[r.jsx(e.div,{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",initial:{x:"-100%"},whileHover:{x:"100%"},transition:{duration:.6,ease:"easeInOut"}}),r.jsx("span",{className:"relative z-10 flex items-center justify-center gap-2",children:t}),r.jsx("div",{className:"absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-current/20 to-current/20 -z-10"})]})};export{b as B};
