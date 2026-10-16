import React, { useState } from "react";
import { Code2, ImagePlus, Plus, Trash2, Type } from "lucide-react";
import { generateWebsiteMarkup } from "@/components/websiteBuilderMarkup";
import "./WebsiteBuilder.css";

const STARTER_ELEMENTS = [
  { id: 1, type: "text", content: "¡Hola! Este es tu sitio." },
  { id: 2, type: "button", content: "Conocer más" },
  { id: 3, type: "image", content: "Una imagen de ejemplo" },
];

const ELEMENT_LABELS = {
  text: "Texto",
  button: "Botón",
  image: "Imagen",
};

export function WebsiteBuilder() {
  const [elements, setElements] = useState(STARTER_ELEMENTS);
  const [nextId, setNextId] = useState(4);
  const markup = generateWebsiteMarkup(elements);

  const addElement = (type) => {
    setElements((current) => [
      ...current,
      { id: nextId, type, content: ELEMENT_LABELS[type] === "Imagen" ? "Describe tu imagen" : `Nuevo ${ELEMENT_LABELS[type].toLowerCase()}` },
    ]);
    setNextId((id) => id + 1);
  };

  const updateElement = (id, content) => {
    setElements((current) =>
      current.map((element) => (element.id === id ? { ...element, content } : element)),
    );
  };

  const removeElement = (id) => {
    setElements((current) => current.filter((element) => element.id !== id));
  };

  return (
    <div className="builder-page">
      <div className="builder-intro">
        <div>
          <p className="builder-eyebrow">UN PRIMER PASO, SIN CÓDIGO</p>
          <h1>Tu sitio, a tu manera</h1>
          <p>Agregá elementos y editá sus textos. El código se actualiza mientras diseñás.</p>
        </div>
        <span className="builder-live"><span aria-hidden="true" /> Actualización en vivo</span>
      </div>

      <div className="builder-panes">
        <section className="builder-code-pane" aria-labelledby="builder-code-title">
          <div className="builder-pane-heading">
            <div>
              <span className="builder-pane-kicker">PANEL 1 · CÓDIGO</span>
              <h2 id="builder-code-title"><Code2 aria-hidden="true" size={18} /> Tu código</h2>
            </div>
            <span className="builder-file-label">index.html</span>
          </div>
          <p className="builder-pane-help">Este HTML cambia automáticamente con tu diseño.</p>
          <pre className="builder-code" aria-label="Código HTML generado"><code>{markup}</code></pre>
        </section>

        <section className="builder-editor-pane" aria-labelledby="builder-editor-title">
          <div className="builder-pane-heading">
            <div>
              <span className="builder-pane-kicker">PANEL 2 · DISEÑO</span>
              <h2 id="builder-editor-title">Tu página</h2>
            </div>
          </div>
          <div className="builder-add-controls" aria-label="Agregar elementos">
            <button type="button" onClick={() => addElement("text")}><Plus size={16} aria-hidden="true" /><Type size={16} aria-hidden="true" /> Texto</button>
            <button type="button" onClick={() => addElement("button")}><Plus size={16} aria-hidden="true" /> Botón</button>
            <button type="button" onClick={() => addElement("image")}><Plus size={16} aria-hidden="true" /><ImagePlus size={16} aria-hidden="true" /> Imagen</button>
          </div>

          <div className="builder-canvas">
            <div className="builder-canvas-bar"><span /><span /><span /> Vista previa</div>
            <div className="builder-preview">
              {elements.map((element) => (
                <div className={`builder-preview-item builder-preview-${element.type}`} key={element.id}>
                  {element.type === "button" ? (
                    <button type="button" tabIndex={-1}>{element.content || "Botón"}</button>
                  ) : element.type === "image" ? (
                    <div role="img" aria-label={`Imagen: ${element.content || "sin descripción"}`}>
                      <ImagePlus size={22} aria-hidden="true" />
                      <span>{element.content || "Describe tu imagen"}</span>
                    </div>
                  ) : (
                    <p>{element.content || "Tu texto aparecerá aquí"}</p>
                  )}
                </div>
              ))}
              {elements.length === 0 && (
                <p className="builder-empty">Tu página está vacía. Elegí un elemento para empezar.</p>
              )}
            </div>
          </div>

          <div className="builder-fields">
            <h3>Editá tus elementos</h3>
            {elements.map((element, index) => (
              <div className="builder-field" key={element.id}>
                <label htmlFor={`builder-element-${element.id}`}>
                  {ELEMENT_LABELS[element.type]} {index + 1}
                </label>
                <div className="builder-field-control">
                  <textarea
                    id={`builder-element-${element.id}`}
                    rows={2}
                    value={element.content}
                    onChange={(event) => updateElement(element.id, event.target.value)}
                    aria-label={`Editar ${ELEMENT_LABELS[element.type].toLowerCase()} ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="builder-remove"
                    onClick={() => removeElement(element.id)}
                    aria-label={`Quitar ${ELEMENT_LABELS[element.type].toLowerCase()} ${index + 1}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
