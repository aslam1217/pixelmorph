let canvas=document.getElementById("canvasInput");
let ctx=canvas.getContext("2d");

let image=new Image();

document.getElementById("upload").addEventListener("change",e=>{

    const file=e.target.files[0];

    image.src=URL.createObjectURL(file);

    image.onload=()=>{

        canvas.width=image.width;
        canvas.height=image.height;

        ctx.drawImage(image,0,0);

    }

});

document.getElementById("process").onclick=function(){

    let src=cv.imread("canvasInput");

    let gray=new cv.Mat();

    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);

    cv.GaussianBlur(gray,gray,new cv.Size(5,5),0);

    let edges=new cv.Mat();

    cv.Canny(gray,edges,75,200);

    let contours=new cv.MatVector();

    let hierarchy=new cv.Mat();

    cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_LIST,
        cv.CHAIN_APPROX_SIMPLE
    );

    let biggest=null;
    let maxArea=0;

    for(let i=0;i<contours.size();i++){

        let cnt=contours.get(i);

        let area=cv.contourArea(cnt);

        if(area>maxArea){

            let peri=cv.arcLength(cnt,true);

            let approx=new cv.Mat();

            cv.approxPolyDP(cnt,approx,0.02*peri,true);

            if(approx.rows===4){

                biggest=approx;

                maxArea=area;

            }

        }

    }

    if(biggest==null){

        alert("No document found.");

        return;

    }

    let pts=[];

    for(let i=0;i<4;i++){

        pts.push({
            x:biggest.intPtr(i,0)[0],
            y:biggest.intPtr(i,0)[1]
        });

    }

    pts.sort((a,b)=>a.y-b.y);

    let top=pts.slice(0,2).sort((a,b)=>a.x-b.x);

    let bottom=pts.slice(2).sort((a,b)=>a.x-b.x);

    let tl=top[0];
    let tr=top[1];
    let bl=bottom[0];
    let br=bottom[1];

    let width=Math.max(

        Math.hypot(br.x-bl.x,br.y-bl.y),

        Math.hypot(tr.x-tl.x,tr.y-tl.y)

    );

    let height=Math.max(

        Math.hypot(tr.x-br.x,tr.y-br.y),

        Math.hypot(tl.x-bl.x,tl.y-bl.y)

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

    let M=cv.getPerspectiveTransform(srcTri,dstTri);

    let dst=new cv.Mat();

    cv.warpPerspective(
        src,
        dst,
        M,
        new cv.Size(width,height)
    );

    cv.imshow("canvasOutput",dst);

    src.delete();
    gray.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    dst.delete();

}