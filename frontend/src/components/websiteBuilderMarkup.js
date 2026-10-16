const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function generateWebsiteMarkup(elements) {
  const body = elements
    .map(({ type, content }) => {
      const text = escapeHtml(content);
      if (type === "button") return `  <button type="button">${text}</button>`;
      if (type === "image") {
        return `  <div role="img" aria-label="Imagen: ${text}">[Imagen: ${text}]</div>`;
      }
      return `  <p>${text}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi sitio</title>
</head>
<body>
  <main>
${body}
  </main>
</body>
</html>`;
}
