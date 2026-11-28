// Trusted static code only: no query text, user input, credentials, or error bodies are embedded.
// Runs from HTML so it can recover even when the application/instrumentation bundle itself fails.
export const earlyChunkRecovery = `(function(){
window.addEventListener('error',function(event){try{
 var target=event.target;
 if(!target)return;
 var src=target.tagName==='SCRIPT'?target.src:target.tagName==='LINK'&&target.rel==='stylesheet'?target.href:'';
 if(!src)return;
 var asset=new URL(src,window.location.href);
 if(asset.origin!==window.location.origin||!asset.pathname.startsWith('/_next/static/'))return;
 var key='rightstart:chunk-retry-at',now=Date.now(),last=Number(window.sessionStorage.getItem(key));
 if(Number.isFinite(last)&&last>0&&last<=now&&now-last<60000)return;
 var page=new URL(window.location.href);
 page.searchParams.set('_rs_reload',now.toString(36));
 window.sessionStorage.setItem(key,String(now));
 window.location.replace(page.href);
}catch(ignore){}},true);
})();`;
