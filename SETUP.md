# Guía de Configuración - Tu Escuela

## Requisitos Previos

- Node.js 18+ instalado
- Una cuenta en [Supabase](https://supabase.com) (plan gratuito es suficiente)
- Una cuenta en [Vercel](https://vercel.com) (plan gratuito) para el deploy

---

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Click en **New Project**
3. Elige un nombre (ej: "mi-colegio") y una contraseña segura para la base de datos
4. Selecciona la región más cercana (ej: South America - São Paulo)
5. Espera a que el proyecto se cree (~2 minutos)

## Paso 2: Crear las Tablas

1. En tu proyecto de Supabase, ve a **SQL Editor** (icono en la barra lateral)
2. Click en **New Query**
3. Copia y pega todo el contenido del archivo `supabase/schema.sql`
4. Click en **Run** (o Ctrl+Enter)
5. Deberías ver "Success. No rows returned" — esto es normal

## Paso 3: (Opcional) Cargar Datos de Ejemplo

Si quieres probar con datos de ejemplo antes de ingresar los reales:

1. En el SQL Editor, crea otro New Query
2. Copia y pega el contenido de `supabase/seed.sql`
3. Click en Run

## Paso 4: Crear el Usuario Director

1. En Supabase, ve a **Authentication** > **Users**
2. Click en **Add User** > **Create New User**
3. Ingresa:
   - Email: el correo del director (ej: `director@micolegio.edu.pe`)
   - Password: una contraseña segura
   - Marca **Auto Confirm User**
4. Click en **Create User**
5. Copia el **User UID** que aparece (lo necesitarás)
6. Ve a **Table Editor** > tabla **profiles**
7. Busca el registro que se creó automáticamente y edita:
   - `name`: Nombre completo del director
   - `role`: `director`
   - `status`: `active`

## Paso 5: Crear Usuarios Profesores

Repite el paso 4 para cada profesor, pero en el paso 7 usa `role: profesor`.

## Paso 6: Configurar la Aplicación

1. En Supabase, ve a **Settings** > **API**
2. Copia estos valores:
   - **Project URL** (ej: `https://abc123.supabase.co`)
   - **anon public key** (la clave que empieza con `eyJ...`)

3. En la raíz del proyecto, crea el archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-anon-key-aqui
```

4. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

5. Inicia sesión con el correo y contraseña del director

## Paso 7: Configurar Recuperación de Contraseña

1. En Supabase, ve a **Authentication** > **Email Templates**
2. En la plantilla **Reset Password**, personaliza:
   - Subject: `Recupera tu contraseña - Mi Colegio`
   - Body: Personaliza el mensaje con el nombre de tu colegio
3. Ve a **Authentication** > **URL Configuration**
4. En **Site URL**, ingresa la URL de tu app desplegada (ej: `https://mi-colegio.vercel.app`)
5. En **Redirect URLs**, agrega: `https://mi-colegio.vercel.app/reset-password`

## Paso 8: Deploy en Vercel

### Opción A: Desde GitHub (Recomendado)

1. Sube el código a un repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
3. Click en **Add New** > **Project**
4. Selecciona tu repositorio
5. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
6. Click en **Deploy**
7. En ~1 minuto tendrás tu URL (ej: `mi-colegio.vercel.app`)

### Opción B: Deploy Manual

```bash
npm install -g vercel
vercel login
vercel --prod
```

Cuando pregunte por variables de entorno, ingresa las de Supabase.

---

## Verificación

Una vez desplegado, verifica que:

- [ ] Puedes iniciar sesión como director
- [ ] Puedes crear profesores desde Roles
- [ ] Los profesores pueden iniciar sesión
- [ ] Los datos se guardan al recargar la página
- [ ] "¿Olvidaste tu contraseña?" envía el correo

## Modo Demo

Si NO configuras las variables de entorno, la app funciona en **modo demo** con datos de ejemplo precargados. Esto es útil para presentaciones o pruebas sin necesidad de Supabase.

Credenciales demo:
- Director: `director@tuescuela.edu.pe` / `admin`
- Profesor: `cmendoza@tuescuela.edu.pe` / `admin`

---

## Soporte

Si tienes problemas con la configuración, revisa:

1. Que las variables de entorno estén correctas (sin espacios extra)
2. Que el schema.sql se haya ejecutado sin errores
3. Que el usuario director tenga `role: director` en la tabla profiles
4. La consola del navegador (F12) para errores de conexión
