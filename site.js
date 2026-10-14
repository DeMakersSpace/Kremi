document.addEventListener('DOMContentLoaded',function(){
  var trigger=document.getElementById('hamburger'),nav=document.getElementById('mobileNav');
  if(!trigger||!nav)return;
  var wasOpen=false;
  function sync(){var open=trigger.getAttribute('aria-expanded')==='true';nav.inert=!open;trigger.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');if(open&&!wasOpen){var first=nav.querySelector('a');if(first)first.focus();}wasOpen=open;}
  new MutationObserver(sync).observe(trigger,{attributes:true,attributeFilter:['aria-expanded']});sync();
  document.addEventListener('keydown',function(e){if(trigger.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){trigger.click();trigger.focus();return;}if(e.key==='Tab'){var links=[trigger].concat(Array.from(nav.querySelectorAll('a,button')));var first=links[0],last=links[links.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  window.addEventListener('resize',function(){if(window.innerWidth>1024&&trigger.getAttribute('aria-expanded')==='true')trigger.click();});
});
