import { redirect } from '@sveltejs/kit';

const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

export async function load({ locals: { getSession } }) {
  const session = await getSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  // Hacemos el fetch de los productos
  const response = await fetch(`${API_URL}/medicamentos`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  const productos = response.ok ? await response.json() : [];

  // Devolvemos AMBOS, la sesión y los productos
  return { session, productos };
}