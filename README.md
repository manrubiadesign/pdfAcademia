# Estudio con PDFs 📚✨

Aplicación Full-Stack para chatear con documentos PDF, generar exámenes interactivos y estudiar con tarjetas de memoria (flashcards), con citas rigurosas de página y verificación estricta contra alucinaciones.

---

## 🚀 Funcionalidades Implementadas

1. **Gestor y Extracción de PDFs**:
   - Subida mediante arrastrar y soltar (drag & drop) o selector de archivos.
   - Extracción de texto página por página en el navegador mediante `pdf.js`.
   - Detección automática y alerta ante PDFs escaneados o sin texto seleccionable.
   - Medidor en tiempo real de capacidad de caracteres (`~300.000` recomendados).

2. **Preguntas (Chat con Citas Estrictas)**:
   - Respuestas basadas **únicamente** en los documentos subidos.
   - Formato de citación estricta de fuente: `[NombreDocumento.pdf, pág. X]`.
   - Si la información no aparece en los PDFs, la IA responde honestamente en lugar de inventar.
   - Soporte para nueva conversación y sugerencias rápidas.

3. **Generador y Corrector de Exámenes**:
   - **Tipo Test (4 opciones)** con una correcta y corrección automática.
   - **Verdadero / Falso** con justificación y cita de página.
   - **Respuesta Corta** con redacción del alumno y evaluación inteligente por IA frente a una respuesta modelo.
   - Selector de **5 a 15 preguntas**, dificultad (**Fácil, Media, Difícil**) y tema opcional.
   - Botón **"Repasar falladas"** para reabrir y practicar solo los fallos hasta dominarlos.
   - Botón **"Descargar / Imprimir examen"** con diseño optimizado para papel o PDF nativo.

4. **Tarjetas de Estudio (Flashcards)**:
   - Generación de **8, 12 o 20 tarjetas** con conceptos clave.
   - Efecto **flip 3D** al tocar o hacer clic.
   - Navegación, barra de progreso y botón de **Barajar (Shuffle)**.
   - Marcador de **"Dominada / Aprendida"** con animación de confeti.

5. **Guardado Automático y Privacidad**:
   - Persistencia local en **IndexedDB** (sin el límite de 5MB de LocalStorage) para conservar documentos, historial y exámenes entre sesiones de forma privada.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **PDF Engine**: `pdfjs-dist` (extracción estructurada por páginas)
- **Motor de IA**: Google Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`)
- **Efectos y Gamificación**: `canvas-confetti`
- **Almacenamiento**: IndexedDB nativo del navegador

---

## ⚙️ Configuración de la API Key de Gemini

Puedes configurarla de dos formas muy sencillas:

1. **En la propia aplicación**: Haz clic en el icono de **engranaje ⚙️** en la esquina superior derecha e introduce tu clave de API de Gemini. Se guardará de forma segura en tu navegador.
2. **O mediante archivo `.env.local`**:
   ```bash
   GEMINI_API_KEY=tu_clave_aqui
   ```
   *(Puedes obtener una clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey))*.

---

## 🏃‍♂️ Ejecución

El servidor de desarrollo ya está activo en:
```
http://localhost:3000
```

Si deseas iniciarlo manualmente en cualquier momento:
```bash
npm run dev
```
