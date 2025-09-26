import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/* ===== Types ===== */
type Tab = "petunjuk" | "media" | "guru" | "kosp" | "kelas";
type KelasNum = 1 | 2 | 3 | 4 | 5 | 6;

interface Post { id: string; text: string; media?: string; time: string; }
interface Teacher { id: string; name: string; photo?: string; profile?: string; }
interface Student { id: string; name: string; photo?: string; profile?: string; }
interface AppData {
  posts: Post[];
  teachers: Teacher[];
  visi: string;
  misi: string;
  deskripsi: string;
  students: Record<KelasNum, Student[]>;
}

/* ===== Helper ===== */
const uid = () => Math.random().toString(36).slice(2, 9);
const save = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));
const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; }
  catch { return d; }
};

export default function App() {
  /* ===== Data utama ===== */
  const [tab, setTab] = useState<Tab>("petunjuk");
  const [data, setData] = useState<AppData>(() =>
    load<AppData>("appData", {
      posts: [],
      teachers: [],
      visi: "",
      misi: "",
      deskripsi: "",
      students: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    })
  );
  useEffect(() => save("appData", data), [data]);

  /* ===== Logo Sekolah ===== */
  const [logo, setLogo] = useState<string | undefined>(() => {
    const v = localStorage.getItem("logo");
    return v || undefined;
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  useEffect(() => { if (logo) localStorage.setItem("logo", logo); }, [logo]);

  /* ===== Auth (Login / Logout) ===== */
  type Role = "admin" | "guru";
  interface SessionUser { role: Role; name: string; }
  const [user, setUser] = useState<SessionUser | null>(() => load("sessionUser", null));
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<Role>("admin");

  // kredensial sederhana (MVP)
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";
  const GURU_PASS  = "guru123";

  const loginAdmin = (username: string, password: string) => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const ses = { role: "admin" as Role, name: "Administrator" };
      setUser(ses); save("sessionUser", ses); setShowAuth(false);
      alert("Login admin berhasil");
    } else {
      alert("Username/Password admin salah");
    }
  };

  const loginGuru = (nama: string, password: string) => {
    if (!nama.trim()) return alert("Nama guru wajib diisi");
    if (password !== GURU_PASS) return alert("Password guru salah");
    const ses = { role: "guru" as Role, name: nama.trim() };
    setUser(ses); save("sessionUser", ses); setShowAuth(false);
    alert("Login guru berhasil");
  };

  const logout = () => { setUser(null); localStorage.removeItem("sessionUser"); };

  const canEdit  = !!user && (user.role === "admin" || user.role === "guru"); // boleh posting
  const canAdmin = !!user && user.role === "admin";                           // boleh edit KOSP

  /* ===== Composer (Posting) ===== */
  const [text, setText] = useState("");
  const mediaRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<string | undefined>();
  const handlePickMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setMedia(String(r.result)); r.readAsDataURL(f);
  };
  const postNow = () => {
    if (!text.trim() && !media) return;
    setData(d => ({
      ...d,
      posts: [{ id: uid(), text: text.trim(), media, time: new Date().toISOString() }, ...d.posts]
    }));
    setText(""); setMedia(undefined);
  };

  /* ===== Guru ===== */
  const [gName, setGName] = useState("");
  const [gPhoto, setGPhoto] = useState<string | undefined>();
  const [gProfile, setGProfile] = useState("");
  const gPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setGPhoto(String(r.result)); r.readAsDataURL(f);
  };
  const addTeacher = () => {
    if (!gName.trim()) return;
    setData(d => ({
      ...d,
      teachers: [...d.teachers, { id: uid(), name: gName.trim(), photo: gPhoto, profile: gProfile.trim() }]
    }));
    setGName(""); setGPhoto(undefined); setGProfile("");
  };

  /* ===== Kelas & Siswa ===== */
  const [kelas, setKelas] = useState<KelasNum>(1);
  const [sName, setSName] = useState("");
  const [sPhoto, setSPhoto] = useState<string | undefined>();
  const [sProfile, setSProfile] = useState("");
  const sPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; const r = new FileReader();
    r.onload = () => setSPhoto(String(r.result)); r.readAsDataURL(f);
  };
  const addStudent = () => {
    if (!sName.trim()) return;
    setData(d => ({
      ...d,
      students: {
        ...d.students,
        [kelas]: [...d.students[kelas], { id: uid(), name: sName.trim(), photo: sPhoto, profile: sProfile.trim() }]
      }
    }));
    setSName(""); setSPhoto(undefined); setSProfile("");
  };

  return (
    <div className="wrap">
      {/* ===== Header ===== */}
      <header className="brandbar">
        <div className="brand-left" onClick={() => logoInputRef.current?.click()}>
          {logo ? <img src={logo} alt="Logo Sekolah" /> : <div className="logo-placeholder">Upload Logo</div>}
          <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={pickLogo}/>
        </div>
        <div className="brand-text">
          <div className="line1">DINAS PENDIDIKAN NAGAN RAYA</div>
          <div className="line2">SD NEGERI SEUMAMBEK</div>
        </div>
      </header>

      {/* ===== Auth Bar ===== */}
      <div className="authbar">
        {user ? (
          <>
            <span className="welcome">Masuk sebagai <b>{user.name}</b> ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => setShowAuth(true)}>Login</button>
        )}
      </div>

      {/* ===== Nav ===== */}
      <nav className="topnav">
        <div className="arrow" onClick={() => setTab("petunjuk")} title="Kembali ke Beranda">➜</div>
        <button className={tab==="media"?"on":""} onClick={()=>setTab("media")}>MEDIA</button>
        <button className={tab==="guru" ?"on":""} onClick={()=>setTab("guru") }>GURU</button>
        <button className={tab==="kosp" ?"on":""} onClick={()=>setTab("kosp") }>KOSP</button>
        <button className={tab==="kelas"?"on":""} onClick={()=>setTab("kelas")}>KELAS</button>
      </nav>

      {/* ===== Content ===== */}
      <main className="content">
        {/* Beranda / Composer */}
        {tab === "petunjuk" && (
          <>
            <div className="composer">
              <div className="composer-title">Tuliskan.....</div>
              <textarea
                className="composer-input"
                placeholder={canEdit ? "Tulis pengumuman/berita di sini…" : "Login sebagai guru/admin untuk membuat postingan"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!canEdit}
              />
              {media && (
                <div className="preview">
                  {media.startsWith("data:video") ? <video src={media} controls/> : <img src={media} alt="preview"/>}
                </div>
              )}
              <div className="composer-actions">
                <button className="ghost" onClick={() => mediaRef.current?.click()} disabled={!canEdit}>📷</button>
                <button className="post"  onClick={postNow} disabled={!canEdit}>Postingan</button>
                <input ref={mediaRef} type="file" accept="image/*,video/*" hidden onChange={handlePickMedia}/>
              </div>
            </div>

            <div className="feed">
              {data.posts.length === 0 && <p className="muted">Belum ada postingan.</p>}
              {data.posts.map((p) => (
                <div key={p.id} className="post">
                  <div className="when">{new Date(p.time).toLocaleString()}</div>
                  {p.text && <p>{p.text}</p>}
                  {p.media && (p.media.startsWith("data:video") ? <video src={p.media} controls/> : <img src={p.media} alt="media"/>)}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Media (feed) */}
        {tab === "media" && (
          <div className="feed">
            <h2>Media</h2>
            {data.posts.length === 0 && <p className="muted">Belum ada media.</p>}
            {data.posts.map((p) => (
              <div key={p.id} className="post">
                <div className="when">{new Date(p.time).toLocaleString()}</div>
                {p.text && <p>{p.text}</p>}
                {p.media && (p.media.startsWith("data:video") ? <video src={p.media} controls/> : <img src={p.media} alt="media"/>)}
              </div>
            ))}
          </div>
        )}

        {/* Guru */}
        {tab === "guru" && (
          <div className="card">
            <h2>Data Guru</h2>
            <div className="flex wrap gap">
              <div className="photoPick" onClick={() => document.getElementById("gPick")?.click()}>
                {gPhoto ? <img src={gPhoto} alt="guru" /> : <span>Foto</span>}
                <input id="gPick" type="file" accept="image/*" hidden onChange={gPick}/>
              </div>
              <input className="input" placeholder="Nama guru" value={gName} onChange={(e)=>setGName(e.target.value)} />
              <input className="input" placeholder="Profil singkat (mapel, gelar, dll.)" value={gProfile} onChange={(e)=>setGProfile(e.target.value)} />
              <button onClick={addTeacher}>Tambahkan</button>
            </div>

            <div className="grid3">
              {data.teachers.map((t) => (
                <div className="teacher" key={t.id}>
                  <div className="photo">{t.photo ? <img src={t.photo} alt="t"/> : <span>Foto</span>}</div>
                  <div className="tname">{t.name}</div>
                  {t.profile && <div className="muted small">{t.profile}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KOSP */}
        {tab === "kosp" && (
          <div className="card">
            <h2>KOSP — Visi & Misi</h2>
            <label className="lbl">Deskripsi / Story Sekolah</label>
            <textarea className="input area" value={data.deskripsi} onChange={(e)=>setData({...data, deskripsi:e.target.value})} disabled={!canAdmin}/>
            <label className="lbl">Visi</label>
            <textarea className="input area" value={data.visi} onChange={(e)=>setData({...data, visi:e.target.value})} disabled={!canAdmin}/>
            <label className="lbl">Misi</label>
            <textarea className="input area" value={data.misi} onChange={(e)=>setData({...data, misi:e.target.value})} disabled={!canAdmin}/>

            <div className="kosp-preview">
              <h3>Pratinjau</h3>
              <p>{data.deskripsi || "Belum ada deskripsi."}</p>
              <h4>Visi</h4>
              <p>{data.visi || "—"}</p>
              <h4>Misi</h4>
              <p className="preline">{data.misi || "—"}</p>
              {!canAdmin && <p className="muted small">* Login sebagai admin untuk mengubah KOSP.</p>}
            </div>
          </div>
        )}

        {/* Kelas */}
        {tab === "kelas" && (
          <div className="card">
            <h2>Kelas</h2>
            <div className="kelas-icons">
              {[1,2,3,4,5,6].map((k) => (
                <button key={k} className={`kelasIcon ${k===kelas?"on":""}`} onClick={() => setKelas(k as KelasNum)}>{k}</button>
              ))}
            </div>

            <div className="flex wrap gap top">
              <div className="photoPick" onClick={() => document.getElementById("sPick")?.click()}>
                {sPhoto ? <img src={sPhoto} alt="s"/> : <span>Foto</span>}
                <input id="sPick" type="file" accept="image/*" hidden onChange={sPick} />
              </div>
              <input className="input" placeholder={`Nama siswa Kelas ${kelas}`} value={sName} onChange={(e)=>setSName(e.target.value)} />
              <input className="input" placeholder="Profil singkat siswa (opsional)" value={sProfile} onChange={(e)=>setSProfile(e.target.value)}/>
              <button onClick={addStudent}>Tambahkan</button>
            </div>

            <div className="grid3">
              {data.students[kelas].map((s) => (
                <div className="student" key={s.id}>
                  <div className="photo">{s.photo ? <img src={s.photo} alt="s"/> : <span>Foto</span>}</div>
                  <div className="tname">{s.name}</div>
                  {s.profile && <div className="muted small">{s.profile}</div>}
                </div>
              ))}
              {data.students[kelas].length === 0 && <p className="muted">Belum ada siswa di Kelas {kelas}.</p>}
            </div>
          </div>
        )}
      </main>

      {/* ===== Modal Login ===== */}
      {showAuth && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-head">
              <div className={`tab ${authTab==="admin"?"on":""}`} onClick={()=>setAuthTab("admin")}>Admin</div>
              <div className={`tab ${authTab==="guru" ?"on":""}`} onClick={()=>setAuthTab("guru") }>Guru</div>
              <button className="close" onClick={()=>setShowAuth(false)}>✕</button>
            </div>
            {authTab === "admin" ? <AdminForm onSubmit={loginAdmin}/> : <GuruForm onSubmit={loginGuru}/>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Form Components ====== */
function AdminForm({ onSubmit }: { onSubmit: (u: string, p: string) => void }) {
  const [u, setU] = useState(""), [p, setP] = useState("");
  return (
    <div className="form">
      <input className="input" placeholder="Username admin" value={u} onChange={e=>setU(e.target.value)}/>
      <input className="input" type="password" placeholder="Password admin" value={p} onChange={e=>setP(e.target.value)}/>
      <button onClick={()=>onSubmit(u,p)}>Login Admin</button>
    </div>
  );
}
function GuruForm({ onSubmit }: { onSubmit: (n: string, p: string) => void }) {
  const [n, setN] = useState(""), [p, setP] = useState("");
  return (
    <div className="form">
      <input className="input" placeholder="Nama guru" value={n} onChange={e=>setN(e.target.value)}/>
      <input className="input" type="password" placeholder="Password guru" value={p} onChange={e=>setP(e.target.value)}/>
      <button onClick={()=>onSubmit(n,p)}>Login Guru</button>
    </div>
  );
}
