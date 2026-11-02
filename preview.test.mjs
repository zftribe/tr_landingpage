import {test,after} from 'node:test'
import assert from 'node:assert/strict'
import {readFile,access} from 'node:fs/promises'
import {Script} from 'node:vm'
import {createPreviewServer} from './preview.mjs'

const server=createPreviewServer()
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const base=`http://127.0.0.1:${server.address().port}`
after(()=>new Promise(resolve=>server.close(resolve)))
test('homepage and tracker serve without any credentials',async()=>{
  for(const url of ['/','/yield-tracker/']){const r=await fetch(base+url);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/)}
})
test('hidden repository/credential paths and mutations are denied',async()=>{
  for(const url of ['/.git/config','/.env.local','/%2egit/config'])assert.equal((await fetch(base+url)).status,403)
  assert.equal((await fetch(base+'/',{method:'POST',body:'not-a-form'})).status,405)
  assert.equal((await fetch(base+'/missing.html')).status,404)
  const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'')
})
test('referenced local images, pages and inline scripts resolve or parse',async()=>{
  for(const page of ['index.html','yield-tracker/index.html']){
    const text=await readFile(new URL(page,import.meta.url),'utf8')
    // Generated template URLs need browser review; check static markup here.
    const markup=text.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g,'')
    for(const match of markup.matchAll(/\b(?:src|href)="([^"#]+)"/g)){
      const source=match[1];if(/^(?:[a-z]+:|\/\/|\/)/i.test(source))continue
      const relative=decodeURIComponent(source.split(/[?#]/)[0]);if(relative)await access(new URL(relative,new URL(page,import.meta.url)))
    }
    for(const match of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Script(match[1],{filename:page})
  }
})
