import assert from 'node:assert/strict';
import {hoverProgress,mixHoverColor} from '../src/scripts/hover.js';
// Independently integrate the published component's physical equation (RK4).
// This catches timing/range regressions, including using one CSS duration for
// both layout projection and complex properties.
let x=0,v=0;const dt=.00005;
for(let i=0;i<=20000;i++){
 if(i%20===0)for(const range of [100,1000]){
  const expected=(1-x)*range<=.5?1:x;
  assert.ok(Math.abs(hoverProgress(i*dt*1000,range)-expected)<1e-8);
 }
 const acceleration=(position,velocity)=>500*(1-position)-60*velocity;
 const a=v,b=acceleration(x,v),c=v+b*dt/2,d=acceleration(x+a*dt/2,v+b*dt/2),e=v+d*dt/2,f=acceleration(x+c*dt/2,v+d*dt/2),g=v+f*dt,h=acceleration(x+e*dt,v+f*dt);
 x+=dt/6*(a+2*c+2*e+g);v+=dt/6*(b+2*d+2*f+h);
}
assert.equal(mixHoverColor('rgb(255, 255, 255)','rgb(0, 0, 0)',.5),'rgba(180, 180, 180, 1)');
assert.equal(mixHoverColor('rgb(255, 255, 255)','rgba(0, 0, 0, 0)',.5),'rgba(180, 180, 180, 0.5)');
console.log('PASS: 2002 independent spring samples; opaque and transparent color mixing.');
