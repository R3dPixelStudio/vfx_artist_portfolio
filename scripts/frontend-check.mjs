import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
await mkdir('docs',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];
async function setup(options){
 const page=await browser.newPage(options);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"code":"NOT_CONFIGURED"}'}));return page;
}
async function settle(page){await page.waitForFunction(()=>document.querySelector('.chapter-content')?.getAttribute('aria-busy')==='false',null,{timeout:25000});}
async function diff(a,b){const [x,y]=await Promise.all([sharp(a).raw().toBuffer(),sharp(b).raw().toBuffer()]);let n=0;for(let i=0;i<x.length;i++)if(Math.abs(x[i]-y[i])>3)n++;return n/x.length;}
async function shot(page,name){await page.screenshot({path:'docs/portal-'+name+'.png'});}
try{
 const page=await setup({viewport:{width:1440,height:900},deviceScaleFactor:1});
 assert.equal((await page.goto('http://127.0.0.1:3000/')).status(),200);
 await page.locator('.world-canvas[data-live="true"] canvas').waitFor();await page.waitForTimeout(1000);
 const a=await page.locator('canvas').screenshot();await page.waitForTimeout(1000);const b=await page.locator('canvas').screenshot();
 assert.ok(await diff(a,b)>.0001);checks.push('Filament portal rotates without input');await shot(page,'landing');
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();await page.waitForTimeout(500);
 const c=await page.locator('canvas').screenshot();await page.waitForTimeout(650);assert.ok(await diff(c,await page.locator('canvas').screenshot())<.00001);
 await page.getByRole('button',{name:'Enable animation',exact:true}).click();checks.push('Pause freezes the rendered portal; resume control works');
 await page.getByRole('button',{name:'Next / About',exact:true}).click();await page.waitForTimeout(450);await shot(page,'travel');await settle(page);
 assert.equal(await page.locator('#about-title').isVisible(),true);assert.equal(await page.evaluate(()=>document.activeElement?.id),'about-title');
 await page.getByRole('button',{name:/02.*3D & motion/}).click();assert.equal(await page.locator('#discipline-1').isVisible(),true);await shot(page,'about');
 await page.getByRole('button',{name:'Next / Works',exact:true}).click();await settle(page);assert.equal(await page.locator('#gallery-title').isVisible(),true);
 await page.getByRole('button',{name:'Next world',exact:true}).click();await page.waitForTimeout(700);assert.equal(await page.locator('.carousel-counter strong').innerText(),'02');
 await page.locator('.world-carousel').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(700);assert.equal(await page.locator('.carousel-counter strong').innerText(),'03');
 await page.locator('.world-card.is-active').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);await shot(page,'works');
 await page.getByRole('button',{name:'Next / Contact',exact:true}).click();await settle(page);assert.equal(await page.locator('#contact-title').isVisible(),true);await shot(page,'contact');
 await page.locator('.contact-intro').getByRole('button',{name:/Prepare a brief/}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Back',exact:true}).click();await settle(page);assert.equal(await page.locator('#gallery-title').isVisible(),true);
 checks.push('Next/Back traverses all four chapters; About accordion, Works keyboard/click dialog and Contact brief work');
 for(const label of ['Home','About','Contact','Home']){await page.locator('.chapter-navigation').getByRole('button',{name:new RegExp(label)}).click();await page.waitForTimeout(90);}
 await settle(page);assert.equal(await page.locator('#landing-title').isVisible(),true);checks.push('Rapid direct navigation settles with visible content');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('.world-canvas[data-live="true"] canvas').waitFor();
 await page.getByRole('button',{name:'Enable animation',exact:true}).click();await page.waitForTimeout(700);assert.equal(await page.locator('.experience').getAttribute('data-motion'),'on');checks.push('Explicit play overrides reduced-motion preference');await page.close();
 for(const locale of ['en','fa']){
 const mobile=await setup({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await mobile.goto('http://127.0.0.1:3000/'+(locale==='fa'?'fa/':''));await mobile.locator('.world-canvas[data-live="true"] canvas').waitFor();await mobile.waitForTimeout(500);await shot(mobile,'mobile-'+locale);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const next=mobile.locator('.next-step');const box=await next.boundingBox();assert.ok(box.y+box.height<=844&&box.x>=0&&box.x+box.width<=390);
 await next.click();await settle(mobile);assert.equal(await mobile.locator('#about-title').isVisible(),true);await shot(mobile,'about-mobile-'+locale);
 await next.click();await settle(mobile);await mobile.getByRole('button',{name:locale==='en'?'Next world':'جهان بعدی',exact:true}).click();await mobile.waitForTimeout(700);await shot(mobile,'works-mobile-'+locale);
 await next.click();await settle(mobile);await mobile.locator('.chat-compose input').scrollIntoViewIfNeeded();assert.equal(await mobile.locator('.chat-compose input').isVisible(),true);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 checks.push(locale+' mobile: visible navigation, four reachable chapters, no horizontal overflow');await mobile.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile('docs/portal-checks.json',JSON.stringify({checks,pageErrors:errors,note:'Frontend only. API requests intercepted. Backend behavior unverified.'},null,2));console.log(JSON.stringify({checks,pageErrors:errors},null,2));
}finally{await browser.close();}
