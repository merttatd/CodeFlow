/* Evidence-based descriptions and call sites; no remote service is used. */
(function(root){
function mask(s){return s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,x=>x.replace(/[^\n]/g,' '))}
function closing(s,start){let depth=0;for(let i=start;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')'&&!--depth)return i}return start}
function enrich(model){
const functions=model.nodes.filter(n=>n.type==='function'),files=model.nodes.filter(n=>n.type==='file');
model.edges=model.edges.filter(e=>e.kind!=='call');
for(const fn of functions){
const file=files.find(f=>f.path===fn.path),py=fn.path.endsWith('.py'),clean=mask(fn.code),open=clean.indexOf('('),close=open>=0?closing(clean,open):-1,arrow=clean.indexOf('=>');
const expressionArrow=!py&&arrow>=0&&clean.slice(arrow+2).trimStart()[0]!=='{';
const bodyStart=py?clean.indexOf('\n')+1:arrow>=0?arrow+2:clean.indexOf('{',close)+1;
fn.parameters=arrow>=0&&(open<0||arrow<open)?fn.code.slice(0,arrow).replace(/^[\s\S]*?=\s*(?:async\s+)?/,'').trim():open>=0?fn.code.slice(open+1,close).trim():'';
fn.signature=fn.label+'('+fn.parameters+')';
const prefix=file.code.split('\n').slice(0,fn.line-1).join('\n');
const comment=prefix.match(/\/\*\*?((?:(?!\*\/)[\s\S])*)\*\/\s*$/);const lineComments=prefix.match(/(?:^[\t ]*(?:#|\/\/)[^\n]*\n?)+$/m);
const doc=py?fn.code.slice(bodyStart).match(/^\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/):null;
fn.documentation=doc?(doc[1]||doc[2]||'').trim():comment?comment[1].replace(/^\s*\* ?/gm,'').trim():lineComments&&lineComments.index+lineComments[0].length===prefix.length?lineComments[0].replace(/^\s*(?:#|\/\/) ?/gm,'').trim():'';
let body=clean.slice(bodyStart);const nested=functions.filter(n=>n!==fn&&n.path===fn.path&&n.line>fn.line&&n.line<=fn.endLine);
// Exclude separately declared nested functions from the enclosing function's calls.
for(const child of nested){const pos=fn.code.indexOf(child.code,bodyStart);if(pos>=0){const start=pos-bodyStart;body=body.slice(0,start)+body.slice(start,start+child.code.length).replace(/[^\n]/g,' ')+body.slice(start+child.code.length)}}
fn.callSites=[];fn.returns=[];fn.steps=[];
const re=/\b([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*)\s*\(/g;let match;
const exclude=new Set(['if','for','while','switch','catch','function','def','with']);
while((match=re.exec(body))){const name=match[1].replace(/\s/g,''),offset=bodyStart+match.index;if(exclude.has(name))continue;const paren=clean.indexOf('(',offset),end=closing(clean,paren);const line=fn.line+clean.slice(0,offset).split('\n').length-1;
let candidates=[];if(!name.includes('.')){candidates=functions.filter(n=>n.path===fn.path&&n.label===name);if(!candidates.length){const imported=model.edges.filter(e=>e.source==='file:'+fn.path&&e.kind==='import').map(e=>e.target);candidates=functions.filter(n=>n.label===name&&imported.includes('file:'+n.path))}}
const target=candidates.length===1?candidates[0]:null;
const call={name,line,arguments:fn.code.slice(paren+1,end).trim(),source:fn.code.slice(offset,end+1),target:target?.id||null,resolution:target?'Olası proje içi eşleşme':candidates.length>1?'Birden fazla aday':'Harici, yerleşik veya çözümlenemeyen çağrı'};
fn.callSites.push(call);if(target){let edge=model.edges.find(e=>e.source===fn.id&&e.target===target.id&&e.kind==='call');if(!edge){edge={source:fn.id,target:target.id,kind:'call',sites:[]};model.edges.push(edge)}edge.sites.push({line,arguments:call.arguments,source:call.source})}
}
const lines=body.split('\n'),sourceLines=fn.code.slice(bodyStart).split('\n');const baseLine=fn.line+clean.slice(0,bodyStart).split('\n').length-1;
lines.forEach((line,i)=>{const ret=/\breturn\b/.exec(line);if(ret)fn.returns.push({line:baseLine+i,expression:sourceLines[i].slice(ret.index+6).replace(/;?\s*}\s*$/,'').trim()||'(değer yok)'});const categories=[[/\b(if|elif|else|switch)\b/,'Koşula göre dallanma'],[/\b(for|while)\b/,'Döngü / yineleme'],[/\b(try|catch|except|finally)\b/,'Hata yönetimi'],[/\b(throw|raise)\b/,'Hata üretme'],[/\bawait\b/,'Asenkron sonucu bekleme']];for(const [pattern,label]of categories)if(pattern.test(line))fn.steps.push({line:baseLine+i,label,source:sourceLines[i].trim()})});
if(expressionArrow)fn.returns.push({line:fn.line+clean.slice(0,bodyStart).split('\n').length-1,expression:fn.code.slice(bodyStart).trim(),implicit:true});
for(const call of fn.callSites)fn.steps.push({line:call.line,label:'Çağrı: '+call.name,source:call.source,target:call.target});
for(const ret of fn.returns)fn.steps.push({line:ret.line,label:ret.implicit?'Örtük dönüş':'Sonucu döndürme',source:ret.expression});fn.steps.sort((a,b)=>a.line-b.line);
const observations=[];if(fn.parameters)observations.push('Girdi alır: '+fn.parameters+'.');if(fn.callSites.length)observations.push([...new Set(fn.callSites.map(c=>c.name))].slice(0,8).join(', ')+' çağrılarını içerir.');if(fn.steps.some(s=>s.label==='Koşula göre dallanma'))observations.push('Koşullara göre farklı yollar izleyebilir.');if(fn.steps.some(s=>s.label==='Döngü / yineleme'))observations.push('Veriler üzerinde yineleme yapar.');if(fn.steps.some(s=>s.label==='Hata yönetimi'))observations.push('Hata yakalama veya temizleme bloğu içerir.');if(fn.returns.length)observations.push('Dönüş ifadeleri aşağıda gösterilir.');else observations.push('Açık bir dönüş ifadesi saptanmadı.');
const effects=[];const names=fn.callSites.map(c=>c.name);if(names.some(x=>/^(fetch|requests\.(get|post|put|patch|delete)|axios(?:\.(get|post|put|patch|delete))?)$/.test(x)))effects.push('HTTP isteği gönderebilir.');if(names.some(x=>/\.(execute|executemany|query)$/.test(x)))effects.push('Veritabanı veya sorgu işlemi yapıyor olabilir.');if(names.some(x=>/^(open|readFile|writeFile)$|\.(readFile|writeFile|readFileSync|writeFileSync)$/.test(x)))effects.push('Dosya okuma veya yazma işlemi yapıyor olabilir.');if(names.some(x=>/\.(map|filter|reduce|sort)$/.test(x)))effects.push('Koleksiyon verilerini dönüştürür, süzer veya sıralar.');if(names.some(x=>/^(print|console\.(log|warn|error|info))$/.test(x)))effects.push('Çıktı veya günlük kaydı üretir.');fn.summary=effects.concat(observations).join(' ');fn.summaryBasis=fn.documentation?'Kaynak açıklaması ve statik kod incelemesi':'Statik koddan çıkarım; iş amacı kesin olarak belirlenemez';
}
model.calls=model.edges.filter(e=>e.kind==='call').length;return model;
}
root.CodeFlowDetails={enrich};
})(globalThis);
