import { useState, useEffect, useCallback } from "react";
import * as api from "./api";

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  ink: "#0C0C10", fog: "#F5F5F7", card: "#FFFFFF", line: "#E8E8ED",
  slate: "#8E8E9A", indigo: "#5151FF", indigoD: "#3A3ACC", indigoGh: "#5151FF13",
  green: "#00C48C", greenGh: "#00C48C13", red: "#FF4757", redGh: "#FF475713",
  amber: "#FFB020", amberGh: "#FFB02013", purple: "#9B59B6", purpleGh: "#9B59B613",
  cyan: "#00B8D9", cyanGh: "#00B8D913", gold: "#D4A017", goldGh: "#D4A01713",
};

const LIVELLI_META = {
  1: { label:"Gold",          icon:"🥇", color: C.gold   },
  2: { label:"Silver",        icon:"🥈", color: C.slate  },
  3: { label:"VIP",           icon:"💎", color: C.purple },
  4: { label:"Early Adopter", icon:"🚀", color: C.cyan   },
  5: { label:"Top Cliente",   icon:"⭐", color: C.amber  },
};

const fullName    = u => `${u.nome} ${u.cognome}`;
const fmtD        = ts => new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
const fmtDT       = ts => new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const avBg        = n => { const p=["#5151FF","#00C48C","#FF4757","#FFB020","#9B59B6","#00B8D9"]; let h=0; for(let c of(n||"?"))h=c.charCodeAt(0)+((h<<5)-h); return p[Math.abs(h)%p.length]; };
const walletLabel = wt => ({EOA:"Standard",EOA_ESTERNO:"Esterno",UP:"Avanzato"}[wt]||wt);
const blockscoutTx = hash => `https://explorer.execution.testnet.lukso.network/tx/${hash}`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#F5F5F7;color:#0C0C10;min-height:100vh}
.mono{font-family:'JetBrains Mono',monospace}
.shell{display:flex;min-height:100vh}
.sidebar{width:248px;background:#0C0C10;flex-shrink:0;position:fixed;top:0;left:0;height:100vh;display:flex;flex-direction:column}
.main{margin-left:248px;flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:#fff;border-bottom:1px solid #E8E8ED;height:60px;padding:0 30px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.page{padding:30px;flex:1}
.sb-logo{padding:24px 20px 16px;border-bottom:1px solid #fff1}
.sb-hex{width:34px;height:34px;background:#5151FF;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-name{font-size:15px;font-weight:800;color:#fff;letter-spacing:-.4px}
.sb-sub{font-size:10px;color:#ffffff40;letter-spacing:.6px;text-transform:uppercase;margin-top:1px}
.sb-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:1px}
.sb-sect{font-size:9.5px;color:#ffffff28;letter-spacing:1.1px;text-transform:uppercase;padding:14px 12px 5px;font-weight:600}
.sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;cursor:pointer;color:#ffffff60;font-size:13px;font-weight:500;border:none;background:none;width:100%;text-align:left;transition:all .15s;font-family:inherit}
.sb-item:hover{background:#ffffff0d;color:#fff}
.sb-item.on{background:#5151FF22;color:#5151FF}
.sb-foot{padding:12px 8px;border-top:1px solid #fff1}
.net-pill{background:#ffffff07;border:1px solid #ffffff10;border-radius:8px;padding:10px 12px}
.net-label{font-size:9px;color:#ffffff28;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;display:flex;align-items:center;gap:4px}
.dot-live{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00C48C;box-shadow:0 0 6px #00C48C}
.net-id{font-size:10px;color:#ffffff35;margin-top:2px}
.tb-title{font-size:15px;font-weight:700}
.tb-right{display:flex;align-items:center;gap:10px}
.status-pill{background:#00C48C13;color:#00C48C;font-size:11px;font-weight:600;padding:4px 11px;border-radius:20px;display:flex;align-items:center;gap:5px}
.card{background:#fff;border:1px solid #E8E8ED;border-radius:13px}
.cp{padding:22px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}
.stat{background:#fff;border:1px solid #E8E8ED;border-radius:12px;padding:18px 20px}
.stat-lbl{font-size:11px;color:#8E8E9A;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}
.stat-val{font-size:26px;font-weight:800;letter-spacing:-1px}
.stat-sub{font-size:11px;color:#8E8E9A;margin-top:3px}
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{font-size:10.5px;color:#8E8E9A;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:11px 16px;text-align:left;border-bottom:1px solid #E8E8ED;background:#F5F5F7;white-space:nowrap}
td{padding:12px 16px;font-size:13px;border-bottom:1px solid #E8E8ED;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.bx{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap}
.bx-green{background:#00C48C13;color:#00C48C}
.bx-red{background:#FF475713;color:#FF4757}
.bx-indigo{background:#5151FF13;color:#5151FF}
.bx-amber{background:#FFB02013;color:#FFB020}
.bx-purple{background:#9B59B613;color:#9B59B6}
.bx-cyan{background:#00B8D913;color:#00B8D9}
.bx-gray{background:#F5F5F7;color:#8E8E9A;border:1px solid #E8E8ED}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;font-family:inherit}
.btn-p{background:#5151FF;color:#fff}
.btn-p:hover{background:#3A3ACC}
.btn-g{background:transparent;color:#0C0C10;border:1px solid #E8E8ED}
.btn-g:hover{background:#F5F5F7}
.btn-danger{background:#FF475713;color:#FF4757;border:1px solid #FF475725}
.btn-sm{padding:5px 11px;font-size:11.5px}
.btn-xs{padding:3px 8px;font-size:11px}
.btn:disabled{opacity:.4;cursor:not-allowed}
.ov{position:fixed;inset:0;background:#00000082;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}
.modal{background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 70px #00000028}
.modal-lg{max-width:660px}
.mh{padding:22px 26px 0;display:flex;align-items:center;justify-content:space-between}
.mt{font-size:17px;font-weight:800;letter-spacing:-.4px}
.mb{padding:18px 26px 26px}
.mx{background:#F5F5F7;border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8E8E9A;font-size:17px;font-family:inherit}
.mx:hover{background:#E8E8ED}
.fg{margin-bottom:14px}
.fl{font-size:11px;font-weight:700;color:#8E8E9A;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px}
.fi{width:100%;padding:9px 12px;border:1.5px solid #E8E8ED;border-radius:8px;font-size:13px;font-family:inherit;color:#0C0C10;background:#fff;outline:none;transition:border-color .15s}
.fi:focus{border-color:#5151FF}
.fi.mono{font-family:'JetBrains Mono',monospace;font-size:11px}
.fi-2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.fhint{font-size:11px;color:#8E8E9A;margin-top:4px}
.factions{display:flex;gap:9px;justify-content:flex-end;margin-top:22px;padding-top:18px;border-top:1px solid #E8E8ED}
select.fi{cursor:pointer}
.rg{display:flex;gap:10px}
.rc{flex:1;border:1.5px solid #E8E8ED;border-radius:10px;padding:13px;cursor:pointer;transition:all .15s}
.rc.sel{border-color:#5151FF;background:#5151FF13}
.rc-t{font-size:13px;font-weight:700;margin-bottom:2px}
.rc-s{font-size:11.5px;color:#8E8E9A}
.kbox{background:#0C0C10;border-radius:10px;padding:14px;margin:10px 0}
.kl{font-size:9.5px;color:#ffffff38;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}
.kv{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#00C48C;word-break:break-all;line-height:1.6}
.kwarn{background:#FFB02013;border:1px solid #FFB02028;border-radius:8px;padding:10px 13px;font-size:12px;color:#FFB020;margin:10px 0}
.hero{background:#0C0C10;border-radius:18px;padding:36px;text-align:center;position:relative;overflow:hidden;margin-bottom:22px}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#5151FF38 0%,transparent 65%)}
.hero-lbl{font-size:12px;color:#ffffff45;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;position:relative}
.hero-val{font-size:72px;font-weight:800;color:#fff;letter-spacing:-3px;line-height:1;position:relative}
.hero-unit{font-size:18px;color:#5151FF;font-weight:600;margin-top:8px;position:relative;letter-spacing:-.3px}
.hero-id{background:#ffffff0d;border:1px solid #ffffff12;border-radius:20px;padding:5px 14px;font-size:11px;color:#ffffff40;display:inline-block;margin-top:14px;position:relative}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.st{font-size:16px;font-weight:800;letter-spacing:-.4px}
.ss{font-size:12.5px;color:#8E8E9A;margin-top:2px}
.sep{height:1px;background:#E8E8ED;margin:16px 0}
.div{height:1px;background:#E8E8ED;margin:16px 0}
.empty{text-align:center;padding:50px 20px;color:#8E8E9A}
.empty-ico{font-size:36px;margin-bottom:10px;opacity:.35}
.fade{animation:fade .15s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:middle;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;align-items:center;justify-content:center}
.tag-row{display:flex;flex-wrap:wrap;gap:5px}
.info-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #E8E8ED;font-size:13px}
.info-row:last-child{border-bottom:none}
.ik{color:#8E8E9A}
.iv{font-weight:600}
.alert-s{background:#00C48C13;border:1px solid #00C48C28;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#00C48C;margin-bottom:14px}
.alert-e{background:#FF475713;border:1px solid #FF475728;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#FF4757;margin-bottom:14px}
.alert-w{background:#FFB02013;border:1px solid #FFB02028;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#FFB020;margin-bottom:14px}
.mig-banner{background:linear-gradient(135deg,#9B59B613,#5151FF13);border:1px solid #9B59B628;border-radius:10px;padding:12px 14px;font-size:12px;color:#9B59B6;display:flex;align-items:center;gap:8px;margin-bottom:14px}
.loading{display:flex;align-items:center;justify-content:center;padding:40px;color:#8E8E9A;gap:10px;font-size:13px}
.spinner{width:18px;height:18px;border:2px solid #E8E8ED;border-top-color:#5151FF;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.tx-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #E8E8ED}
.tx-row:last-child{border-bottom:none}
.tx-ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.tx-info{flex:1;min-width:0}
.tx-desc{font-size:13px;font-weight:500}
.tx-hash{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:#8E8E9A;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-decoration:underline}
.tx-right{text-align:right;flex-shrink:0}
.tx-amt{font-size:13.5px;font-weight:700}
.tx-date{font-size:10.5px;color:#8E8E9A;margin-top:1px}
.confirm-box{background:#F5F5F7;border:1px solid #E8E8ED;border-radius:10px;padding:16px;margin:14px 0}
.confirm-row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0}
.confirm-key{color:#8E8E9A}
.confirm-val{font-weight:600}
.pin-box{display:flex;gap:8px;justify-content:center;margin:8px 0}
.pin-digit{width:48px;height:56px;background:#0C0C10;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#00C48C}
input[type=number]{-moz-appearance:textfield}
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
`;

const Ic = {
  dash:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  clienti: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ops:     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  livelli: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  storico: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  chiave:  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  esci:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  dl:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  migr:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  arch:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  profilo: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  refresh: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  link:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

const Spinner = () => <div className="loading"><div className="spinner"/><span>Caricamento...</span></div>;

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [sess, setSess] = useState(null);
  if (!sess) return <Login onLogin={setSess} />;
  if (sess.role === "admin") return <AdminApp onLogout={() => setSess(null)} />;
  return <ClientApp userId={sess.uid} onLogout={() => setSess(null)} />;
}

// ── Login ──────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [tab, setTab] = useState("admin");
  const [f, setF] = useState({ email:"", pass:"", codice:"" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const doAdmin = () => {
    if (f.email === "admin@fidelityhub.io" && f.pass === "admin123") onLogin({ role:"admin" });
    else setErr("Credenziali non valide");
  };

  const doClient = async () => {
    if (f.codice.length < 6) { setErr("Inserisci il PIN completo a 6 cifre"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.loginCliente(f.codice.trim());
      onLogin({ role:"client", uid: res.data.data.id });
    } catch(e) {
      setErr(e.response?.data?.error || "PIN non valido");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F7",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div className="sb-hex"><svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg></div>
            <span style={{fontSize:22,fontWeight:800,letterSpacing:-.6}}>FidelityHub</span>
          </div>
          <p style={{fontSize:12.5,color:"#8E8E9A"}}>Piattaforma fedeltà professionale</p>
        </div>
        <div className="card cp">
          <div style={{display:"flex",background:"#F5F5F7",borderRadius:9,padding:4,gap:3,marginBottom:20}}>
            {[["admin","Gestionale"],["client","Area Cliente"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");setF({email:"",pass:"",codice:""});}} style={{flex:1,padding:"7px 0",border:"none",borderRadius:7,fontFamily:"inherit",fontSize:13,fontWeight:tab===t?700:500,cursor:"pointer",background:tab===t?"#fff":"transparent",color:tab===t?"#0C0C10":"#8E8E9A",transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>
          {err && <div className="alert-e">{err}</div>}
          {tab==="admin" ? (
            <>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="admin@fidelityhub.io" value={f.email} onChange={e=>setF({...f,email:e.target.value})} /></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" type="password" placeholder="••••••••" value={f.pass} onChange={e=>setF({...f,pass:e.target.value})} onKeyDown={e=>e.key==="Enter"&&doAdmin()} /></div>
              <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} onClick={doAdmin}>Accedi al Gestionale</button>
              <p style={{fontSize:11,color:"#8E8E9A",textAlign:"center",marginTop:10}}>admin@fidelityhub.io / admin123</p>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="fl" style={{textAlign:"center",display:"block"}}>PIN di Accesso</label>
                <div style={{display:"flex",gap:8,justifyContent:"center",margin:"8px 0"}}>
                  {[0,1,2,3,4,5].map(i=>(
                    <input
                      key={i}
                      id={`pin-${i}`}
                      className="fi"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={f.codice[i]||""}
                      style={{width:48,height:56,textAlign:"center",fontSize:22,fontWeight:700,padding:0}}
                      onChange={e=>{
                        const val = e.target.value.replace(/\D/,"");
                        const arr = (f.codice+"      ").split("").slice(0,6);
                        arr[i] = val;
                        setF({...f, codice: arr.join("").trimEnd()});
                        if (val && i<5) document.getElementById(`pin-${i+1}`)?.focus();
                      }}
                      onKeyDown={e=>{
                        if (e.key==="Backspace" && !f.codice[i] && i>0) document.getElementById(`pin-${i-1}`)?.focus();
                        if (e.key==="Enter" && f.codice.length===6) doClient();
                      }}
                    />
                  ))}
                </div>
                <p className="fhint" style={{textAlign:"center"}}>Inserisci il PIN a 6 cifre ricevuto alla registrazione</p>
              </div>
              <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} disabled={loading} onClick={doClient}>
                {loading ? "Verifica in corso…" : "Accedi alla mia Area"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conferma Modal ─────────────────────────────────────────────────────────────
function ModalConferma({ titolo, righe, onConferma, onAnnulla, loading }) {
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onAnnulla()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="mh"><div className="mt">⚠️ Conferma operazione</div><button className="mx" onClick={onAnnulla}>×</button></div>
        <div className="mb">
          <div style={{fontSize:13,color:"#8E8E9A",marginBottom:14}}>{titolo}</div>
          <div className="confirm-box">
            {righe.map(([k,v])=>(
              <div key={k} className="confirm-row"><span className="confirm-key">{k}</span><span className="confirm-val">{v}</span></div>
            ))}
          </div>
          <div className="factions">
            <button className="btn btn-g" onClick={onAnnulla} disabled={loading}>Annulla</button>
            <button className="btn btn-p" onClick={onConferma} disabled={loading}>
              {loading ? "Transazione in corso…" : "Conferma e Invia"}
            </button>
          </div>
          {loading && <p style={{fontSize:11,color:"#8E8E9A",textAlign:"center",marginTop:8}}>Attendere, la transazione viene registrata su LUKSO…</p>}
        </div>
      </div>
    </div>
  );
}

// ── Risultato Transazione ──────────────────────────────────────────────────────
function RisultatoTx({ titolo, txHash, dettagli, onChiudi }) {
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onChiudi()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="mh"><div className="mt">✅ {titolo}</div><button className="mx" onClick={onChiudi}>×</button></div>
        <div className="mb">
          <div className="alert-s">Operazione completata e registrata su LUKSO</div>
          {dettagli && dettagli.map(([k,v])=>(
            <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
          ))}
          <div style={{marginTop:14}}>
            <div style={{fontSize:11,color:"#8E8E9A",marginBottom:6}}>Hash Transazione</div>
            <div style={{background:"#0C0C10",borderRadius:8,padding:10,fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"#00C48C",wordBreak:"break-all",lineHeight:1.6}}>
              {txHash}
            </div>
            <a href={blockscoutTx(txHash)} target="_blank" rel="noopener noreferrer" className="btn btn-g btn-sm" style={{marginTop:8,textDecoration:"none"}}>
              {Ic.link} Verifica su Blockscout
            </a>
          </div>
          <div className="factions"><button className="btn btn-p" onClick={onChiudi}>Chiudi</button></div>
        </div>
      </div>
    </div>
  );
}

// ── Admin App ──────────────────────────────────────────────────────────────────
function AdminApp({ onLogout }) {
  const [page, setPage] = useState("dash");
  const [clienti, setClienti] = useState([]);
  const [supply, setSupply] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([api.getClienti(), api.getSupply()]);
      setClienti(cRes.data.data);
      setSupply(sRes.data.data.supply);
    } catch(e) { console.error("Errore:", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

 const nav = [
    {id:"dash",    l:"Dashboard",         ic:Ic.dash},
    {id:"clienti", l:"Clienti",           ic:Ic.clienti},
    {id:"ops",     l:"Gestione Stelle",   ic:Ic.ops},
    {id:"livelli", l:"Riconoscimenti",    ic:Ic.livelli},
    {id:"storico", l:"Storico",           ic:Ic.storico},
  ];
  const titles = {dash:"Dashboard",clienti:"Clienti",ops:"Gestione Stelle",livelli:"Riconoscimenti",storico:"Storico Movimenti"};

  return (
    <div className="shell">
      <style>{CSS}</style>
      <aside className="sidebar">
        <div className="sb-logo">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="sb-hex"><svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg></div>
            <div><div className="sb-name">FidelityHub</div><div className="sb-sub">Gestionale</div></div>
          </div>
        </div>
        <nav className="sb-nav">
          <div className="sb-sect">Pannello</div>
          {nav.map(n=>(
            <button key={n.id} className={`sb-item ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
              {n.ic} {n.l}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button className="sb-item" onClick={loadData}>{Ic.refresh} Aggiorna</button>
          <button className="sb-item" onClick={onLogout}>{Ic.esci} Esci</button>
        </nav>
        <div className="sb-foot">
          <div className="net-pill">
            <div className="net-label"><span className="dot-live"/>Sistema Attivo</div>
            <div className="net-id">LUKSO Testnet</div>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="tb-title">{titles[page]}</span>
          <div className="tb-right">
            <span style={{fontSize:12,color:"#8E8E9A"}}>⭐ {supply.toLocaleString("it-IT")} stelle in circolazione</span>
            <span className="status-pill"><span className="dot-live"/>Online</span>
          </div>
        </header>
        <div className="page fade">
          {loading ? <Spinner /> : (
            <>
              {page==="dash"    && <PageDash clienti={clienti} supply={supply} />}
              {page==="clienti" && <PageClienti clienti={clienti} onRefresh={loadData} />}
              {page==="ops"     && <PageOps clienti={clienti} onRefresh={loadData} />}
              {page==="livelli" && <PageLivelli clienti={clienti} onRefresh={loadData} />}
              {page==="storico" && <PageStorico clienti={clienti} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function PageDash({ clienti, supply }) {
  const attivi = clienti.filter(u=>u.status==="active");
  const upCount = clienti.filter(u=>u.walletType==="UP").length;

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-lbl">Clienti Attivi</div><div className="stat-val">{attivi.length}</div><div className="stat-sub">{clienti.filter(u=>u.status!=="active").length} archiviati</div></div>
        <div className="stat"><div className="stat-lbl">Stelle in Circolazione</div><div className="stat-val">{supply.toLocaleString("it-IT")}</div><div className="stat-sub">on-chain LUKSO</div></div>
        <div className="stat"><div className="stat-lbl">Profili Avanzati</div><div className="stat-val">{upCount}</div><div className="stat-sub">Universal Profile</div></div>
        <div className="stat"><div className="stat-lbl">Totale Clienti</div><div className="stat-val">{clienti.length}</div><div className="stat-sub">tutti i profili</div></div>
      </div>
      <div className="card cp">
        <div className="sh"><div className="st">Clienti Recenti</div></div>
        {attivi.length===0 ? <div className="empty"><div className="empty-ico">👥</div>Nessun cliente ancora</div> :
          [...attivi].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5).map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #E8E8ED"}}>
              <div className="av" style={{background:avBg(fullName(u))}}>{u.nome[0]}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{fullName(u)}</div><div style={{fontSize:11,color:"#8E8E9A"}}>{u.luogo} · {fmtD(u.createdAt)}</div></div>
              <span className={`bx ${u.walletType==="UP"?"bx-purple":u.walletType==="EOA_ESTERNO"?"bx-cyan":"bx-indigo"}`}>{walletLabel(u.walletType)}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Clienti ────────────────────────────────────────────────────────────────────
function PageClienti({ clienti, onRefresh }) {
  const [showCrea, setShowCrea] = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  const filtered = clienti.filter(u => {
    const q = search.toLowerCase();
    const ok = fullName(u).toLowerCase().includes(q) || u.luogo?.toLowerCase().includes(q);
    if (filter==="all")  return ok && u.status==="active";
    if (filter==="arch") return ok && u.status!=="active";
    if (filter==="up")   return ok && u.walletType==="UP" && u.status==="active";
    return ok;
  });

  return (
    <div>
      <div className="sh">
        <div><div className="st">Clienti</div><div className="ss">{clienti.filter(u=>u.status==="active").length} clienti attivi</div></div>
        <button className="btn btn-p" onClick={()=>setShowCrea(true)}>{Ic.plus} Nuovo Cliente</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input className="fi" placeholder="Cerca per nome o città…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}}/>
        {[["all","Attivi"],["up","Profilo Avanzato"],["arch","Archiviati"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className="btn btn-sm" style={{background:filter===v?"#5151FF":"#F5F5F7",color:filter===v?"#fff":"#8E8E9A",border:`1px solid ${filter===v?"#5151FF":"#E8E8ED"}`}}>{l}</button>
        ))}
      </div>
      <div className="card">
        <div className="tbl-wrap">
          {filtered.length===0
            ? <div className="empty"><div className="empty-ico">👤</div>Nessun cliente trovato</div>
            : (
              <table>
                <thead><tr>
                  <th>Cliente</th><th>Luogo / Nascita</th><th>Profilo</th><th>Stato</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          <div className="av" style={{background:u.status!=="active"?"#bbb":avBg(fullName(u))}}>{u.nome[0]}</div>
                          <div>
                            <div style={{fontWeight:600}}>{fullName(u)}</div>
                            {u.migrazioneId && <div style={{fontSize:10,color:"#9B59B6"}}>↑ profilo aggiornato</div>}
                          </div>
                        </div>
                      </td>
                      <td><div style={{fontSize:12}}>{u.luogo}</div><div style={{fontSize:11,color:"#8E8E9A"}}>{u.dataNascita}</div></td>
                      <td><span className={`bx ${u.walletType==="UP"?"bx-purple":u.walletType==="EOA_ESTERNO"?"bx-cyan":"bx-indigo"}`}>{walletLabel(u.walletType)}</span></td>
                      <td><span className={`bx ${u.status==="active"?"bx-green":"bx-gray"}`}>{u.status==="active"?"Attivo":"Archiviato"}</span></td>
                      <td><button className="btn btn-xs btn-g" onClick={()=>setDetail(u)}>Dettaglio</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showCrea && <ModalCreaCliente onClose={()=>setShowCrea(false)} onDone={()=>{setShowCrea(false);onRefresh();}} clienti={clienti}/>}
      {detail   && <ModalDettaglio user={detail} clienti={clienti} onClose={()=>setDetail(null)} onRefresh={()=>{onRefresh();setDetail(null);}}/>}
    </div>
  );
}

// ── Gestione Stelle ────────────────────────────────────────────────────────────
function PageOps({ clienti, onRefresh }) {
  const [tipo, setTipo] = useState("carica");
  const [f, setF] = useState({da:"",a:"",qty:"",note:""});
  const [conferma, setConferma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [err, setErr] = useState("");
  const attivi = clienti.filter(u=>u.status==="active");

  const findNome = id => { const u = attivi.find(x=>x.id===id); return u ? fullName(u) : "—"; };

  const handleConferma = () => {
    setErr("");
    const qty = parseInt(f.qty, 10);
    if (!qty||qty<=0) { setErr("Inserisci un numero di stelle valido"); return; }
    if (tipo==="carica" && !f.a)  { setErr("Seleziona il cliente"); return; }
    if (tipo==="scala"  && !f.da) { setErr("Seleziona il cliente"); return; }
    if (tipo==="trasferisci" && (!f.da||!f.a)) { setErr("Seleziona mittente e destinatario"); return; }
    if (tipo==="trasferisci" && f.da===f.a)    { setErr("Mittente e destinatario coincidono"); return; }
    setConferma(true);
  };

  const handleOp = async () => {
    setLoading(true);
    try {
      const qty = parseInt(f.qty, 10);
      let res;
      if (tipo==="carica")      res = await api.caricaPunti({ clienteId: f.a, quantita: qty, nota: f.note||"Carico stelle" });
      else if (tipo==="scala")  res = await api.scalaPunti({ clienteId: f.da, quantita: qty, nota: f.note||"Scala stelle" });
      else                      res = await api.trasferisciPunti({ daId: f.da, aId: f.a, quantita: qty, nota: f.note||"Trasferimento stelle" });
      setConferma(false);
      setRisultato(res.data.data);
      onRefresh();
    } catch(e) {
      setConferma(false);
      setErr(e.response?.data?.error || "Errore operazione");
    }
    setLoading(false);
  };

  const righeConferma = () => {
    const qty = f.qty;
    if (tipo==="carica")      return [["Operazione","Carica Stelle"],["Cliente",findNome(f.a)],["Stelle",`⭐ ${qty}`],["Causale",f.note||"Carico stelle"]];
    if (tipo==="scala")       return [["Operazione","Scala Stelle"],["Cliente",findNome(f.da)],["Stelle",`⭐ ${qty}`],["Causale",f.note||"Scala stelle"]];
    return [["Operazione","Trasferisci Stelle"],["Da",findNome(f.da)],["A",findNome(f.a)],["Stelle",`⭐ ${qty}`],["Causale",f.note||"Trasferimento"]];
  };

  if (risultato) return (
    <RisultatoTx
      titolo="Stelle aggiornate"
      txHash={risultato.txHash}
      dettagli={[
        ["Cliente", risultato.cliente || `${risultato.da} → ${risultato.a}`],
        risultato.nuovoSaldo !== undefined ? ["Nuovo saldo", `⭐ ${risultato.nuovoSaldo}`] : null,
        risultato.nuovoSaldoDa !== undefined ? ["Saldo mittente", `⭐ ${risultato.nuovoSaldoDa}`] : null,
        risultato.nuovoSaldoA  !== undefined ? ["Saldo destinatario", `⭐ ${risultato.nuovoSaldoA}`] : null,
      ].filter(Boolean)}
      onChiudi={()=>{ setRisultato(null); setF({da:"",a:"",qty:"",note:""}); }}
    />
  );

  return (
    <>
      {conferma && (
        <ModalConferma
          titolo="Stai per eseguire una transazione su LUKSO blockchain. Verifica i dettagli prima di procedere."
          righe={righeConferma()}
          onConferma={handleOp}
          onAnnulla={()=>setConferma(false)}
          loading={loading}
        />
      )}
      <div className="g2">
        <div className="card cp">
          <div className="sh"><div className="st">Operazione</div></div>
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:22}}>
            {[
              {id:"carica",      ico:"⭐", t:"Carica Stelle",     s:"Aggiungi stelle al conto del cliente"},
              {id:"scala",       ico:"🎁", t:"Scala Stelle",       s:"Il cliente utilizza le stelle per un premio"},
              {id:"trasferisci", ico:"↔️", t:"Trasferisci Stelle", s:"Sposta stelle da un cliente a un altro"},
            ].map(op=>(
              <div key={op.id} className={`rc ${tipo===op.id?"sel":""}`} onClick={()=>setTipo(op.id)}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{op.ico}</span>
                  <div><div className="rc-t">{op.t}</div><div className="rc-s">{op.s}</div></div>
                </div>
              </div>
            ))}
          </div>
          {err && <div className="alert-e">{err}</div>}
          {(tipo==="scala"||tipo==="trasferisci") && (
            <div className="fg"><label className="fl">{tipo==="scala"?"Cliente":"Da"}</label>
              <select className="fi" value={f.da} onChange={e=>setF({...f,da:e.target.value})}>
                <option value="">Seleziona cliente…</option>
                {attivi.map(u=><option key={u.id} value={u.id}>{fullName(u)}</option>)}
              </select>
            </div>
          )}
          {(tipo==="carica"||tipo==="trasferisci") && (
            <div className="fg"><label className="fl">{tipo==="trasferisci"?"A":"Cliente"}</label>
              <select className="fi" value={f.a} onChange={e=>setF({...f,a:e.target.value})}>
                <option value="">Seleziona cliente…</option>
                {attivi.filter(u=>u.id!==f.da).map(u=><option key={u.id} value={u.id}>{fullName(u)}</option>)}
              </select>
            </div>
          )}
          <div className="fg"><label className="fl">Numero di Stelle</label>
            <input className="fi" type="number" min="1" placeholder="es. 100" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/>
          </div>
          <div className="fg"><label className="fl">Causale (opzionale)</label>
            <input className="fi" placeholder="es. Acquisto del 14/06/2026" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/>
          </div>
          <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} onClick={handleConferma}>
            Procedi →
          </button>
        </div>
        <div className="card cp">
          <div className="sh"><div className="st">Guida rapida</div></div>
          {[
            {ico:"⭐",t:"Carica Stelle",d:"Accredita stelle sul conto fedeltà del cliente dopo un acquisto."},
            {ico:"🎁",t:"Scala Stelle",  d:"Il cliente sceglie un premio: le stelle vengono scalate dal suo conto."},
            {ico:"↔️",t:"Trasferisci",   d:"Sposta stelle tra due clienti o per migrazione profilo."},
          ].map(op=>(
            <div key={op.t} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:"1px solid #E8E8ED"}}>
              <span style={{fontSize:22,flexShrink:0}}>{op.ico}</span>
              <div><div style={{fontWeight:700,fontSize:13}}>{op.t}</div><div style={{fontSize:12,color:"#8E8E9A",marginTop:2}}>{op.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Riconoscimenti ─────────────────────────────────────────────────────────────
function PageLivelli({ clienti, onRefresh }) {
  const [f, setF] = useState({op:"assegna",uid:"",tipoId:"1",targetUid:""});
  const [conferma, setConferma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [err, setErr] = useState("");
  const attivi = clienti.filter(u=>u.status==="active");

  const findNome = id => { const u = attivi.find(x=>x.id===id); return u ? fullName(u) : "—"; };
  const nomeBadge = id => LIVELLI_META[id]?.label || id;

  const handleConferma = () => {
    setErr("");
    if (!f.uid) { setErr("Seleziona un cliente"); return; }
    if (f.op==="trasferisci" && !f.targetUid) { setErr("Seleziona il destinatario"); return; }
    setConferma(true);
  };

  const handle = async () => {
    setLoading(true);
    try {
      let res;
      if (f.op==="assegna")       res = await api.assegnaBadge({ clienteId: f.uid, tipoId: parseInt(f.tipoId) });
      else if (f.op==="revoca")   res = await api.revocaBadge({ clienteId: f.uid, tipoId: parseInt(f.tipoId) });
      else                        res = await api.trasferisciBadge({ daId: f.uid, aId: f.targetUid, tipoId: parseInt(f.tipoId) });
      setConferma(false);
      setRisultato(res.data.data);
      onRefresh();
    } catch(e) {
      setConferma(false);
      setErr(e.response?.data?.error || "Errore operazione");
    }
    setLoading(false);
  };

  const righeConferma = () => [
    ["Operazione", {assegna:"Assegna",revoca:"Revoca",trasferisci:"Trasferisci"}[f.op]],
    ["Cliente", findNome(f.uid)],
    f.op==="trasferisci" ? ["Destinatario", findNome(f.targetUid)] : null,
    ["Riconoscimento", `${LIVELLI_META[f.tipoId]?.icon} ${nomeBadge(f.tipoId)}`],
  ].filter(Boolean);

  if (risultato) return (
    <RisultatoTx
      titolo="Riconoscimento aggiornato"
      txHash={risultato.txHash}
      dettagli={[["Cliente", risultato.cliente], ["Riconoscimento", nomeBadge(risultato.tipoId)]]}
      onChiudi={()=>{ setRisultato(null); setF({op:"assegna",uid:"",tipoId:"1",targetUid:""}); }}
    />
  );

  return (
    <>
      {conferma && (
        <ModalConferma
          titolo="Stai per modificare un riconoscimento su LUKSO blockchain."
          righe={righeConferma()}
          onConferma={handle}
          onAnnulla={()=>setConferma(false)}
          loading={loading}
        />
      )}
      <div className="g2">
        <div className="card cp">
          <div className="sh"><div className="st">Operazione Riconoscimento</div></div>
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
            {[{id:"assegna",t:"🏅 Assegna Riconoscimento",s:"Premia il cliente con un nuovo livello"},
              {id:"revoca", t:"❌ Revoca Riconoscimento",  s:"Rimuovi un riconoscimento dal cliente"},
              {id:"trasferisci",t:"↔️ Trasferisci",        s:"Sposta il riconoscimento a un altro cliente"}
            ].map(op=>(
              <div key={op.id} className={`rc ${f.op===op.id?"sel":""}`} onClick={()=>setF({...f,op:op.id})}>
                <div className="rc-t">{op.t}</div><div className="rc-s">{op.s}</div>
              </div>
            ))}
          </div>
          {err && <div className="alert-e">{err}</div>}
          <div className="fg"><label className="fl">Cliente {f.op==="trasferisci"?"(mittente)":""}</label>
            <select className="fi" value={f.uid} onChange={e=>setF({...f,uid:e.target.value})}>
              <option value="">Seleziona cliente…</option>
              {attivi.map(u=><option key={u.id} value={u.id}>{fullName(u)}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Riconoscimento</label>
            <select className="fi" value={f.tipoId} onChange={e=>setF({...f,tipoId:e.target.value})}>
              {Object.entries(LIVELLI_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          {f.op==="trasferisci" && (
            <div className="fg"><label className="fl">Destinatario</label>
              <select className="fi" value={f.targetUid} onChange={e=>setF({...f,targetUid:e.target.value})}>
                <option value="">Seleziona cliente…</option>
                {attivi.filter(u=>u.id!==f.uid).map(u=><option key={u.id} value={u.id}>{fullName(u)}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-p" style={{width:"100%",justifyContent:"center",marginTop:8}} onClick={handleConferma}>
            Procedi →
          </button>
        </div>
        <div className="card cp">
          <div className="sh"><div className="st">Livelli Disponibili</div></div>
          {Object.entries(LIVELLI_META).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid #E8E8ED"}}>
              <span style={{fontSize:24}}>{v.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{v.label}</div></div>
              <span style={{background:v.color+"18",color:v.color,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>LSP8</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Storico Movimenti (Admin) ──────────────────────────────────────────────────
function PageStorico({ clienti }) {
  const [clienteId, setClienteId] = useState("");
  const [dati, setDati] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const attivi = clienti.filter(u=>u.status==="active");

  const cerca = async () => {
    if (!clienteId) { setErr("Seleziona un cliente"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.getCliente(clienteId);
      setDati(res.data.data);
    } catch(e) { setErr("Errore caricamento dati"); }
    setLoading(false);
  };

  return (
    <div>
      <div className="sh"><div className="st">Storico Movimenti</div></div>
      <div className="card cp" style={{marginBottom:20}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <div className="fg" style={{flex:1,marginBottom:0}}>
            <label className="fl">Seleziona Cliente</label>
            <select className="fi" value={clienteId} onChange={e=>setClienteId(e.target.value)}>
              <option value="">Seleziona cliente…</option>
              {attivi.map(u=><option key={u.id} value={u.id}>{fullName(u)}</option>)}
            </select>
          </div>
          <button className="btn btn-p" onClick={cerca} disabled={loading}>
            {loading ? "Caricamento…" : "Cerca"}
          </button>
        </div>
        {err && <div className="alert-e" style={{marginTop:10}}>{err}</div>}
      </div>
      {dati && (
        <div className="card cp">
          <div className="sh">
            <div>
              <div className="st">{dati.nome} {dati.cognome}</div>
              <div className="ss">Saldo: ⭐ {(dati.stelle||0).toLocaleString("it-IT")} · {dati.badge?.length||0} riconoscimenti</div>
            </div>
          </div>
          <div className="kbox" style={{marginBottom:16}}>
            <div className="kl">Indirizzo Account</div>
            <div className="kv">{dati.address}</div>
          </div>
          <a href={`https://explorer.execution.testnet.lukso.network/address/${dati.address}`} target="_blank" rel="noopener noreferrer" className="btn btn-g btn-sm" style={{textDecoration:"none",marginBottom:16}}>
            {Ic.link} Vedi su Blockscout
          </a>
         <div className="div"/>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Riconoscimenti</div>
          {(!dati.badge||dati.badge.length===0) ? (
            <div style={{fontSize:13,color:"#8E8E9A"}}>Nessun riconoscimento</div>
          ) : (
            <div className="tag-row" style={{marginBottom:16}}>
              {dati.badge.map(b=>{
                const m=LIVELLI_META[b];
                return m ? <span key={b} style={{fontSize:12,padding:"4px 12px",borderRadius:20,background:m.color+"18",color:m.color,fontWeight:600}}>{m.icon} {m.label}</span> : null;
              })}
            </div>
          )}
          <div className="div"/>
          <StoricoCliente userId={clienteId} />
        </div>
      )}
    </div>
  );
}

// ── Modal: Crea Cliente ────────────────────────────────────────────────────────
function ModalCreaCliente({ onClose, onDone, clienti }) {
  const [eoaMode, setEoaMode] = useState("genera");
  const [isMig,   setIsMig]   = useState(false);
  const [migId,   setMigId]   = useState("");
  const [f, setF] = useState({nome:"",cognome:"",luogo:"",dataNascita:"",existingAddress:"",upAddress:""});
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const handle = async () => {
    setErr(""); setLoading(true);
    try {
      if (!f.nome.trim()||!f.cognome.trim()) { setErr("Nome e cognome obbligatori"); setLoading(false); return; }
      if (!f.luogo.trim()) { setErr("Luogo di nascita obbligatorio"); setLoading(false); return; }
      if (!f.dataNascita)  { setErr("Data di nascita obbligatoria"); setLoading(false); return; }

      let walletType, existingAddress;
      if (eoaMode==="genera")   { walletType = "EOA"; }
      else if (eoaMode==="esterno") { walletType = "EOA_ESTERNO"; existingAddress = f.existingAddress.trim(); }
      else { walletType = "UP"; existingAddress = f.upAddress.trim(); }

      const res = await api.creaCliente({
        nome: f.nome.trim(), cognome: f.cognome.trim(),
        luogo: f.luogo.trim(), dataNascita: f.dataNascita,
        walletType, existingAddress,
        isMigrazione: isMig, migrazioneId: isMig ? migId : null,
      });
      setResult(res.data.data);
    } catch(e) {
      setErr(e.response?.data?.error || "Errore creazione cliente");
    }
    setLoading(false);
  };

  const eoas = clienti.filter(u=>u.walletType!=="UP"&&u.status==="active");

  if (result) return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mh"><div className="mt">✅ Cliente Registrato</div><button className="mx" onClick={onDone}>×</button></div>
        <div className="mb">
          <div className="alert-s"><strong>{result.nome} {result.cognome}</strong> registrato con successo!</div>
          {[["Nome",result.nome],["Cognome",result.cognome],["Luogo",result.luogo],["Nascita",result.dataNascita],["Tipo profilo",walletLabel(result.walletType)]].map(([k,v])=>(
            <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
          ))}
          <div className="div"/>
          <div className="kbox"><div className="kl">Indirizzo Account</div><div className="kv">{result.address}</div></div>
          {result.pin && (
            <>
              <div className="kwarn">⚠️ Consegna il PIN al cliente. Non sarà più recuperabile senza accedere alla scheda cliente.</div>
              <div style={{marginBottom:6,fontSize:11,color:"#ffffff38",textTransform:"uppercase",letterSpacing:.8,marginTop:10}}>PIN di Accesso Cliente</div>
              <div className="pin-box">
                {result.pin.split("").map((d,i)=>(
                  <div key={i} className="pin-digit">{d}</div>
                ))}
              </div>
            </>
          )}
          {result.privateKey && (
            <button className="btn btn-g btn-sm" style={{marginTop:12}} onClick={()=>{
              const b=new Blob([`FIDELITYHUB — Credenziali di Accesso\n\nNome: ${result.nome} ${result.cognome}\nLuogo: ${result.luogo}\nData di nascita: ${result.dataNascita}\nTipo profilo: ${walletLabel(result.walletType)}\n\nIndirizzo account: ${result.address}\nPIN di accesso: ${result.pin}\n\nConserva questo documento in modo riservato.`],{type:"text/plain"});
              const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`fidelityhub-${result.cognome}.txt`;a.click();
            }}>{Ic.dl} Scarica documento di accesso</button>
          )}
          <div className="factions"><button className="btn btn-p" onClick={onDone}>Fatto</button></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="mh"><div className="mt">Nuovo Cliente</div><button className="mx" onClick={onClose}>×</button></div>
        <div className="mb">
          {err && <div className="alert-e">{err}</div>}
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E9A",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Dati Anagrafici</div>
          <div className="fi-2">
            <div className="fg"><label className="fl">Nome</label><input className="fi" placeholder="Mario" value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></div>
            <div className="fg"><label className="fl">Cognome</label><input className="fi" placeholder="Rossi" value={f.cognome} onChange={e=>setF({...f,cognome:e.target.value})}/></div>
          </div>
          <div className="fi-2">
            <div className="fg"><label className="fl">Luogo di Nascita</label><input className="fi" placeholder="Roma" value={f.luogo} onChange={e=>setF({...f,luogo:e.target.value})}/></div>
            <div className="fg"><label className="fl">Data di Nascita</label><input className="fi" type="date" value={f.dataNascita} onChange={e=>setF({...f,dataNascita:e.target.value})}/></div>
          </div>
          <div className="sep"/>
          <div style={{fontSize:11,fontWeight:700,color:"#8E8E9A",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Tipo di Profilo</div>
          <div className="fg">
            <div className="rg">
              {[
                {id:"genera",  t:"✨ Crea nuovo",     s:"Genera automaticamente le credenziali"},
                {id:"esterno", t:"📥 Già registrato",  s:"Il cliente ha già un indirizzo EOA"},
                {id:"up",      t:"⬆️ Profilo Avanzato",s:"Il cliente ha già un UP LUKSO"},
              ].map(o=>(
                <div key={o.id} className={`rc ${eoaMode===o.id?"sel":""}`} onClick={()=>setEoaMode(o.id)}>
                  <div className="rc-t">{o.t}</div><div className="rc-s">{o.s}</div>
                </div>
              ))}
            </div>
          </div>
          {eoaMode==="esterno" && (
            <div className="fg"><label className="fl">Indirizzo EOA Esistente</label>
              <input className="fi mono" placeholder="0x..." value={f.existingAddress} onChange={e=>setF({...f,existingAddress:e.target.value})}/>
            </div>
          )}
          {eoaMode==="up" && (
            <div className="fg"><label className="fl">Indirizzo Universal Profile</label>
              <input className="fi mono" placeholder="0x..." value={f.upAddress} onChange={e=>setF({...f,upAddress:e.target.value})}/>
            </div>
          )}
          <div className="sep"/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,cursor:"pointer"}} onClick={()=>setIsMig(!isMig)}>
            <input type="checkbox" checked={isMig} onChange={()=>setIsMig(!isMig)} style={{width:16,height:16,cursor:"pointer"}}/>
            <span style={{fontSize:13,fontWeight:600}}>Aggiornamento profilo (stesso cliente, nuovo accesso)</span>
          </div>
          {isMig && (
            <div className="fg">
              <div className="mig-banner">{Ic.migr} Seleziona il profilo esistente da sostituire.</div>
              <label className="fl">Profilo da Sostituire</label>
              <select className="fi" value={migId} onChange={e=>setMigId(e.target.value)}>
                <option value="">Seleziona…</option>
                {eoas.filter(u=>u.nome===f.nome.trim()&&u.cognome===f.cognome.trim()).map(u=>(
                  <option key={u.id} value={u.id}>{fullName(u)} — {walletLabel(u.walletType)}</option>
                ))}
                {eoas.filter(u=>!(u.nome===f.nome.trim()&&u.cognome===f.cognome.trim())).map(u=>(
                  <option key={u.id} value={u.id}>{fullName(u)} — {walletLabel(u.walletType)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="factions">
            <button className="btn btn-g" onClick={onClose}>Annulla</button>
            <button className="btn btn-p" disabled={loading} onClick={handle}>
              {loading ? "Creazione in corso…" : "Registra Cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PIN Viewer ─────────────────────────────────────────────────────────────────
function PinViewer({ clienteId }) {
  const [pin, setPin] = useState(null);
  const [show, setShow] = useState(false);

  const loadPin = async () => {
    try {
      const res = await api.getPinCliente(clienteId);
      setPin(res.data.data.pin);
      setShow(true);
    } catch(e) { console.error(e); }
  };

  return (
    <>
      <button className="btn btn-g btn-sm" onClick={show ? ()=>setShow(false) : loadPin}>
        🔢 {show ? "Nascondi" : "Mostra"} PIN accesso cliente
      </button>
      {show && pin && (
        <div style={{marginTop:10,background:"#0C0C10",borderRadius:10,padding:14}}>
          <div style={{fontSize:9.5,color:"#ffffff38",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>PIN Cliente</div>
          <div className="pin-box">
            {pin.split("").map((d,i)=>(
              <div key={i} className="pin-digit">{d}</div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Modal: Dettaglio Cliente ───────────────────────────────────────────────────
function ModalDettaglio({ user, clienti, onClose, onRefresh }) {
  const [tab, setTab]     = useState("info");
  const [dati, setDati]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getCliente(user.id);
        setDati(res.data.data);
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const archive = async () => {
    try { await api.archiviaCliente(user.id); onRefresh(); } catch(e) { console.error(e); }
  };

  const migOrig = user.migrazioneId ? clienti.find(u=>u.id===user.migrazioneId) : null;

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="mh">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="av" style={{background:avBg(fullName(user)),width:40,height:40,fontSize:16}}>{user.nome[0]}</div>
            <div>
              <div className="mt">{fullName(user)}</div>
              <div style={{fontSize:12,color:"#8E8E9A",marginTop:1}}>{user.luogo} · {user.dataNascita} · {walletLabel(user.walletType)}</div>
            </div>
          </div>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div className="mb">
          <div style={{display:"flex",gap:2,background:"#F5F5F7",borderRadius:9,padding:3,marginBottom:20}}>
            {[["info","Anagrafica"],["wallet","Accesso"],["blockchain","Saldo & Badge"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",border:"none",borderRadius:7,fontFamily:"inherit",fontSize:12.5,fontWeight:tab===t?700:500,cursor:"pointer",background:tab===t?"#fff":"transparent",color:tab===t?"#0C0C10":"#8E8E9A",transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>

          {tab==="info" && (
            <div>
              {migOrig && <div className="mig-banner">{Ic.migr} Profilo aggiornato da <strong>{fullName(migOrig)}</strong></div>}
              {[["Nome",user.nome],["Cognome",user.cognome],["Luogo di nascita",user.luogo],["Data di nascita",user.dataNascita],["Registrato il",fmtD(user.createdAt)],["Stato",user.status==="active"?"Attivo":"Archiviato"]].map(([k,v])=>(
                <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
              ))}
              {user.status==="active" && (
                <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #E8E8ED"}}>
                  <button className="btn btn-danger btn-sm" onClick={archive}>{Ic.arch} Archivia cliente</button>
                </div>
              )}
            </div>
          )}

          {tab==="wallet" && (
            <div>
              <div className="info-row"><span className="ik">Tipo profilo</span><span className="iv">{walletLabel(user.walletType)}</span></div>
              <div className="div"/>
              <div className="kbox"><div className="kl">Indirizzo Account</div><div className="kv">{user.address}</div></div>
              <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
                <PinViewer clienteId={user.id} />                <a href={`https://explorer.execution.testnet.lukso.network/address/${user.address}`} target="_blank" rel="noopener noreferrer" className="btn btn-g btn-sm" style={{textDecoration:"none"}}>
                  {Ic.link} Vedi su Blockscout
                </a>
              </div>
            </div>
          )}

          {tab==="blockchain" && (
            <div>
              {loading ? <Spinner /> : dati ? (
                <>
                  <div style={{textAlign:"center",padding:"20px 0"}}>
                    <div style={{fontSize:48,fontWeight:800,color:"#5151FF"}}>⭐ {(dati.stelle||0).toLocaleString("it-IT")}</div>
                    <div style={{fontSize:13,color:"#8E8E9A",marginTop:4}}>Stelle on-chain · LUKSO</div>
                  </div>
                  <div className="div"/>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Riconoscimenti</div>
                  {(!dati.badge||dati.badge.length===0) ? (
                    <div style={{fontSize:13,color:"#8E8E9A"}}>Nessun riconoscimento ancora</div>
                  ) : (
                    <div className="tag-row">
                      {dati.badge.map(b=>{
                        const m=LIVELLI_META[b];
                        return m ? <span key={b} style={{fontSize:12,padding:"4px 12px",borderRadius:20,background:m.color+"18",color:m.color,fontWeight:600}}>{m.icon} {m.label}</span> : null;
                      })}
                    </div>
                  )}
                </>
              ) : <div className="alert-e">Errore caricamento dati blockchain</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StoricoCliente({ userId }) {
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const BADGE_NOMI = {1:"Gold",2:"Silver",3:"VIP",4:"Early Adopter",5:"Top Cliente"};
  const BADGE_ICON = {1:"🥇",2:"🥈",3:"💎",4:"🚀",5:"⭐"};

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getStorico(userId);
        setEventi(res.data.data);
      } catch(e) { setErr("Errore caricamento storico"); }
      setLoading(false);
    };
    load();
  }, [userId]);

  const fmtTs = ts => new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

  const descr = ev => {
    switch(ev.tipo) {
      case "carica":        return { ico:"⭐", label:"Stelle ricevute",      color:"#00C48C", amt:`+${ev.qty} stelle`, nota: ev.nota };
      case "scala":         return { ico:"🎁", label:"Stelle utilizzate",    color:"#FF4757", amt:`-${ev.qty} stelle`, nota: ev.nota };
      case "trasferisci_in":return { ico:"↙️", label:"Stelle ricevute",      color:"#00C48C", amt:`+${ev.qty} stelle`, nota: ev.nota };
      case "trasferisci_out":return{ ico:"↗️", label:"Stelle inviate",       color:"#FF4757", amt:`-${ev.qty} stelle`, nota: ev.nota };
      case "badge_in":      return { ico:BADGE_ICON[ev.tipoId]||"🏅", label:`Riconoscimento ${BADGE_NOMI[ev.tipoId]||""} ricevuto`, color:"#FFB020", amt:"", nota:"" };
      case "badge_rev":     return { ico:"❌", label:`Riconoscimento ${BADGE_NOMI[ev.tipoId]||""} revocato`, color:"#FF4757", amt:"", nota:"" };
      case "badge_tx_in":   return { ico:BADGE_ICON[ev.tipoId]||"🏅", label:`Riconoscimento ${BADGE_NOMI[ev.tipoId]||""} ricevuto`, color:"#FFB020", amt:"", nota:"" };
      case "badge_tx_out":  return { ico:"↗️", label:`Riconoscimento ${BADGE_NOMI[ev.tipoId]||""} trasferito`, color:"#8E8E9A", amt:"", nota:"" };
      default: return { ico:"📋", label:ev.tipo, color:"#8E8E9A", amt:"", nota:"" };
    }
  };

  return (
    <div>
      <div className="sh"><div className="st">Storico Movimenti</div><div className="ss">{eventi.length} operazioni</div></div>
      <div className="card cp">
        {loading ? <Spinner /> : err ? <div className="alert-e">{err}</div> :
         eventi.length===0 ? <div className="empty"><div className="empty-ico">📋</div>Nessun movimento ancora</div> :
         eventi.map((ev,i) => {
           const d = descr(ev);
           return (
             <div key={i} className="tx-row">
               <div className="tx-ic" style={{background:d.color+"18",fontSize:18}}>{d.ico}</div>
               <div className="tx-info">
                 <div className="tx-desc">{d.label}</div>
                 {d.nota && <div style={{fontSize:11,color:"#8E8E9A",marginTop:1}}>{d.nota}</div>}
                 <div className="tx-hash" onClick={()=>window.open(`https://explorer.execution.testnet.lukso.network/tx/${ev.hash}`,"_blank")}>{ev.hash}</div>
               </div>
               <div className="tx-right">
                 {d.amt && <div className="tx-amt" style={{color:d.color}}>{d.amt}</div>}
                 <div className="tx-date">{fmtTs(ev.ts)}</div>
               </div>
             </div>
           );
         })
        }
      </div>
    </div>
  );
}

// ── Client App ─────────────────────────────────────────────────────────────────
function ClientApp({ userId, onLogout }) {
  const [tab, setTab] = useState("wallet");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCliente(userId);
      setUser(res.data.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><Spinner /></div>;
  if (!user) return <div style={{padding:40,textAlign:"center"}}>Profilo non trovato.</div>;

  const nav = [
    {id:"wallet",  l:"Il mio Wallet",    ic:Ic.dash},
    {id:"livelli", l:"I miei Livelli",   ic:Ic.livelli},
    {id:"storico", l:"Storico Movimenti",ic:Ic.storico},
    {id:"profilo", l:"Profilo",          ic:Ic.profilo},
  ];

  return (
    <div className="shell">
      <style>{CSS}</style>
      <aside className="sidebar">
        <div className="sb-logo">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="sb-hex"><svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg></div>
            <div><div className="sb-name">FidelityHub</div><div className="sb-sub">Area Cliente</div></div>
          </div>
        </div>
        <nav className="sb-nav">
          <div className="sb-sect">Il mio account</div>
          {nav.map(n=>(
            <button key={n.id} className={`sb-item ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id)}>{n.ic} {n.l}</button>
          ))}
          <div style={{flex:1}}/>
          <button className="sb-item" onClick={loadUser}>{Ic.refresh} Aggiorna</button>
          <button className="sb-item" onClick={onLogout}>{Ic.esci} Esci</button>
        </nav>
        <div className="sb-foot">
          <div className="net-pill">
            <div className="net-label"><span className="dot-live"/>Connesso</div>
            <div className="net-id">{user.nome} {user.cognome}</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="tb-title">Benvenuto, {user.nome}</span>
          <div className="tb-right">
            <span className="status-pill"><span className="dot-live"/>Connesso</span>
          </div>
        </header>

        <div className="page fade">
          {tab==="wallet" && (
            <div>
              <div className="hero">
                <div className="hero-lbl">Le mie Stelle</div>
                <div className="hero-val">⭐ {(user.stelle||0).toLocaleString("it-IT")}</div>
                <div className="hero-unit">Stelle Fedeltà · LUKSO</div>
                <div className="hero-id">{user.address?.slice(0,6)}…{user.address?.slice(-4)}</div>
              </div>
              <div className="card cp">
                <div className="sh">
                  <div className="st">I miei Riconoscimenti</div>
                  <button className="btn btn-g btn-sm" onClick={loadUser}>{Ic.refresh} Aggiorna</button>
                </div>
                {(!user.badge||user.badge.length===0) ? (
                  <div className="empty"><div className="empty-ico">🏅</div>Nessun riconoscimento ancora</div>
                ) : (
                  <div className="tag-row">
                    {user.badge.map(b=>{
                      const m=LIVELLI_META[b];
                      return m ? <span key={b} style={{fontSize:13,padding:"6px 14px",borderRadius:20,background:m.color+"18",color:m.color,fontWeight:600}}>{m.icon} {m.label}</span> : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab==="livelli" && (
            <div>
              <div className="sh"><div className="st">I miei Livelli</div><div className="ss">{(user.badge||[]).length} riconoscimenti</div></div>
              {(!user.badge||user.badge.length===0) ? (
                <div className="card cp"><div className="empty"><div className="empty-ico">🏅</div>Nessun riconoscimento ancora. Continua ad accumulare stelle!</div></div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                  {user.badge.map(b=>{
                    const m=LIVELLI_META[b];
                    return m ? (
                      <div key={b} className="card cp" style={{textAlign:"center",borderTop:`3px solid ${m.color}`}}>
                        <div style={{fontSize:52,marginBottom:10}}>{m.icon}</div>
                        <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>{m.label}</div>
                        <div style={{fontSize:12,color:"#8E8E9A"}}>Riconoscimento fedeltà</div>
                        <span style={{display:"inline-block",marginTop:12,fontSize:11,padding:"4px 14px",borderRadius:20,background:m.color+"18",color:m.color,fontWeight:600}}>✓ Verificato su LUKSO</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {tab==="storico" && <StoricoCliente userId={userId} />}

          {tab==="profilo" && (
            <div>
              <div className="sh"><div className="st">Il mio Profilo</div></div>
              <div className="g2">
                <div className="card cp">
                  <div style={{fontWeight:700,marginBottom:14}}>Dati Personali</div>
                  {[["Nome",user.nome],["Cognome",user.cognome],["Luogo di nascita",user.luogo],["Data di nascita",user.dataNascita],["Cliente dal",fmtD(user.createdAt)]].map(([k,v])=>(
                    <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
                  ))}
                </div>
                <div className="card cp">
                  <div style={{fontWeight:700,marginBottom:14}}>Il mio Account</div>
                  <div className="info-row"><span className="ik">Tipo profilo</span><span className="iv">{walletLabel(user.walletType)}</span></div>
                  <div className="info-row"><span className="ik">Stelle accumulate</span><span className="iv" style={{color:"#5151FF"}}>⭐ {(user.stelle||0).toLocaleString("it-IT")}</span></div>
                  <div className="info-row"><span className="ik">Riconoscimenti</span><span className="iv">{(user.badge||[]).length}</span></div>
                  <div className="kbox" style={{marginTop:12}}><div className="kl">Indirizzo Account</div><div className="kv">{user.address}</div></div>
                  <a href={`https://explorer.execution.testnet.lukso.network/address/${user.address}`} target="_blank" rel="noopener noreferrer" className="btn btn-g btn-sm" style={{marginTop:8,textDecoration:"none"}}>
                    {Ic.link} Vedi su Blockscout
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}