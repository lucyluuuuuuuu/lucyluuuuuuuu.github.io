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
function springProgress(transition,{distance=1,velocity=0,restDelta=.001}={}){
  const mass=transition.mass||1,k=transition.stiffness||500,c=transition.damping||60;
  const omega=Math.sqrt(k/mass),zeta=c/(2*Math.sqrt(k*mass)),initialVelocity=distance?velocity/distance:0;
  const response=t=>{
    if(zeta<1){const wd=omega*Math.sqrt(1-zeta*zeta);return 1-Math.exp(-zeta*omega*t)*(Math.cos(wd*t)+(zeta*omega-initialVelocity)/wd*Math.sin(wd*t));}
    if(zeta===1)return 1-Math.exp(-omega*t)*(1+(omega-initialVelocity)*t);
    const a=-omega*(zeta-Math.sqrt(zeta*zeta-1)),b=-omega*(zeta+Math.sqrt(zeta*zeta-1));
    return 1+((initialVelocity+b)*Math.exp(a*t)-(initialVelocity+a)*Math.exp(b*t))/(a-b);
  };
  let seconds=1/60;while(seconds<3&&Math.abs((1-response(seconds))*distance)>restDelta)seconds+=1/60;
  const count=Math.ceil(seconds*60);
  return {values:Array.from({length:count+1},(_,i)=>i===count?1:response(i*seconds/count)),duration:seconds*1000};
}
function springFrames(from,to,transition,base){
  const {values,duration}=springProgress(transition),keys=['opacity','x','y','rotate','rotateX','rotateY','scale','skewX','skewY'];
  const frames=values.map(progress=>{const v={};for(const key of keys){const fallback=['opacity','scale'].includes(key)?1:0;v[key]=(from[key]??fallback)+((to[key]??fallback)-(from[key]??fallback))*progress;}return frame(v,base);});
  return {frames,duration};
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
  const options=JSON.parse(el.dataset.slideshow),track=el.querySelector('.slideshow-track'),slides=[...track.children],dots=[...el.querySelectorAll('[data-slide-to]')];
  if(!slides.length)return;
  let index=0,animation,drag;
  const clone=slide=>{const copy=slide.cloneNode(true);copy.inert=true;copy.setAttribute('aria-hidden','true');copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));return copy;};
  // Neighbour copies let the final slide continue into the first without reversing.
  track.prepend(clone(slides.at(-1)));track.append(clone(slides[0]));
  const width=()=>el.clientWidth;
  const position=()=>new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
  const place=x=>{track.style.transform=`translateX(${x}px)`;};
  const settle=()=>place(-(index+1)*width());
  function show(next,releaseVelocity=0){
    const currentPosition=position(),loopWidth=slides.length*width();
    const from=loopWidth?currentPosition+Math.round((-(index+1)*width()-currentPosition)/loopWidth)*loopWidth:0,to=-(next+1)*width();
    animation?.cancel();place(from);
    index=((next%slides.length)+slides.length)%slides.length;
    dots.forEach((dot,j)=>dot.setAttribute('aria-current',String(j===index)));
    slides.forEach((slide,j)=>slide.setAttribute('aria-hidden',String(j!==index)));
    if(reduced.matches||Math.abs(from-to)<.5){settle();return;}
    const {values,duration}=springProgress(options.transition||{stiffness:200,damping:40},{distance:to-from,velocity:releaseVelocity,restDelta:.5});
    const current=track.animate(values.map(t=>({transform:`translateX(${from+(to-from)*t}px)`})),{duration,easing:'linear',fill:'forwards'});
    animation=current;
    current.finished.then(()=>{if(animation!==current)return;settle();current.cancel();animation=undefined;}).catch(()=>{});
  }
  el.querySelector('[data-slide-prev]').addEventListener('click',()=>show(index-1));
  el.querySelector('[data-slide-next]').addEventListener('click',()=>show(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  el.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button'))return;
    const origin=position();animation?.cancel();place(origin);
    drag={id:event.pointerId,start:event.clientX,origin,samples:[{x:event.clientX,t:event.timeStamp}]};
    el.setPointerCapture(event.pointerId);el.classList.add('is-dragging');
  });
  el.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    place(drag.origin+event.clientX-drag.start);
    drag.samples.push({x:event.clientX,t:event.timeStamp});
    drag.samples=drag.samples.filter(p=>event.timeStamp-p.t<100);
  });
  const finish=(event,cancelled=false)=>{
    if(drag?.id!==event.pointerId)return;
    const offset=event.clientX-drag.start,first=drag.samples[0],elapsed=event.timeStamp-first.t;
    const velocity=elapsed>0?(event.clientX-first.x)/elapsed*1000:0;
    const distance=Math.round(Math.abs(offset)/width());
    const delta=cancelled?0:Math.abs(velocity)>200?-Math.sign(velocity)*Math.max(1,distance):Math.abs(offset)>width()/2?-Math.sign(offset)*distance:0;
    drag=undefined;el.classList.remove('is-dragging');show(index+Math.max(-1,Math.min(1,delta)),cancelled?0:velocity);
  };
  el.addEventListener('pointerup',event=>finish(event));
  el.addEventListener('pointercancel',event=>finish(event,true));
  el.addEventListener('dragstart',event=>event.preventDefault());
  new ResizeObserver(()=>{animation?.cancel();settle();}).observe(el);
  settle();show(0);
});
document.querySelectorAll('[data-local-time]').forEach(el=>{el.textContent=new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date());});
