<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Venta from '$lib/components/venta.svelte';
  import ListarProducto from '$lib/components/listar-producto.svelte';

  let session = $state(null);
  
  // 1. Creamos el estado que controlará si el modal de venta está abierto
  let isVentaModalOpen = $state(false);

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
  <button onclick={logout} class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">Salir</button>
</header>

{#if session}
  <Venta 
    {session} 
    open={isVentaModalOpen} 
    on:close={() => isVentaModalOpen = false} 
  />
{/if}

<main class="p-8 space-y-8">
  <div class="text-center">
    <button 
      onclick={() => isVentaModalOpen = true}
      class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
    >
      🛒 Registrar Nueva Venta
    </button>
  </div>
  
  {#if session}
    <ListarProducto {session} />
  {/if}
</main>