import http from 'node:http'
import {readFile,realpath,stat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const types={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'}
export function createPreviewServer(directory=fileURLToPath(new URL('.',import.meta.url))){
  const root=path.resolve(directory)
  return http.createServer(async(req,res)=>{
    if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return}
    try{
      const url=new URL(req.url||'/','http://127.0.0.1'),decoded=decodeURIComponent(url.pathname)
      if(decoded.includes('\\')||decoded.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Not available');return}
      const relative=decoded.endsWith('/')?decoded.slice(1)+'index.html':decoded.slice(1)
      const target=await realpath(path.resolve(root,relative)),canonicalRoot=await realpath(root)
      if(!target.startsWith(canonicalRoot+path.sep)||!(await stat(target)).isFile()){res.writeHead(403);res.end('Not available');return}
      const data=await readFile(target)
      res.writeHead(200,{'Content-Type':types[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
      res.end(req.method==='HEAD'?undefined:data)
    }catch{res.writeHead(404);res.end('Not found')}
  })
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const position=process.argv.indexOf('--port'),port=position>=0?Number(process.argv[position+1]):59127
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Use --port with an integer from 1 to 65535')
  createPreviewServer().listen(port,'127.0.0.1',()=>console.log(`Welcome preview: http://127.0.0.1:${port}/`))
}
