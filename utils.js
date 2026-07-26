// ===================================
// utils.js
// ===================================

// Stores all scanned pages
const scannedPages = [];

// Create element helper
function create(tag, className = "") {
    const el = document.createElement(tag);

    if (className)
        el.className = className;

    return el;
}

// Distance between two points
function distance(a, b) {

    return Math.hypot(

        a.x - b.x,

        a.y - b.y

    );

}

// Order corners
// Returns:
// top-left
// top-right
// bottom-right
// bottom-left

function orderCorners(points) {

    let tl, tr, br, bl;

    let minSum = Infinity;
    let maxSum = -Infinity;

    let minDiff = Infinity;
    let maxDiff = -Infinity;

    points.forEach(p => {

        const sum = p.x + p.y;
        const diff = p.x - p.y;

        if (sum < minSum) {

            minSum = sum;
            tl = p;

        }

        if (sum > maxSum) {

            maxSum = sum;
            br = p;

        }

        if (diff > maxDiff) {

            maxDiff = diff;
            tr = p;

        }

        if (diff < minDiff) {

            minDiff = diff;
            bl = p;

        }

    });

    return [tl, tr, br, bl];

}

// Canvas -> Image

function canvasToImage(canvas) {

    return canvas.toDataURL("image/jpeg", 0.95);

}

// Download image

function downloadImage(dataURL, filename) {

    const a = document.createElement("a");

    a.href = dataURL;

    a.download = filename;

    a.click();

}

// Delete page

function removePage(index) {

    scannedPages.splice(index, 1);

    renderPages();

}

// Render thumbnails

function renderPages() {

    const pages = document.getElementById("pages");

    pages.innerHTML = "";

    scannedPages.forEach((page, index) => {

        const card = create("div", "page");

        const img = create("img");

        img.src = page;

        card.appendChild(img);

        const btns = create("div", "pageButtons");

        const del = create("button", "delete");

        del.innerHTML = "Delete";

        del.onclick = () => removePage(index);

        const dl = create("button", "download");

        dl.innerHTML = "Download";

        dl.onclick = () => {

            downloadImage(

                page,

                `scan-${index + 1}.jpg`

            );

        };

        btns.appendChild(del);

        btns.appendChild(dl);

        card.appendChild(btns);

        pages.appendChild(card);

    });

}

// Loader

function showLoader() {

    const pages = document.getElementById("pages");

    pages.innerHTML =

        '<div class="loader"></div>';

}

function hideLoader() {

    renderPages();

}
