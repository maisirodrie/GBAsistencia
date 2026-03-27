import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captura el elemento DOM del cartón de frecuencia y lo exporta como PDF.
 * @param {HTMLElement} elemento - El div #cartao-pdf-wrapper fuera de pantalla.
 * @param {string} nombreAlumno - Para nombrar el archivo descargado.
 */
export const generarPDFCartao = async (elemento, nombreAlumno = "alumno") => {
  if (!elemento) {
    alert("No se encontró el cartón para imprimir.");
    return;
  }

  // Mover el elemento temporalmente a una posición visible para html2canvas
  const originalLeft = elemento.parentElement.style.left;
  elemento.parentElement.style.left = "0px";

  // Esperar a que las imágenes estén cargadas
  const imgs = Array.from(elemento.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((r) => { img.onload = r; img.onerror = r; })
    )
  );

  // Esperar un frame para que el navegador pinte
  await new Promise((r) => requestAnimationFrame(r));

  const canvas = await html2canvas(elemento, {
    scale:           3,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: null,
    logging:         false,
    imageTimeout:    5000,
  });

  // Restaurar posición fuera de pantalla
  elemento.parentElement.style.left = originalLeft;

  const imgData = canvas.toDataURL("image/png");
  const pxW     = canvas.width  / 3;
  const pxH     = canvas.height / 3;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit:        "px",
    format:      [pxW, pxH],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pxW, pxH);
  pdf.save(`Carton_${nombreAlumno.replace(/\s+/g, "_")}.pdf`);
};
