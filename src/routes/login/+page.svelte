<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = "";
  let password = "";
  let message = "";

  async function login(e) {
    e.preventDefault();
    message = "Procesando...";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      message = "❌ Credenciales incorrectas.";
      console.error("Error de login:", error.message);
    } else {
      console.log("✅ Login exitoso:", data.user);
      message = `Bienvenido ${data.user.email}`;
      goto("/dashboard"); // redirige
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
    <h2 class="text-3xl font-bold text-center text-blue-800 mb-6">Ingreso al Sistema</h2>
    <form on:submit={login} class="space-y-4">
      <input type="email" bind:value={email} placeholder="Correo Electrónico" class="w-full px-4 py-2 border-2 rounded-lg" required />
      <input type="password" bind:value={password} placeholder="Contraseña" class="w-full px-4 py-2 border-2 rounded-lg" required />
      <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Ingresar</button>
    </form>
    <div class="text-center font-bold mt-4">{message}</div>
  </div>
</div>
