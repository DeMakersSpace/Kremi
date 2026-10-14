import { readdir, mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2] || path.join(root,'_site'));
await mkdir(destination,{recursive:true});
const pages=new Set(['index.html','events.html','our-story.html','reviews.html']);
const files=new Set([...pages,'home.js','site.js','site-fixes.css','sitemap.xml','seasonal-crepes.json','menu-data.json']);
for(const name of await readdir(root)) if(/\.(png|jpe?g|webp|svg|ico)$/i.test(name)||['CNAME','robots.txt','.nojekyll'].includes(name)) files.add(name);
for(const file of files) await copyFile(path.join(root,file),path.join(destination,file));
const seasonal=JSON.parse(await readFile(path.join(root,'seasonal-crepes.json'),'utf8'));
for(const item of seasonal.items||[]){if(!item.image||/^(https?:|data:)/i.test(item.image))continue;const source=path.resolve(root,item.image);const relative=path.relative(root,source);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Invalid seasonal image path');await mkdir(path.dirname(path.join(destination,relative)),{recursive:true});await copyFile(source,path.join(destination,relative));}
console.log('Prepared public website in '+destination+' (owner tools excluded).');
