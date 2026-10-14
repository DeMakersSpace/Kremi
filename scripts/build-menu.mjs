import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const menu=JSON.parse(await readFile(path.join(root,'menu-data.json'),'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=n=>'S$'+n.toFixed(2);
function rows(items){return '<dl class="menu-price-list">'+items.map(x=>'<div><dt>'+escape(x.name)+(x.description?'<small>'+escape(x.description)+'</small>':'')+'</dt><dd>'+price(x.price)+'</dd></div>').join('')+'</dl>';}
function groups(){return menu.drinks.map(g=>'<section class="drink-card"><h3 class="drink-cat-title">'+escape(g.category)+'</h3>'+(g.note?'<p class="drink-cat-note">'+escape(g.note)+'</p>':'')+rows(g.items.map(([name,price])=>({name,price})))+'</section>').join('\n');}
const crepes=[...new Set(menu.crepes.map(x=>x.category))].map(c=>'<h3>'+escape(c)+'</h3>'+rows(menu.crepes.filter(x=>x.category===c))).join('')+'<h3>Add-ons</h3>'+rows(menu.crepeAddons)+'<p>'+escape(menu.crepeNote)+'</p>';
const drinks='<p class="menu-options">'+escape(menu.drinksNote)+'</p><div class="drinks-menu-grid">'+groups()+'</div>';
let html=await readFile(path.join(root,'index.html'),'utf8');
function replaceBlock(text,start,end,body){const a=text.indexOf(start),b=text.indexOf(end);if(a<0||b<a)throw Error('Missing generated menu markers: '+start);return text.slice(0,a+start.length)+'\n'+body+'\n'+text.slice(b);}
html=replaceBlock(html,'<!-- DRINKS_START -->','<!-- DRINKS_END -->',drinks);
html=replaceBlock(html,'<!-- MENU_TEXT_START -->','<!-- MENU_TEXT_END -->','<div id="menuTextCrepe">'+crepes+'</div><div id="menuTextDrinks" hidden>'+drinks+'</div>');
await writeFile(path.join(root,'index.html'),html);
const featured=menu.crepes.filter(x=>x.featured).map(x=>({img:x.image,name:x.name,badge:x.category,bc:x.category==='Savoury crepes'?'tb-savory':'tb-sweet',price:price(x.price)}));
let js=await readFile(path.join(root,'home.js'),'utf8');
js=replaceBlock(js,'// FEATURED_START','// FEATURED_END','var tCrepes='+JSON.stringify(featured)+';');
for (const asset of ['KremiCrepeMenu.png','KremiDrinksMenuA4.png','KremiCrepeMenu-preview.jpg','KremiDrinksMenuA4-preview.jpg']) {
  const hash=createHash('sha256').update(await readFile(path.join(root,asset))).digest('hex').slice(0,10);
  const pattern=new RegExp(asset.replaceAll('.', '\\.')+'(?:\\?v=[a-f0-9]+)?','g');
  js=js.replace(pattern,asset+'?v='+hash);
  html=html.replace(pattern,asset+'?v='+hash);
}
await writeFile(path.join(root,'index.html'),html);
await writeFile(path.join(root,'home.js'),js);
console.log('Built menu: '+menu.crepes.length+' crepes, '+menu.drinks.reduce((n,g)=>n+g.items.length,0)+' drinks.');
