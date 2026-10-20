import { installHover } from './hover.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
installHover(reduced);
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
  const target = id && document.getElementById(id);
  if(!target)return;
  const behavior = smooth && !reduced.matches ? 'smooth' : 'instant';
  // The original Work navigation aligns the section with the viewport top.
  // Other content anchors retain their comfortable reading offset.
  if(id==='works')scrollTo({top:target.getBoundingClientRect().top+scrollY,behavior});
  else target.scrollIntoView({behavior});
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
  if(link){const target=new URL(link.href);if(target.origin===location.origin&&target.pathname===location.pathname&&target.hash&&target.hash===location.hash){event.preventDefault();followHash(true);}}
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
  return {opacity:data.opacity??1,transform:`${base} perspective(${data.transformPerspective||1200}px) translate(${x}px,${y}px) rotate(${data.rotate||0}deg) rotateX(${data.rotateX||0}deg) rotateY(${data.rotateY||0}deg) scale(${scale}) skew(${data.skewX||0}deg,${data.skewY||0}deg) translateZ(0px)`};
}
function springProgress(transition,{distance=1,velocity=0,restDelta=Math.abs(distance)<5?.005:.5,restSpeed=Math.abs(distance)<5?.01:2}={}){
  const mass=transition.mass||1,k=transition.stiffness||500,c=transition.damping||60;
  const omega=Math.sqrt(k/mass),zeta=c/(2*Math.sqrt(k*mass)),initialVelocity=distance?velocity/distance:0;
  const response=t=>{
    if(zeta<1){const wd=omega*Math.sqrt(1-zeta*zeta);return 1-Math.exp(-zeta*omega*t)*(Math.cos(wd*t)+(zeta*omega-initialVelocity)/wd*Math.sin(wd*t));}
    if(zeta===1)return 1-Math.exp(-omega*t)*(1+(omega-initialVelocity)*t);
    const a=-omega*(zeta-Math.sqrt(zeta*zeta-1)),b=-omega*(zeta+Math.sqrt(zeta*zeta-1));
    return 1+((initialVelocity+b)*Math.exp(a*t)-(initialVelocity+a)*Math.exp(b*t))/(a-b);
  };
  const speed=t=>{
    if(zeta<1){const a=zeta*omega,b=omega*Math.sqrt(1-zeta*zeta);return Math.exp(-a*t)*(initialVelocity*Math.cos(b*t)+(omega*omega-a*initialVelocity)/b*Math.sin(b*t));}
    if(zeta===1)return Math.exp(-omega*t)*(initialVelocity+omega*(omega-initialVelocity)*t);
    const a=-omega*(zeta-Math.sqrt(zeta*zeta-1)),b=-omega*(zeta+Math.sqrt(zeta*zeta-1));
    return (a*(initialVelocity+b)*Math.exp(a*t)-b*(initialVelocity+a)*Math.exp(b*t))/(a-b);
  };
  // Crossing the target is not settling: retain the overshoot until both
  // displacement and velocity are small, as in the original spring engine.
  const sampleRate=240;
  let seconds=1/sampleRate;while(seconds<3&&(Math.abs((1-response(seconds))*distance)>restDelta||Math.abs(speed(seconds)*distance)>restSpeed))seconds+=1/sampleRate;
  const count=Math.ceil(seconds*sampleRate);
  return {values:Array.from({length:count+1},(_,i)=>i===count?1:response(i*seconds/count)),duration:seconds*1000};
}
function springFrames(from,to,transition,base){
  const keys=['opacity','x','y','rotate','rotateX','rotateY','scale','skewX','skewY'];
  // The source animates each property independently. Opacity, pixel offsets,
  // angles and scale therefore reach their own resting thresholds at different
  // times, even though they share the same physical spring parameters.
  const properties=keys.map(key=>{
    const fallback=['opacity','scale'].includes(key)?1:0,start=from[key]??fallback,end=to[key]??fallback,distance=end-start;
    return {key,start,end,curve:distance?springProgress(transition,{distance,...(key==='scale'?{restDelta:.001}:{})}):null};
  });
  const duration=Math.max(1,...properties.map(p=>p.curve?.duration||0)),count=Math.ceil(duration/1000*240);
  const frames=Array.from({length:count+1},(_,i)=>{
    const elapsed=i/count*duration,v={};
    for(const {key,start,end,curve} of properties){
      if(!curve||elapsed>=curve.duration){v[key]=end;continue;}
      const offset=elapsed/curve.duration*(curve.values.length-1),index=Math.floor(offset),fraction=offset-index;
      const progress=curve.values[index]+(curve.values[index+1]-curve.values[index])*fraction;
      v[key]=start+(end-start)*progress;
    }
    return frame(v,base);
  });
  return {frames,duration};
}
const appearanceStates = new Map();
function restoreRestingFrame(el) {
  const state=appearanceStates.get(el);
  if(!state||state.phase!=='finished'||!visible(el))return;
  el.style.transform=state.originalTransform;
  // Keep the original final 3D layer for identical text rendering. Existing CSS
  // transforms stay in CSS so percentage-based centering continues to resize.
  const final=frame(state.data.to);
  if(getComputedStyle(el).transform==='none')el.style.transform=final.transform;
  el.style.opacity=final.opacity;
}
function appearanceBase(el,state){
  el.style.transform=state.originalTransform;
  const computed=getComputedStyle(el).transform;
  return state.originalTransform&&state.originalTransform!=='none'?state.originalTransform:computed==='none'?'':computed;
}
function prepareAppearance(el,state){
  if(state.phase!=='pending'||!visible(el))return;
  const initial=frame(state.data.from,appearanceBase(el,state));
  Object.assign(el.style,initial);
}
function playAppearance(el,state){
  if(state.phase!=='pending'||!visible(el))return;
  state.phase='playing';observer.unobserve(el);
  const {data}=state,transition=data.to.transition||{},ease=transition.ease;
  const base=appearanceBase(el,state);
  const finish=()=>{state.phase='finished';restoreRestingFrame(el);};
  if(reduced.matches){finish();return;}
  const spring=transition.type==='spring'?springFrames(data.from,data.to,transition,base):null;
  el.animate(spring?.frames||[frame(data.from,base),frame(data.to,base)],{duration:spring?.duration||(transition.duration||.7)*1000,delay:(transition.delay||0)*1000,easing:spring?'linear':Array.isArray(ease)?`cubic-bezier(${ease.join(',')})`:'cubic-bezier(.44,0,.56,1)',fill:'backwards'}).finished.then(finish).catch(finish);
}
const observer = new IntersectionObserver(entries => {
  for(const entry of entries){
    const state=appearanceStates.get(entry.target);
    if(!state||state.data.trigger||!entry.isIntersecting)continue;
    // Framer measures the visible vertical fraction against the smaller of
    // the element and viewport heights, rather than the element's full area.
    const height=Math.min(entry.boundingClientRect.height,innerHeight);
    if(!height||entry.intersectionRect.height/height>=(state.data.threshold||0))playAppearance(entry.target,state);
  }
},{threshold:Array.from({length:100},(_,i)=>i/100)});
let targetFrame;
function checkAppearanceTargets(){
  targetFrame=undefined;
  for(const [el,state] of appearanceStates){
    if(state.phase!=='pending'||!state.data.trigger||!visible(el))continue;
    const target=[...el.closest('[data-view]').querySelectorAll('[data-anchor]')].find(node=>node.dataset.anchor===state.data.trigger);
    if(!target){playAppearance(el,state);continue;}
    const start=target.getBoundingClientRect().top+scrollY-1-(state.data.threshold||0)*innerHeight;
    if(scrollY>=Math.max(0,start))playAppearance(el,state);
  }
}
function requestAppearanceCheck(){if(targetFrame===undefined)targetFrame=requestAnimationFrame(checkAppearanceTargets);}
const appearanceResizeObserver=new ResizeObserver(entries=>{
  for(const {target} of entries){
    const state=appearanceStates.get(target);
    if(state.phase==='finished')restoreRestingFrame(target);
    else prepareAppearance(target,state);
  }
  requestAppearanceCheck();
});
document.querySelectorAll('[data-appear]').forEach(el=>{
  if(el.closest('[data-ticker]'))return;
  const state={data:JSON.parse(el.dataset.appear),originalTransform:el.style.transform,phase:'pending'};
  appearanceStates.set(el,state);prepareAppearance(el,state);
  if(!state.data.trigger)observer.observe(el);
  appearanceResizeObserver.observe(el);
});
addEventListener('scroll',requestAppearanceCheck,{passive:true});
addEventListener('resize',requestAppearanceCheck);
document.fonts.ready.then(requestAppearanceCheck);
requestAppearanceCheck();

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
const localClocks=[...document.querySelectorAll('[data-local-time]')];
if(localClocks.length){
  const timeFormat=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const updateLocalTime=()=>{const value=timeFormat.format(new Date());localClocks.forEach(el=>{el.textContent=value;});};
  updateLocalTime();setInterval(updateLocalTime,1000);
}
