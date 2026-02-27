import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captura el elemento DOM del cartón de frecuencia y lo exporta como PDF.
 * @param {HTMLElement} elemento - El div del CartaoFrequencia renderizado en pantalla.
 * @param {string} nombreAlumno - Para nombrar el archivo descargado.
 */
export const generarPDFCartao = async (elemento, nombreAlumno = "alumno") => {
  if (!elemento) {
    alert("No se encontró el cartón para imprimir.");
    return;
  }

  // Capturar el elemento como imagen en alta resolución
  const canvas = await html2canvas(elemento, {
    scale: 2,          // 2x resolución para mejor calidad
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  const imgData   = canvas.toDataURL("image/jpeg", 0.95);
  const imgWidth  = canvas.width;
  const imgHeight = canvas.height;

  // Orientación landscape para que quepa el cartón apaisado
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [imgWidth / 2, imgHeight / 2],
  });

  pdf.addImage(imgData, "JPEG", 0, 0, imgWidth / 2, imgHeight / 2);
  pdf.save(`Carton_${nombreAlumno.replace(/\s+/g, "_")}.pdf`);
};
