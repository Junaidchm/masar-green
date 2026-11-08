const KEY = 'masar-referral-invite';

export function pendingReferral(): string | undefined {
  const fromLink = new URLSearchParams(window.location.search).get('ref');
  if (fromLink) {
    const code = fromLink.trim().toUpperCase().slice(0,64);
    try { sessionStorage.setItem(KEY,code); } catch { /* URL remains available for sign-in. */ }
    return code;
  }
  try { return sessionStorage.getItem(KEY) || undefined; } catch { return undefined; }
}

export function clearReferral() {
  try { sessionStorage.removeItem(KEY); } catch { /* Still remove the URL parameter. */ }
  const url = new URL(window.location.href);
  url.searchParams.delete('ref');
  window.history.replaceState(window.history.state,'',`${url.pathname}${url.search}${url.hash}`);
}
