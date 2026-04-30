// 2.5D Rendering Helpers
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  
    
    R = (R>0)?R:0;
    G = (G>0)?G:0;
    B = (B>0)?B:0;

    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function draw3DBlock(ctx, x, y, width, height, color, depthX = 12, depthY = 12) {
    
    if (!isDrawnStyle) {
        // Right face (darker)
        ctx.fillStyle = shadeColor(color, -20); 
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width + depthX, y - depthY);
        ctx.lineTo(x + width + depthX, y - depthY + height);
        ctx.lineTo(x + width, y + height);
        ctx.closePath();
        ctx.fill();
        
        // Top face (lighter)
        ctx.fillStyle = shadeColor(color, 20);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + depthX, y - depthY);
        ctx.lineTo(x + width + depthX, y - depthY);
        ctx.lineTo(x + width, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Front face (Standard)
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}