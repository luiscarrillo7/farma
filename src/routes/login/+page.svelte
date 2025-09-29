<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = $state("");
  let password = $state("");
  let message = $state("");
  let isLoading = $state(false);
  
  // NUEVO: Prevenir múltiples intentos rápidos
  let lastAttempt = 0;
  const MIN_ATTEMPT_DELAY = 2000; // 2 segundos entre intentos

  async function login(e) {
    e.preventDefault();
    
    // OPTIMIZACIÓN: Rate limiting en el cliente
    const now = Date.now();
    if (now - lastAttempt < MIN_ATTEMPT_DELAY) {
      message = "⏳ Por favor espere antes de intentar nuevamente";
      return;
    }
    
    // OPTIMIZACIÓN: Prevenir múltiples clics
    if (isLoading) {
      return;
    }
    
    lastAttempt = now;
    isLoading = true;
    message = "Procesando...";
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        message = "❌ Credenciales inválidas";
        console.error("Error login:", error.message);
      } else {
        console.log("✅ Login correcto:", data);
        goto("/dashboard");
      }
    } catch (err) {
      message = "❌ Error de conexión. Intente nuevamente.";
      console.error("Error inesperado:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
    <h2 class="text-3xl font-bold text-center text-blue-800 mb-6">Ingreso al Sistema</h2>
    <form onsubmit={login} class="space-y-4">
      <input 
        type="email" 
        bind:value={email} 
        placeholder="Correo Electrónico"
        class="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none" 
        required 
        disabled={isLoading}
      />
      <input 
        type="password" 
        bind:value={password} 
        placeholder="Contraseña"
        class="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none" 
        required 
        disabled={isLoading}
      />
      <button 
        type="submit"
        disabled={isLoading}
        class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "⏳ Procesando..." : "Ingresar"}
      </button>
    </form>
    {#if message}
      <div class="text-center font-bold mt-4 {message.includes('❌') ? 'text-red-600' : 'text-gray-600'}">
        {message}
      </div>
    {/if}
  </div>
</div>