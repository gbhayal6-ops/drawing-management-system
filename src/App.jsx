import { useState, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   ROLE DEFINITIONS  — capabilities per role
═══════════════════════════════════════════════════════════════════ */
const ROLE_DEFS = {
  Admin: {
    label: "Administrator",
    color: "#F43F5E",
    bg: "#F43F5E18",
    icon: "👑",
    desc: "Full system access. Manage users, roles, all drawings.",
    can: { upload: true, editDrawing: true, deleteDrawing: true, viewAll: true, manageUsers: true, transmit: true },
  },
  "Lead Engineer": {
    label: "Lead Engineer",
    color: "#3B82F6",
    bg: "#3B82F618",
    icon: "🔷",
    desc: "Upload, edit, delete drawings. Send transmittals.",
    can: { upload: true, editDrawing: true, deleteDrawing: true, viewAll: true, manageUsers: false, transmit: true },
  },
  Engineer: {
    label: "Engineer",
    color: "#10B981",
    bg: "#10B98118",
    icon: "🟢",
    desc: "Upload and edit drawings. Cannot delete.",
    can: { upload: true, editDrawing: true, deleteDrawing: false, viewAll: true, manageUsers: false, transmit: true },
  },
  Reviewer: {
    label: "Reviewer",
    color: "#F59E0B",
    bg: "#F59E0B18",
    icon: "🟡",
    desc: "View and comment on drawings only.",
    can: { upload: false, editDrawing: false, deleteDrawing: false, viewAll: true, manageUsers: false, transmit: false },
  },
  Viewer: {
    label: "Viewer",
    color: "#6B7280",
    bg: "#6B728018",
    icon: "⚪",
    desc: "Read-only access to approved drawings.",
    can: { upload: false, editDrawing: false, deleteDrawing: false, viewAll: false, manageUsers: false, transmit: false },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   INITIAL STATE — only Admin credential exists by default
═══════════════════════════════════════════════════════════════════ */
const ADMIN_SEED = {
  id: "admin-001",
  name: "System Administrator",
  email: "admin@drawvault.com",
  password: "Admin@1234",
  role: "Admin",
  department: "IT",
  status: "Active",
  createdAt: "2026-01-01",
  lastLogin: null,
};

const SEED_DRAWINGS = [
  { id: 1, number: "CIV-001-C", title: "Foundation Layout – Block A",   rev: "C", status: "IFC",        discipline: "Civil",        project: "Tower Alpha",   author: "admin@drawvault.com", modified: "2026-05-28", size: "2.4 MB", format: "PDF", tags: ["foundation","block-a"], comments: [] },
  { id: 2, number: "STR-002-B", title: "Steel Frame – Levels 3 to 6",   rev: "B", status: "IFR",        discipline: "Structural",   project: "Tower Alpha",   author: "admin@drawvault.com", modified: "2026-05-27", size: "5.1 MB", format: "DWG", tags: ["steel","levels"],       comments: [] },
  { id: 3, number: "HVC-003-A", title: "HVAC Ductwork – Floor 2",        rev: "A", status: "IFA",        discipline: "HVAC",         project: "Riverside Mall",author: "admin@drawvault.com", modified: "2026-05-25", size: "1.8 MB", format: "PDF", tags: ["hvac","floor-2"],      comments: [] },
  { id: 4, number: "ELE-004-D", title: "Electrical Distribution Board",  rev: "D", status: "As-Built",   discipline: "Electrical",   project: "Riverside Mall",author: "admin@drawvault.com", modified: "2026-05-20", size: "3.3 MB", format: "PDF", tags: ["electrical"],           comments: [] },
  { id: 5, number: "PIP-005-A", title: "Piping Isometric – Section 4B",  rev: "A", status: "IFC",        discipline: "Piping",       project: "Refinery X",    author: "admin@drawvault.com", modified: "2026-05-18", size: "4.7 MB", format: "DXF", tags: ["piping","iso"],         comments: [] },
];

const DISCIPLINES = ["Civil","Structural","Mechanical","Electrical","Piping","HVAC","Architecture"];
const STATUSES    = ["IFR","IFC","IFA","As-Built","Superseded","Void"];
const FORMATS     = ["PDF","DWG","DXF","PNG","XLSX"];
const REVISIONS   = ["A","B","C","D","E","F","G","H","IFC","0","1","2","3"];
const PROJECTS    = ["Tower Alpha","Riverside Mall","Refinery X","Harbor Bridge","Metro Station 7"];
const DEPARTMENTS = ["Engineering","Architecture","MEP","IT","Management","QA","Procurement"];

const STATUS_META = {
  IFR:        { color: "#F59E0B", bg: "#F59E0B18" },
  IFC:        { color: "#10B981", bg: "#10B98118" },
  IFA:        { color: "#3B82F6", bg: "#3B82F618" },
  "As-Built": { color: "#8B5CF6", bg: "#8B5CF618" },
  Superseded: { color: "#6B7280", bg: "#6B728018" },
  Void:       { color: "#EF4444", bg: "#EF444418" },
};
const DISC_ICON = { Civil:"🏗", Structural:"🔩", Mechanical:"⚙️", Electrical:"⚡", Piping:"🔧", HVAC:"💨", Architecture:"🏛" };

/* ═══════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── Auth state ── */
  const [authed,   setAuthed]   = useState(false);
  const [session,  setSession]  = useState(null);          // logged-in user object
  const [users,    setUsers]    = useState([ADMIN_SEED]);   // user registry

  /* ── App state ── */
  const [page,     setPage]     = useState("dashboard");
  const [drawings, setDrawings] = useState(SEED_DRAWINGS);
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [upload,   setUpload]   = useState(false);
  const [sidebar,  setSidebar]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filters,  setFilters]  = useState({ discipline:"All", status:"All", project:"All" });
  const [sort,     setSort]     = useState("modified_desc");
  const [viewMode, setViewMode] = useState("table");

  const can = (perm) => ROLE_DEFS[session?.role]?.can[perm] ?? false;

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3400);
  };
  const ask = (msg, onOk) => setConfirm({ msg, onOk });

  /* ── AUTH ── */
  const handleLogin = async (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return "Invalid email or password.";
    if (found.status === "Inactive") return "Your account is deactivated. Contact the administrator.";
    const updated = { ...found, lastLogin: today() };
    setUsers(prev => prev.map(u => u.id === found.id ? updated : u));
    setSession(updated);
    setAuthed(true);
    flash(`Welcome back, ${found.name.split(" ")[0]} 👋`);
    return null;
  };

  const handleLogout = () => {
    setAuthed(false); setSession(null); setSelected(null); setPage("dashboard");
    flash("Signed out successfully", "info");
  };

  /* ── USER MANAGEMENT (Admin only) ── */
  const addUser = (u) => {
    const newUser = { ...u, id: `usr-${Date.now()}`, createdAt: today(), lastLogin: null, status: "Active" };
    setUsers(prev => [...prev, newUser]);
    flash(`User "${u.name}" created successfully 👤`);
  };

  const updateUser = (id, patch) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
    flash("User updated ✓");
  };

  const deleteUser = (id) => {
    if (id === session.id) { flash("Cannot delete your own account.", "error"); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
    flash("User removed", "warn");
  };

  const toggleUserStatus = (id) => {
    if (id === session.id) { flash("Cannot deactivate your own account.", "error"); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
  };

  /* ── DRAWINGS CRUD ── */
  const addDrawing = (d) => {
    setDrawings(prev => [{ ...d, id: Date.now(), modified: today(), comments: [], author: session.email }, ...prev]);
    flash("Drawing uploaded to SharePoint 📤");
  };
  const updateDrawing = (id, patch) => {
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...patch, modified: today() } : d));
    if (selected?.id === id) setSelected(p => ({ ...p, ...patch }));
    flash("Drawing updated ✓");
  };
  const deleteDrawing = (id) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) setSelected(null);
    flash("Drawing deleted", "warn");
  };
  const addComment = (id, text) => {
    const c = { user: session.name, text, date: today() };
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, comments: [...d.comments, c] } : d));
    setSelected(p => ({ ...p, comments: [...p.comments, c] }));
  };

  /* ── Filtered drawings ── */
  const visibleDrawings = drawings
    .filter(d => {
      // Viewer: only sees IFC drawings
      if (session?.role === "Viewer" && d.status !== "IFC") return false;
      const q = search.toLowerCase();
      const matchQ = !q || d.title.toLowerCase().includes(q) || d.number.toLowerCase().includes(q);
      const matchD = filters.discipline === "All" || d.discipline === filters.discipline;
      const matchS = filters.status     === "All" || d.status     === filters.status;
      const matchP = filters.project    === "All" || d.project    === filters.project;
      return matchQ && matchD && matchS && matchP;
    })
    .sort((a,b) => {
      if (sort === "modified_desc") return new Date(b.modified) - new Date(a.modified);
      if (sort === "modified_asc")  return new Date(a.modified) - new Date(b.modified);
      if (sort === "number_asc")    return a.number.localeCompare(b.number);
      if (sort === "title_asc")     return a.title.localeCompare(b.title);
      return 0;
    });

  const nav = (pg) => { setPage(pg); setSelected(null); };

  /* ── NAV ITEMS based on role ── */
  const navItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "drawings",  icon: "⊟", label: "Drawing Register" },
    ...(can("transmit") ? [{ id: "transmittals", icon: "✉", label: "Transmittals" }] : []),
    ...(can("manageUsers") ? [{ id: "users", icon: "👥", label: "User Management" }] : []),
    { id: "admin",     icon: "⚙", label: can("manageUsers") ? "System Settings" : "My Settings" },
  ];

  const stats = {
    total:    drawings.length,
    ifc:      drawings.filter(d => d.status === "IFC").length,
    ifr:      drawings.filter(d => d.status === "IFR").length,
    projects: new Set(drawings.map(d => d.project)).size,
    users:    users.filter(u => u.status === "Active").length,
  };

  /* ── RENDER ── */
  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={S.root}>
      <style>{GCSS}</style>

      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDlg msg={confirm.msg} onOk={() => { confirm.onOk(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
      {upload  && <UploadModal disciplines={DISCIPLINES} statuses={STATUSES} formats={FORMATS} revisions={REVISIONS} projects={PROJECTS} session={session} onClose={() => setUpload(false)} onSubmit={d => { addDrawing(d); setUpload(false); }} />}

      <div style={S.shell}>
        <Sidebar open={sidebar} setOpen={setSidebar} page={page} nav={nav} session={session} navItems={navItems} onLogout={handleLogout} stats={stats} />

        <div style={S.mainWrap}>
          <Topbar
            title={selected ? selected.number : (navItems.find(n=>n.id===page)?.label || "Dashboard")}
            sub={selected ? selected.title : `Logged in as ${session.name} · ${session.role}`}
            onUpload={can("upload") ? () => setUpload(true) : null}
            search={search} setSearch={setSearch}
            showSearch={!selected && page === "drawings"}
            role={session.role}
          />

          <div style={S.content}>
            {selected ? (
              <DetailView drawing={selected} onBack={() => setSelected(null)}
                onUpdate={can("editDrawing") ? updateDrawing : null}
                onDelete={can("deleteDrawing") ? (id) => ask("Permanently delete this drawing?", () => { deleteDrawing(id); setSelected(null); }) : null}
                onComment={addComment} session={session} statuses={STATUSES} />
            ) : page === "dashboard" ? (
              <Dashboard stats={stats} drawings={drawings} session={session} onOpen={setSelected} onViewAll={() => nav("drawings")} users={users} />
            ) : page === "drawings" ? (
              <DrawingList drawings={visibleDrawings} total={drawings.length}
                filters={filters} setFilters={setFilters}
                sort={sort} setSort={setSort}
                viewMode={viewMode} setViewMode={setViewMode}
                onOpen={setSelected}
                onDelete={can("deleteDrawing") ? (d) => ask(`Delete "${d.number}"?`, () => deleteDrawing(d.id)) : null}
                onUpload={can("upload") ? () => setUpload(true) : null}
                canUpload={can("upload")} />
            ) : page === "transmittals" ? (
              <TransmittalsView drawings={drawings} session={session} flash={flash} />
            ) : page === "users" && can("manageUsers") ? (
              <UserManagement users={users} session={session}
                onAdd={addUser} onUpdate={updateUser} onDelete={(id) => ask("Remove this user?", () => deleteUser(id))}
                onToggleStatus={toggleUserStatus} flash={flash} />
            ) : page === "admin" ? (
              <SettingsView session={session} can={can} users={users} drawings={drawings} onUpdateSelf={(patch) => { setSession(p=>({...p,...patch})); updateUser(session.id, patch); }} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOGIN SCREEN — email + password, no preset user selection
═══════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true); setError("");
    await delay(700);
    const err = await onLogin(email.trim().toLowerCase(), password);
    if (err) { setError(err); setLoading(false); }
  };

  return (
    <div style={S.loginPage}>
      <div style={S.loginGlow} />
      <div style={S.loginCard}>
        {/* Brand */}
        <div style={S.loginBrand}>
          <span style={S.loginIcon}>⊞</span>
          <span style={S.loginBrandName}>DrawVault</span>
        </div>
        <p style={S.loginSub}>Engineering Drawing Management System</p>
        <div style={S.loginDivider} />

        {/* Form */}
        <div style={S.loginForm}>
          <div style={S.loginFieldGroup}>
            <label style={S.loginLbl}>Email Address</label>
            <input style={S.loginInput}
              type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
          </div>

          <div style={S.loginFieldGroup}>
            <label style={S.loginLbl}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...S.loginInput, paddingRight: 40 }}
                type={showPass ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} />
              <button style={S.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div style={S.loginError}>
              ⚠ {error}
            </div>
          )}

          <button style={{ ...S.msBtn, marginTop: 4 }} onClick={submit} disabled={loading}>
            <MsLogo />
            {loading ? "Signing in…" : "Sign in with Microsoft SSO"}
          </button>
        </div>

        {/* Hint box */}
        <div style={S.loginHint}>
          <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 700, marginBottom: 6 }}>
            🔑 Default Admin Credentials
          </div>
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
            Email: <span style={{ color: "#7DD3FC" }}>admin@drawvault.com</span><br />
            Password: <span style={{ color: "#7DD3FC" }}>Admin@1234</span><br />
            <span style={{ color: "#475569", fontSize: 11 }}>Change credentials after first login.</span>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 14 }}>
          Secured by Azure Active Directory · SharePoint Integration
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   USER MANAGEMENT (Admin only)
═══════════════════════════════════════════════════════════════════ */
function UserManagement({ users, session, onAdd, onUpdate, onDelete, onToggleStatus, flash }) {
  const [showAdd,   setShowAdd]   = useState(false);
  const [editing,   setEditing]   = useState(null);   // user object being edited
  const [searchQ,   setSearchQ]   = useState("");

  const visible = users.filter(u =>
    !searchQ || u.name.toLowerCase().includes(searchQ.toLowerCase()) || u.email.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input style={{ ...S.topSearch, flex: 1, minWidth: 200 }} placeholder="Search users…"
          value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <button style={S.btnPrimary} onClick={() => setShowAdd(true)}>+ Add New User</button>
      </div>

      {/* Role legend */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(ROLE_DEFS).map(([role, def]) => (
          <div key={role} style={{ background: def.bg, border: `1px solid ${def.color}44`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>{def.icon}</span>
            <span style={{ fontSize: 11, color: def.color, fontWeight: 700 }}>{role}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span>Registered Users <span style={{ color: "#64748B", fontWeight: 400 }}>({users.length} total, {users.filter(u=>u.status==="Active").length} active)</span></span>
        </div>
        <table style={S.tbl}>
          <thead>
            <tr>
              {["User","Email","Role","Department","Status","Last Login","Created","Actions"].map(h =>
                <th key={h} style={S.th}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map(u => {
              const rd = ROLE_DEFS[u.role] || ROLE_DEFS.Viewer;
              const isSelf = u.id === session.id;
              return (
                <tr key={u.id} style={S.trow}>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Av name={u.name} size={30} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{u.name}</div>
                        {isSelf && <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 600 }}>● You</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "#7DD3FC" }}>{u.email}</td>
                  <td style={S.td}>
                    <span style={{ background: rd.bg, color: rd.color, border: `1px solid ${rd.color}44`, padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {rd.icon} {u.role}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: "#94A3B8" }}>{u.department || "—"}</td>
                  <td style={S.td}>
                    <button style={{ ...S.statusToggle, color: u.status === "Active" ? "#10B981" : "#EF4444", borderColor: u.status === "Active" ? "#10B981" : "#EF4444", background: u.status === "Active" ? "#10B98118" : "#EF444418" }}
                      onClick={() => onToggleStatus(u.id)} disabled={isSelf}>
                      {u.status === "Active" ? "✓ Active" : "✗ Inactive"}
                    </button>
                  </td>
                  <td style={{ ...S.td, color: "#64748B", fontSize: 12 }}>{u.lastLogin || "Never"}</td>
                  <td style={{ ...S.td, color: "#64748B", fontSize: 12 }}>{u.createdAt}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.iconActionBtn} title="Edit user" onClick={() => setEditing(u)}>✏️</button>
                      {!isSelf && (
                        <button style={{ ...S.iconActionBtn, color: "#EF4444" }} title="Delete user" onClick={() => onDelete(u.id)}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && <div style={S.empty}><div>👤</div><div style={{ marginTop: 8, color: "#94A3B8" }}>No users found</div></div>}
      </div>

      {/* Add user modal */}
      {showAdd && (
        <UserFormModal
          title="Add New User"
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => { onAdd(data); setShowAdd(false); }}
        />
      )}

      {/* Edit user modal */}
      {editing && (
        <UserFormModal
          title="Edit User"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => { onUpdate(editing.id, data); setEditing(null); }}
          isEdit
        />
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────
   USER FORM MODAL — Add or Edit
─────────────────────────────────────────────────── */
function UserFormModal({ title, initial, onClose, onSubmit, isEdit }) {
  const [form, setForm] = useState({
    name:       initial?.name       || "",
    email:      initial?.email      || "",
    password:   initial?.password   || "",
    role:       initial?.role       || "Engineer",
    department: initial?.department || "Engineering",
    status:     initial?.status     || "Active",
  });
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format";
    if (!isEdit && !form.password) e.password = "Password is required";
    if (form.password && form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const payload = { ...form };
    if (isEdit && !form.password) delete payload.password;
    onSubmit(payload);
  };

  const rd = ROLE_DEFS[form.role];

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 560 }}>
        <div style={S.modalHead}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>

          {/* Role preview banner */}
          <div style={{ background: rd.bg, border: `1px solid ${rd.color}44`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{rd.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: rd.color }}>{rd.label}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{rd.desc}</div>
            </div>
          </div>

          {/* Capability chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(rd.can).map(([perm, allowed]) => (
              <span key={perm} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, fontWeight: 600,
                background: allowed ? "#10B98118" : "#EF444418",
                color: allowed ? "#10B981" : "#EF4444",
                border: `1px solid ${allowed ? "#10B98133" : "#EF444433"}` }}>
                {allowed ? "✓" : "✗"} {PERM_LABELS[perm]}
              </span>
            ))}
          </div>

          {/* Form fields */}
          <div style={S.formGrid}>
            <Field label="Full Name *" error={errors.name}>
              <input style={{ ...S.input, ...(errors.name ? { borderColor: "#EF4444" } : {}) }}
                placeholder="John Smith" value={form.name} onChange={e => set("name", e.target.value)} />
            </Field>

            <Field label="Email Address *" error={errors.email}>
              <input style={{ ...S.input, ...(errors.email ? { borderColor: "#EF4444" } : {}) }}
                type="email" placeholder="john@company.com"
                value={form.email} onChange={e => set("email", e.target.value)} />
            </Field>

            <Field label={isEdit ? "New Password (leave blank to keep)" : "Password *"} error={errors.password}>
              <div style={{ position: "relative" }}>
                <input style={{ ...S.input, paddingRight: 38, ...(errors.password ? { borderColor: "#EF4444" } : {}) }}
                  type={showPass ? "text" : "password"}
                  placeholder={isEdit ? "Leave blank to keep current" : "Min 6 characters"}
                  value={form.password} onChange={e => set("password", e.target.value)} />
                <button style={S.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>

            <Field label="Role *">
              <select style={S.input} value={form.role} onChange={e => set("role", e.target.value)}>
                {Object.keys(ROLE_DEFS).map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>

            <Field label="Department">
              <select style={S.input} value={form.department} onChange={e => set("department", e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>

            {isEdit && (
              <Field label="Account Status">
                <select style={S.input} value={form.status} onChange={e => set("status", e.target.value)}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>
            )}
          </div>
        </div>
        <div style={S.modalFoot}>
          <button style={S.btnSec} onClick={onClose}>Cancel</button>
          <button style={S.btnPrimary} onClick={submit}>
            {isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PERM_LABELS = {
  upload: "Upload", editDrawing: "Edit", deleteDrawing: "Delete",
  viewAll: "View All", manageUsers: "Manage Users", transmit: "Transmit",
};

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════════ */
function Sidebar({ open, setOpen, page, nav, session, navItems, onLogout, stats }) {
  const rd = ROLE_DEFS[session?.role] || {};
  return (
    <aside style={{ ...S.sidebar, width: open ? 236 : 60 }}>
      <div>
        <div style={S.brand}>
          <span style={S.brandIcon}>⊞</span>
          {open && <span style={S.brandName}>DrawVault</span>}
        </div>

        {open && (
          <div style={S.sidebarStats}>
            <div style={S.sideStat}><span style={S.sideStatN}>{stats.total}</span><span style={S.sideStatL}>Drawings</span></div>
            <div style={S.sideStat}><span style={S.sideStatN}>{stats.projects}</span><span style={S.sideStatL}>Projects</span></div>
            <div style={S.sideStat}><span style={S.sideStatN}>{stats.users}</span><span style={S.sideStatL}>Users</span></div>
          </div>
        )}

        <nav style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => (
            <button key={item.id}
              style={{ ...S.navBtn, ...(page === item.id ? S.navBtnOn : {}) }}
              onClick={() => nav(item.id)} title={item.label}>
              <span style={S.navIco}>{item.icon}</span>
              {open && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div style={S.sidebarBottom}>
        {open && session && (
          <div style={S.userPill}>
            <Av name={session.name} size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                <span style={{ fontSize: 10 }}>{rd.icon}</span>
                <span style={{ fontSize: 10, color: rd.color, fontWeight: 700 }}>{session.role}</span>
              </div>
            </div>
          </div>
        )}
        <button style={S.navBtn} onClick={() => setOpen(p => !p)} title="Toggle sidebar">
          <span style={S.navIco}>{open ? "◁" : "▷"}</span>
          {open && <span>Collapse</span>}
        </button>
        <button style={S.navBtn} onClick={onLogout} title="Sign out">
          <span style={S.navIco}>⏻</span>
          {open && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════════════ */
function Topbar({ title, sub, onUpload, search, setSearch, showSearch, role }) {
  const rd = ROLE_DEFS[role] || {};
  return (
    <header style={S.topbar}>
      <div>
        <h1 style={S.topTitle}>{title}</h1>
        <div style={S.topSub}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {showSearch && (
          <input style={S.topSearch} placeholder="Search drawings…" value={search} onChange={e => setSearch(e.target.value)} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: rd.bg, border: `1px solid ${rd.color}44`, borderRadius: 20, padding: "5px 12px" }}>
          <span style={{ fontSize: 13 }}>{rd.icon}</span>
          <span style={{ fontSize: 11, color: rd.color, fontWeight: 700 }}>{role}</span>
        </div>
        {onUpload && <button style={S.btnPrimary} onClick={onUpload}>+ Upload Drawing</button>}
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════ */
function Dashboard({ stats, drawings, session, onOpen, onViewAll, users }) {
  const byDisc = {};
  const byStat = {};
  drawings.forEach(d => {
    byDisc[d.discipline] = (byDisc[d.discipline] || 0) + 1;
    byStat[d.status]     = (byStat[d.status]     || 0) + 1;
  });

  const isAdmin = session.role === "Admin";
  const recent  = [...drawings].sort((a,b) => new Date(b.modified) - new Date(a.modified)).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ ...S.statGrid, gridTemplateColumns: isAdmin ? "repeat(5,1fr)" : "repeat(4,1fr)" }}>
        {[
          { label: "Total Drawings",  val: stats.total,    color: "#3B82F6", icon: "📐" },
          { label: "IFC",             val: stats.ifc,      color: "#10B981", icon: "✅" },
          { label: "For Review",      val: stats.ifr,      color: "#F59E0B", icon: "🔍" },
          { label: "Projects",        val: stats.projects, color: "#8B5CF6", icon: "🏢" },
          ...(isAdmin ? [{ label: "Active Users", val: stats.users, color: "#F43F5E", icon: "👥" }] : []),
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Discipline breakdown */}
          <div style={S.card}>
            <CardHeader title="By Discipline" />
            <div style={{ padding: "4px 16px 16px" }}>
              {Object.entries(byDisc).sort((a,b)=>b[1]-a[1]).map(([disc, n]) => (
                <div key={disc} style={S.barRow}>
                  <span style={S.barLabel}>{DISC_ICON[disc]} {disc}</span>
                  <div style={S.barTrack}><div style={{ ...S.barFill, width: `${(n/drawings.length)*100}%` }} /></div>
                  <span style={S.barN}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin: user roles overview */}
          {isAdmin && (
            <div style={S.card}>
              <CardHeader title="Users by Role" />
              <div style={{ padding: "8px 16px 14px" }}>
                {Object.keys(ROLE_DEFS).map(role => {
                  const count = users.filter(u => u.role === role).length;
                  if (!count) return null;
                  const rd = ROLE_DEFS[role];
                  return (
                    <div key={role} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}18` }}>
                      <span style={{ fontSize: 13, color: rd.color }}>{rd.icon} {role}</span>
                      <span style={{ background: rd.bg, color: rd.color, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent drawings */}
        <div style={S.card}>
          <CardHeader title="Recently Modified" action={{ label: "View all →", onClick: onViewAll }} />
          <table style={S.tbl}>
            <thead><tr>{["Number","Title","Status","Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {recent.map(d => (
                <tr key={d.id} style={S.trow} onClick={() => onOpen(d)} className="trow-hover">
                  <td style={S.td}><span style={S.mono}>{d.number}</span></td>
                  <td style={{ ...S.td, maxWidth: 180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.title}</td>
                  <td style={S.td}><StatusBadge s={d.status} /></td>
                  <td style={{ ...S.td, color:"#64748B" }}>{d.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status overview */}
      <div style={S.card}>
        <CardHeader title="Status Distribution" />
        <div style={{ display:"flex", gap:12, padding:"12px 16px 16px", flexWrap:"wrap" }}>
          {Object.entries(byStat).map(([st, n]) => {
            const m = STATUS_META[st] || { color:"#64748B", bg:"#64748B18" };
            return (
              <div key={st} style={{ background:m.bg, border:`1px solid ${m.color}33`, borderRadius:10, padding:"10px 18px", textAlign:"center", minWidth:90 }}>
                <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{n}</div>
                <div style={{ fontSize:11, color:m.color, fontWeight:600, marginTop:2 }}>{st}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DRAWING LIST
═══════════════════════════════════════════════════════════════════ */
function DrawingList({ drawings, total, filters, setFilters, sort, setSort, viewMode, setViewMode, onOpen, onDelete, onUpload, canUpload }) {
  const setF = (k,v) => setFilters(f=>({...f,[k]:v}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={S.filterBar}>
        <div style={{ display:"flex", gap:8, flex:1, flexWrap:"wrap" }}>
          <FilterSelect label="Discipline" value={filters.discipline} onChange={v=>setF("discipline",v)} options={["All",...DISCIPLINES]} />
          <FilterSelect label="Status"     value={filters.status}     onChange={v=>setF("status",v)}     options={["All",...STATUSES]} />
          <FilterSelect label="Project"    value={filters.project}    onChange={v=>setF("project",v)}    options={["All",...PROJECTS]} />
          <FilterSelect label="Sort"       value={sort}               onChange={setSort}
            options={["modified_desc","modified_asc","number_asc","title_asc"]}
            labels={["Newest","Oldest","Drawing No.","Title A-Z"]} />
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#64748B" }}>{drawings.length}/{total}</span>
          <button style={{ ...S.iconBtn, background:viewMode==="table"?"#1E3A5F":"transparent" }} onClick={()=>setViewMode("table")}>☰</button>
          <button style={{ ...S.iconBtn, background:viewMode==="grid" ?"#1E3A5F":"transparent" }} onClick={()=>setViewMode("grid")}>⊞</button>
        </div>
      </div>

      {drawings.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize:36 }}>🔍</div>
          <div style={{ marginTop:10, fontWeight:600, color:"#CBD5E1" }}>No drawings found</div>
          {canUpload && <button style={{ ...S.btnPrimary, marginTop:14 }} onClick={onUpload}>+ Upload first drawing</button>}
        </div>
      ) : viewMode === "table" ? (
        <div style={S.card}>
          <table style={S.tbl}>
            <thead><tr>{["Drawing No.","Title","Rev","Discipline","Project","Status","Format","Modified",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {drawings.map(d => (
                <tr key={d.id} style={S.trow} onClick={()=>onOpen(d)} className="trow-hover">
                  <td style={S.td}><span style={S.mono}>{d.number}</span></td>
                  <td style={{ ...S.td, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{d.title}</td>
                  <td style={S.td}><RevBadge r={d.rev} /></td>
                  <td style={S.td}>{DISC_ICON[d.discipline]} {d.discipline}</td>
                  <td style={{ ...S.td, color:"#94A3B8" }}>{d.project}</td>
                  <td style={S.td}><StatusBadge s={d.status} /></td>
                  <td style={{ ...S.td, color:"#64748B" }}>{d.format}</td>
                  <td style={{ ...S.td, color:"#64748B" }}>{d.modified}</td>
                  <td style={S.td} onClick={e=>e.stopPropagation()}>
                    {onDelete && <button style={S.trashBtn} onClick={()=>onDelete(d)}>🗑</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={S.grid}>
          {drawings.map(d => {
            const m = STATUS_META[d.status] || {};
            return (
              <div key={d.id} style={S.gridCard} onClick={()=>onOpen(d)} className="grid-card-hover">
                <div style={{ ...S.gridTop, background:m.bg }}>
                  <span style={{ fontSize:28 }}>{DISC_ICON[d.discipline]}</span>
                  <StatusBadge s={d.status} />
                </div>
                <div style={S.gridBody}>
                  <div style={S.mono}>{d.number}</div>
                  <div style={S.gridTitle}>{d.title}</div>
                  <div style={S.gridMeta}>{d.project} · Rev {d.rev}</div>
                  <div style={S.gridFooter}>
                    <span style={{ color:"#64748B", fontSize:11 }}>{d.modified}</span>
                    {onDelete && <button style={{ ...S.trashBtn, marginLeft:"auto" }} onClick={e=>{ e.stopPropagation(); onDelete(d); }}>🗑</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DRAWING DETAIL
═══════════════════════════════════════════════════════════════════ */
function DetailView({ drawing: d, onBack, onUpdate, onDelete, onComment, session, statuses }) {
  const [editStatus, setEditStatus] = useState(d.status);
  const [editRev,    setEditRev]    = useState(d.rev);
  const [note,       setNote]       = useState("");
  const [saving,     setSaving]     = useState(false);
  const [tab,        setTab]        = useState("info");

  const save = async () => {
    setSaving(true); await delay(400);
    onUpdate(d.id, { status: editStatus, rev: editRev });
    setSaving(false);
  };

  const mockHistory = [
    { rev: d.rev,   date: d.modified,   by: d.author, note: "Current" },
    { rev: prevRev(d.rev), date: "2026-04-10", by: "system", note: "Previous revision" },
  ].filter(r=>r.rev);

  return (
    <div>
      <button style={S.backBtn} onClick={onBack}>← Back to Register</button>
      <div style={S.detailHeader}>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          <span style={{ fontSize:38 }}>{DISC_ICON[d.discipline]}</span>
          <div>
            <div style={{ fontSize:12, color:"#64748B", fontFamily:"monospace" }}>{d.number}</div>
            <div style={{ fontSize:19, fontWeight:700, color:"#F1F5F9", marginTop:2 }}>{d.title}</div>
            <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
              <StatusBadge s={d.status} /><RevBadge r={d.rev} />
              <span style={{ fontSize:11, color:"#64748B" }}>{d.discipline} · {d.project}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button style={S.btnPrimary}>⬇ Download</button>
          <button style={S.btnSec}>🔗 Share Link</button>
          {onDelete && <button style={{ ...S.btnSec, color:"#EF4444", borderColor:"#EF4444" }} onClick={()=>onDelete(d.id)}>🗑 Delete</button>}
        </div>
      </div>

      <div style={S.tabs}>
        {[["info","Information"],["history","Revisions"],["comments",`Comments (${d.comments?.length||0})`]].map(([id,lbl])=>(
          <button key={id} style={{ ...S.tab,...(tab===id?S.tabOn:{}) }} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "info" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={S.card}>
            <CardHeader title="Metadata" />
            <div style={{ padding:"8px 16px 16px" }}>
              {[["Drawing No.",d.number],["Title",d.title],["Discipline",`${DISC_ICON[d.discipline]} ${d.discipline}`],["Project",d.project],["Format",d.format],["Size",d.size],["Author",d.author],["Modified",d.modified]].map(([l,v])=>(
                <div key={l} style={S.metaRow}><span style={S.metaLbl}>{l}</span><span style={S.metaVal}>{v}</span></div>
              ))}
              {d.tags?.length > 0 && (
                <div style={S.metaRow}><span style={S.metaLbl}>Tags</span><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{d.tags.map(t=><span key={t} style={S.tag}>{t}</span>)}</div></div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {onUpdate ? (
              <div style={S.card}>
                <CardHeader title="Update Drawing" />
                <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
                  <div><label style={S.lbl}>Status</label>
                    <select style={S.input} value={editStatus} onChange={e=>setEditStatus(e.target.value)}>
                      {statuses.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label style={S.lbl}>Revision</label>
                    <select style={S.input} value={editRev} onChange={e=>setEditRev(e.target.value)}>
                      {REVISIONS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving?"Saving…":"Save to SharePoint"}</button>
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, padding:16, color:"#64748B", fontSize:13, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔒</div>
                Your role ({session.role}) does not have edit permissions.
              </div>
            )}
            <div style={S.card}>
              <CardHeader title="File Preview" />
              <div style={S.previewBox}>
                <div style={{ textAlign:"center", color:"#475569" }}>
                  <div style={{ fontSize:44 }}>📄</div>
                  <div style={{ fontFamily:"monospace", fontSize:12, marginTop:8, color:"#7DD3FC" }}>{d.number}.{d.format?.toLowerCase()}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{d.size}</div>
                  <button style={{ ...S.btnSec, marginTop:12, fontSize:12 }}>Open in SharePoint</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={S.card}>
          <CardHeader title="Revision History" />
          <table style={S.tbl}>
            <thead><tr>{["Rev","Date","By","Note"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{mockHistory.map((r,i)=>(
              <tr key={i} style={S.trow}>
                <td style={S.td}><RevBadge r={r.rev} /></td>
                <td style={S.td}>{r.date}</td><td style={S.td}>{r.by}</td>
                <td style={S.td}>{r.note} {i===0&&<span style={{ color:"#3B82F6", fontSize:10, fontWeight:700 }}>●CURRENT</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "comments" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={S.card}>
            <CardHeader title="Review Comments" />
            {!d.comments?.length ? (
              <div style={{ padding:"28px 16px", textAlign:"center", color:"#64748B" }}>No comments yet.</div>
            ) : (
              <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
                {d.comments.map((c,i)=>(
                  <div key={i} style={S.commentCard}>
                    <div style={{ display:"flex", gap:9, alignItems:"center", marginBottom:6 }}>
                      <Av name={c.user} size={26} />
                      <span style={{ fontWeight:700, fontSize:13, color:"#E2E8F0" }}>{c.user}</span>
                      <span style={{ color:"#64748B", fontSize:11, marginLeft:4 }}>{c.date}</span>
                    </div>
                    <p style={{ margin:0, color:"#CBD5E1", fontSize:13, lineHeight:1.5 }}>{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={S.card}>
            <CardHeader title="Add Comment" />
            <div style={{ padding:"12px 16px" }}>
              <textarea style={S.textarea} rows={3} placeholder="Enter review comment…" value={note} onChange={e=>setNote(e.target.value)} />
              <button style={S.btnPrimary} disabled={!note.trim()} onClick={()=>{ addComment && onComment(d.id,note); setNote(""); }}>Post Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TRANSMITTALS
═══════════════════════════════════════════════════════════════════ */
function TransmittalsView({ drawings, session, flash }) {
  const [selected,setSelected]=useState([]);
  const [to,setTo]=useState("");
  const [subject,setSubject]=useState("");
  const [purpose,setPurpose]=useState("IFR");
  const [sent,setSent]=useState([]);
  const toggle=(id)=>setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const send=()=>{
    setSent(p=>[{id:Date.now(),to,subject,purpose,count:selected.length,date:today(),by:session.name},...p]);
    setSelected([]); setTo(""); setSubject("");
    flash("Transmittal sent ✉️");
  };
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16, alignItems:"start" }}>
      <div style={S.card}>
        <CardHeader title="New Transmittal" />
        <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="Recipient"><input style={S.input} placeholder="client@company.com" value={to} onChange={e=>setTo(e.target.value)} /></Field>
          <Field label="Subject"><input style={S.input} placeholder="Drawing package reference" value={subject} onChange={e=>setSubject(e.target.value)} /></Field>
          <Field label="Purpose">
            <select style={S.input} value={purpose} onChange={e=>setPurpose(e.target.value)}>
              {["IFR","IFC","IFA","Information","As-Built"].map(p=><option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label={`Select Drawings (${selected.length} selected)`}>
            <div style={{ maxHeight:220, overflowY:"auto", border:`1px solid ${C.border}`, borderRadius:8 }}>
              {drawings.map(d=>(
                <label key={d.id} style={{ display:"flex", gap:10, padding:"8px 12px", cursor:"pointer", borderBottom:`1px solid #0F172A`, alignItems:"center" }}>
                  <input type="checkbox" checked={selected.includes(d.id)} onChange={()=>toggle(d.id)} style={{ accentColor:"#3B82F6" }} />
                  <span style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace" }}>{d.number}</span>
                  <span style={{ fontSize:13, color:"#CBD5E1", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.title}</span>
                  <StatusBadge s={d.status} />
                </label>
              ))}
            </div>
          </Field>
          <button style={S.btnPrimary} disabled={!to||!subject||!selected.length} onClick={send}>✉ Send Transmittal</button>
        </div>
      </div>
      <div style={S.card}>
        <CardHeader title="Transmittal Log" />
        {!sent.length ? (
          <div style={{ padding:"28px 16px", textAlign:"center", color:"#64748B" }}>No transmittals sent yet.</div>
        ) : (
          <table style={S.tbl}>
            <thead><tr>{["To","Subject","Purpose","Dwgs","Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{sent.map(t=>(
              <tr key={t.id} style={S.trow}>
                <td style={S.td}>{t.to}</td>
                <td style={{ ...S.td, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</td>
                <td style={S.td}><StatusBadge s={t.purpose} /></td>
                <td style={S.td}>{t.count}</td>
                <td style={{ ...S.td, color:"#64748B" }}>{t.date}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════════════════════════════════ */
function SettingsView({ session, can, users, drawings, onUpdateSelf }) {
  const [name,     setName]     = useState(session.name);
  const [showPass, setShowPass] = useState(false);
  const [newPass,  setNewPass]  = useState("");
  const [saved,    setSaved]    = useState(false);

  const save = () => {
    const patch = { name };
    if (newPass) patch.password = newPass;
    onUpdateSelf(patch);
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
    setNewPass("");
  };

  const rd = ROLE_DEFS[session.role] || {};
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Profile */}
      <div style={S.card}>
        <CardHeader title="My Profile" />
        <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"auto 1fr", gap:20, alignItems:"start" }}>
          <Av name={session.name} size={64} />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Field label="Display Name">
              <input style={S.input} value={name} onChange={e=>setName(e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input style={{ ...S.input, opacity:0.6 }} value={session.email} disabled />
            </Field>
            <Field label="New Password (optional)">
              <div style={{ position:"relative" }}>
                <input style={{ ...S.input, paddingRight:38 }} type={showPass?"text":"password"} placeholder="Leave blank to keep current" value={newPass} onChange={e=>setNewPass(e.target.value)} />
                <button style={S.eyeBtn} onClick={()=>setShowPass(p=>!p)} tabIndex={-1}>{showPass?"🙈":"👁"}</button>
              </div>
            </Field>
            <button style={{ ...S.btnPrimary, alignSelf:"flex-start" }} onClick={save}>{saved?"✓ Saved!":"Save Changes"}</button>
          </div>
        </div>
      </div>

      {/* Role info */}
      <div style={S.card}>
        <CardHeader title="Your Permissions" />
        <div style={{ padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:rd.bg, border:`1px solid ${rd.color}44`, borderRadius:10, padding:"12px 16px" }}>
            <span style={{ fontSize:32 }}>{rd.icon}</span>
            <div>
              <div style={{ fontWeight:700, color:rd.color, fontSize:15 }}>{session.role}</div>
              <div style={{ color:"#64748B", fontSize:13 }}>{rd.desc}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {Object.entries(rd.can||{}).map(([perm,allowed])=>(
              <div key={perm} style={{ background:allowed?"#10B98118":"#EF444418", border:`1px solid ${allowed?"#10B98133":"#EF444433"}`, borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
                <div style={{ fontSize:16 }}>{allowed?"✅":"🚫"}</div>
                <div style={{ fontSize:11, color:allowed?"#10B981":"#EF4444", fontWeight:700, marginTop:4 }}>{PERM_LABELS[perm]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System info (admin only) */}
      {can("manageUsers") && (
        <div style={S.card}>
          <CardHeader title="SharePoint / Azure Integration" />
          <div style={{ padding:"8px 16px 16px" }}>
            {[
              ["Site URL","https://contoso.sharepoint.com/sites/DrawingMgmt"],
              ["Document Library","Drawings"],
              ["Auth Method","Azure AD SSO — MSAL.js"],
              ["Total Users",`${users.length} registered`],
              ["Total Drawings",`${drawings.length} in register`],
            ].map(([l,v])=>(
              <div key={l} style={S.metaRow}>
                <span style={S.metaLbl}>{l}</span>
                <span style={{ ...S.metaVal, fontFamily:"monospace", fontSize:12, color:"#7DD3FC" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UPLOAD MODAL
═══════════════════════════════════════════════════════════════════ */
function UploadModal({ disciplines, statuses, formats, revisions, projects, session, onClose, onSubmit }) {
  const [form, setForm] = useState({ title:"", number:"", rev:"A", status:"IFR", discipline:disciplines[0], project:projects[0], format:"PDF", size:"", tags:"" });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHead}><span style={{ fontWeight:700, fontSize:16 }}>Upload Drawing to SharePoint</span><button style={S.closeBtn} onClick={onClose}>✕</button></div>
        <div style={S.modalBody}>
          <div style={{ ...S.dropZone,...(drag?S.dropOn:{}) }}
            onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f){setFile(f);set("size",fmtSize(f.size));}}}
            onClick={()=>document.getElementById("__fI").click()}>
            <input id="__fI" type="file" style={{ display:"none" }} accept=".pdf,.dwg,.dxf,.png,.xlsx"
              onChange={e=>{const f=e.target.files[0];if(f){setFile(f);set("size",fmtSize(f.size));}}} />
            <div style={{ fontSize:30 }}>📁</div>
            <div style={{ color:"#CBD5E1", marginTop:8, fontWeight:600 }}>{file?`✅ ${file.name}`:"Drop file or click to browse"}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>PDF · DWG · DXF · PNG</div>
          </div>
          <div style={S.formGrid}>
            {[{label:"Drawing Title *",key:"title",placeholder:"e.g. Foundation Layout"},{label:"Drawing Number *",key:"number",placeholder:"e.g. CIV-001-A"}].map(f=>(
              <div key={f.key}><label style={S.lbl}>{f.label}</label><input style={S.input} placeholder={f.placeholder} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} /></div>
            ))}
            {[{label:"Revision",key:"rev",opts:revisions},{label:"Status",key:"status",opts:statuses},{label:"Discipline",key:"discipline",opts:disciplines},{label:"Project",key:"project",opts:projects},{label:"Format",key:"format",opts:formats}].map(f=>(
              <div key={f.key}><label style={S.lbl}>{f.label}</label><select style={S.input} value={form[f.key]} onChange={e=>set(f.key,e.target.value)}>{f.opts.map(o=><option key={o}>{o}</option>)}</select></div>
            ))}
            <div style={{ gridColumn:"1/-1" }}><label style={S.lbl}>Tags (comma-separated)</label><input style={S.input} placeholder="e.g. foundation, block-a" value={form.tags} onChange={e=>set("tags",e.target.value)} /></div>
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>Uploading as <strong style={{ color:"#CBD5E1" }}>{session.name}</strong> · To SharePoint library <strong style={{ color:"#7DD3FC" }}>Drawings</strong></div>
        </div>
        <div style={S.modalFoot}>
          <button style={S.btnSec} onClick={onClose}>Cancel</button>
          <button style={S.btnPrimary} disabled={!form.title||!form.number} onClick={()=>onSubmit({...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)})}>📤 Upload to SharePoint</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════ */
function StatusBadge({ s }) {
  const m = STATUS_META[s] || { color:"#64748B", bg:"#64748B18" };
  return <span style={{ background:m.bg, color:m.color, border:`1px solid ${m.color}44`, padding:"2px 8px", borderRadius:12, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{s}</span>;
}
function RevBadge({ r }) {
  return <span style={{ background:"#1E3A5F", color:"#7DD3FC", padding:"1px 7px", borderRadius:4, fontSize:11, fontWeight:700, fontFamily:"monospace" }}>Rev {r}</span>;
}
function Av({ name, size = 32 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const colors   = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#F43F5E","#06B6D4"];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`${color}33`, color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*0.34, flexShrink:0 }}>{initials}</div>;
}
function CardHeader({ title, action }) {
  return <div style={S.cardHead}><span>{title}</span>{action&&<button style={S.linkBtn} onClick={action.onClick}>{action.label}</button>}</div>;
}
function FilterSelect({ label, value, onChange, options, labels }) {
  return <select style={{ ...S.fSel, minWidth:120 }} value={value} onChange={e=>onChange(e.target.value)} title={label}>{options.map((o,i)=><option key={o} value={o}>{labels?labels[i]:o}</option>)}</select>;
}
function Field({ label, children, error }) {
  return <div><label style={S.lbl}>{label}</label>{children}{error&&<div style={{ fontSize:11, color:"#EF4444", marginTop:3 }}>⚠ {error}</div>}</div>;
}
function Toast({ msg, type }) {
  const colors = { success:"#10B981", warn:"#F59E0B", info:"#3B82F6", error:"#EF4444" };
  return <div style={{ ...S.toast, background:colors[type]||colors.success }}>{msg}</div>;
}
function ConfirmDlg({ msg, onOk, onCancel }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth:360 }}>
        <div style={S.modalHead}><span style={{ fontWeight:700 }}>Confirm</span></div>
        <div style={{ padding:"20px", color:"#CBD5E1", fontSize:14 }}>{msg}</div>
        <div style={S.modalFoot}>
          <button style={S.btnSec} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btnPrimary, background:"#EF4444" }} onClick={onOk}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
function MsLogo() {
  return <svg width="18" height="18" viewBox="0 0 21 21" style={{ marginRight:10 }}><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>;
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */
const delay   = (ms) => new Promise(r=>setTimeout(r,ms));
const today   = ()   => new Date().toISOString().split("T")[0];
const fmtSize = (b)  => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1e3).toFixed(0)} KB`;
const prevRev = (r)  => { if (!r||r.length!==1) return null; const c=r.charCodeAt(0); return c>65?String.fromCharCode(c-1):null; };

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS + STYLES
═══════════════════════════════════════════════════════════════════ */
const C = { bg:"#070D1A", surface:"#0C1424", card:"#101C30", border:"#182840", text:"#E2E8F0", muted:"#64748B", accent:"#2563EB", accentL:"#3B82F6" };

const S = {
  root:     { fontFamily:"'DM Sans',system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.text, fontSize:14 },
  shell:    { display:"flex", minHeight:"100vh" },
  sidebar:  { background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", justifyContent:"space-between", transition:"width 0.2s", overflow:"hidden", flexShrink:0 },
  brand:    { display:"flex", alignItems:"center", gap:10, padding:"18px 14px", borderBottom:`1px solid ${C.border}` },
  brandIcon:{ fontSize:20, color:C.accentL, flexShrink:0 },
  brandName:{ fontWeight:800, fontSize:17, color:C.text, whiteSpace:"nowrap", letterSpacing:"-0.3px" },
  sidebarStats:{ display:"flex", padding:"10px 14px", borderBottom:`1px solid ${C.border}` },
  sideStat: { flex:1, display:"flex", flexDirection:"column", alignItems:"center" },
  sideStatN:{ fontSize:18, fontWeight:800, color:C.accentL },
  sideStatL:{ fontSize:10, color:C.muted, marginTop:1 },
  navBtn:   { display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:"transparent", border:"none", color:C.muted, cursor:"pointer", borderRadius:7, fontSize:13, width:"100%", textAlign:"left", whiteSpace:"nowrap", transition:"all 0.12s" },
  navBtnOn: { background:`${C.accentL}1A`, color:C.accentL },
  navIco:   { fontSize:15, width:18, textAlign:"center", flexShrink:0 },
  sidebarBottom:{ padding:"12px 8px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:4 },
  userPill: { display:"flex", alignItems:"center", gap:9, padding:"8px 14px", marginBottom:2 },
  mainWrap: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 },
  topbar:   { padding:"14px 24px", borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, flexWrap:"wrap", gap:10 },
  topTitle: { margin:0, fontSize:19, fontWeight:700, color:C.text },
  topSub:   { fontSize:11, color:C.muted, marginTop:1 },
  topSearch:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 12px", color:C.text, fontSize:13, outline:"none", width:220 },
  content:  { flex:1, overflowY:"auto", padding:22 },
  card:     { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" },
  cardHead: { padding:"12px 16px", borderBottom:`1px solid ${C.border}`, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"space-between" },
  statGrid: { display:"grid", gap:14, marginBottom:18 },
  statCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 16px" },
  barRow:   { display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  barLabel: { width:140, fontSize:13, color:C.muted, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  barTrack: { flex:1, height:5, background:C.border, borderRadius:3, overflow:"hidden" },
  barFill:  { height:"100%", background:C.accentL, borderRadius:3, transition:"width 0.5s ease" },
  barN:     { width:24, textAlign:"right", fontSize:13, color:C.text, fontWeight:700 },
  tbl:      { width:"100%", borderCollapse:"collapse" },
  th:       { padding:"9px 12px", textAlign:"left", fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" },
  trow:     { cursor:"pointer" },
  td:       { padding:"10px 12px", borderBottom:`1px solid ${C.border}1A`, fontSize:13, color:C.text },
  mono:     { fontFamily:"monospace", color:"#7DD3FC", fontSize:12 },
  filterBar:{ display:"flex", gap:10, alignItems:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", flexWrap:"wrap" },
  fSel:     { background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 10px", color:C.text, fontSize:13, outline:"none" },
  iconBtn:  { background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 9px", color:C.muted, cursor:"pointer", fontSize:14 },
  grid:     { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 },
  gridCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"transform 0.12s, border-color 0.12s" },
  gridTop:  { padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  gridBody: { padding:"10px 16px 14px", display:"flex", flexDirection:"column", gap:4 },
  gridTitle:{ fontSize:13, fontWeight:600, color:C.text, lineHeight:1.4 },
  gridMeta: { fontSize:11, color:C.muted },
  gridFooter:{ display:"flex", alignItems:"center", marginTop:6 },
  detailHeader:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 },
  backBtn:  { background:"none", border:"none", color:C.accentL, cursor:"pointer", fontSize:14, marginBottom:12, padding:0 },
  tabs:     { display:"flex", gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16 },
  tab:      { background:"none", border:"none", borderBottom:"2px solid transparent", padding:"9px 18px", color:C.muted, cursor:"pointer", fontSize:14, fontWeight:600 },
  tabOn:    { color:C.accentL, borderBottom:`2px solid ${C.accentL}` },
  metaRow:  { display:"flex", alignItems:"flex-start", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}18` },
  metaLbl:  { width:130, flexShrink:0, fontSize:12, color:C.muted, fontWeight:600, paddingTop:1 },
  metaVal:  { color:C.text, fontSize:14 },
  tag:      { background:`${C.accentL}1A`, color:C.accentL, padding:"2px 8px", borderRadius:12, fontSize:11 },
  previewBox:{ padding:24, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160 },
  commentCard:{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" },
  statusToggle:{ border:"1px solid", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, cursor:"pointer" },
  iconActionBtn:{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:13 },
  btnPrimary:{ background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" },
  btnSec:   { background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" },
  trashBtn: { background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:"2px 6px", borderRadius:4 },
  linkBtn:  { background:"none", border:"none", color:C.accentL, cursor:"pointer", fontSize:12 },
  lbl:      { display:"block", fontSize:12, color:C.muted, fontWeight:600, marginBottom:5 },
  input:    { width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", color:C.text, fontSize:13, boxSizing:"border-box", outline:"none" },
  textarea: { width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 10px", color:C.text, fontSize:13, boxSizing:"border-box", resize:"vertical", display:"block", marginBottom:10, outline:"none" },
  overlay:  { position:"fixed", inset:0, background:"rgba(0,0,0,.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  modal:    { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:"92%", maxWidth:640, maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 80px rgba(0,0,0,.6)" },
  modalHead:{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" },
  modalBody:{ padding:"18px 20px", overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:14 },
  modalFoot:{ padding:"14px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:10 },
  closeBtn: { background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer" },
  dropZone: { border:`2px dashed ${C.border}`, borderRadius:10, padding:24, textAlign:"center", cursor:"pointer", transition:"all 0.18s" },
  dropOn:   { borderColor:C.accentL, background:`${C.accentL}0D` },
  formGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  empty:    { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", background:C.card, border:`1px solid ${C.border}`, borderRadius:12 },
  toast:    { position:"fixed", top:18, right:18, padding:"11px 18px", borderRadius:10, color:"#fff", fontWeight:700, fontSize:13, zIndex:9999, boxShadow:"0 6px 24px rgba(0,0,0,.4)", pointerEvents:"none" },
  // Login
  loginPage:   { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, position:"relative", overflow:"hidden" },
  loginGlow:   { position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,#1E3A5F55 0%,transparent 70%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" },
  loginCard:   { background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:"44px 40px", width:"100%", maxWidth:440, position:"relative", zIndex:1, boxShadow:"0 40px 100px rgba(0,0,0,.7)" },
  loginBrand:  { display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:6 },
  loginIcon:   { fontSize:36, color:C.accentL },
  loginBrandName:{ fontWeight:800, fontSize:28, color:C.text, letterSpacing:"-1px" },
  loginSub:    { textAlign:"center", color:C.muted, fontSize:14, marginBottom:22 },
  loginDivider:{ height:1, background:C.border, marginBottom:22 },
  loginForm:   { display:"flex", flexDirection:"column", gap:14 },
  loginFieldGroup:{ display:"flex", flexDirection:"column", gap:6 },
  loginLbl:    { fontSize:12, color:C.muted, fontWeight:600 },
  loginInput:  { width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" },
  loginError:  { background:"#EF444418", border:"1px solid #EF444444", borderRadius:8, padding:"10px 14px", color:"#EF4444", fontSize:13, fontWeight:600 },
  msBtn:       { display:"flex", alignItems:"center", justifyContent:"center", width:"100%", padding:"12px", background:"#fff", color:"#111", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer" },
  loginHint:   { marginTop:20, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" },
  eyeBtn:      { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15, color:C.muted },
};

const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #070D1A; }
  ::-webkit-scrollbar-thumb { background: #182840; border-radius: 3px; }
  .trow-hover:hover { background: #182840 !important; }
  .grid-card-hover:hover { transform: translateY(-2px); border-color: #2563EB66 !important; }
  select option { background: #0C1424; color: #E2E8F0; }
  button:disabled { opacity: 0.42; cursor: not-allowed !important; }
  input:focus, select:focus, textarea:focus { border-color: #2563EB !important; }
`;
