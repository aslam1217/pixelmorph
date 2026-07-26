// ======================================
// camera.js
// ======================================

let stream = null;

const video = document.getElementById("video");
const cameraSection = document.getElementById("cameraSection");

const captureBtn = document.getElementById("captureBtn");
const closeCamera = document.getElementById("closeCamera");

// Open camera
async function startCamera() {

    if (!navigator.mediaDevices) {

        alert("Camera not supported.");

        return;

    }

    try {

        stream = await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: "environment"

            },

            audio: false

        });

        video.srcObject = stream;

        cameraSection.classList.remove("hidden");

    }

    catch (err) {

        console.error(err);

        alert("Unable to access camera.");

    }

}

// Close camera
function stopCamera() {

    if (stream) {

        stream.getTracks().forEach(track => {

            track.stop();

        });

    }

    stream = null;

    video.srcObject = null;

    cameraSection.classList.add("hidden");

}

// Capture photo
captureBtn.onclick = async () => {

    if (!stream)
        return;

    showLoader();

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );

    const img = new Image();

    img.onload = async () => {

        try {

            const result = await scanDocument(img);

            scannedPages.push(result);

            hideLoader();

        }

        catch (err) {

            console.error(err);

            hideLoader();

        }

    };

    img.src = canvas.toDataURL("image/jpeg", 0.95);

};

// Close button
closeCamera.onclick = () => {

    stopCamera();

};

// Close camera when leaving page
window.addEventListener("beforeunload", () => {

    stopCamera();

});
