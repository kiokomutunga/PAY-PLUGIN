import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  Search, Bell, LayoutDashboard, ArrowLeftRight, BarChart2,
  Zap, Target, CreditCard, Settings, HelpCircle, LogOut,
  Send, Plus, Download, Calendar, ChevronRight, TrendingUp,
  Lightbulb, Bot, X, Check, Shield, Lock, RefreshCw,
  CheckCircle, Smartphone, Phone
} from "lucide-react";

// ── Data constants ─────────────────────────────────────────────────────────────
const SPEND = [
  { name: "Food & Dining",     value: 650, color: "#22c55e", pct: "32%" },
  { name: "Transport",         value: 400, color: "#1e293b", pct: "20%" },
  { name: "Shopping",          value: 350, color: "#334155", pct: "18%" },
  { name: "Bills & Utilities", value: 300, color: "#475569", pct: "14%" },
  { name: "Entertainment",     value: 200, color: "#64748b", pct: "9%"  },
  { name: "Others",            value: 250, color: "#94a3b8", pct: "10%" },
];

const NAV = [
  { group: "MAIN", items: [
    { n: "Overview",     I: LayoutDashboard },
    { n: "Transactions", I: ArrowLeftRight  },
    { n: "Analytics",    I: BarChart2       },
  ]},
  { group: "INTELLIGENCE",  items: [{ n: "Smart Insights", I: Zap      }] },
  { group: "MONEY CONTROL", items: [{ n: "Goals",          I: Target   }, { n: "Cards",   I: CreditCard }] },
  { group: "OTHERS",        items: [{ n: "Settings",       I: Settings }, { n: "Help",    I: HelpCircle }, { n: "Log out", I: LogOut }] },
];

const STATS = [
  { label: "Monthly Income",   amt: "$553,600", cents: ".07", pct: "+71%",  up: true,  dotBg: "#dcfce7", dotTc: "#16a34a", pctColor: "#16a34a" },
  { label: "Monthly Expenses", amt: "$850,000", cents: ".12", pct: "+3.6%", up: false, dotBg: "#fee2e2", dotTc: "#dc2626", pctColor: "#dc2626" },
  { label: "Monthly Savings",  amt: "$721,480", cents: ".13", pct: "+8.3%", up: true,  dotBg: "#dbeafe", dotTc: "#1d4ed8", pctColor: "#16a34a" },
];

const TXS = [
  { e: "☕", name: "Starbucks Coffee", time: "March 21, 9:42am",   amt: "-$2,300",  pos: false },
  { e: "🏦", name: "Deposit",          time: "March 21, 1:18pm",  amt: "+$350.00", pos: true  },
  { e: "🚕", name: "Uber Ride",        time: "March 15, 10:01pm", amt: "-$4,200",  pos: false },
];

const RECS = [
  { e: "💻", title: "Save $5,000",         desc: "This is to get that Laptop" },
  { e: "🍔", title: "Reduce Food Spending", desc: "Try a weekly budget"        },
  { e: "📺", title: "Upcoming Bill",        desc: "Netflix: $100"              },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtCard   = v => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExpiry = v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 2 ? d.slice(0,2)+"/"+d.slice(2) : d; };
const genRef    = () => "TXN" + Math.random().toString(36).slice(2,8).toUpperCase();

// ── Shared style tokens ────────────────────────────────────────────────────────
const T = {
  input: { width:"100%", padding:"10px 12px", borderRadius:"10px", border:"1.5px solid #e2e8f0", fontSize:"13px", outline:"none", color:"#0f172a", backgroundColor:"#fff", fontFamily:"inherit" },
  label: { fontSize:"11px", fontWeight:600, color:"#64748b", marginBottom:"5px", display:"block" },
  btn:   (bg="#22c55e", fg="#fff", extra={}) => ({ backgroundColor:bg, color:fg, border:"none", borderRadius:"12px", padding:"12px 20px", fontSize:"13px", fontWeight:600, cursor:"pointer", width:"100%", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", ...extra }),
  card:  (extra={}) => ({ backgroundColor:"#fff", borderRadius:"16px", ...extra }),
  overlay: { position:"fixed", inset:0, backgroundColor:"rgba(10,15,28,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" },
  modal: (w="420px") => ({ backgroundColor:"#fff", borderRadius:"20px", width:w, maxWidth:"92vw", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.22)" }),
};

// ── Root Component ─────────────────────────────────────────────────────────────
export default function FinAI() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [active,    setActive]    = useState("Overview");
  // modal stack: null | "pay-method" | "card" | "mpesa" | "otp" | "success"
  const [modal,     setModal]     = useState(null);
  const [payMethod, setPayMethod] = useState(null);   // "card" | "mpesa"
  const [loading,   setLoading]   = useState(false);
  const [txRef,     setTxRef]     = useState(null);

  // Card payment form
  const [card, setCard] = useState({ number:"", name:"", expiry:"", cvv:"", amount:"" });

  // M-Pesa
  const [mpesa,     setMpesa]     = useState({ phone:"", amount:"" });
  const [stkStep,   setStkStep]   = useState("form"); // "form" | "sending" | "sent"

  // OTP
  const [otp,      setOtp]      = useState(Array(6).fill(""));
  const [otpTimer, setOtpTimer] = useState(30);
  const otpRefs = useRef([]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (modal !== "otp" || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [modal, otpTimer]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openModal  = name => { setModal(name); if (name === "otp") setOtpTimer(30); };
  const reset      = () => {
    setModal(null); setPayMethod(null); setLoading(false);
    setCard({ number:"", name:"", expiry:"", cvv:"", amount:"" });
    setMpesa({ phone:"", amount:"" }); setStkStep("form");
    setOtp(Array(6).fill("")); setTxRef(null);
  };

  const handleCardPay = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); openModal("otp"); }, 1600);
  };

  const handleStkPush = () => {
    setStkStep("sending");
    setTimeout(() => {
      setStkStep("sent");
      setTimeout(() => openModal("otp"), 2200);
    }, 1600);
  };

  const handleOtpChange = (i, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d && i < 5) otpRefs.current[i+1]?.focus();
  };
  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setTxRef(genRef());
      setLoading(false);
      openModal("success");
    }, 1600);
  };

  const amount = payMethod === "card" ? card.amount : mpesa.amount;
  const canCardPay = card.amount && card.number.replace(/\s/g,"").length === 16 && card.name && card.expiry.length === 5 && card.cvv.length >= 3;
  const canStk     = mpesa.amount && mpesa.phone.length === 9;
  const canVerify  = otp.every(d => d !== "");

  // ── Render helpers ─────────────────────────────────────────────────────────

  // ── 1. Payment method chooser ──────────────────────────────────────────────
  const renderPayMethod = () => (
    <div style={T.modal("380px")}>
      <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontWeight:700, fontSize:"16px" }}>Send Money</p>
          <p style={{ fontSize:"11px", color:"#94a3b8", marginTop:"2px" }}>Choose your payment method</p>
        </div>
        <button onClick={reset} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", lineHeight:1 }}><X size={18}/></button>
      </div>
      <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:"10px" }}>
        {[
          { icon:"💳", title:"Credit / Debit Card",   sub:"Visa · Mastercard · Amex",    method:"card",  hover:"#22c55e" },
          { icon:"M",  title:"M-Pesa STK Push",        sub:"Lipa Na M-Pesa · Safaricom",  method:"mpesa", hover:"#00A651", mpesa:true },
        ].map(({ icon, title, sub, method, hover, mpesa:isMpesa }) => (
          <button
            key={method}
            onClick={() => { setPayMethod(method); openModal(method); }}
            style={{ display:"flex", alignItems:"center", gap:"14px", padding:"16px", borderRadius:"14px", border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", textAlign:"left", transition:"border-color 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=hover; e.currentTarget.style.boxShadow=`0 0 0 3px ${hover}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ width:"44px", height:"44px", borderRadius:"12px", backgroundColor: isMpesa?"#e6f7ee":"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isMpesa?"16px":"22px", fontWeight: isMpesa?800:400, color: isMpesa?"#00A651":"inherit", flexShrink:0 }}>
              {icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:600, fontSize:"13px", color:"#0f172a" }}>{title}</p>
              <p style={{ fontSize:"11px", color:"#94a3b8", marginTop:"2px" }}>{sub}</p>
            </div>
            <ChevronRight size={16} color="#94a3b8"/>
          </button>
        ))}
        <button onClick={reset} style={{ ...T.btn("#f1f5f9","#64748b"), marginTop:"4px" }}>Cancel</button>
      </div>
    </div>
  );

  // ── 2. Card payment modal ──────────────────────────────────────────────────
  const renderCard = () => (
    <div style={T.modal("440px")}>
      <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontWeight:700, fontSize:"16px" }}>Card Payment</p>
          <p style={{ fontSize:"11px", color:"#94a3b8", marginTop:"2px", display:"flex", alignItems:"center", gap:"4px" }}><Lock size={10}/> 256-bit SSL encrypted</p>
        </div>
        <button onClick={reset} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8" }}><X size={18}/></button>
      </div>
      <div style={{ padding:"18px 22px 22px" }}>
        {/* Card visual */}
        <div style={{ background:"linear-gradient(135deg,#1e293b 0%,#0f172a 55%,#1c3a5e 100%)", borderRadius:"14px", padding:"18px 20px", marginBottom:"18px", height:"140px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", width:"150px", height:"150px", borderRadius:"50%", background:"rgba(255,255,255,0.04)", top:"-40px", right:"-30px" }}/>
          <div style={{ position:"absolute", width:"100px", height:"100px", borderRadius:"50%", background:"rgba(255,255,255,0.03)", bottom:"-30px", right:"60px" }}/>
          {/* chip */}
          <div style={{ width:"34px", height:"26px", borderRadius:"4px", backgroundColor:"#f59e0b", marginBottom:"14px", opacity:0.9 }}/>
          <p style={{ color:"#fff", fontSize:"14px", fontWeight:600, letterSpacing:"2.5px", marginBottom:"14px", fontFamily:"monospace", opacity:0.95 }}>
            {card.number || "•••• •••• •••• ••••"}
          </p>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"8px", marginBottom:"2px" }}>CARDHOLDER</p>
              <p style={{ color:"#fff", fontSize:"11px", fontWeight:600, letterSpacing:"1px" }}>{card.name.toUpperCase() || "YOUR NAME"}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"8px", marginBottom:"2px" }}>EXPIRES</p>
              <p style={{ color:"#fff", fontSize:"11px", fontWeight:600 }}>{card.expiry || "MM/YY"}</p>
            </div>
          </div>
        </div>
        {/* Form fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <div>
            <label style={T.label}>Amount</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", fontWeight:600, color:"#64748b" }}>KES</span>
              <input style={{ ...T.input, paddingLeft:"48px" }} placeholder="0" value={card.amount}
                onChange={e => setCard(p=>({ ...p, amount:e.target.value.replace(/\D/g,"") }))}/>
            </div>
          </div>
          <div>
            <label style={T.label}>Card Number</label>
            <input style={{ ...T.input, fontFamily:"monospace", letterSpacing:"1.5px" }} placeholder="1234 5678 9012 3456"
              value={card.number} onChange={e => setCard(p=>({ ...p, number:fmtCard(e.target.value) }))}/>
          </div>
          <div>
            <label style={T.label}>Cardholder Name</label>
            <input style={T.input} placeholder="Name as on card" value={card.name}
              onChange={e => setCard(p=>({ ...p, name:e.target.value }))}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={T.label}>Expiry</label>
              <input style={T.input} placeholder="MM/YY" value={card.expiry}
                onChange={e => setCard(p=>({ ...p, expiry:fmtExpiry(e.target.value) }))}/>
            </div>
            <div>
              <label style={T.label}>CVV</label>
              <input style={T.input} type="password" placeholder="•••" maxLength={4} value={card.cvv}
                onChange={e => setCard(p=>({ ...p, cvv:e.target.value.replace(/\D/g,"").slice(0,4) }))}/>
            </div>
          </div>
          <button onClick={handleCardPay} disabled={loading || !canCardPay}
            style={{ ...T.btn(), marginTop:"4px", opacity:(loading||!canCardPay)?0.55:1 }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> Processing…</>
              : <><Lock size={14}/> Pay Now</>}
          </button>
          <p style={{ textAlign:"center", fontSize:"10px", color:"#94a3b8", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
            <Shield size={10}/> Secured · Your card details are encrypted and never stored
          </p>
        </div>
      </div>
    </div>
  );

  // ── 3. M-Pesa STK Push modal ───────────────────────────────────────────────
  const renderMpesa = () => (
    <div style={T.modal("400px")}>
      {/* Green header */}
      <div style={{ background:"linear-gradient(135deg,#00A651,#006A35)", padding:"20px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ fontWeight:900, fontSize:"20px", color:"#fff", letterSpacing:"-0.3px" }}>M-PESA</p>
            <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.75)", marginTop:"2px" }}>Lipa Na M-Pesa · STK Push</p>
          </div>
          <button onClick={reset} style={{ background:"rgba(255,255,255,0.18)", border:"none", borderRadius:"8px", width:"30px", height:"30px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <X size={15}/>
          </button>
        </div>
        <div style={{ marginTop:"14px", padding:"10px 12px", backgroundColor:"rgba(255,255,255,0.12)", borderRadius:"10px", display:"flex", alignItems:"center", gap:"8px" }}>
          <Smartphone size={14} color="rgba(255,255,255,0.85)"/>
          <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.85)" }}>A payment prompt will be sent to your Safaricom line</p>
        </div>
      </div>

      <div style={{ padding:"20px 22px 22px" }}>
        {stkStep === "form" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div>
              <label style={T.label}>Amount (KES)</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", fontWeight:700, color:"#00A651" }}>KES</span>
                <input style={{ ...T.input, paddingLeft:"50px" }} placeholder="0" value={mpesa.amount}
                  onChange={e => setMpesa(p=>({ ...p, amount:e.target.value.replace(/\D/g,"") }))}/>
              </div>
            </div>
            <div>
              <label style={T.label}>M-Pesa Phone Number</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:"#64748b" }}>🇰🇪 +254</span>
                <input style={{ ...T.input, paddingLeft:"86px" }} placeholder="7XX XXX XXX" value={mpesa.phone}
                  onChange={e => setMpesa(p=>({ ...p, phone:e.target.value.replace(/\D/g,"").slice(0,9) }))}/>
              </div>
              <p style={{ fontSize:"10px", color:"#94a3b8", marginTop:"4px" }}>Enter the 9 digits after +254 e.g. 712345678</p>
            </div>
            <div style={{ backgroundColor:"#f0fdf4", borderRadius:"10px", padding:"10px 12px", border:"1px solid #bbf7d0" }}>
              <p style={{ fontSize:"11px", color:"#166534", lineHeight:"1.55" }}>
                ⚡ <strong>How it works:</strong> You'll receive a pop-up on your phone. Enter your M-Pesa PIN to confirm the payment.
              </p>
            </div>
            <button onClick={handleStkPush} disabled={!canStk}
              style={{ ...T.btn("#00A651"), opacity:canStk?1:0.5 }}>
              <Smartphone size={15}/> Send STK Push
            </button>
          </div>
        )}

        {stkStep === "sending" && (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"50%", backgroundColor:"#e6f7ee", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:"26px" }}>
              📱
            </div>
            <p style={{ fontWeight:700, fontSize:"15px", color:"#0f172a" }}>Connecting to M-Pesa…</p>
            <p style={{ fontSize:"12px", color:"#64748b", marginTop:"6px" }}>Please wait while we send the push notification</p>
            <div style={{ marginTop:"20px", height:"4px", backgroundColor:"#e6f7ee", borderRadius:"4px", overflow:"hidden" }}>
              <div style={{ height:"100%", backgroundColor:"#00A651", borderRadius:"4px", animation:"bar 1.6s ease-in-out forwards" }}/>
            </div>
          </div>
        )}

        {stkStep === "sent" && (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ width:"64px", height:"64px", borderRadius:"50%", backgroundColor:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <CheckCircle size={34} color="#22c55e"/>
            </div>
            <p style={{ fontWeight:800, fontSize:"16px", color:"#0f172a" }}>STK Push Sent!</p>
            <p style={{ fontSize:"12px", color:"#64748b", marginTop:"8px", lineHeight:"1.6" }}>
              Check your phone <strong style={{ color:"#0f172a" }}>+254 {mpesa.phone.slice(0,3)}***{mpesa.phone.slice(-2)}</strong><br/>
              Enter your M-Pesa PIN to authorize<br/>
              <strong style={{ color:"#0f172a", fontSize:"15px" }}>KES {parseInt(mpesa.amount||0).toLocaleString()}</strong>
            </p>
            <div style={{ marginTop:"16px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", backgroundColor:"#22c55e", animation:"pulse 1s ease-in-out infinite" }}/>
              <p style={{ fontSize:"11px", color:"#94a3b8" }}>Verifying authorization…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── 4. SMS OTP modal ───────────────────────────────────────────────────────
  const maskedPhone = payMethod === "mpesa"
    ? `+254 ${mpesa.phone.slice(0,3)}***${mpesa.phone.slice(-2)}`
    : "+XXX *** ***";

  const renderOtp = () => (
    <div style={T.modal("370px")}>
      <div style={{ padding:"28px 24px" }}>
        {/* Icon */}
        <div style={{ textAlign:"center", marginBottom:"16px" }}>
          <div style={{ width:"60px", height:"60px", borderRadius:"50%", backgroundColor:"#f0fdf4", border:"2px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
            <Shield size={28} color="#22c55e"/>
          </div>
        </div>
        <p style={{ fontWeight:800, fontSize:"18px", textAlign:"center", color:"#0f172a" }}>OTP Verification</p>
        <p style={{ fontSize:"12px", color:"#64748b", textAlign:"center", marginTop:"7px", lineHeight:"1.65" }}>
          We sent a 6-digit code via SMS to<br/>
          <strong style={{ color:"#0f172a", fontSize:"13px" }}>{maskedPhone}</strong>
        </p>
        {/* OTP digit boxes */}
        <div style={{ display:"flex", gap:"8px", margin:"24px 0 8px", justifyContent:"center" }}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => otpRefs.current[i] = el}
              maxLength={1}
              value={d}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKey(i, e)}
              style={{
                width:"44px", height:"54px", textAlign:"center",
                fontSize:"22px", fontWeight:700,
                borderRadius:"12px",
                border: d ? "2px solid #22c55e" : "1.5px solid #e2e8f0",
                backgroundColor: d ? "#f0fdf4" : "#fff",
                outline:"none", color:"#0f172a",
                transition:"border-color 0.15s, background-color 0.15s",
                fontFamily:"monospace",
              }}
            />
          ))}
        </div>
        {/* Timer / resend */}
        <div style={{ textAlign:"center", marginBottom:"20px", minHeight:"20px" }}>
          {otpTimer > 0
            ? <p style={{ fontSize:"12px", color:"#94a3b8" }}>Resend code in <strong style={{ color:"#0f172a" }}>{otpTimer}s</strong></p>
            : <button onClick={() => { setOtp(Array(6).fill("")); setOtpTimer(30); }}
                style={{ fontSize:"12px", color:"#22c55e", fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                Resend OTP
              </button>
          }
        </div>
        {/* Verify button */}
        <button onClick={handleVerify} disabled={loading || !canVerify}
          style={{ ...T.btn(), opacity:(loading||!canVerify)?0.55:1 }}>
          {loading
            ? <><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> Verifying…</>
            : <><Check size={14}/> Verify & Authorize</>}
        </button>
        <button onClick={reset} style={{ ...T.btn("#f1f5f9","#64748b"), marginTop:"10px" }}>Cancel</button>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", marginTop:"14px" }}>
          <Lock size={10} color="#94a3b8"/>
          <p style={{ fontSize:"10px", color:"#94a3b8" }}>This code expires in 10 minutes</p>
        </div>
      </div>
    </div>
  );

  // ── 5. Success modal ───────────────────────────────────────────────────────
  const renderSuccess = () => (
    <div style={T.modal("360px")}>
      <div style={{ padding:"36px 24px 28px", textAlign:"center" }}>
        <div style={{ width:"76px", height:"76px", borderRadius:"50%", backgroundColor:"#dcfce7", border:"3px solid #86efac", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
          <Check size={38} color="#22c55e"/>
        </div>
        <p style={{ fontWeight:800, fontSize:"19px", color:"#0f172a", marginBottom:"8px" }}>Payment Authorized!</p>
        <p style={{ fontSize:"13px", color:"#64748b", lineHeight:"1.65" }}>
          Your {payMethod === "mpesa" ? "M-Pesa" : "card"} payment of
        </p>
        <p style={{ fontWeight:800, fontSize:"26px", color:"#0f172a", margin:"6px 0 12px" }}>
          KES {parseInt(amount||0).toLocaleString()}
        </p>
        <p style={{ fontSize:"12px", color:"#64748b" }}>has been successfully authorized.</p>
        {/* Receipt */}
        <div style={{ margin:"20px 0", padding:"14px 16px", backgroundColor:"#f8fafc", borderRadius:"12px", border:"1px solid #f1f5f9", textAlign:"left", display:"flex", flexDirection:"column", gap:"8px" }}>
          {[
            { k:"Method",    v: payMethod === "mpesa" ? "M-Pesa STK Push" : "Credit / Debit Card" },
            { k:"Reference", v: txRef, mono:true },
            { k:"Date",      v: new Date().toLocaleString("en-KE", { dateStyle:"medium", timeStyle:"short" }) },
            { k:"Status",    v: "✓ Authorized", green:true },
          ].map(({ k, v, mono, green }) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"11px", color:"#94a3b8" }}>{k}</span>
              <span style={{ fontSize:"11px", fontWeight:600, color: green?"#22c55e":"#0f172a", fontFamily: mono?"monospace":"inherit" }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={reset} style={T.btn()}>Done</button>
      </div>
    </div>
  );

  // ── Dashboard Layout ───────────────────────────────────────────────────────
  return (
    <div style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", backgroundColor:"#eef3ee", fontFamily:"'Inter',system-ui,sans-serif", fontSize:"14px", color:"#0f172a" }}>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes bar     { from { width:0% } to { width:100% } }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
        input::placeholder { color:#cbd5e1; }
      `}</style>

      {/* Dashboard — dims + blurs behind modal */}
      <div style={{ display:"flex", height:"100%", transition:"filter 0.25s", filter: modal?"blur(1.5px) brightness(0.88)":"none", pointerEvents: modal?"none":"auto" }}>

        {/* SIDEBAR */}
        <aside style={{ width:"210px", flexShrink:0, backgroundColor:"#fff", borderRight:"1px solid #f1f5f9", display:"flex", flexDirection:"column", gap:"14px", padding:"20px 12px", overflowY:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"0 6px", marginBottom:"4px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"10px", backgroundColor:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#4ade80", fontWeight:800, fontSize:"11px" }}>F↑</span>
            </div>
            <span style={{ fontWeight:800, fontSize:"16px", letterSpacing:"-0.3px" }}>FINAI</span>
          </div>
          {NAV.map(({ group, items }) => (
            <div key={group}>
              <p style={{ fontSize:"9px", fontWeight:800, letterSpacing:"0.14em", color:"#94a3b8", marginBottom:"5px", paddingLeft:"8px" }}>{group}</p>
              {items.map(({ n, I }) => (
                <button key={n} onClick={() => setActive(n)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"12px", marginBottom:"1px", fontSize:"12px", fontWeight: active===n?600:400, backgroundColor: active===n?"#0f172a":"transparent", color: active===n?"#fff":"#6b7280", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                  <I size={13}/>{n}
                </button>
              ))}
            </div>
          ))}
          <div style={{ marginTop:"auto", borderRadius:"12px", border:"1px solid #e2e8f0", backgroundColor:"#f8fafc", padding:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"50%", backgroundColor:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={12} color="#fff"/></div>
              <span style={{ fontSize:"11px", fontWeight:600 }}>AI Assistant</span>
              <span style={{ marginLeft:"auto", width:"7px", height:"7px", borderRadius:"50%", backgroundColor:"#4ade80" }}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", backgroundColor:"#fff", borderRadius:"8px", border:"1px solid #e2e8f0", padding:"5px 8px", marginBottom:"7px" }}>
              <input placeholder="Ask me anything financ…" style={{ flex:1, border:"none", outline:"none", fontSize:"9px", color:"#94a3b8", backgroundColor:"transparent", fontFamily:"inherit" }}/>
              <Send size={10} color="#94a3b8"/>
            </div>
            <div style={{ display:"flex", gap:"5px" }}>
              {["Spending tips","Budget help"].map(t => (
                <button key={t} style={{ fontSize:"9px", color:"#475569", backgroundColor:"#fff", border:"1px solid #e2e8f0", borderRadius:"6px", padding:"3px 6px", cursor:"pointer", fontFamily:"inherit" }}>{t}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"linear-gradient(135deg,#fde68a,#fb923c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>😊</div>
              <div>
                <p style={{ fontWeight:700, fontSize:"14px", lineHeight:"1.3" }}>Welcome, Divine 👋</p>
                <p style={{ fontSize:"11px", color:"#94a3b8" }}>Here is your financial overview for today</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:"7px" }}>
              {[Search, Bell].map((Icon, i) => (
                <button key={i} style={{ width:"34px", height:"34px", borderRadius:"50%", backgroundColor:"#fff", border:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Icon size={14} color="#6b7280"/>
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard grid */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 24px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:"14px" }}>

              {/* Total Balance */}
              <div style={{ gridColumn:"span 4", backgroundColor:"#0f172a", borderRadius:"16px", padding:"18px 20px", color:"#fff" }}>
                <p style={{ fontSize:"11px", color:"#64748b", marginBottom:"10px", display:"flex", alignItems:"center", gap:"5px" }}>
                  Total Balance
                  <span style={{ width:"14px", height:"14px", borderRadius:"50%", border:"1px solid #475569", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"8px" }}>i</span>
                </p>
                <p style={{ fontWeight:800, fontSize:"26px", letterSpacing:"-0.5px", marginBottom:"10px" }}>
                  $2,450,800<span style={{ fontSize:"15px", fontWeight:600, color:"#64748b" }}>.50</span>
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:"3px", backgroundColor:"rgba(34,197,94,0.16)", color:"#4ade80", fontSize:"10px", fontWeight:600, padding:"3px 8px", borderRadius:"7px" }}>
                    <TrendingUp size={10}/> +5.2%
                  </span>
                  <span style={{ fontSize:"10px", color:"#475569" }}>vs last month</span>
                </div>
              </div>

              {/* 3 Stat cards */}
              <div style={{ gridColumn:"span 8", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
                {STATS.map(({ label, amt, cents, pct, up, dotBg, dotTc, pctColor }) => (
                  <div key={label} style={{ backgroundColor:"#fff", borderRadius:"16px", padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"10px", color:"#6b7280", marginBottom:"10px" }}>
                      <span style={{ width:"18px", height:"18px", borderRadius:"50%", backgroundColor:dotBg, color:dotTc, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"10px" }}>{up?"↑":"↓"}</span>
                      {label}
                    </div>
                    <p style={{ fontWeight:700, fontSize:"15px", marginBottom:"5px" }}>{amt}<span style={{ fontSize:"10px", fontWeight:600, color:"#94a3b8" }}>{cents}</span></p>
                    <p style={{ display:"flex", alignItems:"center", gap:"3px", fontSize:"10px", color:pctColor }}>
                      <TrendingUp size={10}/> {pct} <span style={{ color:"#94a3b8", fontWeight:400 }}>vs last month</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Spending Overview */}
              <div style={{ gridColumn:"span 7", backgroundColor:"#fff", borderRadius:"16px", padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                  <p style={{ fontWeight:600, fontSize:"13px" }}>Spending Overview</p>
                  <span style={{ fontSize:"10px", color:"#6b7280", border:"1px solid #e2e8f0", borderRadius:"8px", padding:"3px 8px" }}>This Week ▾</span>
                </div>
                <p style={{ fontWeight:700, fontSize:"22px", marginBottom:"14px" }}>$215,800<span style={{ fontSize:"12px", fontWeight:600, color:"#94a3b8" }}>.19</span></p>
                <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                  <div style={{ position:"relative", width:"118px", height:"118px", flexShrink:0 }}>
                    <PieChart width={118} height={118}>
                      <Pie data={SPEND} cx={59} cy={59} innerRadius={38} outerRadius={55} startAngle={90} endAngle={-270} dataKey="value" stroke="#fff" strokeWidth={2}>
                        {SPEND.map((e,i) => <Cell key={i} fill={e.color}/>)}
                      </Pie>
                    </PieChart>
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", pointerEvents:"none" }}>
                      <span style={{ fontSize:"7px", color:"#94a3b8" }}>Top Category</span>
                      <span style={{ fontSize:"9px", fontWeight:700 }}>Food &</span>
                      <span style={{ fontSize:"9px", fontWeight:700 }}>Dining</span>
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:"7px" }}>
                    {SPEND.map(({ name, value, color, pct }) => (
                      <div key={name} style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"10px" }}>
                        <span style={{ width:"7px", height:"7px", borderRadius:"50%", backgroundColor:color, flexShrink:0 }}/>
                        <span style={{ flex:1, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</span>
                        <span style={{ fontWeight:600 }}>${value}</span>
                        <span style={{ color:"#94a3b8", width:"26px", textAlign:"right" }}>{pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ gridColumn:"span 5", display:"flex", flexDirection:"column", gap:"14px" }}>
                {/* AI Insight */}
                <div style={{ borderRadius:"16px", backgroundColor:"#14532d", padding:"18px", color:"#fff", position:"relative", overflow:"hidden" }}>
                  <div style={{ display:"flex", gap:"10px" }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"9px", backgroundColor:"rgba(74,222,128,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Zap size={15} color="#4ade80"/>
                    </div>
                    <div>
                      <p style={{ fontSize:"10px", color:"#4ade80", fontWeight:600, marginBottom:"5px" }}>🤖 AI Smart Insight</p>
                      <p style={{ fontSize:"12px", color:"#d1fae5", lineHeight:"1.5", marginBottom:"12px" }}>You Spent 32% more on food this week. Want tips to reduce it?</p>
                      <button style={{ backgroundColor:"#22c55e", color:"#fff", border:"none", borderRadius:"10px", padding:"7px 14px", fontSize:"11px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>View Suggestions</button>
                    </div>
                  </div>
                  <div style={{ position:"absolute", bottom:"-18px", right:"-10px", fontSize:"58px", opacity:0.07 }}>💡</div>
                </div>

                {/* Quick Actions — Send Money & Add Funds now open payment flows */}
                <div style={{ backgroundColor:"#fff", borderRadius:"16px", padding:"14px", flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:"12px", marginBottom:"10px" }}>Quick Actions</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"4px" }}>
                    {[
                      { icon:"→", label:"Send Money",   bg:"#dcfce7", fg:"#16a34a", action:()=>setModal("pay-method") },
                      { icon:"M",  label:"M-Pesa",       bg:"#e6f7ee", fg:"#00A651", action:()=>{ setPayMethod("mpesa"); setModal("mpesa"); } },
                      { icon:"+", label:"Add Funds",    bg:"#f1f5f9", fg:"#334155", action:()=>{ setPayMethod("card");  setModal("card");  } },
                      { icon:"↓", label:"Receive",      bg:"#f1f5f9", fg:"#334155", action:null },
                    ].map(({ icon, label, bg, fg, action }) => (
                      <button key={label} onClick={action||undefined}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", padding:"6px 2px", borderRadius:"10px", background:"transparent", border:"none", cursor:action?"pointer":"default", opacity:action?1:0.55, fontFamily:"inherit" }}>
                        <div style={{ width:"36px", height:"36px", borderRadius:"10px", backgroundColor:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:label==="M-Pesa"?"13px":"16px", fontWeight: label==="M-Pesa"?900:600, color:fg }}>
                          {icon}
                        </div>
                        <span style={{ fontSize:"8px", color:"#6b7280", textAlign:"center", lineHeight:"1.3" }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div style={{ gridColumn:"span 7", backgroundColor:"#fff", borderRadius:"16px", padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <p style={{ fontWeight:600, fontSize:"12px" }}>AI Recommendations</p>
                  <button style={{ fontSize:"10px", color:"#22c55e", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>View All</button>
                </div>
                <div style={{ display:"flex", gap:"10px" }}>
                  {RECS.map(({ e, title, desc }) => (
                    <div key={title} style={{ flex:1, backgroundColor:"#f8fafc", borderRadius:"10px", padding:"10px", cursor:"pointer" }}>
                      <span style={{ fontSize:"20px" }}>{e}</span>
                      <p style={{ fontWeight:600, fontSize:"10px", marginTop:"7px", marginBottom:"2px" }}>{title}</p>
                      <p style={{ fontSize:"9px", color:"#94a3b8" }}>{desc}</p>
                    </div>
                  ))}
                  <button style={{ width:"28px", height:"28px", borderRadius:"50%", backgroundColor:"#f1f5f9", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, alignSelf:"center", fontSize:"14px" }}>›</button>
                </div>
              </div>

              {/* Recent Transactions */}
              <div style={{ gridColumn:"span 5", backgroundColor:"#fff", borderRadius:"16px", padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <p style={{ fontWeight:600, fontSize:"12px" }}>Recent Transactions</p>
                  <button style={{ fontSize:"10px", color:"#22c55e", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>View All</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
                  {TXS.map(({ e, name, time, amt, pos }) => (
                    <div key={name} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"32px", height:"32px", borderRadius:"9px", backgroundColor:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", flexShrink:0 }}>{e}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:500, fontSize:"11px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                        <p style={{ fontSize:"9px", color:"#94a3b8" }}>{time}</p>
                      </div>
                      <span style={{ fontWeight:700, fontSize:"12px", color: pos?"#22c55e":"#ef4444", flexShrink:0 }}>{amt}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL OVERLAY ──────────────────────────────────────────────────── */}
      {modal && (
        <div style={T.overlay} onClick={e => { if (e.target === e.currentTarget) reset(); }}>
          {modal === "pay-method" && renderPayMethod()}
          {modal === "card"       && renderCard()     }
          {modal === "mpesa"      && renderMpesa()    }
          {modal === "otp"        && renderOtp()      }
          {modal === "success"    && renderSuccess()  }
        </div>
      )}
    </div>
  );
}
