<script>
  let dni = '';
  let password = '';
  let mensaje = '';

  // Usuarios de prueba (sin API todavía)
  const usuarios = [
    { dni: 'archivo.luis.carrillo@gmail.com', password: '12345678Lc', nombre: 'Luis Carrillo' },
    { dni: 'ana@test.com', password: '1234', nombre: 'Ana Perez' }
  ];

  const login = () => {
    const user = usuarios.find(u => u.dni === dni && u.password === password);

    if (user) {
      mensaje = `✅ Bienvenido ${user.nombre}`;
    } else {
      mensaje = '❌ Credenciales inválidas';
    }
  };
</script>

<h1>Login Farma (Demo)</h1>

<form on:submit|preventDefault={login}>
  <input type="text" placeholder="DNI o Correo" bind:value={dni} />
  <input type="password" placeholder="Contraseña" bind:value={password} />
  <button type="submit">Ingresar</button>
</form>

<p>{mensaje}</p>
