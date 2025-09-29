<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Venta from '$lib/components/venta.svelte';
  import ListarProducto from '$lib/components/listar-producto.svelte';

  // 1. ESTA ES LA FORMA CORRECTA EN SVELTE 5
  // Obtenemos 'data' (que viene de tu +page.server.js) usando $props()
  let { data } = $props();

  // 2. Extraemos la sesión y los productos de 'data'
  const { session, productos } = data;

  // 3. Ya no necesitamos pedir la sesión desde el cliente. La borramos.
  
  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Bienvenido</h1>
    <button onclick={logout} class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">Salir</button>
  </header>

  <main class="p-8 space-y-8">
    {#if session}
      <Venta {session} />
      <ListarProducto {session} {productos} />
    {/if}
  </main>
</div>