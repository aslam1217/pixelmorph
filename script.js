// ===============================
// Document Scanner - script.js
// ===============================

const upload = document.getElementById("upload");
const results = document.getElementById("results");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

let scannedPages = [];

// ----------------------
// Upload Images
// ----------------------
upload.addEventListener("change", (e) => {

    const files = [...e.target.files];

    if (!files.length) return;

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        const img = new Image();

        img.onload = () => {

            scanDocument(img);

            URL.revokeObjectURL(img.src);

        };

        img.src = URL.createObjectURL(file);

    });

});

// ----------------------
// Scan One Image
// ----------------------
function scanDocument(image){

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.drawImage(image,0,0);

    let src = cv.imread(tempCanvas);

    let gray = new cv.Mat();
    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);

    cv.GaussianBlur(
        gray,
        gray,
        new cv.Size(5,5),
        0
    );

    let edges = new cv.Mat();

    cv.Canny(
        gray,
        edges,
        75,
        200
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

    for(let i=0;i<contours.size();i++){

        let cnt = contours.get(i);

        let area = cv.contourArea(cnt);

        if(area < 5000) continue;

        let peri = cv.arcLength(cnt,true);

        let approx = new cv.Mat();

        cv.approxPolyDP(
            cnt,
            approx,
            0.02*peri,
            true
        );

        if(approx.rows===4 && area>biggestArea){

            biggestArea = area;
            biggest = approx;

        }

    }

    if(biggest==null){

        alert("Document not detected.");

        src.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();

        return;

    }

    let pts=[];

    for(let i=0;i<4;i++){

        pts.push({

            x:biggest.intPtr(i,0)[0],
            y:biggest.intPtr(i,0)[1]

        });

    }

    pts = sortCorners(pts);

    let tl=pts[0];
    let tr=pts[1];
    let br=pts[2];
    let bl=pts[3];

    let width=Math.max(

        distance(br,bl),
        distance(tr,tl)

    );

    let height=Math.max(

        distance(tr,br),
        distance(tl,bl)

    );

    let srcTri=cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [

            tl.x,tl.y,

            tr.x,tr.y,

            br.x,br.y,

            bl.x,bl.y

        ]
    );

    let dstTri=cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [

            0,0,

            width,0,

            width,height,

            0,height

        ]
    );

    let M=cv.getPerspectiveTransform(
        srcTri,
        dstTri
    );

    let dst=new cv.Mat();

    cv.warpPerspective(

        src,
        dst,
        M,
        new cv.Size(width,height)

    );

    createResult(dst);

    src.delete();
    gray.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

}

// ----------------------
// Display Result
// ----------------------

function createResult(mat){

    const wrapper=document.createElement("div");
    wrapper.className="page";

    const canvas=document.createElement("canvas");

    canvas.width=mat.cols;
    canvas.height=mat.rows;

    wrapper.appendChild(canvas);

    const remove=document.createElement("button");

    remove.innerText="Delete";

    remove.onclick=()=>{

        wrapper.remove();

        scannedPages=scannedPages.filter(p=>p!==canvas);

    };

    wrapper.appendChild(remove);

    results.appendChild(wrapper);

    cv.imshow(canvas,mat);

    scannedPages.push(canvas);

    mat.delete();

}

// ----------------------
// Utilities
// ----------------------

function distance(a,b){

    return Math.hypot(

        a.x-b.x,

        a.y-b.y

    );

}

function sortCorners(pts){

    let sum=pts.map(p=>p.x+p.y);

    let diff=pts.map(p=>p.y-p.x);

    let tl=pts[sum.indexOf(Math.min(...sum))];

    let br=pts[sum.indexOf(Math.max(...sum))];

    let tr=pts[diff.indexOf(Math.min(...diff))];

    let bl=pts[diff.indexOf(Math.max(...diff))];

    return [

        tl,

        tr,

        br,

        bl

    ];

}

// ----------------------
// Clear
// ----------------------

clearBtn.onclick=()=>{

    scannedPages=[];

    results.innerHTML="";

};

// ----------------------
// Download Images
// ----------------------

downloadBtn.onclick=()=>{

    if(scannedPages.length===0){

        alert("No pages scanned.");

        return;

    }

    scannedPages.forEach((canvas,index)=>{

        const a=document.createElement("a");

        a.download=`page-${index+1}.png`;

        a.href=canvas.toDataURL("image/png");

        a.click();

    });

};
