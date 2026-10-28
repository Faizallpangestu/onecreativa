export function clearLoginCache() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("cached_access_accounts_") || key === "lpk_users") localStorage.removeItem(key);
  }
}

export function sessionUser(payload) {
  if (payload?.status !== "success" || !payload.actor?.id || !payload.actor?.role) {
    throw new Error("Respons sesi login tidak valid.");
  }
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem("user")); } catch { /* Discard invalid cached identity. */ }
  const actor = payload.actor;
  const { role, ...profile } = actor;
  const user = {
    ...(String(cached?.id) === String(actor.id) ? cached : {}),
    ...profile,
    role_name: role,
  };
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}
