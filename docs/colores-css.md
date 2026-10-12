# Colores de la aplicación

La fuente única de colores es el bloque `:root` de `src/styles.css`. Angular carga este archivo desde `angular.json`; no se importa de nuevo en los componentes.

## Variables principales

| Uso | Variables |
| --- | --- |
| Texto | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse` |
| Fondos | `--surface`, `--surface-page`, `--surface-muted`, `--surface-table` |
| Bordes | `--border-default`, `--border-control`, `--border-strong` |
| Acciones | `--action-primary`, `--action-neutral`, `--action-neutral-hover`, `--action-on-primary` |
| Enlaces y foco | `--link-color`, `--focus-ring` |
| Navegación | `--sidebar-bg`, `--sidebar-text`, `--sidebar-hover`, `--sidebar-active` |
| Estados | `--success-*`, `--danger-*`, `--warning-*`, `--info-*` |
| Gráficas | `--chart-primary`, `--chart-secondary`, `--chart-negative`, `--chart-target` |
| Sombras | `--shadow-color-*` |

Los grupos `--org-*`, `--login-*` y `--dashboard-*` conservan los acentos existentes. La migración mantiene los distintos tonos actuales; no unifica todos los módulos en un solo color.

## Cómo cambiar un color

Edita el valor de la variable en `src/styles.css`. Todos los estilos que usen esa variable se actualizan, incluidos los estilos importados por otros componentes. Los componentes conservan sus tamaños, posiciones y reglas responsive.

```css
/* CSS de un componente: reutiliza las variables globales. */
.boton-principal {
  background: var(--action-primary);
  color: var(--action-on-primary);
  border: 1px solid var(--action-primary);
}

.tarjeta {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.error {
  background: var(--danger-bg-soft);
  color: var(--danger-text);
}
```

## Reglas de mantenimiento

- Elige variables por función, no por su tono: un error usa `--danger-text`, aunque coincida con otro rojo.
- Antes de crear una variable, revisa si ya existe una para esa función.
- Coloca los nuevos valores hexadecimales o RGB únicamente en `:root` y documenta su función. `transparent`, `currentColor` e `inherit` pueden permanecer en los componentes.
- No agregues un `:root` en CSS encapsulado de Angular. Para una excepción local explícita puedes sobrescribir una variable en `:host`, documentando el motivo.
- Las variables se heredan incluso con la encapsulación de Angular; los selectores de cada componente siguen siendo locales.
- Texto y fondos tienen variables separadas. Algunas variables son alias: `--sidebar-bg` parte de `--action-neutral`; puedes asignarle otro valor global si quieres separar la navegación de los botones.
- Al cambiar la paleta, revisa contraste de texto, foco de teclado, botones y estados. Esta migración conserva los valores originales; un cambio posterior de tema requiere su propia revisión visual.

## Comprobaciones realizadas

Se migraron 23 archivos CSS, conservando sus colores mediante comparación de valores resueltos. La compilación de producción pasó. Los avisos de tamaño CSS de Angular siguen presentes en algunos estilos; no se modificaron los límites para ocultarlos.
