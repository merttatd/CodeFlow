(function(root){
function layout(nodes,edges){
const W=230,H=76,ROW=124,ids=new Set(nodes.map(n=>n.id));edges=edges.filter(e=>ids.has(e.source)&&ids.has(e.target));
const next=new Map(nodes.map(n=>[n.id,[]]));edges.forEach(e=>next.get(e.source).push(e.target));
// Condense cycles before ranking. Every member of a cycle gets its own column.
let index=0;const indices=new Map(),low=new Map(),stack=[],onStack=new Set(),components=[];
function visit(id){indices.set(id,index);low.set(id,index++);stack.push(id);onStack.add(id);for(const target of next.get(id)){if(!indices.has(target)){visit(target);low.set(id,Math.min(low.get(id),low.get(target)))}else if(onStack.has(target))low.set(id,Math.min(low.get(id),indices.get(target)))}if(low.get(id)===indices.get(id)){const group=[];let member;do{member=stack.pop();onStack.delete(member);group.push(member)}while(member!==id);components.push(group.reverse())}}
nodes.forEach(n=>{if(!indices.has(n.id))visit(n.id)});
const componentOf=new Map();components.forEach((group,i)=>group.forEach(id=>componentOf.set(id,i)));
const links=components.map(()=>new Set()),indegree=components.map(()=>0),base=components.map(()=>0);
edges.forEach(e=>{const a=componentOf.get(e.source),b=componentOf.get(e.target);if(a!==b&&!links[a].has(b)){links[a].add(b);indegree[b]++}});
const queue=indegree.map((d,i)=>d===0?i:-1).filter(i=>i>=0);for(let i=0;i<queue.length;i++){const a=queue[i];for(const b of links[a]){base[b]=Math.max(base[b],base[a]+components[a].length);if(!--indegree[b])queue.push(b)}}
const rank=new Map(),columns=[];components.forEach((group,i)=>group.forEach((id,j)=>{const r=base[i]+j;rank.set(id,r);(columns[r]||=[]).push(id)}));
// Alternate barycentric sweeps to keep related nodes near each other.
for(let sweep=0;sweep<8;sweep++){const order=new Map();columns.forEach(col=>col.forEach((id,i)=>order.set(id,i)));const forward=sweep%2===0;const arranged=forward?columns:[...columns].reverse();for(const col of arranged){const score=id=>{const neighbors=edges.filter(e=>forward?e.target===id&&rank.get(e.source)<rank.get(id):e.source===id&&rank.get(e.target)>rank.get(id)).map(e=>order.get(forward?e.source:e.target));return neighbors.length?neighbors.reduce((a,b)=>a+b,0)/neighbors.length:order.get(id)};col.sort((a,b)=>score(a)-score(b));col.forEach((id,i)=>order.set(id,i))}}
const longEdges=edges.filter(e=>rank.get(e.target)!==rank.get(e.source)+1),top=64+longEdges.length*9;
const busiest=Math.max(0,...columns.map(col=>edges.filter(e=>col.includes(e.source)).length));const GAP=Math.max(150,Math.min(440,70+busiest*8));
const rows=Math.max(1,...columns.map(c=>c.length)),positions=new Map();columns.forEach((col,c)=>col.forEach((id,r)=>positions.set(id,{x:64+c*(W+GAP),y:top+(rows-col.length)*ROW/2+r*ROW})));
const outCounts=new Map(),inCounts=new Map();edges.forEach(e=>{outCounts.set(e.source,(outCounts.get(e.source)||0)+1);inCounts.set(e.target,(inCounts.get(e.target)||0)+1)});
const outs=new Map(),ins=new Map(),channels=new Map();let lane=0;
const routes=edges.map(edge=>{const a=positions.get(edge.source),b=positions.get(edge.target),oi=outs.get(edge.source)||0,ii=ins.get(edge.target)||0;outs.set(edge.source,oi+1);ins.set(edge.target,ii+1);const sy=a.y+14+(H-28)*(oi+1)/(outCounts.get(edge.source)+1),ty=b.y+14+(H-28)*(ii+1)/(inCounts.get(edge.target)+1);const r=rank.get(edge.source),channel=channels.get(r)||0;channels.set(r,channel+1);let points;
if(rank.get(edge.target)===r+1){const mid=a.x+W+35+(channel*9)%(GAP-70);points=[[a.x+W,sy],[mid,sy],[mid,ty],[b.x,ty]]}
else{const ly=30+lane++*9;const right=a.x+W+20+(oi%8)*6,left=b.x-20-(ii%8)*6;points=[[a.x+W,sy],[right,sy],[right,ly],[left,ly],[left,ty],[b.x,ty]]}
return {edge,points,d:points.map((p,i)=>(i?'L':'M')+' '+p.join(' ')).join(' ')};
});
return {positions,routes,nodeWidth:W,nodeHeight:H,width:Math.max(680,128+columns.length*(W+GAP)-GAP),height:Math.max(440,top+rows*ROW+30)};
}
root.CodeFlowLayout={layout};
})(globalThis);
