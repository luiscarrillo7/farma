<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Venta from '$lib/components/venta.svelte';

  let session = null;

  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (!session) goto('/login');
  });

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
  <h1 class="text-2xl font-bold">Bienvenido</h1>
  <button on:click={logout} class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">Salir</button>
</header>

<main class="p-8 text-center">
  <Venta {session} />
</main>
