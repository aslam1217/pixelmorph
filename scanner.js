// ======================================
// scanner.js
// Part 1
// ======================================

// Main scanning function
async function scanDocument(image) {

    // Draw image on canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    // Load image into OpenCV
    let src = cv.imread(canvas);

    // Detect document
    let corners = detectDocument(src);

    if (!corners) {

        src.delete();

        // If detection fails,
        // return original image
        return canvas.toDataURL("image/jpeg", 0.95);

    }

    // Perspective correction
    let scanned = warpDocument(src, corners);

    // Improve brightness & contrast
    enhanceDocument(scanned);

    // Convert to image
    let outCanvas = document.createElement("canvas");

    cv.imshow(outCanvas, scanned);

    let result = outCanvas.toDataURL(
        "image/jpeg",
        0.95
    );

    src.delete();
    scanned.delete();

    return result;

}

// Detect paper
function detectDocument(src) {

    let gray = new cv.Mat();

    let blur = new cv.Mat();

    let edges = new cv.Mat();

    cv.cvtColor(
        src,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    cv.GaussianBlur(
        gray,
        blur,
        new cv.Size(5, 5),
        0
    );

    cv.Canny(
        blur,
        edges,
        60,
        180
    );

    let contours = new cv.MatVector();

    let hierarchy = new cv.Mat();

    cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_LIST,
        cv.CHAIN_APPROX_SIMPLE
    );

    let biggest = null;

    let biggestArea = 0;

    for (let i = 0; i < contours.size(); i++) {

        const contour = contours.get(i);

        const area = cv.contourArea(contour);

        if (area < 5000)
            continue;

        let peri = cv.arcLength(
            contour,
            true
        );

        let approx = new cv.Mat();

        cv.approxPolyDP(
            contour,
            approx,
            0.02 * peri,
            true
        );

        if (
            approx.rows === 4 &&
            area > biggestArea
        ) {

            biggestArea = area;

            biggest = [];

            for (let j = 0; j < 4; j++) {

                biggest.push({

                    x: approx.intPtr(j, 0)[0],

                    y: approx.intPtr(j, 0)[1]

                });

            }

        }

        approx.delete();
        contour.delete();

    }

    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

    if (!biggest)
        return null;

    return orderCorners(biggest);

}
