const { chromium }=require(process.argv[2]||'playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
  let browser;
  const server=spawn(process.execPath,['serve.mjs'],{cwd:root,windowsHide:true,env:{...process.env,PORT:'0',GITHUB_TOKEN:'',KREMI_ADMIN_PASSWORD:'test-only-password'},stdio:['ignore','pipe','pipe']});
  try {
    const base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not start')),10000);server.once('error',reject);server.stdout.on('data',data=>{const url=data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(url){clearTimeout(timeout);resolve(url[0]);}});});
    browser=await chromium.launch({headless:true});
    const errors=[];
    for(const width of [1440,768,390,320]){
      const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<=390,isMobile:width<=390});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      // Check our implementation without relying on third-party services or sending messages.
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
      for(const file of ['/','/our-story.html','/reviews.html','/events.html']){
        const response=await page.goto(base+file,{waitUntil:'networkidle'});assert.equal(response.status(),200);
        assert.equal(await page.locator('main').count(),1);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Page overflow '+file+' '+width);
      }
      await page.goto(base+'/#matcha');await page.waitForFunction(()=>csCurrentPanel==='matcha');
      assert(await page.locator('#matcha').isVisible());assert(!await page.locator('#menu').isVisible());
      const hojicha=page.locator('#matcha .menu-price-list > div').filter({hasText:'Hojicha Latte'});assert((await hojicha.innerText()).includes('S$7.50'));
      await page.locator('[data-panel="menu"]').click();assert(await page.locator('#menu').isVisible());
      await page.goBack();await page.waitForFunction(()=>csCurrentPanel==='matcha');assert(await page.locator('#matcha').isVisible());
      await page.locator('footer a[href="#menu"]').click();assert(await page.locator('#menu').isVisible());
      assert.equal(await page.locator('.tcard').count(),5);
      await page.locator('#tStage').scrollIntoViewIfNeeded();
      await page.locator('.tcard img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
      assert((await page.locator('.tcard').first().innerText()).includes('S$9.90'));
      assert.equal(await page.locator('#carouselPause').innerText(),'Play slideshow');
      await page.evaluate(()=>{window.__beforeCarousel=tCur;});
      await page.waitForTimeout(5200);
      assert.equal(await page.evaluate(()=>tCur),await page.evaluate(()=>window.__beforeCarousel),'Reduced motion must stop rotation');
      await page.locator('.tc-btn').last().click();assert.notEqual(await page.evaluate(()=>tCur),await page.evaluate(()=>window.__beforeCarousel));
      const box=await page.locator('#tStage').boundingBox();
      if(width<=390){const cdp=await context.newCDPSession(page);const x=width*0.7,y=Math.min(700,box.y+box.height/2);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-100,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
      else {await page.mouse.move(box.x+box.width*.65,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.35,box.y+box.height/2,{steps:5});await page.mouse.up();}
      assert.equal(await page.evaluate(()=>csCurrentPanel),'menu','Swipe must not switch panels');
      assert(!await page.locator('#menuModal').isVisible());
      await page.locator('.btn-view-menu').click();
      assert(await page.locator('#menuModal').evaluate(d=>d.open));
      assert(await page.locator('#menuModal').evaluate(d=>d.contains(document.activeElement)));
      for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.locator('#menuModal').evaluate(d=>d.contains(document.activeElement)),'Focus escaped modal');}
      for(const [tab,name,widthExpected] of [['#tabCrepe','Kremi_Crepe_Menu.png',1600],['#tabDrinks','Kremi_Drinks_Menu.png',1200]]){
        await page.locator(tab).click();await page.locator('#menuImgView').evaluate(i=>i.decode());
        assert.equal(await page.locator('#menuImgView').evaluate(i=>i.naturalWidth),widthExpected);
        const link=page.locator('#menuDownloadBtn');assert.equal(await link.getAttribute('download'),name);
        const r=await page.request.get(await link.evaluate(a=>a.href));assert.equal(r.status(),200);assert((await r.body()).length>100000);
      }
      await page.locator('.menu-readable summary').click();assert(await page.locator('#menuTextDrinks').isVisible());assert((await page.locator('#menuTextDrinks').innerText()).includes('Banana Pudding Hojicha'));
      await page.keyboard.press('Escape');assert(!await page.locator('#menuModal').isVisible());assert(await page.locator('.btn-view-menu').evaluate(e=>e===document.activeElement));
      if(width<=768){await page.locator('#hamburger').click();assert.equal(await page.locator('#hamburger').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#hamburger').getAttribute('aria-expanded'),'false');assert(await page.locator('#mobileNav').evaluate(e=>e.inert));}
      console.log('PASS public pages, menu links/history, carousel swipe, dialog, downloads and keyboard at '+width+'px');
      await context.close();
    }
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    await page.goto(base+'/events.html');await page.locator('#formSubmitBtn').click();assert(await page.locator('#fname').evaluate(e=>e===document.activeElement));
    await page.locator('#fname').fill('Test Guest');await page.locator('#fphone').fill('+65 9123 4567');await page.locator('#feventType').selectOption({label:'Birthday Party'});await page.locator('#fguests').selectOption({label:'80'});
    await page.locator('#fdate').fill('2020-01-01');await page.locator('#formSubmitBtn').click();assert((await page.locator('#err-fdate').innerText()).includes('7 days'));
    const min=await page.evaluate(()=>getMinDate());await page.locator('#fdate').fill(min);await page.locator('#formSubmitBtn').click();assert(await page.locator('#formSuccess').isVisible());assert((await page.locator('#enquiryDraft').inputValue()).includes('Test Guest'));assert.equal(new URL(page.url()).pathname,'/events.html');
    await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Copy enquiry',exact:true}).click();await page.waitForFunction(()=>document.getElementById('draftStatus').textContent.length>0);assert((await page.locator('#draftStatus').innerText()).startsWith('Copied'));
    await page.locator('#fmsg').fill('Updated details');assert(!await page.locator('#formSuccess').isVisible());
    await page.locator('#btnMultiDay').click();const dateFields=page.locator('#multiDateList input');await dateFields.first().fill(min);await page.getByRole('button',{name:'Add another date'}).click();await page.locator('#formSubmitBtn').click();assert((await page.locator('#err-fdate').innerText()).includes('every event date'));
    await dateFields.last().fill(min);await page.locator('#formSubmitBtn').click();assert((await page.locator('#err-fdate').innerText()).includes('different dates'));
    await page.locator('.remove-date-btn').last().click();await page.locator('#formSubmitBtn').click();assert(await page.locator('#formSuccess').isVisible());
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('Denied'))},configurable:true});});await page.getByRole('button',{name:'Copy enquiry',exact:true}).click();await page.waitForFunction(()=>document.getElementById('draftStatus').textContent.includes('highlighted'));assert((await page.locator('#draftStatus').innerText()).includes('highlighted'));
    console.log('PASS enquiry validation, Singapore dates, multi-day fields, editable draft and both clipboard paths; no email sent');
    await page.goto(base+'/admin-login.html');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('setup'));assert(await page.locator('#login').isDisabled());
    assert.equal((await page.request.get(base+'/api/me')).status(),401);assert.equal((await page.request.get(base+'/seasonal-admin.html',{maxRedirects:0})).status(),302);
    for(const secret of ['/.env.local','/.git/config','/serve.mjs','/scripts/build-menu.mjs'])assert.equal((await page.request.get(base+secret)).status(),404);
    assert.equal((await page.request.post(base+'/api/publish-seasonal',{data:{}})).status(),401);
    console.log('PASS unconfigured owner status, authentication and private-file restrictions');
    assert.deepEqual(errors,[],'Browser JavaScript errors');
    console.log('All browser checks passed.');
  } finally {if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
