// =====================================
// app.js
// Main Application Controller
// =====================================

let cvReady = false;

// Wait for OpenCV
function waitForOpenCV() {

    if (typeof cv === "undefined") {

        setTimeout(waitForOpenCV, 100);

        return;

    }

    cv["onRuntimeInitialized"] = () => {

        cvReady = true;

        console.log("OpenCV Ready");

    };

}

waitForOpenCV();

const galleryInput = document.getElementById("galleryInput");
const clearBtn = document.getElementById("clearBtn");
const pdfBtn = document.getElementById("pdfBtn");
const cameraBtn = document.getElementById("cameraBtn");

// Upload images
galleryInput.addEventListener("change", async (event) => {

    if (!cvReady) {

        alert("OpenCV is still loading.");

        return;

    }

    const files = [...event.target.files];

    if (!files.length)
        return;

    showLoader();

    for (const file of files) {

        try {

            await processFile(file);

        }

        catch (err) {

            console.error(err);

        }

    }

    hideLoader();

    galleryInput.value = "";

});

// Read file

async function processFile(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const img = new Image();

            img.onload = async () => {

                try {

                    const result = await scanDocument(img);

                    scannedPages.push(result);

                    resolve();

                }

                catch (e) {

                    console.error(e);

                    alert(file.name + " could not be scanned.");

                    reject(e);

                }

            };

            img.src = reader.result;

        };

        reader.readAsDataURL(file);

    });

}

// Clear pages

clearBtn.onclick = () => {

    if (!scannedPages.length)
        return;

    if (!confirm("Delete all scanned pages?"))
        return;

    scannedPages.length = 0;

    renderPages();

};

// Download PDF

pdfBtn.onclick = () => {

    if (!scannedPages.length) {

        alert("No pages scanned.");

        return;

    }

    exportPDF(scannedPages);

};

// Camera

cameraBtn.onclick = () => {

    startCamera();

};

// Register Service Worker

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("sw.js")
            .catch(console.error);

    });

}
