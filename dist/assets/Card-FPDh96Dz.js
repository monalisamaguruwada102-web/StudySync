import{r as o,j as e,m as v}from"./vendor-BHBgCXd7.js";const h=({children:p,className:c="",title:a="",HeaderAction:r=null})=>{const s=o.useRef(null),[t,x]=o.useState({x:0,y:0}),[n,i]=o.useState(0),u=l=>{if(!s.current)return;const d=s.current.getBoundingClientRect();x({x:l.clientX-d.left,y:l.clientY-d.top})},b=()=>{i(1)},g=()=>{i(0)};return e.jsxs(v.div,{ref:s,onMouseMove:u,onMouseEnter:b,onMouseLeave:g,className:`
                bg-white dark:bg-slate-900 
                rounded-2xl 
                border border-slate-200/50 dark:border-slate-800
                shadow-xl shadow-slate-200/20 dark:shadow-black/40
                overflow-hidden 
                transition-shadow duration-300 
                relative
                group
                flex flex-col
                ${c}
            `,initial:{opacity:0,y:20},animate:{opacity:1,y:0},whileHover:{y:-5,boxShadow:"0 25px 50px -12px rgba(0, 0, 0, 0.25)"},transition:{type:"spring",stiffness:300,damping:25},children:[e.jsx("div",{className:"pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl z-20",style:{opacity:n,background:`radial-gradient(600px circle at ${t.x}px ${t.y}px, rgba(99,102,241,0.4), transparent 40%)`}}),e.jsx("div",{className:"pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl z-10",style:{opacity:n,background:`radial-gradient(800px circle at ${t.x}px ${t.y}px, rgba(99,102,241,0.06), transparent 40%)`}}),(a||r)&&e.jsxs("div",{className:"px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-20 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm",children:[a&&e.jsx("h3",{className:"font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2",children:a}),r&&e.jsx("div",{children:r})]}),e.jsx("div",{className:"p-5 relative z-20 flex-1",children:p}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none z-0"})]})};export{h as C};
