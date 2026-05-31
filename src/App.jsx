import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   SEED DATA
───────────────────────────────────────────────────────────────── */
const SEED_DRAWINGS = [
  { id: 1, number: "CIV-001-C", title: "Foundation Layout – Block A", rev: "C", status: "IFC", discipline: "Civil", project: "Tower Alpha", author: "Alex Morgan", modified: "2026-05-28", size: "2.4 MB", format: "PDF", tags: ["foundation", "block-a"], comments: [{ user: "Jordan Lee", text: "Approved for construction.", date: "2026-05-29" }] },
  { id: 2, number: "STR-002-B", title: "Steel Frame – Levels 3 to 6", rev: "B", status: "IFR", discipline: "Structural", project: "Tower Alpha", author: "Jordan Lee", modified: "2026-05-27", size: "5.1 MB", format: "DWG", tags: ["steel", "levels"], comments: [] },
  { id: 3, number: "HVC-003-A", title: "HVAC Ductwork – Floor 2", rev: "A", status: "IFA", discipline: "HVAC", project: "Riverside Mall", author: "Sam Chen", modified: "2026-05-25", size: "1.8 MB", format: "PDF", tags: ["hvac", "floor-2"], comments: [{ user: "Alex Morgan", text: "Review pending sign-off.", date: "2026-05-26" }] },
  { id: 4, number: "ELE-004-D", title: "Electrical Distribution Board", rev: "D", status: "As-Built", discipline: "Electrical", project: "Riverside Mall", author: "Taylor Wu", modified: "2026-05-20", size: "3.3 MB", format: "PDF", tags: ["electrical", "distribution"], comments: [] },
  { id: 5, number: "PIP-005-A", title: "Piping Isometric – Section 4B", rev: "A", status: "IFC", discipline: "Piping", project: "Refinery X", author: "Alex Morgan", modified: "2026-05-18", size: "4.7 MB", format: "DXF", tags: ["piping", "iso"], comments: [] },
  { id: 6, number: "ARC-006-B", title: "Site Plan – Overall Layout", rev: "B", status: "Superseded", discipline: "Architecture", project: "Tower Alpha", author: "Morgan Davis", modified: "2026-05-10", size: "6.0 MB", format: "DWG", tags: ["site", "layout"], comments: [] },
  { id: 7, number: "MEC-007-A", title: "Pump Room Arrangement", rev: "A", status: "IFR", discipline: "Mechanical", project: "Refinery X", author: "Sam Chen", modified: "2026-05-08", size: "2.9 MB", format: "PDF", tags: ["pump", "arrangement"], comments: [] },
  { id: 8, number: "STR-008-C", title: "Roof Truss Details", rev: "C", status: "IFC", discipline: "Structural", project: "Riverside Mall", author: "Jordan Lee", modified: "2026-04-30", size: "3.5 MB", format: "PDF", tags: ["roof", "truss"], comments: [] },
];

const DISCIPLINES = ["Civil", "Structural", "Mechanical", "Electrical", "Piping", "HVAC", "Architecture"];
const STATUSES    = ["IFR", "IFC", "IFA", "As-Built", "Superseded", "Void"];
const FORMATS     = ["PDF", "DWG", "DXF", "PNG", "XLSX"];
const REVISIONS   = ["A","B","C","D","E","F","G","H","IFC","0","1","2","3"];

const PROJECTS = ["Tower Alpha", "Riverside Mall", "Refinery X", "Harbor Bridge", "Metro Station 7"];

const USERS = [];

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const STATUS_META = {
  IFR:        { color: "#F59E0B", bg: "#F59E0B18", label: "Issued for Review" },
  IFC:        { color: "#10B981", bg: "#10B98118", label: "Issued for Construction" },
  IFA:        { color: "#3B82F6", bg: "#3B82F618", label: "Issued for Approval" },
  "As-Built": { color: "#8B5CF6", bg: "#8B5CF618", label: "As-Built" },
  Superseded: { color: "#6B7280", bg: "#6B728018", label: "Superseded" },
  Void:       { color: "#EF4444", bg: "#EF444418", label: "Void" },
};

const DISC_ICON = {
  Civil: "🏗", Structural: "🔩", Mechanical: "⚙️",
  Electrical: "⚡", Piping: "🔧", HVAC: "💨", Architecture: "🏛",
};

/* ─────────────────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [authed,   setAuthed]   = useState(false);
  const [user,     setUser]     = useState(null);
  const [logging,  setLogging]  = useState(false);
  const [page,     setPage]     = useState("dashboard");
  const [drawings, setDrawings] = useState(SEED_DRAWINGS);
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);   // { msg, onOk }
  const [upload,   setUpload]   = useState(false);
  const [sidebar,  setSidebar]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filters,  setFilters]  = useState({ discipline:"All", status:"All", project:"All" });
  const [sort,     setSort]     = useState("modified_desc");
  const [viewMode, setViewMode] = useState("table"); // table | grid

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const ask = (msg, onOk) => setConfirm({ msg, onOk });

  /* ── Login ── */
  const handleLogin = async (u) => {
    setLogging(true);
    await delay(900);
    setUser(u); setAuthed(true); setLogging(false);
    flash(`Welcome back, ${u.name.split(" ")[0]} 👋`);
  };

  const handleLogout = () => {
    setAuthed(false); setUser(null); setSelected(null); setPage("dashboard");
    flash("Signed out successfully", "info");
  };

  /* ── CRUD ── */
  const addDrawing = (d) => {
    setDrawings(prev => [{ ...d, id: Date.now(), modified: today(), comments: [] }, ...prev]);
    flash("Drawing uploaded successfully 📤");
  };

  const updateDrawing = (id, patch) => {
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...patch, modified: today() } : d));
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...patch }));
    flash("Drawing updated ✓");
  };

  const deleteDrawing = (id) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) setSelected(null);
    flash("Drawing deleted", "warn");
  };

  const addComment = (id, text) => {
    setDrawings(prev => prev.map(d =>
      d.id === id ? { ...d, comments: [...d.comments, { user: user.name, text, date: today() }] } : d
    ));
    setSelected(prev => ({ ...prev, comments: [...prev.comments, { user: user.name, text, date: today() }] }));
  };

  /* ── Filtered list ── */
  const visible = drawings
    .filter(d => {
      const q = search.toLowerCase();
      const matchQ = !q || d.title.toLowerCase().includes(q) || d.number.toLowerCase().includes(q) || d.author.toLowerCase().includes(q);
      const matchD = filters.discipline === "All" || d.discipline === filters.discipline;
      const matchS = filters.status     === "All" || d.status     === filters.status;
      const matchP = filters.project    === "All" || d.project    === filters.project;
      return matchQ && matchD && matchS && matchP;
    })
    .sort((a, b) => {
      if (sort === "modified_desc") return new Date(b.modified) - new Date(a.modified);
      if (sort === "modified_asc")  return new Date(a.modified) - new Date(b.modified);
      if (sort === "number_asc")    return a.number.localeCompare(b.number);
      if (sort === "title_asc")     return a.title.localeCompare(b.title);
      return 0;
    });

  const stats = {
    total: drawings.length,
    ifc:   drawings.filter(d => d.Status === "IFC" || d.status === "IFC").length,
    ifr:   drawings.filter(d => d.status === "IFR").length,
    ifa:   drawings.filter(d => d.status === "IFA").length,
    projects: new Set(drawings.map(d => d.project)).size,
  };

  /* ── Nav helper ── */
  const nav = (pg) => { setPage(pg); setSelected(null); };

  if (!authed) return <LoginScreen onLogin={handleLogin} loading={logging} />;

  return (
    <div style={S.root}>
      <style>{GLOBAL_CSS}</style>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog msg={confirm.msg}
          onOk={() => { confirm.onOk(); setConfirm(null); }}
          onCancel={() => setConfirm(null)} />
      )}

      {/* Upload modal */}
      {upload && (
        <UploadModal
          disciplines={DISCIPLINES} statuses={STATUSES} formats={FORMATS}
          revisions={REVISIONS} projects={PROJECTS} user={user}
          onClose={() => setUpload(false)}
          onSubmit={(d) => { addDrawing(d); setUpload(false); }} />
      )}

      {/* Shell */}
      <div style={S.shell}>
        <Sidebar open={sidebar} setOpen={setSidebar} page={page} nav={nav} user={user} onLogout={handleLogout} stats={stats} />

        <div style={S.mainWrap}>
          {/* Topbar */}
          <Topbar
            title={selected ? selected.number : PAGE_TITLES[page]}
            sub={selected ? selected.title : "SharePoint · Azure AD SSO"}
            onUpload={() => setUpload(true)}
            search={search} setSearch={setSearch}
            showSearch={!selected && page === "drawings"}
          />

          {/* Content */}
          <div style={S.content}>
            {selected ? (
              <DetailView
                drawing={selected}
                onBack={() => setSelected(null)}
                onUpdate={updateDrawing}
                onDelete={(id) => ask("Permanently delete this drawing?", () => { deleteDrawing(id); setSelected(null); })}
                onComment={addComment}
                user={user}
                statuses={STATUSES}
              />
            ) : page === "dashboard" ? (
              <Dashboard stats={stats} drawings={drawings} onOpen={(d) => setSelected(d)} onViewAll={() => nav("drawings")} />
            ) : page === "drawings" ? (
              <DrawingList
                drawings={visible} total={drawings.length}
                filters={filters} setFilters={setFilters}
                sort={sort} setSort={setSort}
                viewMode={viewMode} setViewMode={setViewMode}
                onOpen={(d) => setSelected(d)}
                onDelete={(d) => ask(`Delete "${d.number}"?`, () => deleteDrawing(d.id))}
                onUpload={() => setUpload(true)}
              />
            ) : page === "transmittals" ? (
              <TransmittalsView drawings={drawings} user={user} flash={flash} />
            ) : page === "admin" ? (
              <AdminView user={user} drawings={drawings} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LOGIN SCREEN
───────────────────────────────────────────────────────────────── */
function LoginScreen({ onLogin, loading }) {
  const [picked, setPicked] = useState(null);
  return (
    <div style={S.loginPage}>
      <div style={S.loginGlow} />
      <div style={S.loginCard}>
        <div style={S.loginBrand}>
          <span style={S.loginIcon}>⊞</span>
          <span style={S.loginBrandName}>DrawVault</span>
        </div>
        <p style={S.loginSub}>Engineering Drawing Management</p>
        <div style={S.loginDivider} />

        <p style={S.loginPickLabel}>Select your account to continue</p>
        <div style={S.userList}>
          {USERS.map(u => (
            <button key={u.name}
              style={{ ...S.userBtn, ...(picked?.name === u.name ? S.userBtnActive : {}) }}
              onClick={() => setPicked(u)}>
              <span style={S.userAv}>{u.initials}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: "#E2E8F0", fontSize: 14 }}>{u.name}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>{u.role} · {u.email}</div>
              </div>
              {picked?.name === u.name && <span style={{ marginLeft: "auto", color: "#3B82F6" }}>✓</span>}
            </button>
          ))}
        </div>

        <button style={{ ...S.msBtn, opacity: (!picked || loading) ? 0.5 : 1 }}
          disabled={!picked || loading}
          onClick={() => onLogin(picked)}>
          <MsLogo />
          {loading ? "Signing in with Microsoft…" : "Sign in with Microsoft SSO"}
        </button>
        <p style={{ fontSize: 11, color: "#475569", marginTop: 14, textAlign: "center" }}>
          Protected by Azure Active Directory · Your credentials are managed by your organization
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────── */
const PAGE_TITLES = { dashboard: "Dashboard", drawings: "Drawing Register", transmittals: "Transmittals", admin: "Administration" };
const NAV_ITEMS = [
  { id: "dashboard",    icon: "◈", label: "Dashboard"      },
  { id: "drawings",     icon: "⊟", label: "Drawing Register" },
  { id: "transmittals", icon: "✉", label: "Transmittals"   },
  { id: "admin",        icon: "⚙", label: "Admin"          },
];

function Sidebar({ open, setOpen, page, nav, user, onLogout, stats }) {
  return (
    <aside style={{ ...S.sidebar, width: open ? 236 : 60 }}>
      <div style={S.sidebarTop}>
        <div style={S.brand}>
          <span style={S.brandIcon}>⊞</span>
          {open && <span style={S.brandName}>DrawVault</span>}
        </div>
        {open && (
          <div style={S.sidebarStats}>
            <div style={S.sideStat}><span style={S.sideStatN}>{stats.total}</span><span style={S.sideStatL}>Drawings</span></div>
            <div style={S.sideStat}><span style={S.sideStatN}>{stats.projects}</span><span style={S.sideStatL}>Projects</span></div>
          </div>
        )}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              style={{ ...S.navBtn, ...(page === item.id ? S.navBtnOn : {}) }}
              onClick={() => nav(item.id)} title={item.label}>
              <span style={S.navIco}>{item.icon}</span>
              {open && <span style={S.navLbl}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div style={S.sidebarBottom}>
        {open && user && (
          <div style={S.userPill}>
            <Av name={user.name} size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{user.role}</div>
            </div>
          </div>
        )}
        <button style={S.navBtn} onClick={() => setOpen(p => !p)} title="Toggle sidebar">
          <span style={S.navIco}>{open ? "◁" : "▷"}</span>
          {open && <span style={S.navLbl}>Collapse</span>}
        </button>
        <button style={S.navBtn} onClick={onLogout} title="Sign out">
          <span style={S.navIco}>⏻</span>
          {open && <span style={S.navLbl}>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────────────────────────── */
function Topbar({ title, sub, onUpload, search, setSearch, showSearch }) {
  return (
    <header style={S.topbar}>
      <div>
        <h1 style={S.topTitle}>{title}</h1>
        <div style={S.topSub}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {showSearch && (
          <input style={S.topSearch} placeholder="Search drawings…"
            value={search} onChange={e => setSearch(e.target.value)} />
        )}
        <button style={S.btnPrimary} onClick={onUpload}>+ Upload Drawing</button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────── */
function Dashboard({ stats, drawings, onOpen, onViewAll }) {
  const byDisc = {};
  const byStat = {};
  drawings.forEach(d => {
    byDisc[d.discipline] = (byDisc[d.discipline] || 0) + 1;
    byStat[d.status]     = (byStat[d.status]     || 0) + 1;
  });

  const recent = [...drawings].sort((a, b) => new Date(b.modified) - new Date(a.modified)).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={S.statGrid}>
        {[
          { label: "Total Drawings", val: stats.total,    color: "#3B82F6", icon: "📐" },
          { label: "IFC",            val: drawings.filter(d=>d.status==="IFC").length, color: "#10B981", icon: "✅" },
          { label: "For Review",     val: drawings.filter(d=>d.status==="IFR").length, color: "#F59E0B", icon: "🔍" },
          { label: "Projects",       val: stats.projects, color: "#8B5CF6", icon: "🏢" },
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
        {/* Discipline breakdown */}
        <div style={S.card}>
          <CardHeader title="By Discipline" />
          <div style={{ padding: "4px 16px 16px" }}>
            {Object.entries(byDisc).sort((a,b)=>b[1]-a[1]).map(([disc, n]) => (
              <div key={disc} style={S.barRow}>
                <span style={S.barLabel}>{DISC_ICON[disc]} {disc}</span>
                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: `${(n / drawings.length) * 100}%` }} />
                </div>
                <span style={S.barN}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent drawings */}
        <div style={S.card}>
          <CardHeader title="Recently Modified" action={{ label: "View all →", onClick: onViewAll }} />
          <table style={S.tbl}>
            <thead>
              <tr>{["Number","Title","Status","Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {recent.map(d => (
                <tr key={d.id} style={S.trow} onClick={() => onOpen(d)} className="trow-hover">
                  <td style={S.td}><span style={S.mono}>{d.number}</span></td>
                  <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</td>
                  <td style={S.td}><StatusBadge s={d.status} /></td>
                  <td style={{ ...S.td, color: "#64748B" }}>{d.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={S.card}>
        <CardHeader title="Status Overview" />
        <div style={{ display: "flex", gap: 12, padding: "12px 16px 16px", flexWrap: "wrap" }}>
          {Object.entries(byStat).map(([st, n]) => {
            const m = STATUS_META[st] || { color: "#64748B", bg: "#64748B18" };
            return (
              <div key={st} style={{ background: m.bg, border: `1px solid ${m.color}33`, borderRadius: 10, padding: "10px 18px", textAlign: "center", minWidth: 90 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{n}</div>
                <div style={{ fontSize: 11, color: m.color, fontWeight: 600, marginTop: 2 }}>{st}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DRAWING LIST
───────────────────────────────────────────────────────────────── */
function DrawingList({ drawings, total, filters, setFilters, sort, setSort, viewMode, setViewMode, onOpen, onDelete, onUpload }) {
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const projects = ["All", ...PROJECTS];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Filter bar */}
      <div style={S.filterBar}>
        <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
          <FilterSelect label="Discipline" value={filters.discipline} onChange={v=>setF("discipline",v)} options={["All",...DISCIPLINES]} />
          <FilterSelect label="Status"     value={filters.status}     onChange={v=>setF("status",v)}     options={["All",...STATUSES]}    />
          <FilterSelect label="Project"    value={filters.project}    onChange={v=>setF("project",v)}    options={projects}               />
          <FilterSelect label="Sort"       value={sort}               onChange={setSort}
            options={["modified_desc","modified_asc","number_asc","title_asc"]}
            labels={["Newest first","Oldest first","Drawing no.","Title A–Z"]} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>{drawings.length} of {total}</span>
          <button style={{ ...S.iconBtn, background: viewMode==="table" ? "#1E3A5F" : "transparent" }} onClick={() => setViewMode("table")} title="Table">☰</button>
          <button style={{ ...S.iconBtn, background: viewMode==="grid"  ? "#1E3A5F" : "transparent" }} onClick={() => setViewMode("grid")}  title="Grid">⊞</button>
        </div>
      </div>

      {drawings.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ marginTop: 10, fontWeight: 600, color: "#CBD5E1" }}>No drawings match your filters</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Try adjusting the filters or search query</div>
        </div>
      ) : viewMode === "table" ? (
        <TableView drawings={drawings} onOpen={onOpen} onDelete={onDelete} />
      ) : (
        <GridView drawings={drawings} onOpen={onOpen} onDelete={onDelete} />
      )}
    </div>
  );
}

function TableView({ drawings, onOpen, onDelete }) {
  return (
    <div style={S.card}>
      <table style={S.tbl}>
        <thead>
          <tr>
            {["Drawing No.","Title","Rev","Discipline","Project","Status","Format","Modified","Author",""].map(h =>
              <th key={h} style={S.th}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {drawings.map(d => (
            <tr key={d.id} style={S.trow} onClick={() => onOpen(d)} className="trow-hover">
              <td style={S.td}><span style={S.mono}>{d.number}</span></td>
              <td style={{ ...S.td, maxWidth: 200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight: 500 }}>{d.title}</td>
              <td style={S.td}><RevBadge r={d.rev} /></td>
              <td style={S.td}>{DISC_ICON[d.discipline]} {d.discipline}</td>
              <td style={{ ...S.td, color: "#94A3B8" }}>{d.project}</td>
              <td style={S.td}><StatusBadge s={d.status} /></td>
              <td style={{ ...S.td, color: "#64748B" }}>{d.format}</td>
              <td style={{ ...S.td, color: "#64748B" }}>{d.modified}</td>
              <td style={{ ...S.td, color: "#94A3B8" }}>{d.author.split(" ")[0]}</td>
              <td style={S.td} onClick={e => e.stopPropagation()}>
                <button style={S.trashBtn} title="Delete"
                  onClick={() => onDelete(d)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ drawings, onOpen, onDelete }) {
  return (
    <div style={S.grid}>
      {drawings.map(d => {
        const m = STATUS_META[d.status] || {};
        return (
          <div key={d.id} style={S.gridCard} onClick={() => onOpen(d)} className="grid-card-hover">
            <div style={{ ...S.gridTop, background: m.bg }}>
              <span style={{ fontSize: 28 }}>{DISC_ICON[d.discipline]}</span>
              <StatusBadge s={d.status} />
            </div>
            <div style={S.gridBody}>
              <div style={S.mono}>{d.number}</div>
              <div style={S.gridTitle}>{d.title}</div>
              <div style={S.gridMeta}>{d.project} · Rev {d.rev} · {d.format}</div>
              <div style={S.gridFooter}>
                <span style={{ color: "#64748B", fontSize: 11 }}>{d.modified}</span>
                <button style={{ ...S.trashBtn, marginLeft: "auto" }}
                  onClick={e => { e.stopPropagation(); onDelete(d); }}>✕</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DETAIL VIEW
───────────────────────────────────────────────────────────────── */
function DetailView({ drawing: d, onBack, onUpdate, onDelete, onComment, user, statuses }) {
  const [editStatus, setEditStatus] = useState(d.status);
  const [editRev,    setEditRev]    = useState(d.rev);
  const [note,       setNote]       = useState("");
  const [saving,     setSaving]     = useState(false);
  const [tab,        setTab]        = useState("info"); // info | history | comments

  const save = async () => {
    setSaving(true);
    await delay(400);
    onUpdate(d.id, { status: editStatus, rev: editRev });
    setSaving(false);
  };

  const postComment = () => {
    if (!note.trim()) return;
    onComment(d.id, note.trim());
    setNote("");
  };

  const MOCK_HISTORY = [
    { rev: d.rev,                date: d.modified,   by: d.author,      note: "Current revision" },
    { rev: prevRev(d.rev),       date: "2026-04-10", by: "Jordan Lee",   note: "Minor corrections to dims" },
    { rev: prevRev(prevRev(d.rev)), date: "2026-03-01", by: d.author,    note: "Initial issue" },
  ].filter(r => r.rev);

  return (
    <div>
      <button style={S.backBtn} onClick={onBack}>← Back to Register</button>

      {/* Header */}
      <div style={S.detailHeader}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 40 }}>{DISC_ICON[d.discipline]}</span>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontFamily: "monospace" }}>{d.number}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>{d.title}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <StatusBadge s={d.status} />
              <RevBadge r={d.rev} />
              <span style={{ fontSize: 11, color: "#64748B" }}>{d.discipline} · {d.project}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={S.btnPrimary}>⬇ Download</button>
          <button style={S.btnSec}>🔗 Copy Link</button>
          <button style={{ ...S.btnSec, color: "#EF4444", borderColor: "#EF4444" }}
            onClick={() => onDelete(d.id)}>🗑 Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[["info","Information"],["history","Revisions"],["comments","Comments " + (d.comments?.length ? `(${d.comments.length})` : "")]].map(([id, lbl]) => (
          <button key={id} style={{ ...S.tab, ...(tab===id ? S.tabOn : {}) }} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === "info" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Meta */}
          <div style={S.card}>
            <CardHeader title="Drawing Metadata" />
            <div style={{ padding: "8px 16px 16px" }}>
              {[
                ["Drawing Number", d.number],
                ["Title",          d.title],
                ["Discipline",     `${DISC_ICON[d.discipline]} ${d.discipline}`],
                ["Project",        d.project],
                ["Format",         d.format],
                ["File Size",      d.size],
                ["Uploaded By",    d.author],
                ["Last Modified",  d.modified],
              ].map(([lbl, val]) => (
                <div key={lbl} style={S.metaRow}>
                  <span style={S.metaLbl}>{lbl}</span>
                  <span style={S.metaVal}>{val}</span>
                </div>
              ))}
              {d.tags?.length > 0 && (
                <div style={S.metaRow}>
                  <span style={S.metaLbl}>Tags</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {d.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Update panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={S.card}>
              <CardHeader title="Update Drawing" />
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={S.lbl}>Status</label>
                  <select style={S.input} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Revision</label>
                  <select style={S.input} value={editRev} onChange={e => setEditRev(e.target.value)}>
                    {REVISIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button style={S.btnPrimary} onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes to SharePoint"}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div style={S.card}>
              <CardHeader title="File Preview" />
              <div style={S.previewBox}>
                <div style={{ textAlign: "center", color: "#475569" }}>
                  <div style={{ fontSize: 48 }}>📄</div>
                  <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 8, color: "#7DD3FC" }}>{d.number}.{d.format.toLowerCase()}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{d.size}</div>
                  <button style={{ ...S.btnSec, marginTop: 12, fontSize: 12 }}>Open in SharePoint</button>
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
            <thead><tr>{["Revision","Date","Author","Notes"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_HISTORY.map((r, i) => (
                <tr key={i} style={S.trow}>
                  <td style={S.td}><RevBadge r={r.rev} /></td>
                  <td style={S.td}>{r.date}</td>
                  <td style={S.td}>{r.by}</td>
                  <td style={S.td}>{r.note} {i === 0 && <span style={{ color: "#3B82F6", fontSize: 11, fontWeight: 700 }}>● CURRENT</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <CardHeader title="Review Comments" />
            {d.comments?.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748B" }}>No comments yet.</div>
            ) : (
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {d.comments.map((c, i) => (
                  <div key={i} style={S.commentCard}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <Av name={c.user} size={28} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#E2E8F0" }}>{c.user}</span>
                        <span style={{ color: "#64748B", fontSize: 11, marginLeft: 8 }}>{c.date}</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: "#CBD5E1", fontSize: 14, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={S.card}>
            <CardHeader title="Add Comment" />
            <div style={{ padding: "12px 16px" }}>
              <textarea style={S.textarea} rows={3} placeholder="Enter review comment or markup note…"
                value={note} onChange={e => setNote(e.target.value)} />
              <button style={S.btnPrimary} disabled={!note.trim()} onClick={postComment}>Post Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TRANSMITTALS VIEW
───────────────────────────────────────────────────────────────── */
function TransmittalsView({ drawings, user, flash }) {
  const [selected, setSelected] = useState([]);
  const [to, setTo]             = useState("");
  const [subject, setSubject]   = useState("");
  const [purpose, setPurpose]   = useState("IFR");
  const [sent, setSent]         = useState([]);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const send = async () => {
    setSent(p => [{ id: Date.now(), to, subject, purpose, drawings: selected.length, date: today(), by: user.name }, ...p]);
    setSelected([]); setTo(""); setSubject("");
    flash("Transmittal sent successfully ✉️");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <CardHeader title="New Transmittal" />
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={S.lbl}>To (email or name)</label>
              <input style={S.input} placeholder="e.g. Client Name or client@email.com" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div>
              <label style={S.lbl}>Subject / Reference</label>
              <input style={S.input} placeholder="e.g. Tower Alpha – Structural IFC Package" value={subject} onChange={e=>setSubject(e.target.value)} />
            </div>
            <div>
              <label style={S.lbl}>Purpose of Issue</label>
              <select style={S.input} value={purpose} onChange={e=>setPurpose(e.target.value)}>
                {["IFR","IFC","IFA","Information","As-Built"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>Select Drawings ({selected.length} selected)</label>
              <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid #1E293B`, borderRadius: 8 }}>
                {drawings.map(d => (
                  <label key={d.id} style={{ display: "flex", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid #0F172A`, alignItems: "center" }}>
                    <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} style={{ accentColor: "#3B82F6" }} />
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>{d.number}</span>
                    <span style={{ fontSize: 13, color: "#CBD5E1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                    <StatusBadge s={d.status} />
                  </label>
                ))}
              </div>
            </div>
            <button style={S.btnPrimary} disabled={!to || !subject || selected.length === 0} onClick={send}>
              ✉ Send Transmittal
            </button>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <CardHeader title="Transmittal Log" />
        {sent.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748B" }}>No transmittals sent yet.</div>
        ) : (
          <table style={S.tbl}>
            <thead><tr>{["To","Subject","Purpose","Drawings","Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {sent.map(t => (
                <tr key={t.id} style={S.trow}>
                  <td style={S.td}>{t.to}</td>
                  <td style={{ ...S.td, maxWidth: 140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</td>
                  <td style={S.td}><StatusBadge s={t.purpose} /></td>
                  <td style={S.td}>{t.drawings}</td>
                  <td style={{ ...S.td, color: "#64748B" }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ADMIN VIEW
───────────────────────────────────────────────────────────────── */
function AdminView({ user, drawings }) {
  const byProject = {};
  drawings.forEach(d => { byProject[d.project] = (byProject[d.project] || 0) + 1; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <CardHeader title="SharePoint Integration" />
          <div style={{ padding: "8px 16px 16px" }}>
            {[
              ["Site URL",         "https://contoso.sharepoint.com/sites/DrawingMgmt"],
              ["Document Library", "Drawings"],
              ["List Name",        "DrawingRegister"],
              ["Auth Method",      "Azure AD SSO — MSAL.js"],
              ["API Version",      "SharePoint REST API v2"],
              ["Connected As",     user.name],
              ["Tenant",           "contoso.onmicrosoft.com"],
            ].map(([lbl,val]) => (
              <div key={lbl} style={S.metaRow}>
                <span style={S.metaLbl}>{lbl}</span>
                <span style={{ ...S.metaVal, fontFamily: "monospace", fontSize: 12, color: "#7DD3FC" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <CardHeader title="Azure App Registration" />
          <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Client ID",            "9df0ea4a-7885-442e-9a53-3cd175fd2688"],
              ["Tenant ID",            "31d5935b-dd84-4b66-bffe-6688dbc2abeb"],
              ["Required Permissions", "User.Read · Sites.ReadWrite.All · Files.ReadWrite.All"],
              ["Token Scope",          "https://graph.microsoft.com/.default"],
              ["Redirect URI",         window.location.origin],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#0B1120", borderRadius: 8, padding: "8px 12px", border: "1px solid #1E293B" }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>{lbl}</div>
                <div style={{ fontSize: 12, color: "#CBD5E1", fontFamily: "monospace" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <CardHeader title="Drawing Register — SharePoint List Columns" />
        <table style={S.tbl}>
          <thead><tr>{["Column","Type","Required","Description"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ["Title",          "Single line", "Yes",  "Drawing title"],
              ["DrawingNumber",  "Single line", "Yes",  "Unique drawing reference e.g. CIV-001-C"],
              ["Revision",       "Choice",      "Yes",  "Current revision letter or number"],
              ["Status",         "Choice",      "Yes",  "IFR / IFC / IFA / As-Built / Superseded / Void"],
              ["Discipline",     "Choice",      "Yes",  "Civil, Structural, Mechanical, etc."],
              ["ProjectName",    "Single line", "Yes",  "Project name or code"],
              ["FileFormat",     "Choice",      "No",   "PDF, DWG, DXF, PNG"],
              ["Tags",           "Multi-choice","No",   "Freeform tags for search"],
              ["UploadedBy",     "Person",      "Auto", "SharePoint fills automatically"],
              ["Modified",       "Date",        "Auto", "SharePoint fills automatically"],
            ].map(([col,type,req,desc]) => (
              <tr key={col} style={S.trow}>
                <td style={S.td}><code style={{ fontFamily:"monospace", background:"#0B1120", padding:"2px 7px", borderRadius:4, color:"#7DD3FC", fontSize:12 }}>{col}</code></td>
                <td style={S.td}>{type}</td>
                <td style={S.td}><span style={{ color: req==="Yes"?"#10B981": req==="Auto"?"#3B82F6":"#64748B", fontWeight:600, fontSize:12 }}>{req}</span></td>
                <td style={{ ...S.td, color: "#94A3B8" }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <CardHeader title="Drawings per Project" />
        <div style={{ padding: "4px 16px 16px" }}>
          {Object.entries(byProject).map(([proj, n]) => (
            <div key={proj} style={S.barRow}>
              <span style={S.barLabel}>🏢 {proj}</span>
              <div style={S.barTrack}><div style={{ ...S.barFill, width: `${(n/drawings.length)*100}%` }} /></div>
              <span style={S.barN}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   UPLOAD MODAL
───────────────────────────────────────────────────────────────── */
function UploadModal({ disciplines, statuses, formats, revisions, projects, user, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "", number: "", rev: "A", status: "IFR",
    discipline: disciplines[0], project: projects[0],
    format: "PDF", size: "", tags: "",
  });
  const [file,    setFile]    = useState(null);
  const [dragging,setDragging]= useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const drop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!form.size) set("size", fmtSize(f.size)); }
  };

  const submit = () => {
    onSubmit({ ...form, author: user.name, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean) });
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHead}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Upload Drawing to SharePoint</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          {/* Drop zone */}
          <div style={{ ...S.dropZone, ...(dragging ? S.dropOn : {}) }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            onClick={() => document.getElementById("__fInput").click()}>
            <input id="__fInput" type="file" style={{ display:"none" }} accept=".pdf,.dwg,.dxf,.png,.jpg,.xlsx"
              onChange={e => { const f = e.target.files[0]; if(f){ setFile(f); set("size", fmtSize(f.size)); }}} />
            <div style={{ fontSize: 32 }}>📁</div>
            <div style={{ color: "#CBD5E1", marginTop: 8, fontWeight: 600 }}>
              {file ? `✅ ${file.name}` : "Drop file here or click to browse"}
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>PDF · DWG · DXF · PNG · XLSX</div>
          </div>

          <div style={S.formGrid}>
            <div style={S.fg}>
              <label style={S.lbl}>Drawing Title *</label>
              <input style={S.input} placeholder="e.g. Foundation Layout – Block A"
                value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Drawing Number *</label>
              <input style={S.input} placeholder="e.g. CIV-001-A"
                value={form.number} onChange={e => set("number", e.target.value)} />
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Revision</label>
              <select style={S.input} value={form.rev} onChange={e=>set("rev",e.target.value)}>
                {revisions.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Status</label>
              <select style={S.input} value={form.status} onChange={e=>set("status",e.target.value)}>
                {statuses.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Discipline</label>
              <select style={S.input} value={form.discipline} onChange={e=>set("discipline",e.target.value)}>
                {disciplines.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Project</label>
              <select style={S.input} value={form.project} onChange={e=>set("project",e.target.value)}>
                {projects.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Format</label>
              <select style={S.input} value={form.format} onChange={e=>set("format",e.target.value)}>
                {formats.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Tags (comma-separated)</label>
              <input style={S.input} placeholder="e.g. foundation, block-a"
                value={form.tags} onChange={e=>set("tags",e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Uploading as <strong style={{ color: "#CBD5E1" }}>{user.name}</strong> → SharePoint library <strong style={{ color: "#7DD3FC" }}>Drawings</strong>
          </div>
        </div>
        <div style={S.modalFoot}>
          <button style={S.btnSec} onClick={onClose}>Cancel</button>
          <button style={S.btnPrimary} disabled={!form.title || !form.number} onClick={submit}>
            📤 Upload to SharePoint
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────────────────────────── */
function StatusBadge({ s }) {
  const m = STATUS_META[s] || { color: "#64748B", bg: "#64748B18" };
  return (
    <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}44`,
      padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {s}
    </span>
  );
}

function RevBadge({ r }) {
  return <span style={{ background: "#1E3A5F", color: "#7DD3FC", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>Rev {r}</span>;
}

function Av({ name, size = 32 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}33`,
      color, display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div style={S.cardHead}>
      <span>{title}</span>
      {action && <button style={S.linkBtn} onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels }) {
  return (
    <select style={{ ...S.fSel, minWidth: 130 }} value={value} onChange={e => onChange(e.target.value)} title={label}>
      {options.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
    </select>
  );
}

function Toast({ msg, type }) {
  const colors = { success: "#10B981", warn: "#F59E0B", info: "#3B82F6", error: "#EF4444" };
  return (
    <div style={{ ...S.toast, background: colors[type] || colors.success }}>
      {msg}
    </div>
  );
}

function ConfirmDialog({ msg, onOk, onCancel }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 380 }}>
        <div style={S.modalHead}><span style={{ fontWeight: 700 }}>Confirm Action</span></div>
        <div style={{ padding: "20px 20px", color: "#CBD5E1", fontSize: 15 }}>{msg}</div>
        <div style={S.modalFoot}>
          <button style={S.btnSec} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btnPrimary, background: "#EF4444" }} onClick={onOk}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function MsLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" style={{ marginRight: 10 }}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────── */
const delay     = (ms) => new Promise(r => setTimeout(r, ms));
const today     = ()   => new Date().toISOString().split("T")[0];
const fmtSize   = (b)  => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1e3).toFixed(0)} KB`;
const prevRev   = (r)  => {
  if (!r || r.length !== 1) return null;
  const c = r.charCodeAt(0);
  return c > 65 ? String.fromCharCode(c - 1) : null;
};

/* ─────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────── */
const C = {
  bg:      "#080F1E",
  surface: "#0E1829",
  card:    "#111D30",
  border:  "#1A2D48",
  text:    "#E2E8F0",
  muted:   "#64748B",
  accent:  "#2563EB",
  accentL: "#3B82F6",
};

const S = {
  root:     { fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.text, fontSize: 14 },
  shell:    { display: "flex", minHeight: "100vh" },

  // Sidebar
  sidebar:  { background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "width 0.2s", overflow: "hidden", flexShrink: 0 },
  sidebarTop: { display: "flex", flexDirection: "column", gap: 0 },
  sidebarBottom: { padding: "12px 8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 4 },
  brand:    { display: "flex", alignItems: "center", gap: 10, padding: "18px 14px", borderBottom: `1px solid ${C.border}` },
  brandIcon:{ fontSize: 20, color: C.accentL, flexShrink: 0 },
  brandName:{ fontWeight: 800, fontSize: 17, color: C.text, whiteSpace: "nowrap", letterSpacing: "-0.3px" },
  sidebarStats: { display: "flex", gap: 0, padding: "10px 14px", borderBottom: `1px solid ${C.border}` },
  sideStat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" },
  sideStatN:{ fontSize: 20, fontWeight: 800, color: C.accentL },
  sideStatL:{ fontSize: 10, color: C.muted, marginTop: 1 },
  navBtn:   { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "transparent", border: "none", color: C.muted, cursor: "pointer", borderRadius: 7, fontSize: 13, width: "100%", textAlign: "left", whiteSpace: "nowrap", transition: "all 0.12s" },
  navBtnOn: { background: `${C.accentL}1A`, color: C.accentL },
  navIco:   { fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 },
  navLbl:   { overflow: "hidden" },
  userPill: { display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", marginBottom: 2 },

  // Main
  mainWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 },
  topbar:   { padding: "14px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  topTitle: { margin: 0, fontSize: 19, fontWeight: 700, color: C.text },
  topSub:   { fontSize: 11, color: C.muted, marginTop: 1 },
  topSearch:{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", color: C.text, fontSize: 13, outline: "none", width: 220 },
  content:  { flex: 1, overflowY: "auto", padding: 22 },

  // Cards
  card:     { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" },
  cardHead: { padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" },

  // Stat grid
  statGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 },
  statCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 16px" },

  // Bars
  barRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  barLabel: { width: 140, fontSize: 13, color: C.muted, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  barTrack: { flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" },
  barFill:  { height: "100%", background: C.accentL, borderRadius: 3, transition: "width 0.5s ease" },
  barN:     { width: 24, textAlign: "right", fontSize: 13, color: C.text, fontWeight: 700 },

  // Table
  tbl:      { width: "100%", borderCollapse: "collapse" },
  th:       { padding: "9px 12px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" },
  trow:     { cursor: "pointer" },
  td:       { padding: "10px 12px", borderBottom: `1px solid ${C.border}1A`, fontSize: 13, color: C.text },
  mono:     { fontFamily: "monospace", color: "#7DD3FC", fontSize: 12 },

  // Filter bar
  filterBar:{ display: "flex", gap: 10, alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" },
  fSel:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", color: C.text, fontSize: 13, outline: "none" },
  iconBtn:  { background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 9px", color: C.muted, cursor: "pointer", fontSize: 14 },

  // Grid view
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 },
  gridCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.12s, border-color 0.12s" },
  gridTop:  { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  gridBody: { padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: 4 },
  gridTitle:{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 },
  gridMeta: { fontSize: 11, color: C.muted },
  gridFooter:{ display: "flex", alignItems: "center", marginTop: 6 },

  // Detail
  detailHeader: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 },
  backBtn:  { background: "none", border: "none", color: C.accentL, cursor: "pointer", fontSize: 14, marginBottom: 12, padding: 0 },
  tabs:     { display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 },
  tab:      { background: "none", border: "none", borderBottom: "2px solid transparent", padding: "9px 18px", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  tabOn:    { color: C.accentL, borderBottom: `2px solid ${C.accentL}` },
  metaRow:  { display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}18` },
  metaLbl:  { width: 130, flexShrink: 0, fontSize: 12, color: C.muted, fontWeight: 600, paddingTop: 1 },
  metaVal:  { color: C.text, fontSize: 14 },
  tag:      { background: `${C.accentL}1A`, color: C.accentL, padding: "2px 8px", borderRadius: 12, fontSize: 11 },
  previewBox:{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 },
  commentCard:{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" },

  // Buttons
  btnPrimary:{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  btnSec:    { background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  trashBtn:  { background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "2px 6px", borderRadius: 4 },
  linkBtn:   { background: "none", border: "none", color: C.accentL, cursor: "pointer", fontSize: 12 },

  // Form
  lbl:      { display: "block", fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 5 },
  input:    { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  textarea: { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 10px", color: C.text, fontSize: 13, boxSizing: "border-box", resize: "vertical", display: "block", marginBottom: 10, outline: "none" },

  // Modal
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal:    { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "92%", maxWidth: 640, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,.6)" },
  modalHead:{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalBody:{ padding: "18px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 },
  modalFoot:{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 },
  closeBtn: { background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" },
  dropZone: { border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", transition: "all 0.18s" },
  dropOn:   { borderColor: C.accentL, background: `${C.accentL}0D` },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  fg:       {},

  // Login
  loginPage:{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, position: "relative", overflow: "hidden" },
  loginGlow:{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #1E3A5F55 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" },
  loginCard:{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "44px 40px", width: "100%", maxWidth: 430, position: "relative", zIndex: 1, boxShadow: "0 40px 100px rgba(0,0,0,.6)" },
  loginBrand:{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 },
  loginIcon: { fontSize: 36, color: C.accentL },
  loginBrandName:{ fontWeight: 800, fontSize: 28, color: C.text, letterSpacing: "-1px" },
  loginSub: { textAlign: "center", color: C.muted, fontSize: 14, marginBottom: 22 },
  loginDivider:{ height: 1, background: C.border, marginBottom: 20 },
  loginPickLabel:{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" },
  userList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
  userBtn:  { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.12s" },
  userBtnActive:{ border: `1px solid ${C.accentL}`, background: `${C.accentL}12` },
  userAv:   { width: 36, height: 36, borderRadius: "50%", background: `${C.accentL}22`, color: C.accentL, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  msBtn:    { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px", background: "#fff", color: "#111", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" },

  // Toast
  toast:    { position: "fixed", top: 18, right: 18, padding: "11px 18px", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.4)", pointerEvents: "none" },

  // Empty
  empty:    { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #080F1E; }
  ::-webkit-scrollbar-thumb { background: #1A2D48; border-radius: 3px; }
  .trow-hover:hover { background: #1A2D4822 !important; }
  .grid-card-hover:hover { transform: translateY(-2px); border-color: #2563EB66 !important; }
  select option { background: #0E1829; color: #E2E8F0; }
  button:disabled { opacity: 0.45; cursor: not-allowed !important; }
`;
