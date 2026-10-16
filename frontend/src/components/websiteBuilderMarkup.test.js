import { generateWebsiteMarkup } from "./websiteBuilderMarkup";

test("generates readable markup for text, buttons, and image placeholders", () => {
  const markup = generateWebsiteMarkup([
    { type: "text", content: "Hola" },
    { type: "button", content: "Continuar" },
    { type: "image", content: "Paisaje" },
  ]);

  expect(markup).toContain("<p>Hola</p>");
  expect(markup).toContain('<button type="button">Continuar</button>');
  expect(markup).toContain('<div role="img" aria-label="Imagen: Paisaje">[Imagen: Paisaje]</div>');
});

test("escapes user content before including it in markup", () => {
  const markup = generateWebsiteMarkup([
    { type: "text", content: `<script>alert("hola")</script> & '` },
  ]);

  expect(markup).toContain("&lt;script&gt;alert(&quot;hola&quot;)&lt;/script&gt; &amp; &#39;");
  expect(markup).not.toContain("<script>");
});
