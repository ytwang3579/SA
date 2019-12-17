// create canvas element
drawspace = document.createElement("CANVAS");
drawspace.id = 'drawspace';
drawspace.style.border = '1px solid #FF0000';
drawspace.height = 660;
drawspace.width = 1000;
drawspace.style.cursor = 'URL(./brushc.png), pointer';

// create clear button
clearbutton = document.createElement("BUTTON");
clearbutton.id = 'clearbutton';
clearbutton.style.width = '60px';
clearbutton.style.height = '60px';
clearbutton.textContent = 'CLEAR';
clearbutton.style.position = 'absolute'
clearbutton.style.top = 10;

// create color button
redbutton = document.createElement("BUTTON");
redbutton.id = '#FF0000';
redbutton.style.backgroundColor = '#FF0000';
redbutton.style.width = '30px';
redbutton.style.height = '30px';
redbutton.textContent = '';
redbutton.style.position = 'absolute';
redbutton.style.top = '70px';

bluebutton = document.createElement("BUTTON");
bluebutton.id = '#0000FF';
bluebutton.style.backgroundColor = '#0000FF';
bluebutton.style.width = '30px';
bluebutton.style.height = '30px';
bluebutton.textContent = '';
bluebutton.style.position = 'absolute';
bluebutton.style.top = '70px';
bluebutton.style.left = '1040px';

blackbutton = document.createElement("BUTTON");
blackbutton.id = '#000000';
blackbutton.style.backgroundColor = '#000000';
blackbutton.style.width = '30px';
blackbutton.style.height = '30px';
blackbutton.textContent = '';
blackbutton.style.position = 'absolute';
blackbutton.style.top = '100px';
blackbutton.style.border = '5px solid #AAAAAA';

greenbutton = document.createElement("BUTTON");
greenbutton.id = '#00FF00';
greenbutton.style.backgroundColor = '#00FF00';
greenbutton.style.width = '30px';
greenbutton.style.height = '30px';
greenbutton.textContent = '';
greenbutton.style.position = 'absolute';
greenbutton.style.top = '100px';
greenbutton.style.left = '1040px';

// brush type
brush = document.createElement("IMG");
brush.id = 'brush';
brush.src = 'brush.png';
brush.style.width = '60px';
brush.style.height = '60px';
brush.style.position = 'absolute';
brush.style.top = '130px';

eraser = document.createElement("IMG");
eraser.id = 'eraser';
eraser.src = 'eraser.png';
eraser.style.width = '60px';
eraser.style.height = '60px';
eraser.style.position = 'absolute';
eraser.style.top = '190px';

circle = document.createElement("IMG");
circle.id = 'circle';
circle.src = 'circle.png';
circle.style.width = '60px';
circle.style.height = '60px';
circle.style.position = 'absolute';
circle.style.top = '250px';

triangle = document.createElement("IMG");
triangle.id = 'triangle';
triangle.src = 'triangle.png';
triangle.style.width = '60px';
triangle.style.height = '60px';
triangle.style.position = 'absolute';
triangle.style.top = '310px';

rectangle = document.createElement("IMG");
rectangle.id = 'rectangle';
rectangle.src = 'rectangle.png';
rectangle.style.width = '60px';
rectangle.style.height = '60px';
rectangle.style.position = 'absolute';
rectangle.style.top = '370px';

undo = document.createElement("IMG");
undo.id = 'undo';
undo.src = 'undo.png';
undo.style.width = '60px';
undo.style.height = '60px';
undo.style.position = 'absolute';
undo.style.top = '430px';

redo = document.createElement("IMG");
redo.id = 'redo';
redo.src = 'redo.png';
redo.style.width = '60px';
redo.style.height = '60px';
redo.style.position = 'absolute';
redo.style.top = '490px';

anchor = document.createElement("A");
anchor.id = 'anchor';
anchor.style.cursor = 'pointer';

download = document.createElement("IMG");
download.id = 'download';
download.src = 'download.png';
download.style.width = '60px';
download.style.height = '60px';
download.position = 'absolute';
download.style.top = '550px';

saveX = [];
saveY = [];
isDrag = [];
saveCOLOR = [];
saveTYPE = [];

paint = false;
drag = false;
color = '#000000';
type = 'line';

X1c = []; X2c = []; Y1c = []; Y2c = []; Colorc = [];
X1cr = []; X2cr = []; Y1cr = []; Y2cr = []; Colorcr = [];
X1t = []; X2t = []; Y1t = []; Y2t = []; Colort = [];
X1tr = []; X2tr = []; Y1tr = []; Y2tr = []; Colortr = [];
X1r = []; X2r = []; Y1r = []; Y2r = []; Colorr = [];
X1rr = []; X2rr = []; Y1rr = []; Y2rr = []; Colorrr = [];

last = []; next = []; nextn = [];

saveXr = [];
saveYr = [];
isDragr = [];
saveCOLORr = [];
saveTYPEr = [];

function draw(){
    console.log('draw\n');
    var ctx = drawspace.getContext('2d');
    ctx.clearRect(0, 0, drawspace.width, drawspace.height);
    for(var j=0; j<X1c.length; j++){
        console.log(X1c.length,X2c.length);
        ctx.beginPath();
        ctx.strokeStyle = Colorc[j];
        ctx.arc((X1c[j]+X2c[j])/2,(Y1c[j]+Y2c[j])/2,Math.abs((X1c[j]-X2c[j]))/2,0,2*Math.PI);
        ctx.stroke();
    }
    for(var j=0; j<X1r.length; j++){
        console.log(X1r.length,X2r.length);
        ctx.beginPath();
        ctx.strokeStyle = Colorr[j];
        ctx.rect(X1r[j], Y1r[j], (X2r[j]-X1r[j]), (Y2r[j]-Y1r[j]));
        ctx.stroke();
    }
    for(var j=0; j<X1t.length; j++){
        console.log(X1t.length,X2t.length);
        ctx.beginPath();
        ctx.strokeStyle = Colort[j];
        ctx.moveTo(X1t[j],Y2t[j]);
        ctx.lineTo(X2t[j],Y2t[j]);
        ctx.lineTo((X1t[j]+X2t[j])/2,Y1t[j]);
        ctx.lineTo(X1t[j],Y2t[j]);
        ctx.closePath();
        ctx.stroke();
    }
    for(var i=0; i<saveX.length; i++){
        ctx.beginPath();
        ctx.strokeStyle = saveCOLOR[i];
        ctx.lineWidth = 10;
        ctx.lineJoin = 'round'
        //console.log(i,isDrag[i]);
        
        if(saveTYPE[i]=='line'){
            
            if(i!=0){
                if(isDrag[i]==false){
                    ctx.moveTo(saveX[i], saveY[i]);
                } else {
                    ctx.moveTo(saveX[i-1], saveY[i-1]);
                }
            } else {
                ctx.moveTo(saveX[i], saveY[i]);
            }
            ctx.lineTo(saveX[i]+1, saveY[i]);
            ctx.closePath();
            ctx.stroke();
        } else if(saveTYPE[i]=='circle'){
            if(isDrag[i]==false){
                X1 = X2 = saveX[i];
                Y1 = Y2 = saveY[i];
                saveX.splice(i);
                saveY.splice(i);
                isDrag.splice(i);
                saveCOLOR.splice(i);
                saveTYPE.splice(i);
                i--;
            } else {
                //if(i==saveX.length-1){
                    X2 = saveX[i];
                    Y2 = saveY[i];
                    saveX.pop();
                    saveY.pop();
                    isDrag.pop();
                    saveCOLOR.pop();
                    saveTYPE.pop();
                //}
            }
            ctx.arc((X1+X2)/2,(Y1+Y2)/2,Math.abs(X1-X2)/2,0,2*Math.PI);
            ctx.stroke();
        } else if(saveTYPE[i]=='rectangle'){
            if(isDrag[i]==false){
                X1 = X2 = saveX[i];
                Y1 = Y2 = saveY[i];
                saveX.splice(i);
                saveY.splice(i);
                isDrag.splice(i);
                saveCOLOR.splice(i);
                saveTYPE.splice(i);
                i--;
            } else {
                    X2 = saveX[i];
                    Y2 = saveY[i];
                    saveX.pop();
                    saveY.pop();
                    isDrag.pop();
                    saveCOLOR.pop();
                    saveTYPE.pop();
            }
            ctx.rect(X1, Y1, (X2-X1), (Y2-Y1));
            ctx.stroke();
        } else if(saveTYPE[i]=='triangle'){
            if(isDrag[i]==false){
                X1 = X2 = saveX[i];
                Y1 = Y2 = saveY[i];
                saveX.splice(i);
                saveY.splice(i);
                isDrag.splice(i);
                saveCOLOR.splice(i);
                saveTYPE.splice(i);
                i--;
            } else {
                    X2 = saveX[i];
                    Y2 = saveY[i];
                    saveX.pop();
                    saveY.pop();
                    isDrag.pop();
                    saveCOLOR.pop();
                    saveTYPE.pop();
            }
            var X3 = (X1+X2)/2;
            ctx.moveTo(X1,Y2);
            ctx.lineTo(X2,Y2);
            ctx.lineTo(X3,Y1);
            ctx.lineTo(X1,Y2);
            ctx.closePath();
            ctx.stroke();
            
        }
        ctx.stroke();
    }
}
function btnrst(){
    blackbutton.style.border = '';
    redbutton.style.border = '';
    greenbutton.style.border = '';
    bluebutton.style.border = '';
}

function undoing(){
    if(last[last.length-1]=='line'){
        var i = saveX.length-1;
        var n = 1;
        while(isDrag[i]){
            saveXr.push(saveX[i]);
            saveYr.push(saveY[i]);
            isDragr.push(isDrag[i]);
            saveCOLORr.push(saveCOLOR[i]);
            saveTYPEr.push(saveTYPE[i]);
            saveX.pop();
            saveY.pop();
            isDrag.pop();
            saveCOLOR.pop();
            saveTYPE.pop();
            i--; n++;
        }
        saveXr.push(saveX[i]);
        saveYr.push(saveY[i]);
        isDragr.push(isDrag[i]);
        saveCOLORr.push(saveCOLOR[i]);
        saveTYPEr.push(saveTYPE[i]);
        saveX.pop();
        saveY.pop();
        isDrag.pop();
        saveCOLOR.pop();
        saveTYPE.pop();
        next.push('line');
        nextn.push(n);
        last.pop();
    } else if(last[last.length-1]=='circle'){
        var i = X1c.length-1;
        X1cr.push(X1c[i]);
        X2cr.push(X2c[i]);
        Y1cr.push(Y1c[i]);
        Y2cr.push(Y2c[i]);
        Colorcr.push(Colorc[i]);
        X1c.pop();
        X2c.pop();
        Y1c.pop();
        Y2c.pop();
        Colorc.pop();
        next.push('circle');
        nextn.push(1);
        last.pop();
    } else if(last[last.length-1]=='rectangle'){
        var i = X1r.length-1;
        X1rr.push(X1r[i]);
        X2rr.push(X2r[i]);
        Y1rr.push(Y1r[i]);
        Y2rr.push(Y2r[i]);
        Colorrr.push(Colorr[i]);
        X1r.pop();
        X2r.pop();
        Y1r.pop();
        Y2r.pop();
        Colorr.pop();
        next.push('rectangle');
        nextn.push(1);
        last.pop();
    } else if(last[last.length-1]=='triangle'){
        var i = X1t.length-1;
        X1tr.push(X1t[i]);
        X2tr.push(X2t[i]);
        Y1tr.push(Y1t[i]);
        Y2tr.push(Y2t[i]);
        Colortr.push(Colort[i]);
        X1t.pop();
        X2t.pop();
        Y1t.pop();
        Y2t.pop();
        Colort.pop();
        next.push('triangle');
        nextn.push(1);
        last.pop();
    }
}

function redoing(){
    if(next[next.length-1]=='line'){
        var i = saveXr.length-1;
        var n = nextn[nextn.length-1];
        while(n--){
            saveX.push(saveXr[i]);
            saveY.push(saveYr[i]);
            isDrag.push(isDragr[i]);
            saveCOLOR.push(saveCOLORr[i]);
            saveTYPE.push(saveTYPEr[i]);
            saveXr.pop();
            saveYr.pop();
            isDragr.pop();
            saveCOLORr.pop();
            saveTYPEr.pop();
            i--;
        }
        last.push('line');
        next.pop(); nextn.pop();
    } else if(next[next.length-1]=='circle'){
        var i = X1cr.length-1;
        X1c.push(X1cr[i]);
        X2c.push(X2cr[i]);
        Y1c.push(Y1cr[i]);
        Y2c.push(Y2cr[i]);
        Colorc.push(Colorcr[i]);
        X1cr.pop();
        X2cr.pop();
        Y1cr.pop();
        Y2cr.pop();
        Colorcr.pop();
        last.push('circle');
        next.pop(); nextn.pop();
    } else if(next[next.length-1]=='rectangle'){
        var i = X1rr.length-1;
        X1r.push(X1rr[i]);
        X2r.push(X2rr[i]);
        Y1r.push(Y1rr[i]);
        Y2r.push(Y2rr[i]);
        Colorr.push(Colorrr[i]);
        X1rr.pop();
        X2rr.pop();
        Y1rr.pop();
        Y2rr.pop();
        Colorrr.pop();
        last.push('rectangle');
        next.pop(); nextn.pop();
    } else if(next[next.length-1]=='triangle'){
        var i = X1tr.length-1;
        X1t.push(X1tr[i]);
        X2t.push(X2tr[i]);
        Y1t.push(Y1tr[i]);
        Y2t.push(Y2tr[i]);
        Colort.push(Colortr[i]);
        X1tr.pop();
        X2tr.pop();
        Y1tr.pop();
        Y2tr.pop();
        Colortr.pop();
        last.push('triangle');
        next.pop(); nextn.pop();
    }
}
    
function InitPainter(div){
    //load drawspace

    document.getElementById('mypainter').appendChild(drawspace);
    document.getElementById('mypainter').appendChild(clearbutton);
    document.getElementById('mypainter').appendChild(redbutton);
    document.getElementById('mypainter').appendChild(bluebutton);
    document.getElementById('mypainter').appendChild(blackbutton);
    document.getElementById('mypainter').appendChild(greenbutton);
    document.getElementById('mypainter').appendChild(brush);
    document.getElementById('mypainter').appendChild(eraser);
    document.getElementById('mypainter').appendChild(circle);
    document.getElementById('mypainter').appendChild(triangle);
    document.getElementById('mypainter').appendChild(rectangle);
    document.getElementById('mypainter').appendChild(undo);
    document.getElementById('mypainter').appendChild(redo);
    document.getElementById('mypainter').appendChild(anchor);
    document.getElementById('anchor').appendChild(download);
    
    drawspace.onmousedown = function(e){
        next = [];
        nextn = [];
        
        var X = e.pageX - this.offsetLeft;
        var Y = e.pageY - this.offsetTop;
        
        paint = true;
        saveX.push(X);
        saveY.push(Y);
        saveCOLOR.push(color);
        saveTYPE.push(type);
        isDrag.push(false);
        
        draw();
    };
    
    drawspace.onmousemove = function(e) {
        var X = e.pageX - this.offsetLeft;
        var Y = e.pageY - this.offsetTop;
        
        if(paint==true){
            saveX.push(X);
            saveY.push(Y);
            isDrag.push(true);
            saveCOLOR.push(color);
            saveTYPE.push(type);
            drag = true;
            
            draw();
        }
    };
    
    drawspace.onmouseup = function() { 
        paint = false;
        if(drag==true && type=='circle' && X1!=X2){
            X1c.push(X1);
            Y1c.push(Y1);
            X2c.push(X2);
            Y2c.push(Y2);
            Colorc.push(color);
            last.push(type);
        } else if(drag==true && type=='rectangle' && X1!=X2){
            X1r.push(X1);
            Y1r.push(Y1);
            X2r.push(X2);
            Y2r.push(Y2);
            Colorr.push(color);
            last.push(type);
        } else if(drag==true && type=='triangle' && X1!=X2){
            X1t.push(X1);
            Y1t.push(Y1);
            X2t.push(X2);
            Y2t.push(Y2);
            Colort.push(color);
            last.push(type);
        } else if(type=='line'){
            last.push(type);
        }
        drag = false;
    };
    drawspace.onmouseout = function() { paint = false; };
    
    clearbutton.onclick = function(){
        saveX = [];
        saveY = [];
        isDrag = [];
        saveCOLOR = [];
        saveTYPE = [];
        X1c = [];
        X2c = [];
        Y1c = [];
        Y2c = [];
        Colorc = [];
        saveXr = [];
        saveYr = [];
        isDragr = [];
        saveCOLORr = [];
        saveTYPEr = [];
        X1cr = [];
        X2cr = [];
        Y1cr = [];
        Y2cr = [];
        Colorcr = [];
        next = [];
        nextn = [];
        X1r = [];
        X2r = [];
        Y1r = [];
        Y2r = [];
        Colorr = [];
        X1rr = [];
        X2rr = [];
        Y1rr = [];
        Y2rr = [];
        Colorrr = [];
        X1t = [];
        X2t = [];
        Y1t = [];
        Y2t = [];
        Colort = [];
        X1tr = [];
        X2tr = [];
        Y1tr = [];
        Y2tr = [];
        Colortr = [];
        draw();
    };
    redbutton.onclick = function() { if(color!='#FFFFFF') { color = '#FF0000'; btnrst(); redbutton.style.border = '5px solid #AAAAAA';} };
    greenbutton.onclick = function() { if(color!='#FFFFFF') { color = '#00FF00'; btnrst(); greenbutton.style.border = '5px solid #AAAAAA';} };
    blackbutton.onclick = function() { if(color!='#FFFFFF') { color = '#000000'; btnrst(); blackbutton.style.border = '5px solid #AAAAAA';} };
    bluebutton.onclick = function() { if(color!='#FFFFFF') { color = '#0000FF'; btnrst(); bluebutton.style.border = '5px solid #AAAAAA';} };
    
    brush.onclick = function () {
        type = 'line'; color = '#000000'; btnrst(); blackbutton.style.border = '5px solid #AAAAAA';
        drawspace.style.cursor = 'URL(./brushc.png), pointer';
    };
    
    circle.onclick = function() {
        type = 'circle'; color = '#000000'; btnrst(); blackbutton.style.border = '5px solid #AAAAAA';
        drawspace.style.cursor = 'URL(./brushc.png), pointer';
        
    };
    rectangle.onclick = function() {
        type = 'rectangle'; color = '#000000'; btnrst(); blackbutton.style.border = '5px solid #AAAAAA';
        drawspace.style.cursor = 'URL(./brushc.png), pointer';
    }
    triangle.onclick = function() {
        type = 'triangle'; color = '#000000'; btnrst(); blackbutton.style.border = '5px solid #AAAAAA';
        drawspace.style.cursor = 'URL(./brushc.png), pointer';
    }
    eraser.onclick = function() {
        type = 'line';
        color = '#FFFFFF';
        drawspace.style.cursor = 'URL(./eraserc.png), pointer';
        btnrst();
    }
    undo.onclick = function() {
        undoing();
        draw();
    }
    redo.onclick = function() {
        redoing();
        draw();
    }
    download.onclick = function() {
        anchor.href = drawspace.toDataURL('image/png');
        anchor.download = 'myimg.png';
        //anchor.click();
    }
}