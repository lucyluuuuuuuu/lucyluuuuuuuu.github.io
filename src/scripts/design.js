const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const visible = el => el.getClientRects().length > 0;
const views = [...document.querySelectorAll('.design-view')];
const activeView = () => views.find(visible);

// Canonical anchors follow the currently visible responsive layout.
function activateAnchors() {
  document.querySelectorAll('[data-anchor]').forEach(el => {
    el.id = `${el.closest('[data-view]')?.dataset.view}-${el.dataset.anchor}`;
  });
  activeView()?.querySelectorAll('[data-anchor]').forEach(el => { el.id = el.dataset.anchor; });
}
function followHash(smooth = false) {
  const id = decodeURIComponent(location.hash.slice(1));
  if(id) document.getElementById(id)?.scrollIntoView({behavior:smooth && !reduced.matches ? 'smooth' : 'instant'});
}
activateAnchors();
addEventListener('resize', activateAnchors);
addEventListener('hashchange', () => followHash(true));
if(location.hash) addEventListener('load', () => followHash());

let menuTrigger;
function closeMenu() {
  document.querySelectorAll('.design-menu-overlay').forEach(el => { el.hidden=true; });
  document.body.classList.remove('menu-is-open');
  menuTrigger?.setAttribute('aria-expanded','false');
  menuTrigger?.focus({preventScroll:true});
}
document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]');
  if(action?.dataset.action==='open-menu') {
    menuTrigger=action;
    const menu=action.closest('[data-view]').querySelector('.design-menu-overlay');
    menu.hidden=false;document.body.classList.add('menu-is-open');
    action.setAttribute('aria-expanded','true');
    menu.querySelector('button,a')?.focus({preventScroll:true});
  }
  if(action?.dataset.action==='close-menu') closeMenu();
  const link=event.target.closest('a[href]');
  if(link?.closest('.design-menu-overlay')) closeMenu();
  if(link){const target=new URL(link.href);if(target.pathname===location.pathname&&target.hash===location.hash)followHash(true);}
});
document.addEventListener('keydown', event => {
  if(!document.body.classList.contains('menu-is-open'))return;
  if(event.key==='Escape')closeMenu();
  if(event.key==='Tab'){
    const items=[...activeView().querySelectorAll('.design-menu-overlay a[href],.design-menu-overlay button')].filter(visible);
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
addEventListener('resize',()=>{if(document.body.classList.contains('menu-is-open')&&!visible(menuTrigger))closeMenu();});

function frame(data, base='') {
  const x=data.x||0,y=data.y||0,scale=data.scale??1;
  return {opacity:data.opacity??1,transform:`${base} perspective(${data.transformPerspective||1200}px) translate(${x}px,${y}px) rotate(${data.rotate||0}deg) rotateX(${data.rotateX||0}deg) rotateY(${data.rotateY||0}deg) scale(${scale}) skew(${data.skewX||0}deg,${data.skewY||0}deg)`};
}
function springFrames(from,to,transition,base){
  const mass=transition.mass||1,k=transition.stiffness||500,c=transition.damping||60;
  const omega=Math.sqrt(k/mass),zeta=c/(2*Math.sqrt(k*mass));
  const response=t=>{
    if(zeta<1){const wd=omega*Math.sqrt(1-zeta*zeta);return 1-Math.exp(-zeta*omega*t)*(Math.cos(wd*t)+zeta*omega/wd*Math.sin(wd*t));}
    if(zeta===1)return 1-Math.exp(-omega*t)*(1+omega*t);
    const a=-omega*(zeta-Math.sqrt(zeta*zeta-1)),b=-omega*(zeta+Math.sqrt(zeta*zeta-1));
    return 1-(b*Math.exp(a*t)-a*Math.exp(b*t))/(b-a);
  };
  let seconds=.25;while(seconds<3&&Math.abs(1-response(seconds))>.001)seconds+=.05;
  const count=Math.ceil(seconds*60),keys=['opacity','x','y','rotate','rotateX','rotateY','scale','skewX','skewY'];
  const frames=Array.from({length:count+1},(_,i)=>{const progress=i===count?1:response(i/60),v={};for(const key of keys){const fallback=['opacity','scale'].includes(key)?1:0;v[key]=(from[key]??fallback)+((to[key]??fallback)-(from[key]??fallback))*progress;}return frame(v,base);});
  return {frames,duration:seconds*1000};
}
const observer = new IntersectionObserver(entries => {
  for(const entry of entries)if(entry.isIntersecting&&visible(entry.target)){
    const el=entry.target;observer.unobserve(el);
    if(reduced.matches||el.closest('[data-ticker]'))continue;
    const data=JSON.parse(el.dataset.appear),transition=data.to.transition||{},ease=transition.ease;
    const computed=getComputedStyle(el).transform,base=computed==='none'?'':computed;
    const spring=transition.type==='spring'?springFrames(data.from,data.to,transition,base):null;
    el.animate(spring?.frames||[frame(data.from,base),frame(data.to,base)],{duration:spring?.duration||(transition.duration||.7)*1000,delay:(transition.delay||0)*1000,easing:spring?'linear':Array.isArray(ease)?`cubic-bezier(${ease.join(',')})`:'cubic-bezier(.44,0,.56,1)',fill:'backwards'});
  }
},{threshold:0});
document.querySelectorAll('[data-appear]').forEach(el=>observer.observe(el));

// Continuous tracks use the source speed in pixels/second, with a gap at the seam.
document.querySelectorAll('[data-ticker]').forEach(el=>{
  const options=JSON.parse(el.dataset.ticker),track=el.querySelector('.ticker-track'),group=track.firstElementChild;
  let animation;
  function update(){
    animation?.cancel();
    [...track.children].slice(1).forEach(copy=>copy.remove());
    if(!visible(el))return;
    const vertical=['top','bottom'].includes(options.direction),length=(vertical?group.offsetHeight:group.offsetWidth)+options.gap;
    if(!length)return;
    const count=Math.max(2,Math.ceil((vertical?el.clientHeight:el.clientWidth)/length)+1);
    for(let i=0;i<count;i++){
      const clone=group.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.inert=true;
      clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.querySelectorAll('[data-anchor]').forEach(n=>n.removeAttribute('data-anchor'));track.append(clone);
    }
    if(reduced.matches)return;
    const axis=vertical?'Y':'X',reverse=['right','bottom'].includes(options.direction);
    animation=track.animate([{transform:`translate${axis}(${reverse?-length:0}px)`},{transform:`translate${axis}(${reverse?0:-length}px)`}],{duration:length/options.speed*1000,iterations:Infinity,easing:'linear'});
  }
  new ResizeObserver(update).observe(el);reduced.addEventListener('change',update);
  document.fonts.ready.then(update);
});

document.querySelectorAll('[data-slideshow]').forEach(el=>{
  const track=el.querySelector('.slideshow-track'),slides=[...track.children],dots=[...el.querySelectorAll('[data-slide-to]')];let index=0,startX;
  const show=i=>{index=(i+slides.length)%slides.length;track.style.transform=`translateX(-${index*100}%)`;dots.forEach((dot,j)=>dot.setAttribute('aria-current',String(j===index)));slides.forEach((slide,j)=>slide.setAttribute('aria-hidden',String(j!==index)));};
  el.querySelector('[data-slide-prev]').addEventListener('click',()=>show(index-1));
  el.querySelector('[data-slide-next]').addEventListener('click',()=>show(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  el.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;startX=event.clientX;el.setPointerCapture(event.pointerId);});
  el.addEventListener('pointerup',event=>{if(startX!==undefined&&Math.abs(event.clientX-startX)>40)show(index+(event.clientX<startX?1:-1));startX=undefined;});
  el.addEventListener('pointercancel',()=>{startX=undefined;});
  el.addEventListener('dragstart',event=>event.preventDefault());show(0);
});
document.querySelectorAll('[data-local-time]').forEach(el=>{el.textContent=new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date());});
