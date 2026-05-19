exports.parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

exports.clearAuthCookies = (res, secure) => {
  const common = ['HttpOnly', 'SameSite=Strict', 'Path=/'];
  if (secure) common.push('Secure');
  res.append('Set-Cookie', `ayla_at=; Max-Age=0; ${common.join('; ')}`);
  res.append('Set-Cookie', `ayla_rt=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/auth/refresh${secure ? '; Secure' : ''}`);
};
