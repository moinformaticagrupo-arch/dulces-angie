DULCES ANGIE PREMIUM + PANEL DE ADMINISTRACIÓN
================================================

IMPORTANTE
Esta carpeta ya incluye la tienda, el panel admin.html, y las reglas SQL. Para que el panel funcione en producción, tenés que conectar tu propio proyecto Supabase. No se puede activar el almacenamiento compartido hasta completar estos pasos.

1. CREAR EL PROYECTO
- Entrá en https://supabase.com/ y creá un proyecto.
- En Project Settings > API copiá Project URL y la clave anon/public.
- Abrí supabase-config.js y reemplazá TU-PROYECTO y TU-ANON-KEY.
- Usá únicamente la clave pública anon/publishable. NUNCA pongas service_role/secret en los archivos del sitio.

2. CONFIGURAR LA BASE Y SEGURIDAD
- En Supabase abrí SQL Editor > New query.
- Copiá y ejecutá todo el archivo supabase-setup.sql.
- Las tablas usan RLS y las escrituras solo se permiten a los UUID incluidos en public.admin_users.

3. CREAR LA CUENTA PRIVADA DE ANGIE
- En Authentication > Sign In / Providers, dejá Email habilitado.
- Desactivá los registros públicos (Allow new users to sign up).
- En Authentication > Users, agregá manualmente el usuario con este correo: admin@gmail.com.
- Establecé allí la contraseña que elegiste para Angie (la que compartiste en el chat). Por seguridad, no se guarda la contraseña en los archivos de la web ni en este ZIP.
- Copiá el UUID del usuario creado.
- En SQL Editor ejecutá: insert into public.admin_users (user_id) values ('PEGAR-UUID-REAL-AQUI');
- Nunca compartas esa contraseña por el código ni la publiques en la web.

4. PUBLICAR
- Subí TODOS los archivos de esta carpeta al mismo directorio de tu hosting: index.html, style.css, app.js, supabase-config.js, admin.html, admin.css, admin.js.
- No publiques supabase-setup.sql si no querés, aunque no contiene claves secretas.
- La tienda está en index.html.
- El panel está en /admin.html. El acceso se valida en Supabase y RLS bloquea modificaciones de cualquier usuario que no sea administrador.

5. ADMINISTRAR
- Entrá a /admin.html. El correo admin@gmail.com ya aparece completado; ingresá la contraseña configurada en Supabase e iniciá sesión.
- Podés agregar productos, poner o cambiar precios, cambiar descripción, etiqueta, subir foto, publicar/ocultar y eliminar.
- Los productos y precios guardados se leen desde Supabase y se actualizan para todos los visitantes. Las fotos se guardan en el bucket product-images.

WHATSAPP
El número configurado es 5493815145977 (Argentina), equivalente al número que nos diste: 3815145977.

NOTAS
- Si todavía no configuraste Supabase, la tienda muestra productos de ejemplo y el panel no permitirá entrar.
- Las claves públicas anon/publishable están pensadas para estar en frontend; la seguridad depende de las políticas RLS incluidas en el SQL.
- Probá primero en una copia o entorno de prueba y verificá el acceso después de crear el usuario administrador.
