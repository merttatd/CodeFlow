if(typeof require==='function')require('./graph-layout.js');
(function(){
function assert(value,message){if(!value)throw Error(message)}
function check(nodes,edges){const map=CodeFlowLayout.layout(nodes,edges),boxes=[...map.positions].map(([id,p])=>({id,...p,w:map.nodeWidth,h:map.nodeHeight}));
for(const a of boxes){assert(a.x>=0&&a.y>=0&&a.x+a.w<=map.width&&a.y+a.h<=map.height,'Canvas contains cards');for(const b of boxes)if(a.id!==b.id)assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'Cards do not overlap')}
for(const route of map.routes){for(let i=1;i<route.points.length;i++){const [x1,y1]=route.points[i-1],[x2,y2]=route.points[i];assert(x1===x2||y1===y2,'Orthogonal route');for(const b of boxes){const crosses=x1===x2?x1>b.x&&x1<b.x+b.w&&Math.max(y1,y2)>b.y&&Math.min(y1,y2)<b.y+b.h:y1>b.y&&y1<b.y+b.h&&Math.max(x1,x2)>b.x&&Math.min(x1,x2)<b.x+b.w;assert(!crosses,'Arrows must not pass through cards')}}}
return map}
const nodes=Array.from({length:40},(_,i)=>({id:'n'+i}));const edges=[];for(let i=0;i<39;i++)edges.push({source:'n'+i,target:'n'+(i+1)});for(let i=2;i<30;i+=3)edges.push({source:'n0',target:'n'+i});edges.push({source:'n8',target:'n2'},{source:'n3',target:'n3'});check(nodes,edges);
const fan=Array.from({length:24},(_,i)=>({source:'n0',target:'n'+(i+1)}));check(nodes,fan);check(nodes,[]);check([],[]);
console.log('Passed graph layout: cycles, recursion, disconnected nodes, fan-out, card bounds and obstacle-free orthogonal routing.');
})();
