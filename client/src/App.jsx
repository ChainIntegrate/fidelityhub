import { useState, useEffect } from "react";

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  ink: "#0C0C10", fog: "#F5F5F7", card: "#FFFFFF", line: "#E8E8ED",
  slate: "#8E8E9A", indigo: "#5151FF", indigoD: "#3A3ACC", indigoGh: "#5151FF13",
  green: "#00C48C", greenGh: "#00C48C13", red: "#FF4757", redGh: "#FF475713",
  amber: "#FFB020", amberGh: "#FFB02013", purple: "#9B59B6", purpleGh: "#9B59B613",
  cyan: "#00B8D9", cyanGh: "#00B8D913", gold: "#D4A017", goldGh: "#D4A01713",
};

// ── Seed data ──────────────────────────────────────────────────────────────────
const hex  = n => Array.from({length:n},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
const fakeAddr = () => "0x"+hex(40);
const fakePK   = () => "0x"+hex(64);
const fakeTxId = () => "TX"+Date.now().toString(36).toUpperCase()+hex(6).toUpperCase();

const LIVELLI_META = {
  gold:   { label:"Gold",          icon:"🥇", color: C.gold   },
  silver: { label:"Silver",        icon:"🥈", color: C.slate  },
  vip:    { label:"VIP",           icon:"💎", color: C.purple },
  early:  { label:"Early Adopter", icon:"🚀", color: C.cyan   },
  top:    { label:"Top Cliente",   icon:"⭐", color: C.amber  },
};

const SEED_USERS = [
  { id:"u1", nome:"Mario",  cognome:"Rossi",   luogo:"Roma",    dataNascita:"1985-03-14",
    address:fakeAddr(), privateKey:fakePK(), walletType:"EOA", status:"active",
    stelle:1240, livelli:["gold","early"], createdAt:Date.now()-86400000*30, migrazioneId:null },
  { id:"u2", nome:"Laura",  cognome:"Bianchi", luogo:"Milano",  dataNascita:"1990-07-22",
    address:fakeAddr(), privateKey:fakePK(), walletType:"EOA", status:"active",
    stelle:580,  livelli:["silver"],        createdAt:Date.now()-86400000*15, migrazioneId:null },
  { id:"u3", nome:"Marco",  cognome:"Verdi",   luogo:"Napoli",  dataNascita:"1978-11-05",
    address:fakeAddr(), privateKey:null,    walletType:"EOA_ESTERNO", status:"active",
    stelle:3200, livelli:["gold","vip","early"], createdAt:Date.now()-86400000*60, migrazioneId:null },
  { id:"u4", nome:"Mario",  cognome:"Rossi",   luogo:"Roma",    dataNascita:"1985-03-14",
    address:fakeAddr(), privateKey:null,    walletType:"UP",   status:"active",
    stelle:0,    livelli:[],               createdAt:Date.now()-86400000*2,  migrazioneId:"u1" },
  { id:"u5", nome:"Giulia", cognome:"Russo",   luogo:"Torino",  dataNascita:"1995-01-30",
    address:fakeAddr(), privateKey:fakePK(), walletType:"EOA", status:"active",
    stelle:320,  livelli:["silver"],        createdAt:Date.now()-86400000*7,  migrazioneId:null },
];

const SEED_TXS = [
  { id:fakeTxId(), tipo:"carica",    da:"system", a:"u1", qty:500,  asset:"stelle",  note:"Benvenuto",           ts:Date.now()-86400000*28 },
  { id:fakeTxId(), tipo:"carica",    da:"system", a:"u1", qty:740,  asset:"stelle",  note:"Acquisto €74",        ts:Date.now()-86400000*10 },
  { id:fakeTxId(), tipo:"scala",     da:"u1", a:"system", qty:200,  asset:"stelle",  note:"Premio Caffè x4",     ts:Date.now()-86400000*5  },
  { id:fakeTxId(), tipo:"livello",   da:"system", a:"u1", qty:1,    asset:"gold",    note:"Livello Gold",        ts:Date.now()-86400000*20 },
  { id:fakeTxId(), tipo:"carica",    da:"system", a:"u2", qty:580,  asset:"stelle",  note:"Acquisto €58",        ts:Date.now()-86400000*14 },
  { id:fakeTxId(), tipo:"livello",   da:"system", a:"u2", qty:1,    asset:"silver",  note:"Livello Silver",      ts:Date.now()-86400000*13 },
  { id:fakeTxId(), tipo:"carica",    da:"system", a:"u3", qty:3200, asset:"stelle",  note:"Acquisto €320",       ts:Date.now()-86400000*55 },
  { id:fakeTxId(), tipo:"livello",   da:"system", a:"u3", qty:1,    asset:"vip",     note:"Cliente VIP",         ts:Date.now()-86400000*50 },
  { id:fakeTxId(), tipo:"trasferisci",da:"u1",    a:"u2", qty:100,  asset:"stelle",  note:"Regalo",              ts:Date.now()-86400000*3  },
  { id:fakeTxId(), tipo:"carica",    da:"system", a:"u5", qty:320,  asset:"stelle",  note:"Acquisto €32",        ts:Date.now()-86400000*6  },
];

// ── Storage ────────────────────────────────────────────────────────────────────
const SK = { U:"fh_users", T:"fh_txs" };
const load  = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const save  = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const getUsers = () => load(SK.U) || SEED_USERS;
const getTxs   = () => load(SK.T) || SEED_TXS;
const saveUsers = u => save(SK.U, u);
const pushTx = tx => { const t=getTxs(); t.unshift({...tx,id:fakeTxId(),ts:Date.now()}); save(SK.T,t.slice(0,500)); };

// ── Utils ──────────────────────────────────────────────────────────────────────
const short   = a => a?`${a.slice(0,6)}…${a.slice(-4)}`:"—";
const fmtD    = ts => new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
const fmtDT   = ts => new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const fullName= u => `${u.nome} ${u.cognome}`;
const avBg    = n => { const p=["#5151FF","#00C48C","#FF4757","#FFB020","#9B59B6","#00B8D9"]; let h=0; for(let c of(n||"?"))h=c.charCodeAt(0)+((h<<5)-h); return p[Math.abs(h)%p.length]; };

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:${C.fog};color:${C.ink};min-height:100vh}
.mono{font-family:'JetBrains Mono',monospace}

.shell{display:flex;min-height:100vh}
.sidebar{width:248px;background:${C.ink};flex-shrink:0;position:fixed;top:0;left:0;height:100vh;display:flex;flex-direction:column}
.main{margin-left:248px;flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:#fff;border-bottom:1px solid ${C.line};height:60px;padding:0 30px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.page{padding:30px;flex:1}

.sb-logo{padding:24px 20px 16px;border-bottom:1px solid #fff1}
.sb-hex{width:34px;height:34px;background:${C.indigo};border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-name{font-size:15px;font-weight:800;color:#fff;letter-spacing:-.4px}
.sb-sub{font-size:10px;color:#ffffff40;letter-spacing:.6px;text-transform:uppercase;margin-top:1px}
.sb-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:1px}
.sb-sect{font-size:9.5px;color:#ffffff28;letter-spacing:1.1px;text-transform:uppercase;padding:14px 12px 5px;font-weight:600}
.sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;cursor:pointer;color:#ffffff60;font-size:13px;font-weight:500;border:none;background:none;width:100%;text-align:left;transition:all .15s;font-family:inherit}
.sb-item:hover{background:#ffffff0d;color:#fff}
.sb-item.on{background:${C.indigo}22;color:${C.indigo}}
.sb-foot{padding:12px 8px;border-top:1px solid #fff1}
.net-pill{background:#ffffff07;border:1px solid #ffffff10;border-radius:8px;padding:10px 12px}
.net-label{font-size:9px;color:#ffffff28;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;display:flex;align-items:center;gap:4px}
.dot-live{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.green};box-shadow:0 0 6px ${C.green}}
.net-id{font-size:10px;color:#ffffff35;margin-top:2px}

.tb-title{font-size:15px;font-weight:700}
.tb-right{display:flex;align-items:center;gap:10px}
.status-pill{background:${C.greenGh};color:${C.green};font-size:11px;font-weight:600;padding:4px 11px;border-radius:20px;display:flex;align-items:center;gap:5px}

.card{background:#fff;border:1px solid ${C.line};border-radius:13px}
.cp{padding:22px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}
.stat{background:#fff;border:1px solid ${C.line};border-radius:12px;padding:18px 20px}
.stat-lbl{font-size:11px;color:${C.slate};font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}
.stat-val{font-size:26px;font-weight:800;letter-spacing:-1px}
.stat-sub{font-size:11px;color:${C.slate};margin-top:3px}

.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{font-size:10.5px;color:${C.slate};font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:11px 16px;text-align:left;border-bottom:1px solid ${C.line};background:${C.fog};white-space:nowrap}
td{padding:12px 16px;font-size:13px;border-bottom:1px solid ${C.line};vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}

.bx{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap}
.bx-green{background:${C.greenGh};color:${C.green}}
.bx-red{background:${C.redGh};color:${C.red}}
.bx-indigo{background:${C.indigoGh};color:${C.indigo}}
.bx-amber{background:${C.amberGh};color:${C.amber}}
.bx-purple{background:${C.purpleGh};color:${C.purple}}
.bx-cyan{background:${C.cyanGh};color:${C.cyan}}
.bx-gray{background:${C.fog};color:${C.slate};border:1px solid ${C.line}}

.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;font-family:inherit}
.btn-p{background:${C.indigo};color:#fff}
.btn-p:hover{background:${C.indigoD}}
.btn-g{background:transparent;color:${C.ink};border:1px solid ${C.line}}
.btn-g:hover{background:${C.fog}}
.btn-danger{background:${C.redGh};color:${C.red};border:1px solid ${C.red}25}
.btn-sm{padding:5px 11px;font-size:11.5px}
.btn-xs{padding:3px 8px;font-size:11px}
.btn:disabled{opacity:.4;cursor:not-allowed}

.ov{position:fixed;inset:0;background:#00000082;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}
.modal{background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 70px #00000028}
.modal-lg{max-width:660px}
.mh{padding:22px 26px 0;display:flex;align-items:center;justify-content:space-between}
.mt{font-size:17px;font-weight:800;letter-spacing:-.4px}
.mb{padding:18px 26px 26px}
.mx{background:${C.fog};border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${C.slate};font-size:17px;font-family:inherit}
.mx:hover{background:${C.line}}

.fg{margin-bottom:14px}
.fl{font-size:11px;font-weight:700;color:${C.slate};text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px}
.fi{width:100%;padding:9px 12px;border:1.5px solid ${C.line};border-radius:8px;font-size:13px;font-family:inherit;color:${C.ink};background:#fff;outline:none;transition:border-color .15s}
.fi:focus{border-color:${C.indigo}}
.fi.mono{font-family:'JetBrains Mono',monospace;font-size:11px}
.fi-2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.fhint{font-size:11px;color:${C.slate};margin-top:4px}
.factions{display:flex;gap:9px;justify-content:flex-end;margin-top:22px;padding-top:18px;border-top:1px solid ${C.line}}
select.fi{cursor:pointer}

.rg{display:flex;gap:10px}
.rc{flex:1;border:1.5px solid ${C.line};border-radius:10px;padding:13px;cursor:pointer;transition:all .15s}
.rc.sel{border-color:${C.indigo};background:${C.indigoGh}}
.rc-t{font-size:13px;font-weight:700;margin-bottom:2px}
.rc-s{font-size:11.5px;color:${C.slate}}

.kbox{background:${C.ink};border-radius:10px;padding:14px;margin:10px 0}
.kl{font-size:9.5px;color:#ffffff38;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}
.kv{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:${C.green};word-break:break-all;line-height:1.6}
.kwarn{background:${C.amberGh};border:1px solid ${C.amber}28;border-radius:8px;padding:10px 13px;font-size:12px;color:${C.amber};margin:10px 0}

.hero{background:${C.ink};border-radius:18px;padding:36px;text-align:center;position:relative;overflow:hidden;margin-bottom:22px}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,${C.indigo}38 0%,transparent 65%)}
.hero-lbl{font-size:12px;color:#ffffff45;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;position:relative}
.hero-val{font-size:72px;font-weight:800;color:#fff;letter-spacing:-3px;line-height:1;position:relative}
.hero-unit{font-size:18px;color:${C.indigo};font-weight:600;margin-top:8px;position:relative;letter-spacing:-.3px}
.hero-id{background:#ffffff0d;border:1px solid #ffffff12;border-radius:20px;padding:5px 14px;font-size:11px;color:#ffffff40;display:inline-block;margin-top:14px;position:relative}

.tx-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${C.line}}
.tx-row:last-child{border-bottom:none}
.tx-ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.tx-info{flex:1;min-width:0}
.tx-desc{font-size:13px;font-weight:500}
.tx-ref{font-size:10px;color:${C.slate};margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-right{text-align:right;flex-shrink:0}
.tx-amt{font-size:13.5px;font-weight:700}
.tx-date{font-size:10.5px;color:${C.slate};margin-top:1px}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.st{font-size:16px;font-weight:800;letter-spacing:-.4px}
.ss{font-size:12.5px;color:${C.slate};margin-top:2px}
.sep{height:1px;background:${C.line};margin:16px 0}
.div{height:1px;background:${C.line};margin:16px 0}
.empty{text-align:center;padding:50px 20px;color:${C.slate}}
.empty-ico{font-size:36px;margin-bottom:10px;opacity:.35}
.fade{animation:fade .15s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0}
.tag-row{display:flex;flex-wrap:wrap;gap:5px}
.info-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid ${C.line};font-size:13px}
.info-row:last-child{border-bottom:none}
.ik{color:${C.slate}}
.iv{font-weight:600}
.alert-s{background:${C.greenGh};border:1px solid ${C.green}28;border-radius:8px;padding:10px 14px;font-size:12.5px;color:${C.green};margin-bottom:14px}
.alert-e{background:${C.redGh};border:1px solid ${C.red}28;border-radius:8px;padding:10px 14px;font-size:12.5px;color:${C.red};margin-bottom:14px}
.alert-w{background:${C.amberGh};border:1px solid ${C.amber}28;border-radius:8px;padding:10px 14px;font-size:12.5px;color:${C.amber};margin-bottom:14px}
.mig-banner{background:linear-gradient(135deg,${C.purpleGh},${C.indigoGh});border:1px solid ${C.purple}28;border-radius:10px;padding:12px 14px;font-size:12px;color:${C.purple};display:flex;align-items:center;gap:8px;margin-bottom:14px}
.lvl-card{text-align:center;padding:24px 16px;border-radius:12px;border:1px solid ${C.line}}
input[type=number]{-moz-appearance:textfield}
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
`;

// ── Icons ──────────────────────────────────────────────────────────────────────
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
};

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [sess, setSess] = useState(null);
  useEffect(() => {
    if (!load(SK.U)) save(SK.U, SEED_USERS);
    if (!load(SK.T)) save(SK.T, SEED_TXS);
  }, []);
  if (!sess) return <Login onLogin={setSess} />;
  if (sess.role === "admin") return <AdminApp onLogout={() => setSess(null)} />;
  return <ClientApp userId={sess.uid} onLogout={() => setSess(null)} />;
}

// ── Login ──────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [tab, setTab] = useState("admin");
  const [f, setF] = useState({ email:"", pass:"", codice:"" });
  const [err, setErr] = useState("");

  const doAdmin = () => {
    if (f.email==="admin@fidelityhub.io" && f.pass==="admin123") onLogin({role:"admin"});
    else setErr("Credenziali non valide — prova: admin@fidelityhub.io / admin123");
  };
  const doClient = () => {
    const codice = f.codice.trim();
    if (!codice) { setErr("Inserisci il codice di accesso"); return; }
    // Simulato: usa la chiave privata come codice
    const users = getUsers();
    const u = users.find(x => x.privateKey === codice);
    if (!u) { setErr("Codice di accesso non valido o non riconosciuto"); return; }
    onLogin({ role:"client", uid: u.id });
  };

  return (
    <div style={{minHeight:"100vh",background:C.fog,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div className="sb-hex"><svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg></div>
            <span style={{fontSize:22,fontWeight:800,letterSpacing:-.6}}>FidelityHub</span>
          </div>
          <p style={{fontSize:12.5,color:C.slate}}>Piattaforma fedeltà professionale</p>
        </div>
        <div className="card cp">
          <div style={{display:"flex",background:C.fog,borderRadius:9,padding:4,gap:3,marginBottom:20}}>
            {[["admin","Gestionale"],["client","Area Cliente"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:"7px 0",border:"none",borderRadius:7,fontFamily:"inherit",fontSize:13,fontWeight:tab===t?700:500,cursor:"pointer",background:tab===t?"#fff":"transparent",color:tab===t?C.ink:C.slate,boxShadow:tab===t?"0 1px 4px #00000010":"none",transition:"all .15s"}}>
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
              <p style={{fontSize:11,color:C.slate,textAlign:"center",marginTop:10}}>admin@fidelityhub.io / admin123</p>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="fl">Codice di Accesso</label>
                <textarea className="fi mono" rows={3} placeholder="Inserisci il codice ricevuto…" value={f.codice} onChange={e=>setF({...f,codice:e.target.value})} style={{resize:"none",lineHeight:1.6}} />
                <p className="fhint">Il codice di accesso ti è stato fornito al momento della registrazione</p>
              </div>
              <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} onClick={doClient}>Accedi alla mia Area</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin App ──────────────────────────────────────────────────────────────────
function AdminApp({ onLogout }) {
  const [page, setPage] = useState("dash");
  const [users, setUsers] = useState(getUsers());
  const [txs,   setTxs]   = useState(getTxs());
  const refresh = () => { setUsers(getUsers()); setTxs(getTxs()); };

  const nav = [
    {id:"dash",    l:"Dashboard",          ic:Ic.dash},
    {id:"clienti", l:"Clienti",            ic:Ic.clienti},
    {id:"ops",     l:"Gestione Stelle",    ic:Ic.ops},
    {id:"livelli", l:"Riconoscimenti",     ic:Ic.livelli},
    {id:"storico", l:"Storico Movimenti",  ic:Ic.storico},
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
          <button className="sb-item" onClick={onLogout}>{Ic.esci} Esci</button>
        </nav>
        <div className="sb-foot">
          <div className="net-pill">
            <div className="net-label"><span className="dot-live"/>Sistema Attivo</div>
            <div className="net-id">FidelityHub v1.0</div>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="tb-title">{titles[page]}</span>
          <div className="tb-right">
            <span className="status-pill"><span className="dot-live"/>Online</span>
          </div>
        </header>
        <div className="page fade">
          {page==="dash"    && <PageDash users={users} txs={txs} />}
          {page==="clienti" && <PageClienti users={users} txs={txs} onRefresh={refresh} />}
          {page==="ops"     && <PageOps users={users} onRefresh={refresh} />}
          {page==="livelli" && <PageLivelli users={users} onRefresh={refresh} />}
          {page==="storico" && <PageStorico txs={txs} users={users} />}
        </div>
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function PageDash({ users, txs }) {
  const attivi  = users.filter(u=>u.status==="active");
  const totStel = attivi.reduce((s,u)=>s+(u.stelle||0),0);
  const totCarica = txs.filter(t=>t.tipo==="carica").reduce((s,t)=>s+t.qty,0);
  const upCount = users.filter(u=>u.walletType==="UP").length;

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-lbl">Clienti Attivi</div><div className="stat-val">{attivi.length}</div><div className="stat-sub">{users.filter(u=>u.status!=="active").length} archiviati</div></div>
        <div className="stat"><div className="stat-lbl">Stelle in Circolazione</div><div className="stat-val">{totStel.toLocaleString("it-IT")}</div><div className="stat-sub">saldo totale clienti</div></div>
        <div className="stat"><div className="stat-lbl">Stelle Erogate</div><div className="stat-val">{totCarica.toLocaleString("it-IT")}</div><div className="stat-sub">totale storico</div></div>
        <div className="stat"><div className="stat-lbl">Profili Avanzati</div><div className="stat-val">{upCount}</div><div className="stat-sub">clienti con profilo UP</div></div>
      </div>
      <div className="g2">
        <div className="card cp">
          <div className="sh"><div className="st">Ultimi Movimenti</div></div>
          {txs.length===0
            ? <div className="empty"><div className="empty-ico">📊</div>Nessun movimento</div>
            : txs.slice(0,6).map(tx=><TxRow key={tx.id} tx={tx} users={users}/>)}
        </div>
        <div className="card cp">
          <div className="sh"><div className="st">Classifica Clienti</div></div>
          {[...attivi].sort((a,b)=>b.stelle-a.stelle).slice(0,5).map((u,i)=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.line}`}}>
              <span style={{fontSize:12,fontWeight:700,color:C.slate,width:20,textAlign:"center"}}>{i+1}</span>
              <div className="av" style={{background:avBg(fullName(u))}}>{u.nome[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{fullName(u)}</div>
                <div style={{fontSize:11,color:C.slate}}>{u.luogo}</div>
              </div>
              <div style={{fontWeight:700,color:C.indigo,fontSize:13}}>⭐ {u.stelle.toLocaleString("it-IT")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Clienti ────────────────────────────────────────────────────────────────────
function PageClienti({ users, txs, onRefresh }) {
  const [showCrea, setShowCrea] = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const ok = fullName(u).toLowerCase().includes(q) || u.luogo?.toLowerCase().includes(q);
    if (filter==="all")    return ok && u.status==="active";
    if (filter==="arch")   return ok && u.status!=="active";
    if (filter==="up")     return ok && u.walletType==="UP" && u.status==="active";
    return ok;
  });

  const walletLabel = wt => ({EOA:"Standard",EOA_ESTERNO:"Esterno",UP:"Avanzato"}[wt]||wt);
  const walletStyle = wt => wt==="UP"?"bx-purple":wt==="EOA_ESTERNO"?"bx-cyan":"bx-indigo";

  return (
    <div>
      <div className="sh">
        <div><div className="st">Clienti</div><div className="ss">{users.filter(u=>u.status==="active").length} clienti attivi</div></div>
        <button className="btn btn-p" onClick={()=>setShowCrea(true)}>{Ic.plus} Nuovo Cliente</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input className="fi" placeholder="Cerca per nome o città…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}}/>
        {[["all","Attivi"],["up","Profilo Avanzato"],["arch","Archiviati"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className="btn btn-sm" style={{background:filter===v?C.indigo:C.fog,color:filter===v?"#fff":C.slate,border:`1px solid ${filter===v?C.indigo:C.line}`}}>{l}</button>
        ))}
      </div>
      <div className="card">
        <div className="tbl-wrap">
          {filtered.length===0
            ? <div className="empty"><div className="empty-ico">👤</div>Nessun cliente trovato</div>
            : (
              <table>
                <thead><tr>
                  <th>Cliente</th><th>Luogo / Nascita</th><th>Profilo</th><th>Stelle</th><th>Riconoscimenti</th><th>Stato</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => {
                    const migOrig = u.migrazioneId ? users.find(x=>x.id===u.migrazioneId) : null;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:9}}>
                            <div className="av" style={{background:u.status!=="active"?"#bbb":avBg(fullName(u))}}>{u.nome[0]}</div>
                            <div>
                              <div style={{fontWeight:600}}>{fullName(u)}</div>
                              {migOrig && <div style={{fontSize:10,color:C.purple}}>↑ profilo aggiornato</div>}
                            </div>
                          </div>
                        </td>
                        <td><div style={{fontSize:12}}>{u.luogo}</div><div style={{fontSize:11,color:C.slate}}>{u.dataNascita}</div></td>
                        <td><span className={`bx ${walletStyle(u.walletType)}`}>{walletLabel(u.walletType)}</span></td>
                        <td><span style={{fontWeight:700,color:C.indigo}}>⭐ {(u.stelle||0).toLocaleString("it-IT")}</span></td>
                        <td>
                          <div className="tag-row">
                            {(u.livelli||[]).map(l=>(
                              <span key={l} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:LIVELLI_META[l]?.color+"18",color:LIVELLI_META[l]?.color,fontWeight:600}}>
                                {LIVELLI_META[l]?.icon} {LIVELLI_META[l]?.label}
                              </span>
                            ))}
                            {(!u.livelli||u.livelli.length===0) && <span style={{fontSize:11,color:C.slate}}>—</span>}
                          </div>
                        </td>
                        <td><span className={`bx ${u.status==="active"?"bx-green":"bx-gray"}`}>{u.status==="active"?"Attivo":"Archiviato"}</span></td>
                        <td><button className="btn btn-xs btn-g" onClick={()=>setDetail(u)}>Dettaglio</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showCrea && <ModalCreaCliente onClose={()=>setShowCrea(false)} onDone={()=>{setShowCrea(false);onRefresh();}} users={users}/>}
      {detail   && <ModalDettaglio user={detail} users={users} txs={txs} onClose={()=>setDetail(null)} onRefresh={()=>{onRefresh();setDetail(null);}}/>}
    </div>
  );
}

// ── Gestione Stelle ────────────────────────────────────────────────────────────
function PageOps({ users, onRefresh }) {
  const [tipo, setTipo] = useState("carica");
  const [f, setF] = useState({da:"",a:"",qty:"",note:""});
  const [done, setDone] = useState(false);
  const [err,  setErr]  = useState("");
  const attivi = users.filter(u=>u.status==="active");

  const handleOp = () => {
    setErr("");
    const qty = parseInt(f.qty,10);
    if (!qty||qty<=0) { setErr("Inserisci un numero di stelle valido"); return; }
    const all = getUsers();

    if (tipo==="carica") {
      if (!f.a) { setErr("Seleziona il cliente"); return; }
      const i = all.findIndex(u=>u.id===f.a);
      all[i].stelle = (all[i].stelle||0)+qty;
      saveUsers(all);
      pushTx({tipo:"carica", da:"system", a:f.a, qty, asset:"stelle", note:f.note||"Carico stelle"});
    } else if (tipo==="scala") {
      if (!f.da) { setErr("Seleziona il cliente"); return; }
      const i = all.findIndex(u=>u.id===f.da);
      if (qty>(all[i].stelle||0)) { setErr(`Il cliente ha solo ${all[i].stelle} stelle disponibili`); return; }
      all[i].stelle -= qty;
      saveUsers(all);
      pushTx({tipo:"scala", da:f.da, a:"system", qty, asset:"stelle", note:f.note||"Scala stelle"});
    } else {
      if (!f.da||!f.a) { setErr("Seleziona mittente e destinatario"); return; }
      if (f.da===f.a)  { setErr("Mittente e destinatario non possono coincidere"); return; }
      const iDa = all.findIndex(u=>u.id===f.da);
      const iA  = all.findIndex(u=>u.id===f.a);
      if (qty>(all[iDa].stelle||0)) { setErr(`Il cliente ha solo ${all[iDa].stelle} stelle`); return; }
      all[iDa].stelle -= qty;
      all[iA].stelle   = (all[iA].stelle||0)+qty;
      saveUsers(all);
      pushTx({tipo:"trasferisci", da:f.da, a:f.a, qty, asset:"stelle", note:f.note||"Trasferimento stelle"});
    }
    onRefresh(); setDone(true);
  };

  if (done) return (
    <div className="card cp" style={{maxWidth:500}}>
      <div style={{textAlign:"center",padding:"32px 0"}}>
        <div style={{fontSize:54,marginBottom:12}}>✅</div>
        <div style={{fontWeight:800,fontSize:17}}>Operazione completata</div>
        <div style={{color:C.slate,fontSize:13,marginTop:6}}>Il saldo del cliente è stato aggiornato</div>
        <button className="btn btn-g" style={{marginTop:20}} onClick={()=>{setDone(false);setF({da:"",a:"",qty:"",note:""});}}>Nuova operazione</button>
      </div>
    </div>
  );

  return (
    <div className="g2">
      <div className="card cp">
        <div className="sh"><div className="st">Operazione</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:22}}>
          {[
            {id:"carica",      ico:"⭐", t:"Carica Stelle",      s:"Aggiungi stelle al conto del cliente"},
            {id:"scala",       ico:"🎁", t:"Scala Stelle",        s:"Il cliente utilizza le stelle per un premio"},
            {id:"trasferisci", ico:"↔️", t:"Trasferisci Stelle",  s:"Sposta stelle da un cliente a un altro"},
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
              {attivi.map(u=><option key={u.id} value={u.id}>{fullName(u)} — ⭐ {u.stelle}</option>)}
            </select>
          </div>
        )}
        {(tipo==="carica"||tipo==="trasferisci") && (
          <div className="fg"><label className="fl">{tipo==="trasferisci"?"A":"Cliente"}</label>
            <select className="fi" value={f.a} onChange={e=>setF({...f,a:e.target.value})}>
              <option value="">Seleziona cliente…</option>
              {attivi.filter(u=>u.id!==f.da).map(u=><option key={u.id} value={u.id}>{fullName(u)} — ⭐ {u.stelle}</option>)}
            </select>
          </div>
        )}
        <div className="fg"><label className="fl">Numero di Stelle</label>
          <input className="fi" type="number" min="1" placeholder="es. 100" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/>
        </div>
        <div className="fg"><label className="fl">Causale (opzionale)</label>
          <input className="fi" placeholder="es. Acquisto del 11/06/2026" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/>
        </div>
        <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} onClick={handleOp}>Conferma</button>
      </div>
      <div className="card cp">
        <div className="sh"><div className="st">Guida rapida</div></div>
        {[
          {ico:"⭐",t:"Carica Stelle",d:"Accredita stelle sul conto fedeltà del cliente dopo un acquisto o un'azione premiata."},
          {ico:"🎁",t:"Scala Stelle",  d:"Il cliente sceglie un premio dal catalogo: le stelle corrispondenti vengono scalate dal suo conto."},
          {ico:"↔️",t:"Trasferisci",   d:"Sposta stelle tra due clienti. Utile anche per la migrazione da profilo standard a profilo avanzato."},
        ].map(op=>(
          <div key={op.t} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.line}`}}>
            <span style={{fontSize:22,flexShrink:0}}>{op.ico}</span>
            <div><div style={{fontWeight:700,fontSize:13}}>{op.t}</div><div style={{fontSize:12,color:C.slate,marginTop:2}}>{op.d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Riconoscimenti ─────────────────────────────────────────────────────────────
function PageLivelli({ users, onRefresh }) {
  const [f, setF] = useState({op:"assegna",uid:"",livello:"gold",targetUid:""});
  const [done, setDone] = useState(false);
  const [err,  setErr]  = useState("");
  const attivi = users.filter(u=>u.status==="active");

  const handle = () => {
    setErr("");
    if (!f.uid) { setErr("Seleziona un cliente"); return; }
    const all = getUsers();
    const i = all.findIndex(u=>u.id===f.uid);
    if (f.op==="assegna") {
      if (all[i].livelli?.includes(f.livello)) { setErr("Il cliente ha già questo riconoscimento"); return; }
      all[i].livelli = [...(all[i].livelli||[]), f.livello];
      pushTx({tipo:"livello", da:"system", a:f.uid, qty:1, asset:f.livello, note:`Riconoscimento ${LIVELLI_META[f.livello].label} assegnato`});
    } else if (f.op==="revoca") {
      all[i].livelli = (all[i].livelli||[]).filter(l=>l!==f.livello);
      pushTx({tipo:"livello", da:f.uid, a:"system", qty:1, asset:f.livello, note:`Riconoscimento ${LIVELLI_META[f.livello].label} revocato`});
    } else {
      if (!f.targetUid) { setErr("Seleziona il destinatario"); return; }
      if (!all[i].livelli?.includes(f.livello)) { setErr("Il cliente non possiede questo riconoscimento"); return; }
      const ti = all.findIndex(u=>u.id===f.targetUid);
      if (all[ti].livelli?.includes(f.livello)) { setErr("Il destinatario ha già questo riconoscimento"); return; }
      all[i].livelli  = all[i].livelli.filter(l=>l!==f.livello);
      all[ti].livelli = [...(all[ti].livelli||[]), f.livello];
      pushTx({tipo:"livello", da:f.uid, a:f.targetUid, qty:1, asset:f.livello, note:`Trasferimento riconoscimento ${LIVELLI_META[f.livello].label}`});
    }
    saveUsers(all); onRefresh(); setDone(true);
  };

  if (done) return (
    <div className="card cp" style={{maxWidth:500}}>
      <div style={{textAlign:"center",padding:"32px 0"}}>
        <div style={{fontSize:54,marginBottom:12}}>🏅</div>
        <div style={{fontWeight:800,fontSize:17}}>Riconoscimento aggiornato</div>
        <button className="btn btn-g" style={{marginTop:20}} onClick={()=>{setDone(false);setF({op:"assegna",uid:"",livello:"gold",targetUid:""});}}>Nuova operazione</button>
      </div>
    </div>
  );

  return (
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
          <select className="fi" value={f.livello} onChange={e=>setF({...f,livello:e.target.value})}>
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
        <button className="btn btn-p" style={{width:"100%",justifyContent:"center",marginTop:8}} onClick={handle}>Conferma</button>
      </div>
      <div className="card cp">
        <div className="sh"><div className="st">Livelli Disponibili</div></div>
        {Object.entries(LIVELLI_META).map(([k,v])=>{
          const holders = users.filter(u=>u.livelli?.includes(k));
          return (
            <div key={k} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.line}`}}>
              <span style={{fontSize:24}}>{v.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{v.label}</div>
                <div style={{fontSize:11,color:C.slate}}>{holders.length} clienti premiati</div>
              </div>
              <span style={{background:v.color+"18",color:v.color,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>
                {holders.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Storico Movimenti ──────────────────────────────────────────────────────────
function PageStorico({ txs, users }) {
  const [f, setF] = useState("all");
  const labels = {all:"Tutti",carica:"Carica",scala:"Scala",trasferisci:"Trasferisci",livello:"Riconoscimenti"};
  const shown = f==="all" ? txs : txs.filter(t=>t.tipo===f);
  return (
    <div>
      <div className="sh"><div><div className="st">Storico Movimenti</div><div className="ss">{txs.length} operazioni registrate</div></div></div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {Object.entries(labels).map(([v,l])=>(
          <button key={v} onClick={()=>setF(v)} className="btn btn-sm" style={{background:f===v?C.indigo:C.fog,color:f===v?"#fff":C.slate,border:`1px solid ${f===v?C.indigo:C.line}`}}>{l}</button>
        ))}
      </div>
      <div className="card cp">
        {shown.length===0 ? <div className="empty"><div className="empty-ico">📋</div>Nessun movimento</div>
          : shown.map(tx=><TxRow key={tx.id} tx={tx} users={users} showRef/>)}
      </div>
    </div>
  );
}

// ── Modal: Crea Cliente ────────────────────────────────────────────────────────
function ModalCreaCliente({ onClose, onDone, users }) {
  const [eoaMode, setEoaMode] = useState("genera");
  const [isMig,   setIsMig]   = useState(false);
  const [migId,   setMigId]   = useState("");
  const [f, setF] = useState({nome:"",cognome:"",luogo:"",dataNascita:"",existingPk:"",upAddress:""});
  const [result,  setResult]  = useState(null);
  const [err,     setErr]     = useState("");

  const eoas = users.filter(u=>u.walletType!=="UP"&&u.status==="active");

  const handle = () => {
    setErr("");
    if (!f.nome.trim()||!f.cognome.trim()) { setErr("Nome e cognome sono obbligatori"); return; }
    if (!f.luogo.trim()) { setErr("Luogo di nascita obbligatorio"); return; }
    if (!f.dataNascita)  { setErr("Data di nascita obbligatoria"); return; }

    const dup = users.find(u=>u.nome===f.nome.trim()&&u.cognome===f.cognome.trim()&&u.status==="active");
    if (dup && !isMig) { setErr(`Esiste già un cliente con questo nome. Se è un aggiornamento di profilo, attiva l'opzione "Aggiornamento profilo".`); return; }
    if (dup && isMig && !migId) { setErr("Seleziona il profilo di origine da aggiornare"); return; }

    let address, privateKey=null, walletType;
    if (eoaMode==="genera") {
      address=fakeAddr(); privateKey=fakePK(); walletType="EOA";
    } else if (eoaMode==="esterno") {
      const pk=f.existingPk.trim();
      if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) { setErr("Codice di accesso non valido"); return; }
      address=fakeAddr(); walletType="EOA_ESTERNO";
    } else {
      const up=f.upAddress.trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(up)) { setErr("Identificativo profilo avanzato non valido"); return; }
      address=up; walletType="UP";
    }

    const newUser = {
      id:"u_"+Date.now(), nome:f.nome.trim(), cognome:f.cognome.trim(),
      luogo:f.luogo.trim(), dataNascita:f.dataNascita,
      address, privateKey, walletType, status:"active",
      stelle:0, livelli:[], createdAt:Date.now(),
      migrazioneId: isMig&&migId ? migId : null,
    };

    const all = getUsers();
    if (isMig&&migId) {
      const oi = all.findIndex(u=>u.id===migId);
      if (oi>=0) all[oi].status="migrated";
    }
    all.push(newUser);
    saveUsers(all);
    setResult({user:newUser, privateKey});
  };

  if (result) return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mh"><div className="mt">✅ Cliente Registrato</div><button className="mx" onClick={onDone}>×</button></div>
        <div className="mb">
          <div className="alert-s"><strong>{fullName(result.user)}</strong> registrato con successo!{result.user.migrazioneId?" Profilo precedente archiviato automaticamente.":""}</div>
          {[["Nome completo",fullName(result.user)],["Luogo di nascita",result.user.luogo],["Data di nascita",result.user.dataNascita],["Tipo profilo",{EOA:"Standard",EOA_ESTERNO:"Esterno",UP:"Avanzato"}[result.user.walletType]]].map(([k,v])=>(
            <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
          ))}
          <div className="div"/>
          <div className="kbox"><div className="kl">Indirizzo Account</div><div className="kv">{result.user.address}</div></div>
          {result.privateKey && (
            <>
              <div className="kwarn">⚠️ Consegna il codice di accesso al cliente. Non sarà più recuperabile dopo la chiusura di questa finestra.</div>
              <div className="kbox"><div className="kl">Codice di Accesso Cliente</div><div className="kv">{result.privateKey}</div></div>
              <button className="btn btn-g btn-sm" style={{marginTop:8}} onClick={()=>{
                const b=new Blob([`FIDELITYHUB — Credenziali di Accesso\n\nNome: ${fullName(result.user)}\nLuogo: ${result.user.luogo}\nData di nascita: ${result.user.dataNascita}\nTipo profilo: ${{EOA:"Standard",EOA_ESTERNO:"Esterno",UP:"Avanzato"}[result.user.walletType]}\n\nIndirizzo account: ${result.user.address}\nCodice di accesso: ${result.privateKey}\n\nConserva questo documento in modo riservato.`],{type:"text/plain"});
                const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`fidelityhub-${result.user.cognome}.txt`;a.click();
              }}>{Ic.dl} Scarica documento di accesso</button>
            </>
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

          <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Dati Anagrafici</div>
          <div className="fi-2">
            <div className="fg"><label className="fl">Nome</label><input className="fi" placeholder="Mario" value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></div>
            <div className="fg"><label className="fl">Cognome</label><input className="fi" placeholder="Rossi" value={f.cognome} onChange={e=>setF({...f,cognome:e.target.value})}/></div>
          </div>
          <div className="fi-2">
            <div className="fg"><label className="fl">Luogo di Nascita</label><input className="fi" placeholder="Roma" value={f.luogo} onChange={e=>setF({...f,luogo:e.target.value})}/></div>
            <div className="fg"><label className="fl">Data di Nascita</label><input className="fi" type="date" value={f.dataNascita} onChange={e=>setF({...f,dataNascita:e.target.value})}/></div>
          </div>

          <div className="sep"/>
          <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Tipo di Profilo</div>
          <div className="fg">
            <div className="rg">
              {[
                {id:"genera",  t:"✨ Crea nuovo",    s:"Genera automaticamente le credenziali di accesso"},
                {id:"esterno", t:"📥 Già registrato", s:"Il cliente ha già un codice di accesso esistente"},
                {id:"up",      t:"⬆️ Profilo Avanzato",s:"Il cliente possiede già un profilo avanzato"},
              ].map(o=>(
                <div key={o.id} className={`rc ${eoaMode===o.id?"sel":""}`} onClick={()=>setEoaMode(o.id)}>
                  <div className="rc-t">{o.t}</div><div className="rc-s">{o.s}</div>
                </div>
              ))}
            </div>
          </div>
          {eoaMode==="esterno" && (
            <div className="fg"><label className="fl">Codice di Accesso Esistente</label>
              <textarea className="fi mono" rows={2} placeholder="Inserisci il codice…" value={f.existingPk} onChange={e=>setF({...f,existingPk:e.target.value})} style={{resize:"none"}}/>
              <p className="fhint">Il codice viene usato solo per verificare l'identità del cliente.</p>
            </div>
          )}
          {eoaMode==="up" && (
            <div className="fg"><label className="fl">Identificativo Profilo Avanzato</label>
              <input className="fi mono" placeholder="0x…" value={f.upAddress} onChange={e=>setF({...f,upAddress:e.target.value})}/>
            </div>
          )}

          <div className="sep"/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,cursor:"pointer"}} onClick={()=>setIsMig(!isMig)}>
            <input type="checkbox" checked={isMig} onChange={()=>setIsMig(!isMig)} style={{width:16,height:16,cursor:"pointer"}}/>
            <span style={{fontSize:13,fontWeight:600}}>Aggiornamento profilo (stesso cliente, nuovo accesso)</span>
          </div>
          {isMig && (
            <div className="fg">
              <div className="mig-banner">{Ic.migr} Seleziona il profilo esistente. Verrà archiviato e sostituito da questo nuovo.</div>
              <label className="fl">Profilo da Sostituire</label>
              <select className="fi" value={migId} onChange={e=>setMigId(e.target.value)}>
                <option value="">Seleziona…</option>
                {eoas.filter(u=>u.nome===f.nome.trim()&&u.cognome===f.cognome.trim()).map(u=>(
                  <option key={u.id} value={u.id}>⭐ {fullName(u)} — {u.stelle} stelle — Profilo {u.walletType==="EOA"?"Standard":"Esterno"}</option>
                ))}
                {eoas.filter(u=>!(u.nome===f.nome.trim()&&u.cognome===f.cognome.trim())).map(u=>(
                  <option key={u.id} value={u.id}>{fullName(u)} — {u.stelle} stelle</option>
                ))}
              </select>
            </div>
          )}
          <div className="factions">
            <button className="btn btn-g" onClick={onClose}>Annulla</button>
            <button className="btn btn-p" onClick={handle}>Registra Cliente</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Dettaglio Cliente ───────────────────────────────────────────────────
function ModalDettaglio({ user, users, txs, onClose, onRefresh }) {
  const [tab, setTab]     = useState("info");
  const [showCod, setShowCod] = useState(false);
  const myTxs = txs.filter(t=>t.da===user.id||t.a===user.id);
  const migOrig = user.migrazioneId ? users.find(u=>u.id===user.migrazioneId) : null;
  const migDest = users.find(u=>u.migrazioneId===user.id);

  const archive = () => {
    const all=getUsers(); const i=all.findIndex(u=>u.id===user.id);
    all[i].status="archived"; saveUsers(all); onRefresh();
  };

  const walletLabel = wt => ({EOA:"Standard (generato)",EOA_ESTERNO:"Esterno (portato dal cliente)",UP:"Profilo Avanzato"}[wt]||wt);

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="mh">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="av" style={{background:avBg(fullName(user)),width:40,height:40,fontSize:16}}>{user.nome[0]}</div>
            <div>
              <div className="mt">{fullName(user)}</div>
              <div style={{fontSize:12,color:C.slate,marginTop:1}}>{user.luogo} · {user.dataNascita} · {walletLabel(user.walletType)}</div>
            </div>
          </div>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div className="mb">
          <div style={{display:"flex",gap:2,background:C.fog,borderRadius:9,padding:3,marginBottom:20}}>
            {[["info","Anagrafica"],["accesso","Accesso"],["movimenti","Movimenti"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",border:"none",borderRadius:7,fontFamily:"inherit",fontSize:12.5,fontWeight:tab===t?700:500,cursor:"pointer",background:tab===t?"#fff":"transparent",color:tab===t?C.ink:C.slate,transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>

          {tab==="info" && (
            <div>
              {migOrig && <div className="mig-banner">{Ic.migr} Profilo aggiornato da <strong>{fullName(migOrig)}</strong></div>}
              {migDest  && <div style={{background:C.cyanGh,border:`1px solid ${C.cyan}25`,borderRadius:9,padding:10,fontSize:12,color:C.cyan,marginBottom:12}}>⬆️ Profilo avanzato disponibile: <strong>{fullName(migDest)}</strong></div>}
              {[["Nome",user.nome],["Cognome",user.cognome],["Luogo di nascita",user.luogo],["Data di nascita",user.dataNascita],["Registrato il",fmtD(user.createdAt)],["Stato",user.status==="active"?"Attivo":"Archiviato"]].map(([k,v])=>(
                <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>
              ))}
              <div className="div"/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:12,color:C.slate,marginBottom:4}}>Stelle</div>
                  <div style={{fontSize:22,fontWeight:800,color:C.indigo}}>⭐ {(user.stelle||0).toLocaleString("it-IT")}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:C.slate,marginBottom:6}}>Riconoscimenti</div>
                  <div className="tag-row" style={{justifyContent:"flex-end"}}>
                    {(user.livelli||[]).map(l=>(
                      <span key={l} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:LIVELLI_META[l]?.color+"18",color:LIVELLI_META[l]?.color,fontWeight:600}}>
                        {LIVELLI_META[l]?.icon} {LIVELLI_META[l]?.label}
                      </span>
                    ))}
                    {(!user.livelli||user.livelli.length===0)&&<span style={{fontSize:12,color:C.slate}}>Nessuno</span>}
                  </div>
                </div>
              </div>
              {user.status==="active" && (
                <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.line}`}}>
                  <button className="btn btn-danger btn-sm" onClick={archive}>{Ic.arch} Archivia cliente</button>
                </div>
              )}
            </div>
          )}

          {tab==="accesso" && (
            <div>
              <div className="info-row"><span className="ik">Tipo profilo</span><span className="iv">{walletLabel(user.walletType)}</span></div>
              <div className="info-row"><span className="ik">Registrato il</span><span className="iv">{fmtD(user.createdAt)}</span></div>
              <div className="div"/>
              <div className="kbox"><div className="kl">Indirizzo Account</div><div className="kv">{user.address}</div></div>
              {user.privateKey ? (
                <>
                  <div style={{marginTop:12}}>
                    <button className="btn btn-g btn-sm" onClick={()=>setShowCod(!showCod)}>{Ic.chiave} {showCod?"Nascondi":"Mostra"} codice di accesso</button>
                  </div>
                  {showCod && (
                    <>
                      <div className="kwarn" style={{marginTop:10}}>⚠️ Condividi questo codice solo con il cliente direttamente, in modo riservato.</div>
                      <div className="kbox"><div className="kl">Codice di Accesso</div><div className="kv">{user.privateKey}</div></div>
                      <button className="btn btn-g btn-sm" style={{marginTop:8}} onClick={()=>{
                        const b=new Blob([`FIDELITYHUB — Credenziali di Accesso\n\nNome: ${fullName(user)}\nLuogo: ${user.luogo}\nData di nascita: ${user.dataNascita}\nTipo profilo: ${walletLabel(user.walletType)}\n\nIndirizzo account: ${user.address}\nCodice di accesso: ${user.privateKey}\n\nConserva questo documento in modo riservato.`],{type:"text/plain"});
                        const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`fidelityhub-${user.cognome}.txt`;a.click();
                      }}>{Ic.dl} Scarica documento</button>
                    </>
                  )}
                </>
              ) : (
                <div style={{marginTop:12,fontSize:13,color:C.slate}}>Profilo con accesso esterno — il codice non è in custodia del sistema.</div>
              )}
            </div>
          )}

          {tab==="movimenti" && (
            <div>
              {myTxs.length===0
                ? <div className="empty"><div className="empty-ico">📋</div>Nessun movimento</div>
                : myTxs.map(tx=><TxRow key={tx.id} tx={tx} users={users} myId={user.id} showRef/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Client App ─────────────────────────────────────────────────────────────────
function ClientApp({ userId, onLogout }) {
  const [tab, setTab] = useState("wallet");
  const [showCod, setShowCod] = useState(false);
  const users = getUsers();
  const user  = users.find(u=>u.id===userId);
  const txs   = getTxs().filter(t=>t.da===user?.id||t.a===user?.id);

  if (!user) return <div style={{padding:40,textAlign:"center"}}>Profilo non trovato.</div>;

  const nav = [
    {id:"wallet",  l:"Il mio Wallet",      ic:Ic.dash},
    {id:"livelli", l:"I miei Livelli",      ic:Ic.livelli},
    {id:"storico", l:"Storico Movimenti",   ic:Ic.storico},
    {id:"profilo", l:"Profilo",             ic:Ic.profilo},
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
          <button className="sb-item" onClick={onLogout}>{Ic.esci} Esci</button>
        </nav>
        <div className="sb-foot">
          <div className="net-pill">
            <div className="net-label"><span className="dot-live"/>Sistema Attivo</div>
            <div className="net-id">{fullName(user)}</div>
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
                <div className="hero-unit">Stelle Fedeltà</div>
                <div className="hero-id">#{user.id.toUpperCase()}</div>
              </div>
              <div className="card cp">
                <div className="sh"><div className="st">Ultimi Movimenti</div></div>
                {txs.length===0
                  ? <div className="empty"><div className="empty-ico">🌟</div>Nessun movimento ancora. Le tue stelle appariranno qui.</div>
                  : txs.slice(0,6).map(tx=><TxRow key={tx.id} tx={tx} users={users} myId={userId}/>)}
              </div>
            </div>
          )}

          {tab==="livelli" && (
            <div>
              <div className="sh"><div className="st">I miei Livelli</div><div className="ss">{(user.livelli||[]).length} riconoscimenti ottenuti</div></div>
              {(!user.livelli||user.livelli.length===0) ? (
                <div className="card cp"><div className="empty"><div className="empty-ico">🏅</div>Nessun riconoscimento ancora. Continua ad accumulare stelle!</div></div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                  {user.livelli.map(l=>{
                    const m=LIVELLI_META[l];
                    return (
                      <div key={l} className="card cp" style={{textAlign:"center",borderTop:`3px solid ${m.color}`}}>
                        <div style={{fontSize:52,marginBottom:10}}>{m.icon}</div>
                        <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>{m.label}</div>
                        <div style={{fontSize:12,color:C.slate}}>Riconoscimento fedeltà</div>
                        <span style={{display:"inline-block",marginTop:12,fontSize:11,padding:"4px 14px",borderRadius:20,background:m.color+"18",color:m.color,fontWeight:600}}>✓ Verificato</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab==="storico" && (
            <div>
              <div className="sh"><div className="st">Storico Movimenti</div><div className="ss">{txs.length} operazioni</div></div>
              <div className="card cp">
                {txs.length===0
                  ? <div className="empty"><div className="empty-ico">📋</div>Nessuna operazione ancora</div>
                  : txs.map(tx=><TxRow key={tx.id} tx={tx} users={users} myId={userId} showRef/>)}
              </div>
            </div>
          )}

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
                  <div style={{fontWeight:700,marginBottom:14}}>Accesso</div>
                  <div className="info-row"><span className="ik">Tipo profilo</span><span className="iv">{{EOA:"Standard",EOA_ESTERNO:"Esterno",UP:"Avanzato"}[user.walletType]}</span></div>
                  <div className="info-row"><span className="ik">Stelle accumulate</span><span className="iv" style={{color:C.indigo}}>⭐ {(user.stelle||0).toLocaleString("it-IT")}</span></div>
                  <div className="info-row"><span className="ik">Riconoscimenti</span><span className="iv">{(user.livelli||[]).length}</span></div>
                  {user.privateKey && (
                    <div style={{marginTop:14}}>
                      <button className="btn btn-g btn-sm" onClick={()=>setShowCod(!showCod)}>{Ic.chiave} {showCod?"Nascondi":"Mostra"} codice di accesso</button>
                      {showCod && (
                        <>
                          <div className="kwarn" style={{marginTop:10}}>⚠️ Non condividere il tuo codice di accesso con nessuno.</div>
                          <div className="kbox"><div className="kl">Il tuo Codice di Accesso</div><div className="kv">{user.privateKey}</div></div>
                          <button className="btn btn-g btn-sm" style={{marginTop:8}} onClick={()=>{
                            const b=new Blob([`FIDELITYHUB — Il mio Codice di Accesso\n\nNome: ${fullName(user)}\nCodice: ${user.privateKey}\n\nNon condividere questo documento.`],{type:"text/plain"});
                            const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="mio-accesso.txt";a.click();
                          }}>{Ic.dl} Salva codice</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── TxRow (shared) ─────────────────────────────────────────────────────────────
function TxRow({ tx, users, myId, showRef }) {
  const cfg = {
    carica:      { ico:"⭐", bg:C.greenGh,  color:C.green,  label:"Stelle caricate"    },
    scala:       { ico:"🎁", bg:C.redGh,    color:C.red,    label:"Stelle scalate"      },
    trasferisci: { ico:"↔️", bg:C.indigoGh, color:C.indigo, label:"Trasferimento"       },
    livello:     { ico:"🏅", bg:C.amberGh,  color:C.amber,  label:"Riconoscimento"      },
  };
  const c = cfg[tx.tipo] || cfg.carica;
  const findName = id => id==="system" ? "Sistema" : (users.find(u=>u.id===id) ? fullName(users.find(u=>u.id===id)) : "—");

  let desc = tx.note || c.label;
  if (tx.tipo==="trasferisci") desc = `${findName(tx.da)} → ${findName(tx.a)}${tx.note?` · ${tx.note}`:""}`;
  if (tx.tipo==="livello") desc = `${LIVELLI_META[tx.asset]?.icon||""} ${LIVELLI_META[tx.asset]?.label||tx.asset}${tx.note?` · ${tx.note}`:""}`;

  const isIn  = myId && tx.a===myId;
  const isOut = myId && tx.da===myId;
  const sign  = tx.tipo==="carica" ? "+" : tx.tipo==="scala" ? "−" : tx.tipo==="livello" ? "" : (myId ? (isIn?"+":"−") : "");
  const amtColor = tx.tipo==="carica" ? C.green : tx.tipo==="scala" ? C.red : myId ? (isIn?C.green:C.red) : C.indigo;
  const amt = tx.tipo==="livello"
    ? `${LIVELLI_META[tx.asset]?.label||tx.asset}`
    : `${sign}${tx.qty.toLocaleString("it-IT")} ⭐`;

  return (
    <div className="tx-row">
      <div className="tx-ic" style={{background:c.bg}}>{c.ico}</div>
      <div className="tx-info">
        <div className="tx-desc">{desc}</div>
        {showRef && <div className="tx-ref">Rif. {tx.id}</div>}
      </div>
      <div className="tx-right">
        <div className="tx-amt" style={{color: tx.tipo==="livello"?C.amber:amtColor}}>{amt}</div>
        <div className="tx-date">{fmtDT(tx.ts)}</div>
      </div>
    </div>
  );
}