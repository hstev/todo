(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(s){if(s.ep)return;s.ep=!0;const o=n(s);fetch(s.href,o)}})();const q="hoy-todo:v1";function R(t=new Date){const e=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${e}-${n}-${a}`}function G(t){const e=Date.now();return{id:crypto.randomUUID(),title:t.trim(),completed:!1,createdAt:e,updatedAt:e,completedAt:null,deletedAt:null,timeSpentMs:0,timerStartedAt:null,comments:[]}}function N(t){return{...t,comments:Array.isArray(t==null?void 0:t.comments)?t.comments:[]}}function S(){return{settings:{name:"",dailyReset:!0,theme:"system"},lastResetDate:R(),tasks:[],archive:[]}}function W(){try{const t=localStorage.getItem(q);if(!t)return S();const e=JSON.parse(t);return{...S(),...e,settings:{...S().settings,...e.settings??{}},tasks:(Array.isArray(e.tasks)?e.tasks:[]).map(N),archive:(Array.isArray(e.archive)?e.archive:[]).map(n=>({...n,tasks:(n.tasks??[]).map(N)}))}}catch{return S()}}function v(t,e=Date.now()){return t.timerStartedAt?{...t,timeSpentMs:t.timeSpentMs+(e-t.timerStartedAt),timerStartedAt:null,updatedAt:e}:t}let r=W();const I=new Set;function b(){localStorage.setItem(q,JSON.stringify(r))}function d(){b();for(const t of I)t(r)}function Z(t){r.tasks.length&&(r.archive=[...r.archive,{date:t,archivedAt:Date.now(),tasks:r.tasks.map(e=>v({...e}))}],r.tasks=[])}function C(){const t=R();return r.lastResetDate?r.settings.dailyReset?r.lastResetDate===t?!1:(Z(r.lastResetDate),r.lastResetDate=t,b(),!0):(r.lastResetDate!==t&&(r.lastResetDate=t,b()),!1):(r.lastResetDate=t,b(),!1)}C();function l(){return r}function _(t){return I.add(t),()=>I.delete(t)}function Q(t){const e=t.trim();if(!e)return null;const n=G(e);return r={...r,tasks:[...r.tasks,n]},d(),n}function F(t,e,n=!0){const a=Date.now();r={...r,tasks:r.tasks.map(s=>s.id===t?{...s,...e,updatedAt:a}:s)},n?d():b()}function U(t,e,n=!0){const a=e.trim();if(!a)return;const s=r.tasks.find(o=>o.id===t);!s||s.title===a||F(t,{title:a},n)}function X(t){const e=Date.now();r={...r,tasks:r.tasks.map(n=>{if(n.id!==t)return n;const a=v(n,e),s=!a.completed;return{...a,completed:s,completedAt:s?e:null,updatedAt:e}})},d()}function tt(t){const e=Date.now();r={...r,tasks:r.tasks.map(n=>n.id!==t?n:{...v(n,e),deletedAt:e,updatedAt:e})},d()}function et(t){F(t,{deletedAt:null})}function nt(t){const e=Date.now();r={...r,tasks:r.tasks.map(n=>n.deletedAt?n:n.id===t?n.timerStartedAt?n:{...n,timerStartedAt:e,updatedAt:e}:v(n,e))},d()}function P(t){const e=Date.now();r={...r,tasks:r.tasks.map(n=>n.id===t?v(n,e):n)},d()}function at(t){const e=Date.now();r={...r,tasks:r.tasks.map(n=>n.id!==t?n:{...v(n,e),completed:!0,completedAt:e,updatedAt:e})},d()}function j(t,e){const n=Date.now();r={...r,tasks:r.tasks.map(a=>a.id!==t?a:{...a,comments:e([...a.comments??[]]),updatedAt:n})},d()}function J(t,e){const n=e.trim();if(!n)return null;const a=Date.now(),s={id:crypto.randomUUID(),text:n,createdAt:a,updatedAt:a};return j(t,o=>[...o,s]),s}function st(t,e,n){var i,f;const a=n.trim();if(!a)return!1;const s=(f=(i=r.tasks.find(p=>p.id===t))==null?void 0:i.comments)==null?void 0:f.find(p=>p.id===e);if(!s||s.text===a)return!1;const o=Date.now();return j(t,p=>p.map(x=>x.id===e?{...x,text:a,updatedAt:o}:x)),!0}function ot(t,e){j(t,n=>n.filter(a=>a.id!==e))}function rt(){r={...r,tasks:[],lastResetDate:R()},d()}function it(t){r={...r,settings:{...r.settings,...t}},d()}function ct(){return r.tasks.filter(t=>!t.deletedAt)}function K(){return r.tasks.filter(t=>t.deletedAt).slice().sort((t,e)=>e.deletedAt-t.deletedAt)}function D(){return r.tasks.find(t=>t.timerStartedAt&&!t.deletedAt)??null}function $(t,e=Date.now()){return t?t.timeSpentMs+(t.timerStartedAt?e-t.timerStartedAt:0):0}function lt(){const t=new Date,e=new Date(t);return e.setHours(24,0,0,0),e.getTime()-t.getTime()}function dt(){const t=JSON.parse(JSON.stringify(r));return t.tasks=t.tasks.map(e=>v(e)),t.exportedAt=new Date().toISOString(),t}function ut(t){return t.deletedAt?"eliminada":t.timerStartedAt?"en curso":t.completed?"hecha":"pendiente"}function m(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(t,e=Date.now()){const n=Math.max(0,Math.floor((e-t)/1e3));if(n<60)return"ahora";const a=Math.floor(n/60);if(a===1)return"hace un minuto";if(a<60)return`hace ${a} minutos`;const s=Math.floor(a/60);if(s===1)return"hace una hora";if(s<24)return`hace ${s} horas`;const o=Math.floor(s/24);if(o===1)return"hace un día";if(o<30)return`hace ${o} días`;const i=Math.floor(o/30);if(i===1)return"hace un mes";if(i<12)return`hace ${i} meses`;const f=Math.floor(o/365);return f===1?"hace un año":`hace ${f} años`}function k(t){const e=Math.max(0,Math.floor(t/1e3)),n=Math.floor(e/3600),a=Math.floor(e%3600/60),s=e%60;return n>0?`${n}:${String(a).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${a}:${String(s).padStart(2,"0")}`}function mt(t){return new Intl.DateTimeFormat("es",{hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function ft(t=new Date){return new Intl.DateTimeFormat("es",{weekday:"long",day:"numeric",month:"long"}).format(t)}function pt(t){const[e,n,a]=t.split("-").map(Number);return new Intl.DateTimeFormat("es",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(e,n-1,a))}function O(t=new Date){const e=t.getHours();return e<6?"Buenas noches":e<12?"Buenos días":e<20?"Buenas tardes":"Buenas noches"}const y={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>',trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2m-7 0v12h10V7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',restore:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12H4l4-4 4 4H9a5 5 0 1 0-1-9.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0 4-4m-4 4-4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'},g=document.getElementById("app");function w(){const t=location.hash.replace(/^#/,"")||"/",e=t.match(/^\/foco\/(.+)$/);return e?{name:"focus",id:decodeURIComponent(e[1])}:t==="/eliminados"?{name:"deleted"}:t==="/datos"?{name:"data"}:t==="/ajustes"?{name:"settings"}:{name:"home"}}function h(t){if(location.hash===`#${t}`){u();return}location.hash=t}function A(t){var a,s;const e=document.documentElement;t==="system"?e.removeAttribute("data-theme"):e.setAttribute("data-theme",t);const n=t==="dark"||t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches;(a=document.querySelector('meta[name="color-scheme"]'))==null||a.setAttribute("content",n?"dark":"light"),(s=document.querySelector('meta[name="theme-color"]'))==null||s.setAttribute("content",n?"#161310":"#f3efe6")}function M(t){const e=K().length;return`
    <nav class="nav" aria-label="Secciones">
      ${[["/","Hoy",t==="home"],["/eliminados","Eliminados",t==="deleted",e],["/datos","Datos",t==="data"],["/ajustes","Ajustes",t==="settings"]].map(([a,s,o,i])=>`
            <a href="#${a}" class="${o?"is-active":""}" ${o?'aria-current="page"':""}>
              ${s}${i?`<span class="badge">${i}</span>`:""}
            </a>`).join("")}
    </nav>
  `}function ht(){const{settings:t}=l(),e=t.name.trim(),n=e?`${O()}, ${e}`:O();return document.title=e||"Hoy",`
    <header class="masthead">
      <p class="date">${m(ft())}</p>
      <h1>${m(n)}</h1>
    </header>
  `}function gt(t,e){const n=$(t,e),a=[`<span data-relative="${t.createdAt}">${T(t.createdAt,e)}</span>`];return n>=1e3&&a.push(`<span class="tracked" data-elapsed="${t.id}">${k(n)}</span>`),a.join('<span class="dot" aria-hidden="true">·</span>')}function B(t,e){return`
    <li class="row ${t.completed?"is-done":""}" data-id="${t.id}">
      <button class="check" type="button" data-action="toggle" aria-label="${t.completed?"Marcar como pendiente":"Marcar como hecha"}">
        ${t.completed?y.check:""}
      </button>
      <input
        class="title"
        data-role="title"
        value="${m(t.title)}"
        aria-label="Título de la tarea"
        autocomplete="off"
      />
      <div class="meta">${gt(t,e)}</div>
      <div class="actions">
        ${t.completed?"":`<button class="icon-btn" type="button" data-action="play" aria-label="Iniciar medición">
                ${y.play}
              </button>`}
        <button class="icon-btn danger" type="button" data-action="delete" aria-label="Eliminar">
          ${y.trash}
        </button>
      </div>
    </li>
  `}function yt(){const t=ct(),e=t.filter(s=>!s.completed),n=t.filter(s=>s.completed),a=Date.now();return`
    <div class="shell">
      ${ht()}
      ${M("home")}
      <ul class="list" aria-label="Tareas de hoy">
        ${e.map(s=>B(s,a)).join("")}
        ${n.map(s=>B(s,a)).join("")}
        <li class="row composer">
          <span class="check ghost" aria-hidden="true"></span>
          <input
            id="composer"
            class="title"
            placeholder="Nueva tarea"
            aria-label="Nueva tarea"
            autocomplete="off"
            enterkeyhint="done"
          />
        </li>
      </ul>
    </div>
  `}function vt(){const t=K(),e=Date.now();return`
    <div class="shell">
      <header class="masthead">
        <p class="date">Se pueden restaurar</p>
        <h1>Eliminados</h1>
      </header>
      ${M("deleted")}
      ${t.length===0?'<p class="empty">Nada en la papelera.</p>':`<ul class="list">
              ${t.map(n=>`
                    <li class="row" data-id="${n.id}">
                      <span class="check ghost" aria-hidden="true"></span>
                      <p class="title static">${m(n.title)}</p>
                      <div class="meta">
                        <span data-relative="${n.deletedAt}" data-relative-prefix="eliminada ">eliminada ${T(n.deletedAt,e)}</span>
                      </div>
                      <div class="actions always">
                        <button class="icon-btn" type="button" data-action="restore" aria-label="Restaurar">
                          ${y.restore}
                        </button>
                      </div>
                    </li>`).join("")}
            </ul>`}
    </div>
  `}function $t(){const{archive:t,lastResetDate:e}=l(),n={date:e,tasks:l().tasks,isToday:!0};return[...t.map(a=>({...a,isToday:!1})),n].reverse()}function bt(){const t=$t(),e=t.flatMap(s=>s.tasks),n=e.filter(s=>s.completed&&!s.deletedAt).length,a=e.reduce((s,o)=>s+$(o),0);return`
    <div class="shell">
      <header class="masthead cluster">
        <div>
          <p class="date">Historial y metadatos</p>
          <h1>Datos</h1>
        </div>
        <button class="text-btn" type="button" data-action="export">
          ${y.download} Exportar JSON
        </button>
      </header>
      ${M("data")}
      <dl class="stats">
        <div><dt>Tareas</dt><dd>${e.length}</dd></div>
        <div><dt>Hechas</dt><dd>${n}</dd></div>
        <div><dt>Tiempo</dt><dd>${k(a)}</dd></div>
        <div><dt>Días</dt><dd>${t.filter(s=>s.tasks.length).length}</dd></div>
      </dl>
      <div class="journal">
        ${t.filter(s=>s.tasks.length).map(s=>`
              <section>
                <h2>${s.isToday?"Hoy":m(pt(s.date))}</h2>
                <ul>
                  ${s.tasks.slice().sort((o,i)=>o.createdAt-i.createdAt).map(o=>{const i=ut(o);return`
                        <li>
                          <span class="pill ${i.replace(" ","-")}">${i}</span>
                          <span class="journal-title">${m(o.title)}</span>
                          <span class="journal-meta">
                            ${mt(o.createdAt)}
                            ${$(o)>=1e3?` · ${k($(o))}`:""}
                          </span>
                        </li>`}).join("")}
                </ul>
              </section>`).join("")||'<p class="empty">Aún no hay tareas para mostrar.</p>'}
      </div>
    </div>
  `}function wt(){const{settings:t}=l(),e=m(t.name);return`
    <div class="shell">
      <header class="masthead">
        <p class="date">Preferencias locales</p>
        <h1>Ajustes</h1>
      </header>
      ${M("settings")}
      <form class="settings" id="settings-form">
        <label class="field">
          <span>Nombre</span>
          <input name="name" type="text" maxlength="40" value="${e}" placeholder="Cómo te llamas" autocomplete="nickname" />
          <small>Si lo escribes, aparece en la pantalla principal.</small>
        </label>
        <label class="switch">
          <input name="dailyReset" type="checkbox" ${t.dailyReset?"checked":""} />
          <span>
            <strong>Reiniciar a las 00:00</strong>
            <small>El listado de hoy se archiva al cambiar el día y empiezas en blanco.</small>
          </span>
        </label>
        <fieldset class="field">
          <legend>Tema</legend>
          <div class="segmented" role="radiogroup" aria-label="Tema">
            ${["system","light","dark"].map(n=>{const a={system:"Sistema",light:"Claro",dark:"Oscuro"};return`
                  <label>
                    <input type="radio" name="theme" value="${n}" ${t.theme===n?"checked":""} />
                    <span>${a[n]}</span>
                  </label>`}).join("")}
          </div>
        </fieldset>
      </form>
      <div class="field reset-tasks">
        <span>Tareas</span>
        <button class="btn ghost danger" type="button" data-action="reset-tasks">
          Reiniciar tareas
        </button>
        <small>Borra el listado de hoy y lo que haya en Eliminados. El historial de otros días se conserva.</small>
      </div>
    </div>
  `}function z(t,e=Date.now()){const n=t.comments??[];return n.length?n.map(a=>`
        <li class="comment" data-comment-id="${a.id}" data-action="edit-comment">
          <p class="comment-text">${m(a.text)}</p>
          <div class="actions">
            <button class="icon-btn danger" type="button" data-action="delete-comment" aria-label="Eliminar comentario">
              ${y.trash}
            </button>
          </div>
          <span class="comment-meta" data-relative="${a.updatedAt}">${T(a.updatedAt,e)}</span>
        </li>`).join(""):'<li class="comment-empty">Sin comentarios todavía.</li>'}function kt(t){const e=l().tasks.find(a=>a.id===t&&!a.deletedAt);if(!e)return h("/"),"";const n=Date.now();return`
    <div class="focus" data-id="${e.id}">
      <button class="text-btn back" type="button" data-action="pause" data-id="${e.id}">
        ${y.back} Pausar
      </button>
      <div class="focus-stage">
        <p class="focus-time" data-elapsed="${e.id}">${k($(e,n))}</p>
        <h1>${m(e.title)}</h1>
        <div class="focus-actions">
          <button class="btn ghost" type="button" data-action="pause" data-id="${e.id}">Pausar</button>
          <button class="btn" type="button" data-action="complete-focus" data-id="${e.id}">Hecha</button>
        </div>
      </div>
      <section class="focus-notes" aria-label="Comentarios">
        <ul id="comment-list" class="focus-notes-list">${z(e,n)}</ul>
        <form class="comment-composer" data-action="add-comment">
          <input
            id="comment-input"
            type="text"
            maxlength="280"
            placeholder="Escribe un comentario"
            aria-label="Nuevo comentario"
            autocomplete="off"
            enterkeyhint="send"
          />
        </form>
      </section>
    </div>
  `}let c="composer",E=null,L=!1;function H(t){const e=document.getElementById("comment-list");if(!e){u();return}const n=l().tasks.find(s=>s.id===t&&!s.deletedAt);if(!n)return;const a=E==="end"||e.scrollHeight-e.scrollTop-e.clientHeight<40;e.innerHTML=z(n),a&&(e.scrollTop=e.scrollHeight),E=null}function St(t){const e=t.querySelector(".comment-text");if(!e||e.tagName==="INPUT")return;const n=document.createElement("input");n.className="comment-text",n.dataset.role="comment-edit",n.value=e.textContent,n.maxLength=280,n.setAttribute("aria-label","Editar comentario"),e.replaceWith(n),n.focus(),n.select()}function V(t){var s;const e=t.closest("[data-comment-id]"),n=(s=document.querySelector(".focus"))==null?void 0:s.dataset.id;if(!e||!n)return;st(n,e.dataset.commentId,t.value)||H(n)}function At(){var t,e;if(c==="composer"){(t=document.getElementById("composer"))==null||t.focus({preventScroll:!0});return}c!=null&&c.task&&c.target==="check"&&((e=document.querySelector(`[data-id="${c.task}"] .check`))==null||e.focus({preventScroll:!0}))}function u(){const t=w(),{settings:e}=l();A(e.theme);const n=D();if(n&&t.name!=="focus"){h(`/foco/${n.id}`);return}let a="";t.name==="home"?a=yt():t.name==="deleted"?a=vt():t.name==="data"?a=bt():t.name==="settings"?a=wt():t.name==="focus"&&(a=kt(t.id)),g.innerHTML=a,t.name==="home"&&At()}function Dt(){const t=dt(),e=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),n=URL.createObjectURL(e),a=document.createElement("a"),s=new Date().toISOString().slice(0,10);a.href=n,a.download=`hoy-${s}.json`,a.click(),URL.revokeObjectURL(n)}function Et(t){var o,i;const e=t.target.closest("[data-action]");if(!e)return;const n=e.dataset.action,a=e.closest("[data-id]"),s=e.dataset.id||(a==null?void 0:a.dataset.id);if(n==="toggle")c={task:s,target:"check"},X(s);else if(n==="delete")c="composer",tt(s);else if(n==="restore")et(s);else if(n==="play")nt(s),h(`/foco/${s}`);else if(n==="pause")P(s),c="composer",h("/");else if(n==="complete-focus")at(s),c="composer",h("/");else if(n==="export")Dt();else if(n==="reset-tasks")rt(),e.textContent="Listo",e.disabled=!0;else if(n==="add-comment")t.preventDefault();else if(n==="delete-comment"){const f=(o=document.querySelector(".focus"))==null?void 0:o.dataset.id,p=(i=e.closest("[data-comment-id]"))==null?void 0:i.dataset.commentId;f&&p&&ot(f,p)}else n==="edit-comment"&&St(e.closest("[data-comment-id]"))}function Tt(t){var n,a,s;const e=t.target;if(e instanceof HTMLInputElement){if(e.id==="comment-input"){if(t.key==="Enter"){t.preventDefault();const o=(n=document.querySelector(".focus"))==null?void 0:n.dataset.id;if(!o)return;J(o,e.value)&&(e.value="",E="end")}return}if(e.dataset.role==="comment-edit"){if(t.key==="Enter"&&(t.preventDefault(),V(e)),t.key==="Escape"){t.preventDefault(),L=!0;const o=(a=document.querySelector(".focus"))==null?void 0:a.dataset.id;o&&H(o)}return}if(e.id==="composer"){t.key==="Enter"&&(t.preventDefault(),Q(e.value)&&(e.value="",c="composer"));return}if(e.dataset.role==="title"){const o=(s=e.closest("[data-id]"))==null?void 0:s.dataset.id;t.key==="Enter"&&(t.preventDefault(),U(o,e.value),c="composer",u()),t.key==="Escape"&&(t.preventDefault(),c="composer",u())}}}function Mt(t){const e=t.target;e instanceof HTMLInputElement&&e.dataset.role==="title"&&(c=null)}function xt(t){var n;const e=t.target;if(e instanceof HTMLInputElement&&e.dataset.role==="title"){const a=(n=e.closest("[data-id]"))==null?void 0:n.dataset.id;a&&U(a,e.value,!1)}if(e instanceof HTMLInputElement&&e.dataset.role==="comment-edit"){if(L){L=!1;return}V(e)}}function It(t){const e=t.target.closest("#settings-form");if(!e)return;const n=new FormData(e);it({name:String(n.get("name")??""),dailyReset:n.get("dailyReset")==="on",theme:String(n.get("theme")??"system")})}function Lt(){const t=Date.now();document.querySelectorAll("[data-relative]").forEach(e=>{const n=e.dataset.relativePrefix??"";e.textContent=`${n}${T(Number(e.dataset.relative),t)}`}),document.querySelectorAll("[data-elapsed]").forEach(e=>{const n=l().tasks.find(a=>a.id===e.dataset.elapsed);n&&(e.textContent=k($(n,t)))})}function Y(){window.setTimeout(()=>{if(C()){c="composer";const t=D();t?h(`/foco/${t.id}`):w().name==="focus"?h("/"):u()}Y()},lt()+50)}function Rt(){A(l().settings.theme),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{A(l().settings.theme)}),_(()=>{const e=w();if(e.name==="settings"){A(l().settings.theme);return}if(e.name==="focus"){H(e.id);return}u()}),window.addEventListener("hashchange",()=>{c=w().name==="home"?"composer":null,u()}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&C()&&(c="composer",u())}),g.addEventListener("submit",e=>{var o;if(e.preventDefault(),!e.target.classList.contains("comment-composer"))return;const n=document.getElementById("comment-input"),a=(o=document.querySelector(".focus"))==null?void 0:o.dataset.id;if(!n||!a)return;J(a,n.value)&&(n.value="",E="end")}),g.addEventListener("click",Et),g.addEventListener("keydown",Tt),window.addEventListener("keydown",e=>{if(e.key!=="Escape"||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||w().name!=="focus")return;const n=D();n&&(P(n.id),c="composer",h("/"))}),g.addEventListener("focusin",Mt),g.addEventListener("focusout",xt),g.addEventListener("input",It),window.setInterval(Lt,1e3),Y();const t=D();t&&(location.hash=`/foco/${t.id}`),c="composer",u()}Rt();
