<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Venta from '$lib/components/venta.svelte';
  import ListarProducto from '$lib/components/listar-producto.svelte';
  
  let session = null;
  let isChecking = true;

  onMount(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    session = currentSession;

    if (!session) {
      goto('/login');
    } else {
      isChecking = false;
    }
  });

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Bienvenido</h1>

    <div class="flex gap-4">
      <a 
        href="/inventario" 
        class="bg-green-500 hover:bg-green-600 font-semibold py-2 px-4 rounded-lg">
        Inventario
      </a>

      <button 
        on:click={logout} 
        class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">
        Salir
      </button>
    </div>
  </header>

  <main class="p-8 space-y-8">
    {#if isChecking}
      <p class="text-gray-600 font-semibold">Verificando sesión...</p>
    {:else if session}
      <Venta {session} />
      <ListarProducto {session} />
    {/if}
  </main>
</div>
