"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, Crown, UserPlus, Trash2, Edit3,
  Loader2, Eye, EyeOff, Key, Store, Check, X,
  ChevronDown, ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  getUsers, createUser, deleteUser, toggleUserActive,
  changeUserRole, assignRestaurantToUser, getAllRestaurants,
  resetUserPassword,
} from "@/actions/user";

type User = Awaited<ReturnType<typeof getUsers>>[number];
type Restaurant = Awaited<ReturnType<typeof getAllRestaurants>>[number];

const roleLabels: Record<string, string> = {
  ADMIN: "مدير النظام",
  RESTAURANT_OWNER: "مالك مطعم",
  STAFF: "موظف",
};

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "#fef3c7", text: "#d97706" },
  RESTAURANT_OWNER: { bg: "#dbeafe", text: "#2563eb" },
  STAFF: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersData, restaurantsData] = await Promise.all([
      getUsers(),
      getAllRestaurants(),
    ]);
    setUsers(usersData);
    setAllRestaurants(restaurantsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟ سيتم حذف جميع بياناته.`)) return;
    setActionLoading(userId);
    const result = await deleteUser(userId);
    if (result.success) loadData();
    else alert(result.error || "خطأ");
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: string) => {
    setActionLoading(userId);
    const result = await toggleUserActive(userId);
    if (result.success) loadData();
    else alert(result.error || "خطأ");
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    const result = await changeUserRole(userId, role);
    if (result.success) loadData();
    else alert(result.error || "خطأ");
    setActionLoading(null);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #e57328, #d4641c)", color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#e57328" }} />
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const ownerCount = users.filter(u => u.role === "RESTAURANT_OWNER").length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>المستخدمين</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <button onClick={() => setShowCreateDialog(true)} style={btnPrimary}>
          <UserPlus style={{ width: 16, height: 16 }} /> إضافة مستخدم
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
        {[
          { label: "مديري النظام", count: adminCount, icon: Shield, color: "#d97706", bg: "#fffbeb" },
          { label: "ملاك المطاعم", count: ownerCount, icon: Crown, color: "#2563eb", bg: "#eff6ff" },
          { label: "نشط / الإجمالي", count: `${activeCount}/${users.length}`, icon: Users, color: "#10b981", bg: "#ecfdf5" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
            padding: 20, display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: stat.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <stat.icon style={{ width: 22, height: 22, color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{stat.count}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#fafafa" }}>
                <th style={{ textAlign: "right", padding: "14px 20px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>المستخدم</th>
                <th style={{ textAlign: "right", padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الدور</th>
                <th style={{ textAlign: "center", padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الحالة</th>
                <th style={{ textAlign: "right", padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>المطاعم</th>
                <th style={{ textAlign: "right", padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>تاريخ الانضمام</th>
                <th style={{ textAlign: "center", padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const rc = roleColors[user.role] || roleColors.STAFF;
                const isLoading = actionLoading === user.id;
                return (
                  <tr key={user.id} style={{
                    borderBottom: "1px solid rgba(0,0,0,0.03)",
                    opacity: user.isActive ? 1 : 0.5,
                    background: user.isActive ? "transparent" : "#fafafa",
                  }}>
                    {/* User Info */}
                    <td style={{ padding: "14px 20px" }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: user.isActive ? "linear-gradient(135deg, #e57328, #d4641c)" : "#d1d5db",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 16, fontWeight: 700,
                        }}>
                          {user.name?.charAt(0) || "م"}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                            {user.name}
                            {!user.isActive && <span style={{ fontSize: 10, color: "#ef4444", marginRight: 6 }}>🚫 معطّل</span>}
                          </p>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{user.email}</p>
                          {user.phone && <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{user.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isLoading}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 8,
                          background: rc.bg, color: rc.text, border: "none", cursor: "pointer",
                          appearance: "auto",
                        }}
                      >
                        <option value="ADMIN">مدير النظام</option>
                        <option value="RESTAURANT_OWNER">مالك مطعم</option>
                        <option value="STAFF">موظف</option>
                      </select>
                    </td>

                    {/* Active Status */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        disabled={isLoading}
                        title={user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: user.isActive ? "#10b981" : "#ef4444",
                          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {user.isActive
                          ? <><ToggleRight style={{ width: 22, height: 22 }} /> نشط</>
                          : <><ToggleLeft style={{ width: 22, height: 22 }} /> معطّل</>
                        }
                      </button>
                    </td>

                    {/* Restaurants */}
                    <td style={{ padding: "14px 16px" }}>
                      {user.restaurants.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {user.restaurants.map((r) => (
                            <span key={r.id} style={{ fontSize: 12, color: "#374151" }}>🍽️ {r.nameAr}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                      )}
                      <button
                        onClick={() => setShowAssignDialog(user.id)}
                        style={{
                          fontSize: 10, color: "#3b82f6", background: "none",
                          border: "none", cursor: "pointer", padding: "2px 0", fontWeight: 600,
                        }}
                      >
                        + تعيين مطعم
                      </button>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                      {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div className="flex items-center justify-center gap-1">
                        {/* Reset Password */}
                        <button
                          onClick={() => setShowPasswordDialog(user.id)}
                          style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key style={{ width: 15, height: 15 }} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id, user.name || "المستخدم")}
                          disabled={isLoading}
                          style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}
                          title="حذف المستخدم"
                        >
                          {isLoading ? <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ Create User Dialog ═══════ */}
      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          onSave={() => { setShowCreateDialog(false); loadData(); }}
        />
      )}

      {/* ═══════ Reset Password Dialog ═══════ */}
      {showPasswordDialog && (
        <ResetPasswordDialog
          userId={showPasswordDialog}
          onClose={() => setShowPasswordDialog(null)}
        />
      )}

      {/* ═══════ Assign Restaurant Dialog ═══════ */}
      {showAssignDialog && (
        <AssignRestaurantDialog
          userId={showAssignDialog}
          restaurants={allRestaurants}
          onClose={() => setShowAssignDialog(null)}
          onSave={() => { setShowAssignDialog(null); loadData(); }}
        />
      )}
    </div>
  );
}

/* ─── Create User Dialog ─── */
function CreateUserDialog({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("RESTAURANT_OWNER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const result = await createUser({ name, email, password, phone, role });
    setLoading(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || "خطأ");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus style={{ width: 20, height: 20, color: "#e57328" }} /> إضافة مستخدم جديد
        </h3>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16, padding: "8px 12px", borderRadius: 8, background: "#fef2f2" }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الاسم الكامل *</label>
            <input style={inputStyle} placeholder="مثال: أحمد محمد" value={name} onChange={(e) => setName(e.target.value)} dir="rtl" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>البريد الإلكتروني *</label>
            <input style={inputStyle} type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>كلمة المرور *</label>
            <input style={inputStyle} type="text" placeholder="كلمة مرور قوية" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>رقم الهاتف</label>
            <input style={inputStyle} type="tel" placeholder="+962..." value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الدور</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="RESTAURANT_OWNER">مالك مطعم</option>
              <option value="ADMIN">مدير النظام</option>
              <option value="STAFF">موظف</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 28 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !email.trim() || !password.trim()}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              background: (name && email && password) ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
              color: (name && email && password) ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            إضافة المستخدم
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reset Password Dialog ─── */
function ResetPasswordDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) { alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    setLoading(true);
    const result = await resetUserPassword(userId, password);
    setLoading(false);
    if (result.success) {
      alert("✅ تم تغيير كلمة المرور بنجاح");
      onClose();
    } else {
      alert(result.error || "خطأ");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <Key style={{ width: 20, height: 20, color: "#e57328" }} /> إعادة تعيين كلمة المرور
        </h3>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>كلمة المرور الجديدة</label>
          <input style={inputStyle} type="text" placeholder="أدخل كلمة المرور الجديدة" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoFocus />
        </div>
        <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
          <button
            onClick={handleSubmit}
            disabled={loading || password.length < 6}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              background: password.length >= 6 ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
              color: password.length >= 6 ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            تغيير
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Restaurant Dialog ─── */
function AssignRestaurantDialog({ userId, restaurants, onClose, onSave }: {
  userId: string;
  restaurants: Restaurant[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    const result = await assignRestaurantToUser(userId, selectedRestaurant);
    setLoading(false);
    if (result.success) onSave();
    else alert(result.error || "خطأ");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <Store style={{ width: 20, height: 20, color: "#e57328" }} /> تعيين مطعم للمستخدم
        </h3>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اختر المطعم</label>
          <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)} style={inputStyle}>
            <option value="">— اختر مطعم —</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameAr} {r.userId ? "(مُعيّن)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedRestaurant}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              background: selectedRestaurant ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
              color: selectedRestaurant ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            تعيين
          </button>
        </div>
      </div>
    </div>
  );
}
