<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Venta from '$lib/components/venta.svelte';
  import ListarProducto from '$lib/components/listar-producto.svelte';
  
  let session = $state(null);

  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (!session) goto('/login');
  });

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }

  function irInventario() {
    goto('/inventario');
  }
  
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Bienvenido</h1>

    <div class="flex gap-4">
      <button 
        onclick={irInventario} 
        class="bg-green-500 hover:bg-green-600 font-semibold py-2 px-4 rounded-lg">
        Inventario
      </button>

      <button 
        onclick={logout} 
        class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">
        Salir
      </button>
    </div>
  </header>

  <main class="p-8 space-y-8">
    {#if session}
      <Venta {session} />
      <ListarProducto {session} />
    {/if}
  </main>
</div>
