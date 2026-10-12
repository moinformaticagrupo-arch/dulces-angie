CAMBIOS INCLUIDOS EN ESTA VERSIÓN
--------------------------------
- Cada producto de la tienda ahora tiene los botones "Especificaciones",
  "Consultar" y "Pedir".
- "Especificaciones" abre una ventana con foto, nombre, descripción, precio
  y acceso a WhatsApp.
- "Consultar" y "Pedir" preparan un mensaje de WhatsApp con el producto.
- El catálogo sigue escuchando cambios de Supabase Realtime y además consulta
  periódicamente el catálogo (cada 15 segundos) mientras la pestaña está visible.
  Esto sirve como respaldo si Realtime no está habilitado.
- Se conservó el diseño, los archivos de administración y la configuración actual.

IMPORTANTE
----------
Para que los cambios se compartan entre todos los visitantes, el panel y la
tienda deben usar el mismo proyecto Supabase, y las tablas/políticas deben estar
configuradas ejecutando supabase-setup.sql. El refresco de respaldo puede tardar
hasta unos 15 segundos. Si el navegador mantiene una copia antigua, hacé una
recarga forzada (Ctrl+F5) una sola vez después de publicar.
