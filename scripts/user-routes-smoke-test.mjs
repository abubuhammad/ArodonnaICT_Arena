const baseUrl = 'http://localhost:3000';
const email = 'smoke.user@example.com';
const password = 'Password123!';

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: res.status, body };
}

async function main() {
  const login = await request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  console.log('LOGIN_STATUS', login.status);
  console.log('LOGIN_BODY', JSON.stringify(login.body, null, 2));

  const token = login.body.token;
  if (!token) {
    throw new Error('No token returned from login');
  }

  const me = await request('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('ME_STATUS', me.status);
  console.log('ME_BODY', JSON.stringify(me.body, null, 2));

  const stats = await request('/api/users/student/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('STATS_STATUS', stats.status);
  console.log('STATS_BODY', JSON.stringify(stats.body, null, 2));

  const enrolled = await request('/api/users/student/courses/enrolled', {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('ENROLLED_STATUS', enrolled.status);
  console.log('ENROLLED_BODY', JSON.stringify(enrolled.body, null, 2));

  const certificates = await request('/api/users/student/certificates', {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('CERTIFICATES_STATUS', certificates.status);
  console.log('CERTIFICATES_BODY', JSON.stringify(certificates.body, null, 2));

  const profile = await request(`/api/users/${me.body.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('PROFILE_STATUS', profile.status);
  console.log('PROFILE_BODY', JSON.stringify(profile.body, null, 2));

  const update = await request(`/api/users/${me.body.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Smoke User Updated',
      title: 'Product Lead',
      bio: 'Updated via smoke test',
      avatar: '/images/default-avatar.png',
      isAvailableForCall: true,
      expertise: ['Next.js', 'Prisma'],
      socialLinks: { linkedin: 'https://example.com' },
    }),
  });

  console.log('UPDATE_STATUS', update.status);
  console.log('UPDATE_BODY', JSON.stringify(update.body, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
