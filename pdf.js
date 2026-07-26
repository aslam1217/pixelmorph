// ======================================
// pdf.js
// ======================================

async function exportPDF(images) {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({

        orientation: "portrait",

        unit: "mm",

        format: "a4"

    });

    for (let i = 0; i < images.length; i++) {

        const img = new Image();

        await new Promise(resolve => {

            img.onload = resolve;

            img.src = images[i];

        });

        const pageWidth = 210;
        const pageHeight = 297;

        const ratio = Math.min(

            pageWidth / img.width,

            pageHeight / img.height

        );

        const width = img.width * ratio;
        const height = img.height * ratio;

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        if (i > 0) {

            pdf.addPage();

        }

        pdf.addImage(

            images[i],

            "JPEG",

            x,

            y,

            width,

            height

        );

    }

    pdf.save("document-scan.pdf");

}
