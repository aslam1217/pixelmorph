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
// ======================================
// scanner.js
// Part 2
// ======================================

// Warp document using the detected corners
function warpDocument(src, corners) {

    const [tl, tr, br, bl] = corners;

    const widthTop = distance(tl, tr);
    const widthBottom = distance(bl, br);

    const maxWidth = Math.max(widthTop, widthBottom);

    const heightLeft = distance(tl, bl);
    const heightRight = distance(tr, br);

    const maxHeight = Math.max(heightLeft, heightRight);

    const srcTri = cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
            tl.x, tl.y,
            tr.x, tr.y,
            br.x, br.y,
            bl.x, bl.y
        ]
    );

    const dstTri = cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
            0, 0,
            maxWidth - 1, 0,
            maxWidth - 1, maxHeight - 1,
            0, maxHeight - 1
        ]
    );

    const M = cv.getPerspectiveTransform(srcTri, dstTri);

    const dst = new cv.Mat();

    cv.warpPerspective(
        src,
        dst,
        M,
        new cv.Size(
            Math.round(maxWidth),
            Math.round(maxHeight)
        ),
        cv.INTER_LINEAR,
        cv.BORDER_REPLICATE,
        new cv.Scalar()
    );

    srcTri.delete();
    dstTri.delete();
    M.delete();

    return dst;

}

// Improve scanned appearance
function enhanceDocument(mat) {

    let gray = new cv.Mat();

    cv.cvtColor(
        mat,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    cv.adaptiveThreshold(
        gray,
        gray,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        21,
        15
    );

    cv.cvtColor(
        gray,
        mat,
        cv.COLOR_GRAY2RGBA
    );

    gray.delete();

}
// ======================================
// scanner.js
// Part 3
// Replace detectDocument()
// ======================================

function detectDocument(src) {

    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let thresh = new cv.Mat();
    let kernel = cv.Mat.ones(5, 5, cv.CV_8U);

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    cv.GaussianBlur(
        gray,
        blur,
        new cv.Size(5, 5),
        0
    );

    cv.adaptiveThreshold(
        blur,
        thresh,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        31,
        10
    );

    cv.bitwise_not(thresh, thresh);

    cv.morphologyEx(
        thresh,
        thresh,
        cv.MORPH_CLOSE,
        kernel
    );

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(
        thresh,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    let bestScore = -1;
    let bestCorners = null;

    const imageArea = src.rows * src.cols;

    for (let i = 0; i < contours.size(); i++) {

        const contour = contours.get(i);

        const area = cv.contourArea(contour);

        if (area < imageArea * 0.10) {

            contour.delete();

            continue;

        }

        const perimeter = cv.arcLength(
            contour,
            true
        );

        const approx = new cv.Mat();

        cv.approxPolyDP(
            contour,
            approx,
            0.02 * perimeter,
            true
        );

        if (approx.rows !== 4) {

            approx.delete();
            contour.delete();

            continue;

        }

        const rect = cv.boundingRect(contour);

        const aspect =
            rect.width / rect.height;

        if (aspect < 0.45 || aspect > 2.4) {

            approx.delete();
            contour.delete();

            continue;

        }

        let score = 0;

        score += area / imageArea;

        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;

        const dx = cx - src.cols / 2;
        const dy = cy - src.rows / 2;

        const centerDistance =
            Math.sqrt(dx * dx + dy * dy);

        score +=
            1 -
            centerDistance /
                Math.sqrt(
                    src.cols * src.cols +
                    src.rows * src.rows
                );

        if (score > bestScore) {

            bestScore = score;

            bestCorners = [];

            for (let j = 0; j < 4; j++) {

                bestCorners.push({

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
    thresh.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();

    if (!bestCorners)
        return null;

    return orderCorners(bestCorners);

}
