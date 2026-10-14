
var menuFiles={crepe:{preview:'KremiCrepeMenu-preview.jpg?v=c6df8059ed',full:'KremiCrepeMenu.png?v=4f451bee65',dl:'Kremi_Crepe_Menu.png',w:1600,h:1132},drinks:{preview:'KremiDrinksMenuA4-preview.jpg?v=0d0110aaed',full:'KremiDrinksMenuA4.png?v=942c87da39',dl:'Kremi_Drinks_Menu.png',w:1200,h:1697}};
var menuReturnFocus=null;
function openMenuPDF(tab){
  var dialog=document.getElementById('menuModal');
  menuReturnFocus=document.activeElement;
  switchMenuTab(tab||'crepe');
  dialog.showModal();dialog.classList.add('open');document.body.style.overflow='hidden';
  document.getElementById('menuDownloadBtn').focus();
  tStartAuto();
}
function switchMenuTab(tab){
  var f=menuFiles[tab];if(!f)return;
  var img=document.getElementById('menuImgView');img.src=f.preview;img.width=f.w;img.height=f.h;img.alt=tab==='crepe'?'Kremi crêpe menu':'Kremi drinks menu';
  var download=document.getElementById('menuDownloadBtn');download.href=f.full;download.download=f.dl;
  ['crepe','drinks'].forEach(function(name){var btn=document.getElementById(name==='crepe'?'tabCrepe':'tabDrinks');btn.setAttribute('aria-pressed',String(name===tab));btn.style.borderBottomColor=name===tab?'var(--red)':'transparent';btn.style.color=name===tab?'var(--red)':'var(--ink-soft)';document.getElementById('menuText'+(name==='crepe'?'Crepe':'Drinks')).hidden=name!==tab;});
}
function closeMenuPDF(){document.getElementById('menuModal').close();}
function handleModalOverlayClick(e){if(e.target===document.getElementById('menuModal'))closeMenuPDF();}
var menuDialog=document.getElementById('menuModal');
menuDialog.addEventListener('close',function(){menuDialog.classList.remove('open');document.body.style.overflow='';if(menuReturnFocus&&menuReturnFocus.isConnected)menuReturnFocus.focus();tStartAuto();});
menuDialog.addEventListener('keydown',function(e){
  if(e.key!=='Tab')return;
  var controls=Array.from(menuDialog.querySelectorAll('a[href],button:not([disabled]),summary,input,textarea,select,[tabindex]:not([tabindex="-1"])')).filter(function(el){return el.getClientRects().length&&!el.closest('[hidden]');});
  var first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
menuDialog.addEventListener('cancel',function(e){e.preventDefault();closeMenuPDF();});
var reveals=document.querySelectorAll('.reveal');
var observer=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}});},{threshold:0.12});
reveals.forEach(function(el){observer.observe(el);});
document.body.classList.add('js-ready');
// FEATURED_START
var tCrepes=[{"img":"menumochistrawberry-card-optimized.webp","name":"Strawberry Mochi Crepe","badge":"Popular","bc":"tb-sweet","price":"S$9.90"},{"img":"menustrawberrycreamcheese-optimized.webp","name":"Strawberry Creamcheese Cake","badge":"Popular","bc":"tb-sweet","price":"S$14.90"},{"img":"menustrawberrynutella-optimized.webp","name":"Strawberry/Banana Nutella","badge":"Sweet crepes","bc":"tb-sweet","price":"S$11.90"},{"img":"menumtbuldak-optimized.webp","name":"Buldak (spicy)","badge":"Savoury crepes","bc":"tb-savory","price":"S$11.90"},{"img":"menuspicytunamayo-optimized.webp","name":"Tuna Mayo","badge":"Savoury crepes","bc":"tb-savory","price":"S$9.90"}];
// FEATURED_END
var tCur=0,tN=tCrepes.length,tPaused=false,tTimer=null,tDragX=0,tDragY=0,tDragging=false,tDelta=0,tHover=false,tFocus=false;
var motionPreference=window.matchMedia("(prefers-reduced-motion: reduce)");
tPaused=motionPreference.matches;
function tBuild(){var stage=document.getElementById('tStage');var dots=document.getElementById('tDots');if(!stage)return;stage.innerHTML='';dots.innerHTML='';tCrepes.forEach(function(c,i){var card=document.createElement('div');card.className='tcard';card.setAttribute('role','group');card.setAttribute('aria-roledescription','slide');card.setAttribute('aria-label',(i+1)+' of '+tN);card.innerHTML='<img src="'+c.img+'" alt="'+c.name+'" loading="lazy" decoding="async" width="700" height="700"><div class="tcard-info"><span class="tcard-badge '+c.bc+'">'+c.badge+'</span><div class="tcard-name">'+c.name+'</div><div class="tcard-price">'+c.price+'</div></div>';stage.appendChild(card);var dot=document.createElement('button');dot.type='button';dot.className='tc-dot'+(i===0?' on':'');dot.setAttribute('aria-label','Show '+c.name);dot.addEventListener('click',(function(idx){return function(){tGoTo(idx);};})(i));dots.appendChild(dot);});tRender();tAttachSwipe();tStartAuto();}
function tRender(){var cards=document.querySelectorAll('.tcard');var dots=document.querySelectorAll('.tc-dot');cards.forEach(function(card,i){var rel=((i-tCur)%tN+tN)%tN;var signed=rel<=tN/2?rel:rel-tN;var pos;if(signed===0)pos='0';else if(signed===1)pos='1';else if(signed===-1)pos='-1';else if(signed===2)pos='2';else if(signed===-2)pos='-2';else pos='hidden';card.setAttribute('data-pos',pos);card.setAttribute('aria-hidden',String(signed!==0));});dots.forEach(function(d,i){var active=i===tCur;d.classList.toggle('on',active);d.setAttribute('aria-current',active?'true':'false');});}
function tStep(dir){tCur=(tCur+dir+tN)%tN;tRender();tResetAuto();}function tGoTo(idx){tCur=idx;tRender();tResetAuto();}
function tUpdatePause(){var b=document.getElementById('carouselPause');b.textContent=tPaused?'Play slideshow':'Pause slideshow';b.setAttribute('aria-pressed',String(tPaused));}
function tTogglePause(){tPaused=!tPaused;tUpdatePause();tStartAuto();}
function tStartAuto(){clearTimeout(tTimer);if(!tPaused&&!tHover&&!tFocus&&!document.hidden&&csCurrentPanel==='menu'&&!menuDialog.open)tTimer=setTimeout(function(){tCur=(tCur+1)%tN;tRender();tStartAuto();},5000);}
function tResetAuto(){tStartAuto();}
function tAttachSwipe(){
  var stage=document.getElementById('tStage'),wrap=stage.closest('.turnstile-wrap');
  stage.style.touchAction='pan-y';
  stage.addEventListener('pointerdown',function(e){if(e.button!==0)return;tDragX=e.clientX;tDragY=e.clientY;tDelta=0;tDragging=true;stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointerup',function(e){if(!tDragging)return;var dx=e.clientX-tDragX,dy=e.clientY-tDragY;tDragging=false;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))tStep(dx<0?1:-1);});
  stage.addEventListener('pointercancel',function(){tDragging=false;});
  stage.addEventListener('dragstart',function(e){e.preventDefault();});
  wrap.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){tHover=true;tStartAuto();}});
  wrap.addEventListener('pointerleave',function(){tHover=false;tStartAuto();});
  wrap.addEventListener('focusin',function(){tFocus=true;tStartAuto();});
  wrap.addEventListener('focusout',function(e){tFocus=wrap.contains(e.relatedTarget);tStartAuto();});
  document.addEventListener('visibilitychange',tStartAuto);
  motionPreference.addEventListener('change',function(e){if(e.matches)tPaused=true;tUpdatePause();tStartAuto();});
  tUpdatePause();
}
async function seasonalBuild(){
  var section=document.getElementById('seasonal');
  var grid=document.getElementById('seasonalGrid');
  if(!section||!grid)return;
  try{
    var res=await fetch('seasonal-crepes.json',{cache:'no-store'});
    if(!res.ok) return;
    var data=await res.json();
    var items=Array.isArray(data.items)?data.items:[];
    if(!items.length){section.hidden=true;return;}
    section.hidden=false;
    var label=section.querySelector('.section-label');
    var title=section.querySelector('.section-title');
    var copy=section.querySelector('.seasonal-copy');
    if(label&&data.eyebrow)label.textContent=data.eyebrow;
    if(title&&data.title)title.textContent=data.title;
    if(copy&&data.description)copy.textContent=data.description;
    grid.innerHTML='';
    items.forEach(function(item){
      var card=document.createElement('article');
      card.className='seasonal-card';
      var img=document.createElement('img');
      img.className='seasonal-card-img';
      img.loading='lazy';
      img.decoding='async';
      img.src=item.image||'';
      img.alt=item.alt||item.name||'Seasonal crepe';
      card.appendChild(img);
      var body=document.createElement('div');
      body.className='seasonal-card-body';
      if(item.badge){
        var badge=document.createElement('div');
        badge.className='seasonal-card-label';
        badge.textContent=item.badge;
        body.appendChild(badge);
      }
      var name=document.createElement('div');
      name.className='seasonal-card-name';
      name.textContent=item.name||'Seasonal crepe';
      body.appendChild(name);
      if(item.description){
        var desc=document.createElement('div');
        desc.className='seasonal-card-desc';
        desc.textContent=item.description;
        body.appendChild(desc);
      }
      if(item.price){
        var price=document.createElement('div');
        price.className='seasonal-card-price';
        price.textContent=item.price;
        body.appendChild(price);
      }
      card.appendChild(body);
      grid.appendChild(card);
    });
  }catch(err){
    section.hidden=true;
  }
}
document.addEventListener('DOMContentLoaded',function(){tBuild();seasonalBuild();var h=document.getElementById('hamburger');var m=document.getElementById('mobileNav');if(h&&m){h.addEventListener('click',function(){
    var isOpen=m.classList.contains('open');
    if(isOpen){h.classList.remove('open');m.classList.remove('open');h.setAttribute('aria-expanded','false');document.body.style.overflow='';}
    else{h.classList.add('open');m.classList.add('open');h.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
  });
  m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){h.classList.remove('open');m.classList.remove('open');h.setAttribute('aria-expanded','false');document.body.style.overflow='';});});
  m.addEventListener('click',function(e){if(e.target===m){h.classList.remove('open');m.classList.remove('open');h.setAttribute('aria-expanded','false');document.body.style.overflow='';}});
  window.addEventListener('pageshow',function(){h.classList.remove('open');m.classList.remove('open');h.setAttribute('aria-expanded','false');document.body.style.overflow='';});}});
var nav=document.getElementById('nav');
window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>60);});

// Hash-based navigation also supports direct links and browser history.
var csCurrentPanel='menu';
function applyPanel(panel,scroll){
  if(panel!=='menu'&&panel!=='matcha')return;
  csCurrentPanel=panel;
  document.getElementById('menu').classList.toggle('cs-panel-hidden',panel!=='menu');
  document.getElementById('matcha').classList.toggle('cs-panel-hidden',panel!=='matcha');
  document.querySelectorAll('.cs-tab').forEach(function(tab){var active=tab.dataset.panel===panel;tab.classList.toggle('cs-tab-active',active);tab.setAttribute('aria-pressed',String(active));tab.setAttribute('aria-controls',tab.dataset.panel);});
  var bar=document.getElementById('csTabBar');bar.dataset.active=panel;
  if(scroll)bar.scrollIntoView({behavior:motionPreference.matches?'auto':'smooth',block:'start'});
  tStartAuto();
}
function switchPanel(panel){if(panel!=='menu'&&panel!=='matcha')return;if(location.hash!=='#'+panel)history.pushState(null,'','#'+panel);applyPanel(panel,true);}
function syncPanel(){var panel=location.hash.slice(1);applyPanel(panel==='matcha'?'matcha':'menu',panel==='matcha'||panel==='menu');}
window.addEventListener('hashchange',syncPanel);
document.addEventListener('DOMContentLoaded',syncPanel);
document.addEventListener('click',function(e){var a=e.target.closest('a[href="#menu"],a[href="#matcha"]');if(a){e.preventDefault();switchPanel(a.hash.slice(1));}});

// Matcha arrow animation
(function(){
  var hasAnimated=false;
  function buildArrow(){
    var para=document.getElementById('matcha-rich-desc');
    var card=document.querySelector('.ml-glass-card');
    var grid=document.querySelector('.matcha-top-grid');
    var svg=document.getElementById('matcha-arrow-svg');
    var path=document.getElementById('matcha-arrow-path');
    if(!para||!card||!grid||!svg||!path||motionPreference.matches)return;
    if(window.innerWidth<=1024){svg.style.display='none';return;}
    svg.style.display='block';
    var gr=grid.getBoundingClientRect();
    var pr=para.getBoundingClientRect();
    var cr=card.getBoundingClientRect();
    var x1=pr.right-gr.left;
    var y1=pr.top+pr.height/2-gr.top;
    var x2=cr.left-gr.left;
    var y2=cr.top+cr.height*0.38-gr.top;
    var dx=x2-x1;
    var cx1=x1+dx*0.35; var cy1=y1+35;
    var cx2=x1+dx*0.65; var cy2=y2-20;
    svg.setAttribute('width',gr.width);
    svg.setAttribute('height',gr.height);
    svg.setAttribute('viewBox','0 0 '+gr.width+' '+gr.height);
    path.setAttribute('d','M'+x1+','+y1+' C'+cx1+','+cy1+' '+cx2+','+cy2+' '+x2+','+y2);
    path.style.transition='none';
    var len=path.getTotalLength();
    path.style.strokeDasharray=len+' '+len;
    path.style.strokeDashoffset=len;
    return len;
  }
  function animateArrow(){
    var len=buildArrow();
    if(!len)return;
    var path=document.getElementById('matcha-arrow-path');
    var card=document.querySelector('.ml-glass-card');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        path.style.transition='stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s';
        path.style.strokeDashoffset='0';
      });
    });
    setTimeout(function(){
      if(card){card.classList.add('matcha-glow-active');}
    },1700);
  }
  var section=document.getElementById('matcha');
  if(section&&'IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting&&!hasAnimated){hasAnimated=true;animateArrow();}
      });
    },{threshold:0.45});
    obs.observe(section);
  }
  window.addEventListener('resize',function(){
    if(hasAnimated)buildArrow();
  });
})();
