import React, { useState } from 'react';

type Frame = 'opening' | 'core' | 'proof';

const rules = [
  {id:'S-01',kind:'PRINCIPLE',title:'One decision at a time',detail:'Primary and secondary actions cannot compete for equal visual weight.',status:'active'},
  {id:'S-02',kind:'CONSTRAINT',title:'No feature-shaped fixes',detail:'Solve hierarchy, copy, state, or layout before adding product surface area.',status:'active'},
  {id:'S-03',kind:'APPROVED',title:'Evidence before decoration',detail:'Use the existing results hierarchy as the reference pattern for evidence-led composition.',status:'active'},
  {id:'S-04',kind:'REJECTED',title:'Equal-weight card grids',detail:'Do not distribute attention evenly across independent dashboard tiles.',status:'active'},
  {id:'S-05',kind:'BLOCKING',title:'State completeness',detail:'Loading, empty, error and permission states must exist before release.',status:'active'},
];

function Mark(){return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7h13v5H10v8h8v5H5z"/><path d="M20 7h7v18h-7" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>}

function Shell({frame,setFrame,children}:{frame:Frame;setFrame:(f:Frame)=>void;children:React.ReactNode}){
  return <div className="pt-root">
    <header className="pt-topbar">
      <div className="pt-brand"><span className="pt-mark"><Mark/></span><span>A CHIRPYWORKS PRODUCT</span></div>
      <nav aria-label="Prototype frames">
        {(['opening','core','proof'] as Frame[]).map((item,i)=><button key={item} onClick={()=>setFrame(item)} data-active={frame===item}>{String(i+1).padStart(2,'0')} {item==='opening'?'OPENING':item==='core'?'TAKEOVER':'TRANSFER PROOF'}</button>)}
      </nav>
      <div className="pt-proto">COMMERCIAL PROOF / v0.1</div>
    </header>
    {children}
  </div>
}

function Opening({setFrame}:{setFrame:(f:Frame)=>void}){
  return <main className="pt-opening">
    <section className="pt-opening-copy">
      <p className="pt-kicker"><span/>PROJECT TAKEOVER / PUBLIC-SAFE PROOF</p>
      <h1>Delegate the work.<br/><em>Keep the standard.</em></h1>
      <p className="pt-lead">AI made production abundant. The senior person still has to remember every decision, repeat every correction, and repair the same drift. This product turns accepted project judgment into a working standard — then carries it through the work.</p>
      <button className="pt-primary-action" onClick={()=>setFrame('core')}>WATCH THE TAKEOVER <span>↗</span></button>
      <div className="pt-opening-meta">
        <span>01 / STANDARD</span><span>02 / WORKLINE</span><span>03 / RECEIPT</span>
      </div>
    </section>
    <section className="pt-opening-proof" aria-label="Takeover preview">
      <div className="pt-proof-axis"><span>STANDARD / v1.0</span><i/></div>
      <div className="pt-proof-project">
        <div className="pt-proof-head">
          <span>KPI KIT</span><span>TAKEOVER 01</span>
        </div>
        <h2>Bring the revenue overview to release quality without changing the core product direction.</h2>
        <div className="pt-proof-flow">
          <span data-done>INSPECT</span><i/>
          <span data-done>STANDARD</span><i/>
          <span data-active>EXECUTE</span><i/>
          <span>VERIFY</span><i/>
          <span>HANDOFF</span>
        </div>
        <figure className="pt-proof-image">
          <img src="./docs/assets/revenue-dark-desktop.png" alt="Existing KPI Kit revenue dashboard before takeover"/>
          <figcaption><strong>BEFORE</strong><span>Attention distributed across equal-weight surfaces.</span></figcaption>
        </figure>
      </div>
      <div className="pt-proof-receipt">
        <span>OUTCOME</span>
        <strong>One clear decision path.</strong>
        <small>Evidence attached at close.</small>
      </div>
    </section>
  </main>
}

function StandardRail(){
  return <aside className="pt-standard">
    <div className="pt-standard-head">
      <div><span>PROJECT STANDARD</span><strong>v1.0</strong></div>
      <button>5 ACTIVE</button>
    </div>
    <div className="pt-standard-line" aria-hidden="true"><i/></div>
    <ol>
      {rules.map((r,i)=><li key={r.id}>
        <div className="pt-rule-id"><span>{r.id}</span><small>{r.kind}</small></div>
        <div><strong>{r.title}</strong><p>{r.detail}</p></div>
        <span className="pt-rule-source">{i===3?'REJECTED EXAMPLE':'EXPLICIT'}</span>
      </li>)}
    </ol>
    <footer><span>STANDARD OWNER</span><strong>RUDA / PROJECT</strong></footer>
  </aside>
}

function Core({setFrame}:{setFrame:(f:Frame)=>void}){
  return <main className="pt-core">
    <section className="pt-job">
      <div className="pt-job-head">
        <div>
          <p className="pt-kicker"><span/>ACTIVE TAKEOVER / KPI KIT</p>
          <h1>Revenue overview<br/>reconstruction</h1>
        </div>
        <div className="pt-job-state"><span>03 / 05</span><strong>EXECUTE</strong><small>1 escalation resolved</small></div>
      </div>

      <div className="pt-workline" aria-label="Workline">
        {['INSPECT','STANDARD','EXECUTE','VERIFY','HANDOFF'].map((step,i)=><React.Fragment key={step}>
          <div data-state={i<2?'done':i===2?'active':'upcoming'}><span>{String(i+1).padStart(2,'0')}</span><strong>{step}</strong>{i===2&&<small>Hierarchy rebuild</small>}</div>
          {i<4&&<i data-state={i<2?'done':i===2?'active':'upcoming'}/>}
        </React.Fragment>)}
      </div>

      <div className="pt-decision">
        <div className="pt-decision-index">CURRENT<br/>DECISION</div>
        <div className="pt-decision-copy">
          <span>WHAT REQUIRES ATTENTION</span>
          <h2>The dashboard says “everything matters” before it answers what changed.</h2>
          <p>Four KPI tiles, chart controls, channel breakdown and target monitor enter at near-equal contrast. Keep the data contract; reconstruct the attention order.</p>
        </div>
        <div className="pt-decision-next">
          <span>NEXT</span>
          <strong>Make the primary comparison dominant.</strong>
          <button onClick={()=>setFrame('proof')}>VIEW TRANSFER PROOF ↗</button>
        </div>
      </div>

      <section className="pt-artifact">
        <header>
          <div><span>ARTIFACT / BEFORE</span><strong>Revenue dashboard</strong></div>
          <div className="pt-applies"><span>APPLIES</span><b>S-01</b><b>S-03</b><b>S-04</b></div>
        </header>
        <div className="pt-artifact-stage">
          <img src="./docs/assets/revenue-dark-desktop.png" alt="Existing KPI Kit revenue dashboard"/>
          <div className="pt-annotation a1"><span>01</span><p>Primary KPI competes with three peers.</p></div>
          <div className="pt-annotation a2"><span>02</span><p>Controls sit inside the strongest analytical surface.</p></div>
          <div className="pt-annotation a3"><span>03</span><p>Supporting evidence reads as another dashboard column.</p></div>
        </div>
      </section>

      <footer className="pt-job-footer">
        <span>DESTINATION / <strong>branch: commercialization/project-takeover-demo</strong></span>
        <span>AUTHORITY / <strong>REVERSIBLE WRITE</strong></span>
        <span>COST / <strong>$0 incremental</strong></span>
      </footer>
    </section>
    <StandardRail/>
  </main>
}

function Proof(){
  return <main className="pt-transfer">
    <header className="pt-transfer-head">
      <p className="pt-kicker"><span/>TRANSFER PROOF / STANDARD DELTA</p>
      <div><h1>One correction.<br/><em>Not two explanations.</em></h1><p>The proof is not that Job 1 can be fixed. The proof is that a project-wide correction survives into Job 2 without being pasted back into the prompt.</p></div>
    </header>

    <section className="pt-transfer-sequence">
      <article className="pt-transfer-step">
        <span className="pt-step-no">01</span>
        <p className="pt-step-label">JOB 1 / CORRECTION</p>
        <blockquote>“Don’t use equal emphasis for primary and secondary choices. This is a project-wide rule, not just this screen.”</blockquote>
        <div className="pt-human">HUMAN CORRECTION <strong>1</strong></div>
      </article>

      <div className="pt-transfer-link"><i/><span>CLASSIFIED AS<br/><strong>PROJECT RULE</strong></span><i/></div>

      <article className="pt-transfer-step pt-delta">
        <span className="pt-step-no">02</span>
        <p className="pt-step-label">STANDARD / v1.0 → v1.1</p>
        <div className="pt-delta-row"><del>S-01 One decision at a time</del></div>
        <div className="pt-delta-row added"><ins>S-01 One decision at a time</ins><p>Primary and secondary actions cannot compete for equal visual weight.</p></div>
        <div className="pt-delta-meta"><span>OWNER / RUDA</span><span>SCOPE / PROJECT</span><span>SOURCE / EXPLICIT CORRECTION</span></div>
      </article>

      <div className="pt-transfer-link"><i/><span>APPLIED WITHOUT<br/><strong>REPEATED INSTRUCTION</strong></span><i/></div>

      <article className="pt-transfer-step pt-job2">
        <span className="pt-step-no">03</span>
        <p className="pt-step-label">JOB 2 / SETTINGS PERMISSION FLOW</p>
        <h2>Fix the permission flow.</h2>
        <div className="pt-job2-check">
          <span>STANDARD USED</span><strong>S-01 / S-02 / S-05</strong>
        </div>
        <div className="pt-job2-result"><span>REPEATED HIERARCHY INSTRUCTION</span><strong>NONE</strong></div>
      </article>
    </section>

    <section className="pt-receipt">
      <div className="pt-receipt-title"><span>COMPLETION RECEIPT / JOB 2</span><strong>ACCEPTED</strong></div>
      <div className="pt-receipt-grid">
        <div><span>OUTCOME</span><strong>Permission flow hierarchy rebuilt</strong></div>
        <div><span>STANDARD</span><strong>v1.1 / 3 items applied</strong></div>
        <div><span>EVIDENCE</span><strong>Responsive states + code diff + browser check</strong></div>
        <div><span>HUMAN INTERVENTIONS</span><strong>0 repeated corrections</strong></div>
        <div><span>UNRESOLVED</span><strong>None material</strong></div>
        <div><span>NEXT</span><strong>Release candidate review</strong></div>
      </div>
      <p>Prototype receipt. The final product may only claim checks that were actually executed.</p>
    </section>
  </main>
}

export function TakeoverDemo({initialFrame='opening'}:{initialFrame?:Frame}){
  const [frame,setFrame]=useState<Frame>(initialFrame);
  return <Shell frame={frame} setFrame={setFrame}>
    {frame==='opening'?<Opening setFrame={setFrame}/>:frame==='core'?<Core setFrame={setFrame}/>:<Proof/>}
  </Shell>
}
