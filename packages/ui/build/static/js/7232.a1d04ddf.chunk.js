"use strict";(self.webpackChunkflowise_ui=self.webpackChunkflowise_ui||[]).push([[7232],{17832:(e,t,a)=>{a.r(t),a.d(t,{default:()=>R});var r=a(59192),n=a(94948),s=a(87724),i=a(58584),o=(a(46632),a(12424),a(26696)),c=a(63556),l=a(59988),d=a(8936),h=a(2973),x=a(26e3),p=a(2340),m=a(58424),u=a(12464),g=a(83920),j=a(60560),f=a(25352),y=a(99664),b=a(80576),w=a(9e4);const v=(0,x.cp)(g.c)((e=>{let{theme:t}=e;return{background:t.palette.card.main,color:t.darkTextPrimary,border:"solid 1px",borderColor:t.palette.primary[200]+75,width:"300px",height:"auto",padding:"10px",boxShadow:"0 2px 14px 0 rgb(32 40 45 / 8%)","&:hover":{borderColor:t.palette.primary.main}}})),k=e=>{let{data:t}=e;const a=(0,h.c)(),[n,s]=(0,r.useState)(!1),[i,o]=(0,r.useState)({});return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(v,{content:!1,sx:{padding:0,borderColor:t.selected?a.palette.primary.main:a.palette.text.secondary},border:!1,children:(0,w.jsxs)(c.c,{children:[(0,w.jsxs)("div",{style:{display:"flex",flexDirection:"row",alignItems:"center"},children:[(0,w.jsx)(c.c,{style:{width:50,marginRight:10,padding:5},children:(0,w.jsx)("div",{style:{...a.typography.commonAvatar,...a.typography.largeAvatar,borderRadius:"50%",backgroundColor:"white",cursor:"grab"},children:(0,w.jsx)("img",{style:{width:"100%",height:"100%",padding:5,objectFit:"contain"},src:"".concat(b.OM,"/api/v1/node-icon/").concat(t.name),alt:"Notification"})})}),(0,w.jsx)(c.c,{children:(0,w.jsx)(p.c,{sx:{fontSize:"1rem",fontWeight:500},children:t.label})})]}),(t.inputAnchors.length>0||t.inputParams.length>0)&&(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(m.c,{}),(0,w.jsx)(c.c,{sx:{background:a.palette.asyncSelect.main,p:1},children:(0,w.jsx)(p.c,{sx:{fontWeight:500,textAlign:"center"},children:"Inputs"})}),(0,w.jsx)(m.c,{})]}),t.inputAnchors.map(((e,a)=>(0,w.jsx)(j.c,{disabled:!0,inputAnchor:e,data:t},a))),t.inputParams.map(((e,a)=>(0,w.jsx)(j.c,{disabled:!0,inputParam:e,data:t},a))),t.inputParams.find((e=>e.additionalParams))&&(0,w.jsx)("div",{style:{textAlign:"center"},children:(0,w.jsx)(u.c,{sx:{borderRadius:25,width:"90%",mb:2},variant:"outlined",onClick:()=>{const e={data:t,inputParams:t.inputParams.filter((e=>e.additionalParams)),disabled:!0,confirmButtonName:"Save",cancelButtonName:"Cancel"};o(e),s(!0)},children:"Additional Parameters"})}),(0,w.jsx)(m.c,{}),(0,w.jsx)(c.c,{sx:{background:a.palette.asyncSelect.main,p:1},children:(0,w.jsx)(p.c,{sx:{fontWeight:500,textAlign:"center"},children:"Output"})}),(0,w.jsx)(m.c,{}),t.outputAnchors.map(((e,a)=>(0,w.jsx)(f.c,{disabled:!0,outputAnchor:e,data:t},a)))]})}),(0,w.jsx)(y.c,{show:n,dialogProps:i,onCancel:()=>s(!1)})]})};var C=a(66448),A=a(16024),N=a(20332),P=a(78472),S=a(79557);const D=e=>{let{flowName:t,flowData:a,onChatflowCopy:r}=e;const n=(0,h.c)(),s=(0,o.i6)();return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(c.c,{children:(0,w.jsx)(C.c,{title:"Back",sx:{borderRadius:"50%"},children:(0,w.jsx)(A.c,{variant:"rounded",sx:{...n.typography.commonAvatar,...n.typography.mediumAvatar,transition:"all .2s ease-in-out",background:n.palette.secondary.light,color:n.palette.secondary.dark,"&:hover":{background:n.palette.secondary.dark,color:n.palette.secondary.light}},color:"inherit",onClick:()=>s(-1),children:(0,w.jsx)(S.C4Y,{stroke:1.5,size:"1.3rem"})})})}),(0,w.jsx)(c.c,{sx:{flexGrow:1},children:(0,w.jsx)(N.c,{flexDirection:"row",children:(0,w.jsx)(p.c,{sx:{fontSize:"1.5rem",fontWeight:600,ml:2},children:t})})}),(0,w.jsx)(c.c,{children:(0,w.jsx)(P.y,{color:"secondary",variant:"contained",title:"Use Chatflow",onClick:()=>r(a),startIcon:(0,w.jsx)(S.Ql2,{}),children:"Use Template"})})]})},O={customNode:k},F={buttonedge:""},R=()=>{const e=(0,h.c)(),t=(0,o.i6)(),{state:a}=(0,o.IT)(),{flowData:x,name:p}=a,[m,u,g]=(0,n.wn)(),[j,f,y]=(0,n.lu)(),b=(0,r.useRef)(null);(0,r.useEffect)((()=>{if(x){const e=JSON.parse(x);u(e.nodes||[]),f(e.edges||[])}}),[x]);return(0,w.jsx)(w.Fragment,{children:(0,w.jsxs)(c.c,{children:[(0,w.jsx)(l.c,{enableColorOnDark:!0,position:"fixed",color:"inherit",elevation:1,sx:{bgcolor:e.palette.background.default},children:(0,w.jsx)(d.c,{children:(0,w.jsx)(D,{flowName:p,flowData:JSON.parse(x),onChatflowCopy:e=>(e=>{const a=JSON.stringify(e);t("/canvas",{state:{templateFlowData:a}})})(e)})})}),(0,w.jsx)(c.c,{sx:{pt:"70px",height:"100vh",width:"100%"},children:(0,w.jsx)("div",{className:"reactflow-parent-wrapper",children:(0,w.jsx)("div",{className:"reactflow-wrapper",ref:b,children:(0,w.jsxs)(n.UX,{nodes:m,edges:j,onNodesChange:g,onEdgesChange:y,nodesDraggable:!1,nodeTypes:O,edgeTypes:F,fitView:!0,minZoom:.1,children:[(0,w.jsx)(s.O,{style:{display:"flex",flexDirection:"row",left:"50%",transform:"translate(-50%, -50%)"}}),(0,w.jsx)(i.y,{color:"#aaa",gap:16})]})})})})]})})}}}]);
//# sourceMappingURL=7232.a1d04ddf.chunk.js.map