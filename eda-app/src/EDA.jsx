import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine
} from "recharts";

// ── Dataset: Fictional employee survey ──────────────────────────────────────
const RAW = [
  { id:1,  dept:"Engineering", age:28, salary:82000,  satisfaction:7.2, tenure:2,  performance:88, remote:1 },
  { id:2,  dept:"Engineering", age:34, salary:105000, satisfaction:6.8, tenure:6,  performance:91, remote:1 },
  { id:3,  dept:"Engineering", age:41, salary:130000, satisfaction:5.9, tenure:12, performance:85, remote:0 },
  { id:4,  dept:"Engineering", age:29, salary:88000,  satisfaction:8.1, tenure:3,  performance:93, remote:1 },
  { id:5,  dept:"Engineering", age:52, salary:145000, satisfaction:6.1, tenure:18, performance:80, remote:0 },
  { id:6,  dept:"Engineering", age:37, salary:118000, satisfaction:7.5, tenure:9,  performance:87, remote:1 },
  { id:7,  dept:"Marketing",   age:26, salary:58000,  satisfaction:8.4, tenure:1,  performance:79, remote:0 },
  { id:8,  dept:"Marketing",   age:31, salary:72000,  satisfaction:7.9, tenure:5,  performance:82, remote:1 },
  { id:9,  dept:"Marketing",   age:45, salary:94000,  satisfaction:6.2, tenure:14, performance:75, remote:0 },
  { id:10, dept:"Marketing",   age:27, salary:61000,  satisfaction:8.8, tenure:2,  performance:84, remote:1 },
  { id:11, dept:"Marketing",   age:39, salary:85000,  satisfaction:6.5, tenure:10, performance:78, remote:0 },
  { id:12, dept:"Marketing",   age:33, salary:76000,  satisfaction:7.3, tenure:7,  performance:81, remote:1 },
  { id:13, dept:"HR",          age:30, salary:55000,  satisfaction:7.8, tenure:4,  performance:76, remote:0 },
  { id:14, dept:"HR",          age:44, salary:79000,  satisfaction:6.0, tenure:15, performance:72, remote:0 },
  { id:15, dept:"HR",          age:25, salary:48000,  satisfaction:8.6, tenure:1,  performance:80, remote:1 },
  { id:16, dept:"HR",          age:38, salary:68000,  satisfaction:6.9, tenure:11, performance:74, remote:0 },
  { id:17, dept:"Finance",     age:32, salary:98000,  satisfaction:6.7, tenure:6,  performance:89, remote:0 },
  { id:18, dept:"Finance",     age:47, salary:128000, satisfaction:5.8, tenure:17, performance:84, remote:0 },
  { id:19, dept:"Finance",     age:29, salary:85000,  satisfaction:7.6, tenure:3,  performance:91, remote:1 },
  { id:20, dept:"Finance",     age:36, salary:112000, satisfaction:6.4, tenure:9,  performance:87, remote:0 },
  { id:21, dept:"Finance",     age:41, salary:122000, satisfaction:6.0, tenure:13, performance:82, remote:0 },
  { id:22, dept:"Design",      age:27, salary:74000,  satisfaction:8.9, tenure:2,  performance:86, remote:1 },
  { id:23, dept:"Design",      age:33, salary:88000,  satisfaction:8.2, tenure:6,  performance:88, remote:1 },
  { id:24, dept:"Design",      age:40, salary:102000, satisfaction:7.1, tenure:12, performance:83, remote:1 },
  { id:25, dept:"Design",      age:29, salary:79000,  satisfaction:8.5, tenure:4,  performance:90, remote:1 },
  { id:26, dept:"Design",      age:35, salary:95000,  satisfaction:7.8, tenure:8,  performance:85, remote:0 },
  { id:27, dept:"Operations",  age:43, salary:71000,  satisfaction:5.5, tenure:16, performance:70, remote:0 },
  { id:28, dept:"Operations",  age:31, salary:62000,  satisfaction:6.8, tenure:5,  performance:74, remote:0 },
  { id:29, dept:"Operations",  age:28, salary:57000,  satisfaction:7.4, tenure:2,  performance:77, remote:0 },
  { id:30, dept:"Operations",  age:50, salary:84000,  satisfaction:5.2, tenure:22, performance:68, remote:0 },
];

const FIELDS = ["age","salary","satisfaction","tenure","performance"];
const LABELS = {
  age:"Age (yrs)",
  salary:"Salary ($)",
  satisfaction:"Satisfaction (1-10)",
  tenure:"Tenure (yrs)",
  performance:"Performance Score"
};
const DEPT_COLORS = {
  Engineering:"#6EE7B7", Marketing:"#FCA5A5", HR:"#FDE68A",
  Finance:"#93C5FD", Design:"#C4B5FD", Operations:"#F9A8D4"
};

// ── Stats helpers ────────────────────────────────────────────────────────────
function mean(arr) { return arr.reduce((a,b)=>a+b,0)/arr.length; }

function median(arr) {
  const s=[...arr].sort((a,b)=>a-b);
  const m=Math.floor(s.length/2);
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
}

function stdev(arr) {
  const m=mean(arr);
  return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/arr.length);
}

function pearson(xs,ys) {
  const mx=mean(xs), my=mean(ys), sx=stdev(xs), sy=stdev(ys);
  if(!sx||!sy) return 0;
  return xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0)/(xs.length*sx*sy);
}

function histogram(arr, bins=8) {
  const mn=Math.min(...arr), mx=Math.max(...arr), w=(mx-mn)/bins;
  return Array.from({length:bins},(_,i)=>{
    const lo=mn+i*w, hi=lo+w;
    return {
      label:`${Math.round(lo)}–${Math.round(hi)}`,
      count: arr.filter(v=>v>=lo&&(i===bins-1?v<=hi:v<hi)).length
    };
  });
}

function corrColor(r) {
  const a=Math.abs(r);
  if(a>0.7) return r>0?"#6EE7B7":"#FCA5A5";
  if(a>0.4) return r>0?"#A7F3D0":"#FDE8E8";
  return "#1e2030";
}
function corrText(r) { return Math.abs(r)>0.4?"#0f1620":"#94a3b8"; }

// ── Main Component ───────────────────────────────────────────────────────────
export default function EDA() {
  const [scatterX, setScatterX] = useState("tenure");
  const [scatterY, setScatterY] = useState("salary");
  const [histField, setHistField] = useState("salary");
  const [filterDept, setFilterDept] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  const depts = ["All", ...Object.keys(DEPT_COLORS)];
  const data = useMemo(()=>
    filterDept==="All" ? RAW : RAW.filter(r=>r.dept===filterDept),
  [filterDept]);

  const stats = useMemo(()=>
    FIELDS.map(f=>({
      field:f,
      mean:   mean(data.map(r=>r[f])),
      median: median(data.map(r=>r[f])),
      stdev:  stdev(data.map(r=>r[f])),
      min:    Math.min(...data.map(r=>r[f])),
      max:    Math.max(...data.map(r=>r[f])),
    }))
  ,[data]);

  const corrMatrix = useMemo(()=>
    FIELDS.map(a=>FIELDS.map(b=>pearson(data.map(r=>r[a]),data.map(r=>r[b]))))
  ,[data]);

  const deptSalary = useMemo(()=>
    Object.keys(DEPT_COLORS).map(d=>{
      const rows=data.filter(r=>r.dept===d);
      return { dept:d, salary: rows.length?Math.round(mean(rows.map(r=>r.salary))):0, count:rows.length };
    }).filter(d=>d.count>0)
  ,[data]);

  const remoteVsOffice = [
    { label:"Remote",  value: mean(data.filter(r=>r.remote===1).map(r=>r.satisfaction)) },
    { label:"On-site", value: mean(data.filter(r=>r.remote===0).map(r=>r.satisfaction)) },
  ];

  const histData = useMemo(()=>
    histogram(data.map(r=>r[histField]))
  ,[data, histField]);

  const topCorr = useMemo(()=>{
    const pairs=[];
    FIELDS.forEach((a,i)=>FIELDS.forEach((b,j)=>{
      if(j>i) pairs.push({a,b,r:pearson(data.map(r=>r[a]),data.map(r=>r[b]))});
    }));
    return pairs.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r)).slice(0,3);
  },[data]);

  const fmt = (v,f) =>
    f==="salary" ? `$${Math.round(v).toLocaleString()}` :
    f==="satisfaction" ? v.toFixed(2) : Math.round(v);

  const tabs = ["overview","distributions","correlations","scatter","insights"];

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background:"#151823", border:"1px solid #1e2535",
    borderRadius:10, padding:"20px", marginTop:20
  };
  const sectionLabel = {
    fontSize:12, color:"#6EE7B7", letterSpacing:2,
    textTransform:"uppercase", marginBottom:16
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0e1118", color:"#e2e8f0",
      fontFamily:"'DM Mono','Fira Code',monospace", padding:"0 0 60px"
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background:"#151823", borderBottom:"1px solid #1e2535", padding:"28px 36px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:4, color:"#6EE7B7", textTransform:"uppercase", marginBottom:6 }}>
              Exploratory Data Analysis
            </div>
            <div style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.5px" }}>
              Employee Survey Dataset
            </div>
            <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
              {data.length} records · 6 departments · 7 variables
            </div>
          </div>

          {/* Dept filter buttons */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {depts.map(d=>(
              <button key={d} onClick={()=>setFilterDept(d)} style={{
                padding:"5px 13px", borderRadius:20, border:"1px solid",
                borderColor: filterDept===d?"#6EE7B7":"#2a3348",
                background: filterDept===d?"#6EE7B71a":"transparent",
                color: filterDept===d?"#6EE7B7":"#64748b",
                fontSize:12, cursor:"pointer"
              }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", marginTop:20, borderBottom:"1px solid #1e2535" }}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{
              padding:"8px 18px", background:"transparent", border:"none",
              borderBottom: activeTab===t?"2px solid #6EE7B7":"2px solid transparent",
              color: activeTab===t?"#6EE7B7":"#475569",
              fontSize:12, letterSpacing:1, textTransform:"uppercase",
              cursor:"pointer", fontFamily:"inherit", marginBottom:-1
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div style={{ padding:"28px 36px", maxWidth:1100 }}>

        {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
        {activeTab==="overview" && (<>

          {/* KPI Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
            {[
              { label:"Avg Salary",       value:`$${Math.round(mean(data.map(r=>r.salary))).toLocaleString()}`, accent:"#93C5FD" },
              { label:"Avg Satisfaction", value:mean(data.map(r=>r.satisfaction)).toFixed(2)+"/10",             accent:"#6EE7B7" },
              { label:"Avg Performance",  value:mean(data.map(r=>r.performance)).toFixed(1),                   accent:"#C4B5FD" },
              { label:"Avg Tenure",       value:mean(data.map(r=>r.tenure)).toFixed(1)+" yrs",                 accent:"#FDE68A" },
              { label:"Remote Workers",   value:Math.round(100*data.filter(r=>r.remote).length/data.length)+"%", accent:"#FCA5A5" },
            ].map(k=>(
              <div key={k.label} style={{ background:"#151823", border:"1px solid #1e2535", borderRadius:10, padding:"16px 18px" }}>
                <div style={{ fontSize:11, color:"#475569", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{k.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:k.accent }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Stats Table */}
          <div style={{ background:"#151823", border:"1px solid #1e2535", borderRadius:10, overflow:"auto" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #1e2535", ...sectionLabel }}>
              Statistical Summary
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1e2535" }}>
                  {["Variable","Mean","Median","Std Dev","Min","Max"].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", textAlign:h==="Variable"?"left":"right", color:"#475569", fontWeight:500, fontSize:11, letterSpacing:1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s,i)=>(
                  <tr key={s.field} style={{ borderBottom:"1px solid #1a2030", background:i%2?"#12151e":"transparent" }}>
                    <td style={{ padding:"10px 16px", color:"#94a3b8" }}>{LABELS[s.field]}</td>
                    {[s.mean,s.median,s.stdev,s.min,s.max].map((v,j)=>(
                      <td key={j} style={{ padding:"10px 16px", textAlign:"right", color:"#e2e8f0" }}>{fmt(v,s.field)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dept Salary Bar Chart */}
          <div style={card}>
            <div style={sectionLabel}>Average Salary by Department</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptSalary} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                <XAxis dataKey="dept" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{ background:"#1a2030", border:"1px solid #2a3348", borderRadius:8, fontSize:12 }}
                  formatter={v=>[`$${v.toLocaleString()}`,"Avg Salary"]}/>
                <Bar dataKey="salary" radius={[4,4,0,0]}>
                  {deptSalary.map(d=><Cell key={d.dept} fill={DEPT_COLORS[d.dept]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>)}

        {/* ── DISTRIBUTIONS ──────────────────────────────────────────────── */}
        {activeTab==="distributions" && (<>

          {/* Field selector */}
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
            {FIELDS.map(f=>(
              <button key={f} onClick={()=>setHistField(f)} style={{
                padding:"6px 14px", borderRadius:20, border:"1px solid",
                borderColor: histField===f?"#6EE7B7":"#2a3348",
                background: histField===f?"#6EE7B71a":"transparent",
                color: histField===f?"#6EE7B7":"#64748b",
                fontSize:12, cursor:"pointer", fontFamily:"inherit"
              }}>{LABELS[f]}</button>
            ))}
          </div>

          {/* Histogram */}
          <div style={card}>
            <div style={sectionLabel}>Distribution — {LABELS[histField]}</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={histData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                <XAxis dataKey="label" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:"#1a2030", border:"1px solid #2a3348", borderRadius:8, fontSize:12 }}/>
                <ReferenceLine
                  x={fmt(mean(data.map(r=>r[histField])),histField)}
                  stroke="#6EE7B7" strokeDasharray="4 2"
                  label={{ value:"mean", fill:"#6EE7B7", fontSize:10 }}/>
                <Bar dataKey="count" fill="#6EE7B7" fillOpacity={0.7} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Remote vs Office */}
          <div style={card}>
            <div style={sectionLabel}>Satisfaction — Remote vs On-site</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={remoteVsOffice} barSize={60} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" horizontal={false}/>
                <XAxis type="number" domain={[0,10]} tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="label" tick={{ fill:"#94a3b8", fontSize:13 }} axisLine={false} tickLine={false} width={70}/>
                <Tooltip contentStyle={{ background:"#1a2030", border:"1px solid #2a3348", borderRadius:8, fontSize:12 }}
                  formatter={v=>[v.toFixed(2),"Avg Satisfaction"]}/>
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  <Cell fill="#C4B5FD"/>
                  <Cell fill="#FCA5A5"/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>)}

        {/* ── CORRELATIONS ───────────────────────────────────────────────── */}
        {activeTab==="correlations" && (
          <div style={card}>
            <div style={sectionLabel}>Pearson Correlation Matrix</div>
            <div style={{ fontSize:12, color:"#475569", marginBottom:20 }}>
              Values range from −1 (perfect negative) to +1 (perfect positive).
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ borderCollapse:"separate", borderSpacing:4 }}>
                <thead>
                  <tr>
                    <th style={{ width:120 }}/>
                    {FIELDS.map(f=>(
                      <th key={f} style={{ fontSize:11, color:"#475569", fontWeight:500, padding:"0 4px 8px", textAlign:"center", minWidth:90 }}>
                        {LABELS[f]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map((a,i)=>(
                    <tr key={a}>
                      <td style={{ fontSize:11, color:"#475569", fontWeight:500, paddingRight:8, whiteSpace:"nowrap" }}>{LABELS[a]}</td>
                      {FIELDS.map((b,j)=>{
                        const r=corrMatrix[i][j];
                        return (
                          <td key={b} style={{
                            background:corrColor(r), color:i===j?"#6EE7B7":corrText(r),
                            borderRadius:6, padding:"10px 8px", textAlign:"center",
                            fontSize:13, fontWeight:600, minWidth:90
                          }}>
                            {i===j?"—":r.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SCATTER ────────────────────────────────────────────────────── */}
        {activeTab==="scatter" && (<>
          <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:6, letterSpacing:1 }}>X AXIS</div>
              <select value={scatterX} onChange={e=>setScatterX(e.target.value)} style={{
                background:"#151823", border:"1px solid #2a3348", color:"#e2e8f0",
                borderRadius:6, padding:"6px 12px", fontSize:13, fontFamily:"inherit"
              }}>
                {FIELDS.map(f=><option key={f} value={f}>{LABELS[f]}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:6, letterSpacing:1 }}>Y AXIS</div>
              <select value={scatterY} onChange={e=>setScatterY(e.target.value)} style={{
                background:"#151823", border:"1px solid #2a3348", color:"#e2e8f0",
                borderRadius:6, padding:"6px 12px", fontSize:13, fontFamily:"inherit"
              }}>
                {FIELDS.map(f=><option key={f} value={f}>{LABELS[f]}</option>)}
              </select>
            </div>
            <div style={{ marginLeft:"auto", fontSize:12, color:"#475569" }}>
              r = <span style={{ color:"#6EE7B7", fontWeight:700 }}>
                {pearson(data.map(r=>r[scatterX]),data.map(r=>r[scatterY])).toFixed(3)}
              </span>
            </div>
          </div>

          <div style={card}>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535"/>
                <XAxis dataKey={scatterX} name={LABELS[scatterX]}
                  tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}
                  label={{ value:LABELS[scatterX], fill:"#475569", fontSize:11, position:"insideBottom", offset:-4 }}/>
                <YAxis dataKey={scatterY} name={LABELS[scatterY]}
                  tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}
                  label={{ value:LABELS[scatterY], fill:"#475569", fontSize:11, angle:-90, position:"insideLeft" }}/>
                <Tooltip
                  cursor={{ strokeDasharray:"3 3", stroke:"#2a3348" }}
                  contentStyle={{ background:"#1a2030", border:"1px solid #2a3348", borderRadius:8, fontSize:12 }}
                  formatter={(v,n)=>[v,n]}/>
                <Scatter data={data} fillOpacity={0.85}>
                  {data.map(d=><Cell key={d.id} fill={DEPT_COLORS[d.dept]}/>)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:16 }}>
              {Object.entries(DEPT_COLORS).map(([d,c])=>(
                <div key={d} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
                  {d}
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ── INSIGHTS ───────────────────────────────────────────────────── */}
        {activeTab==="insights" && (
          <div style={{ display:"grid", gap:16 }}>

            {/* Top correlations */}
            <div style={card}>
              <div style={sectionLabel}>Top Correlations Found</div>
              {topCorr.map(({a,b,r})=>(
                <div key={a+b} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #1e2535" }}>
                  <span style={{ fontSize:13, color:"#94a3b8" }}>{LABELS[a]} ↔ {LABELS[b]}</span>
                  <span style={{ fontSize:16, fontWeight:700, color:r>0?"#6EE7B7":"#FCA5A5" }}>
                    {r>0?"+":""}{r.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>

            {/* Narrative insight cards */}
            {[
              {
                icon:"📈", title:"Tenure & Salary grow together",
                body:`A strong positive correlation (r ≈ ${pearson(RAW.map(r=>r.tenure),RAW.map(r=>r.salary)).toFixed(2)}) shows longer-tenured employees earn significantly more — typical of experience-based pay scales.`
              },
              {
                icon:"😟", title:"Longer tenure, lower satisfaction",
                body:`Satisfaction trends downward with tenure (r ≈ ${pearson(RAW.map(r=>r.tenure),RAW.map(r=>r.satisfaction)).toFixed(2)}). Employees in their first 1–4 years report the highest satisfaction scores, suggesting engagement challenges over time.`
              },
              {
                icon:"🏠", title:"Remote workers report higher satisfaction",
                body:`Remote employees average ${mean(RAW.filter(r=>r.remote).map(r=>r.satisfaction)).toFixed(2)}/10 vs ${mean(RAW.filter(r=>r.remote===0).map(r=>r.satisfaction)).toFixed(2)}/10 for on-site. Design and Engineering — highest remote adoption — also top the satisfaction rankings.`
              },
              {
                icon:"💰", title:"Engineering & Finance lead on salary",
                body:`Engineering ($${Math.round(mean(RAW.filter(r=>r.dept==="Engineering").map(r=>r.salary))).toLocaleString()}) and Finance ($${Math.round(mean(RAW.filter(r=>r.dept==="Finance").map(r=>r.salary))).toLocaleString()}) have the highest average compensation, while HR and Operations sit at the lower end.`
              },
              {
                icon:"🎯", title:"Performance is not strongly age-driven",
                body:`The age–performance correlation is weak (r ≈ ${pearson(RAW.map(r=>r.age),RAW.map(r=>r.performance)).toFixed(2)}), suggesting performance is distributed fairly uniformly across age groups.`
              },
            ].map(ins=>(
              <div key={ins.title} style={{ background:"#151823", border:"1px solid #1e2535", borderRadius:10, padding:"18px 20px", display:"flex", gap:16 }}>
                <div style={{ fontSize:24, flexShrink:0 }}>{ins.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", marginBottom:6 }}>{ins.title}</div>
                  <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>{ins.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}