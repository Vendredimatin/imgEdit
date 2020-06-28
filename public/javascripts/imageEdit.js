var myImage;
var ctx;
var img;
let initalSrc;
var orignHeight;
var orignWidth;
var curOperation;
var clip = true;
var meld = true;
var text = true;
var stack = new Image();
var meldImg = new Image();

window.onload = function () {
    let init = true;
    myImage = document.getElementById("myCanvas");
    ctx = myImage.getContext("2d");

    img = new Image();
    img.src = JSON.parse(sessionStorage.editImg).editImgSrc;    // stack.src = img.src;

    img.onload = function () {
        console.log("开头调用");
        if (init) {
            initalSrc = img.src;
            console.log("init");
            orignHeight = img.height;
            orignWidth = img.width;
            AutoResizeImage(600, 600);
            ctx.drawImage(img, myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2);
            init = false;
        }
        console.log(img.width, img.height);
    }


    function AutoResizeImage(maxWidth, maxHeight) {
        var hRatio;
        var wRatio;
        var w = img.width;
        var h = img.height;
        console.log("原始大小", orignWidth, orignHeight);
        console.log("最大", maxWidth, maxHeight);
        let Ratio = 1;
        if (maxWidth == 0 && maxHeight == 0) {
            Ratio = 1;
        } else if (maxWidth == 0) {
            if (hRatio < 1) Ratio = hRatio;
        } else if (maxHeight == 0) {
            if (wRatio < 1) Ratio = wRatio;
        } else if (wRatio < 1 || hRatio < 1) {
            Ratio = (wRatio <= hRatio ? wRatio : hRatio);
        }
        if (Ratio < 1) {
            w = w * Ratio;
            h = h * Ratio;
        }
        img.height = h;
        img.width = w;
        console.log("调整之后", Ratio, w, h);
    }


    var ID = function (id) {
        return document.getElementById(id);
    };

    document.getElementById("rotateBtn").onclick = rotate;
    function rotate() {
        curOperation = "rotate";
        /* 任意角度旋转
         var rotateInput = document.getElementById("rotate-range");
          degree = parseInt(rotateInput.value);
          console.log(degree, rotateInput.value);
          degree %= 360;*/
        let degree = 90;
        ctx.save();
        ctx.clearRect(0, 0, myImage.width, myImage.height);
        ctx.translate(myImage.width / 2, myImage.height / 2);
        ctx.rotate(degree / 180 * Math.PI);
        ctx.translate(-myImage.width / 2, -myImage.height / 2);
        console.log("旋转画");
        console.log(myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2);
        ctx.drawImage(img, myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2);
        ctx.restore();

        let w = img.width;
        let h = img.height;
        console.log("横变竖");
        img.src = getNewImgSrc(myImage.width / 2 - img.height / 2, myImage.height / 2 - img.width / 2, img.height, img.width);
        img.width = h;
        img.height = w;
        console.log("长为", img.width, "高为", img.height);
    }

//拖拽与拉伸方法
//拖拽拉伸所需参数
    var params = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        currentX: 0,
        currentY: 0,
        flag: false,
        kind: "drag"
    };
//获取相关CSS属性方法
    var getCss = function (o, key) {
        return o.currentStyle ? o.currentStyle[key] : document.defaultView.getComputedStyle(o, false)[key];
    };

    document.getElementById("clipBtn").onclick = function () {
        var moveFlag = false;
        var clickFlag = false;

        if (!clip) {
            clip = true;
            clipEnd();
            $("#clipBtn").removeClass("icon complete-icon");
            $("#clipBtn").addClass("icon clip-icon");
            $("#clipText").html("裁剪");
            cancelBtnDisabled();
            return;
        }
        clip = false;

        $("#clipBtn").removeClass("icon clip-icon");
        $("#clipBtn").addClass("icon complete-icon");
        $("#clipText").html("完成");
        curOperation = "clip";
        btnDisabled();
        console.log("clip....");
        var iCurWidth = img.width;
        var iCurHeight = img.height;

        var oRelDiv = document.createElement("div");
        oRelDiv.style.position = "absolute";
        oRelDiv.style.width = iCurWidth + "px";
        oRelDiv.style.height = iCurHeight + 30 + "px";
        oRelDiv.style.top = "30px";
        oRelDiv.style.zIndex = 2;
        oRelDiv.id = "cropContainer";

        var iOrigWidth = orignWidth, iOrigHeight = orignHeight;
        var scaleX = iCurWidth / iOrigWidth;
        var scaleY = iCurHeight / iOrigHeight;

        myImage.parentNode.insertBefore(oRelDiv, myImage);

        //初始化坐标与剪裁高宽
        var cropW = 80, cropH = 80;
        //var posX = (iCurWidth - cropW) / 2, posY = (iCurHeight - cropH) / 2;
        var posX = (myImage.offsetLeft + myImage.width / 2 - cropW / 2),
            posY = myImage.offsetTop + myImage.height / 2 - cropH / 2;
        var sInnerHtml =
            '<div id="zxxCropBox" style="height:' + cropH + 'px; width:' + cropW + 'px; position:absolute; left:' + posX + 'px; top:' + posY + 'px; border:1px solid black;">' +
            '<div id="zxxDragBg" style="height:100%; background:white; opacity:0.3; filter:alpha(opacity=30); cursor:move"></div>' +
            '<div id="dragLeftTop" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; top:-3px; cursor:nw-resize;"></div>' +
            '<div id="dragLeftBot" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; bottom:-3px; cursor:sw-resize;"></div>' +
            '<div id="dragRightTop" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; top:-3px; cursor:ne-resize;"></div>' +
            '<div id="dragRightBot" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; bottom:-3px; cursor:se-resize;"></div>' +
            '<div id="dragTopCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; top:-3px; left:50%; margin-left:-3px; cursor:n-resize;"></div>' +
            '<div id="dragBotCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; bottom:-3px; left:50%; margin-left:-3px; cursor:s-resize;"></div>' +
            '<div id="dragRightCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; top:50%; margin-top:-3px; cursor:e-resize;"></div> ' +
            '<div id="dragLeftCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; top:50%; margin-top:-3px; cursor:w-resize;"></div>' +
            '</div>' +
            '<input type="hidden" id="cropPosX" value="' + posX / scaleX + '" />' +
            '<input type="hidden" id="cropPosY" value="' + posY / scaleY + '" />' +
            '<input type="hidden" id="cropImageWidth" value="' + cropW / scaleX + '" />' +
            '<input type="hidden" id="cropImageHeight" value="' + cropH / scaleY + '" />';

        oRelDiv.innerHTML = sInnerHtml;

        var startDrag = function (point, target, kind) {
            //point是拉伸点，target是被拉伸的目标，其高度及位置会发生改变
            //此处的target与上面拖拽的target是同一目标，故其params.left,params.top可以共用，也必须共用
            //初始化宽高
            params.width = getCss(target, "width");
            params.height = getCss(target, "height");
            //初始化坐标
            if (getCss(target, "left") !== "auto") {
                params.left = getCss(target, "left");
            }
            if (getCss(target, "top") !== "auto") {
                params.top = getCss(target, "top");
            }
            //target是移动对象
            point.onmousedown = function (event) {
                params.kind = kind;
                params.flag = true;
                clickFlag = true;
                if (!event) {
                    event = window.event;
                }
                var e = event;
                params.currentX = e.clientX;
                params.currentY = e.clientY;
                //防止IE文字选中，有助于拖拽平滑
                point.onselectstart = function () {
                    return false;
                }

                document.onmousemove = function (event) {
                    var e = event ? event : window.event;
                    if (params.flag) {
                        var nowX = e.clientX, nowY = e.clientY;
                        var disX = nowX - params.currentX, disY = nowY - params.currentY;
                        if (params.kind === "n") {
                            //上拉伸
                            //高度增加或减小，位置上下移动
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                        } else if (params.kind === "w") {//左拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                        } else if (params.kind === "e") {//右拉伸
                            target.style.width = parseInt(params.width) + disX + "px";
                        } else if (params.kind === "s") {//下拉伸
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else if (params.kind === "nw") {//左上拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                        } else if (params.kind === "ne") {//右上拉伸
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                            //右
                            target.style.width = parseInt(params.width) + disX + "px";
                        } else if (params.kind === "sw") {//左下拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                            //下
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else if (params.kind === "se") {//右下拉伸
                            target.style.width = parseInt(params.width) + disX + "px";
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else {//移动
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.top = parseInt(params.top) + disY + "px";
                        }
                    }

                    document.onmouseup = function () {

                        params.flag = false;
                        if (clickFlag) {
                            if (getCss(target, "left") !== "auto") {
                                params.left = getCss(target, "left");
                            }
                            if (getCss(target, "top") !== "auto") {
                                params.top = getCss(target, "top");
                            }
                            params.width = getCss(target, "width");
                            params.height = getCss(target, "height");

                            //给隐藏文本框赋值
                            posX = parseInt(target.style.left);
                            posY = parseInt(target.style.top);
                            cropW = parseInt(target.style.width);
                            cropH = parseInt(target.style.height);
                            if (posX < 0) {
                                posX = 0;
                            }
                            if (posY < 0) {
                                posY = 0;
                            }
                            if ((posX + cropW) > iCurWidth) {
                                cropW = iCurWidth - posX;
                            }
                            if ((posY + cropH) > iCurHeight) {
                                cropH = iCurHeight - posY;
                            }
                            //赋值
                            ID("cropPosX").value = posX;
                            ID("cropPosY").value = posY;
                            ID("cropImageWidth").value = parseInt(ID("zxxCropBox").style.width);
                            ID("cropImageHeight").value = parseInt(ID("zxxCropBox").style.height);

                            clickFlag = false;
                        }
                    };
                }
            };


        };


        //绑定拖拽
        startDrag(ID("zxxDragBg"), ID("zxxCropBox"), "drag");
        //绑定拉伸
        startDrag(ID("dragLeftTop"), ID("zxxCropBox"), "nw");
        startDrag(ID("dragLeftBot"), ID("zxxCropBox"), "sw");
        startDrag(ID("dragRightTop"), ID("zxxCropBox"), "ne");
        startDrag(ID("dragRightBot"), ID("zxxCropBox"), "se");
        startDrag(ID("dragTopCenter"), ID("zxxCropBox"), "n");
        startDrag(ID("dragBotCenter"), ID("zxxCropBox"), "s");
        startDrag(ID("dragRightCenter"), ID("zxxCropBox"), "e");
        startDrag(ID("dragLeftCenter"), ID("zxxCropBox"), "w");


        //图片不能被选中，目的在于使拖拽顺滑
        ID("myCanvas").onselectstart = function () {
            return false;
        };
        img.onselectstart = function () {
            return false;
        };
    }


    function clipEnd() {
        console.log("clipend......");
        var tx = myImage.offsetLeft + (myImage.width - img.width) / 2;
        var ty = myImage.offsetTop + (myImage.height - img.height) / 2;

        var x = parseInt(ID("zxxCropBox").style.left) - tx,
            y = ID("zxxCropBox").offsetTop + ID("zxxCropBox").parentNode.offsetTop - ty,
            w = document.getElementById("cropImageWidth").value,
            h = document.getElementById("cropImageHeight").value;


        cropImage(x, y, parseInt(w), parseInt(h));
    }

    function cropImage(cropPosX, cropPosY, width, height) {
        var cropContainer = ID("cropContainer");
        cropContainer.parentNode.removeChild(cropContainer);
        ctx.clearRect(0, 0, myImage.width, myImage.height);
        //dx,dy 是相对于图片的坐标。巨坑
        console.log(width, height);
        ctx.drawImage(img, cropPosX, cropPosY, width, height, myImage.width / 2 - width / 2, myImage.height / 2 - height / 2, width, height);
        console.log("裁剪画完");
        img.src = getNewImgSrc(myImage.width / 2 - width / 2, myImage.height / 2 - height / 2, width, height);//myImage.toDataURL("image/png");
        img.height = height;
        img.width = width;
        console.log("crop end...");
    }

    function getNewImgSrc(x, y, width, height) {
        var targetctxImageData = ctx.getImageData(x, y, width, height); // sx, sy, sWidth, sHeight

        var lc = document.createElement('canvas');
        var lctx = lc.getContext('2d');

        lc.width = width;
        lc.height = height;

        lctx.rect(0, 0, width, height);
        lctx.fillStyle = 'white';
        lctx.fill();
        lctx.putImageData(targetctxImageData, 0, 0); // imageData, dx, dy
        console.log("getNewImgSrc.....");
        return lc.toDataURL('image/png');
    }

    let oldScaleInput = document.getElementById("scale-range").value;
    document.getElementById("scale-range").onmousemove = function () {
        curOperation = "scale";
        var scaleInput = document.getElementById("scale-range").value;
        if (oldScaleInput != scaleInput) {
            ctx.clearRect(0, 0, myImage.width, myImage.height);
            ctx.save();
            ctx.translate(myImage.width / 2 - img.width / 2 * scaleInput, myImage.height / 2 - img.height / 2 * scaleInput);
            ctx.scale(scaleInput, scaleInput);
            console.log("放大画");
            ctx.drawImage(img, 0, 0);
            ctx.restore();
        }
    }

    document.getElementById("meldBtn").onclick = function () {
        if (!meld) {
            meld = true;
            meldEnd();
            $("#meldBtn").removeClass("icon complete-icon");
            $("#meldBtn").addClass("icon meld-icon");
            $("#meldText").html("合并");
            $(".paster-container").css("display", "none");
            cancelBtnDisabled();
            return;
        }
        meld = false;
        $(".paster-container").css("display", "block");
        $("#meldBtn").removeClass("icon meld-icon");
        $("#meldBtn").addClass("icon complete-icon");
        $("#meldText").html("完成");
        console.log("meld....");
        btnDisabled();
        curOperation = "meld";


        //var newImg = new Image();
        meldImg.src = "pig_head.png";
        meldImg.onload = function () {
            AutoResizeImage(800, 600, meldImg);
        }

        var iCurWidth = meldImg.width;
        var iCurHeight = meldImg.height;

        var oRelDiv = document.createElement("div");
        oRelDiv.style.position = "absolute";
        oRelDiv.style.width = 800 + "px";
        oRelDiv.style.height = 600 + "px";
        oRelDiv.style.top = "0px";
        oRelDiv.style.zIndex = 2;
        oRelDiv.id = "meldContainer";

        var iOrigWidth = meldImg.naturalWidth, iOrigHeight = meldImg.naturalHeight;
        var scaleX = iCurWidth / iOrigWidth;
        var scaleY = iCurHeight / iOrigHeight;

        myImage.parentNode.insertBefore(oRelDiv, myImage);


        //初始化坐标与剪裁高宽
        var cropW = 80, cropH = 80;

        var posX = (myImage.offsetLeft + myImage.width / 2 - cropW / 2),
            posY = myImage.offsetTop + myImage.height / 2 - cropH / 2;
        var sInnerHtml =
            '<div id="zxxCropBox" style="height:' + cropH + 'px; width:' + cropW + 'px; position:absolute; left:' + posX + 'px; top:' + posY + 'px; border:1px solid black;">' +
            '<div id="zxxDragBg" style="height:100%; background:white; opacity:0.7; filter:alpha(opacity=50); cursor:move;"></div>' +
            '<div id="dragLeftTop" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; top:-3px; cursor:nw-resize;"></div>' +
            '<div id="dragLeftBot" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; bottom:-3px; cursor:sw-resize;"></div>' +
            '<div id="dragRightTop" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; top:-3px; cursor:ne-resize;"></div>' +
            '<div id="dragRightBot" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; bottom:-3px; cursor:se-resize;"></div>' +
            '<div id="dragTopCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; top:-3px; left:50%; margin-left:-3px; cursor:n-resize;"></div>' +
            '<div id="dragBotCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; bottom:-3px; left:50%; margin-left:-3px; cursor:s-resize;"></div>' +
            '<div id="dragRightCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; right:-3px; top:50%; margin-top:-3px; cursor:e-resize;"></div> ' +
            '<div id="dragLeftCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:-3px; top:50%; margin-top:-3px; cursor:w-resize;"></div>' +
            '<div id="rotateCenter" style="position:absolute; width:4px; height:4px; border:1px solid #000; background:white; overflow:hidden; left:50%; top:50%; margin-top:-3px; cursor: crosshair;"></div>' +

            '</div>' +
            '<input type="hidden" id="cropPosX" value="' + posX / scaleX + '" />' +
            '<input type="hidden" id="cropPosY" value="' + posY / scaleY + '" />' +
            '<input type="hidden" id="cropImageWidth" value="' + cropW / scaleX + '" />' +
            '<input type="hidden" id="cropImageHeight" value="' + cropH / scaleY + '" />';

        oRelDiv.innerHTML = sInnerHtml;

        ID("zxxDragBg").style.backgroundSize = "cover";
        //
        ID("zxxDragBg").style.backgroundImage = "url(pig_head.png)";
        //$("#zxxDragBg").attr("style","background:url('cat_ear.png') no-repeat;width:100%;height:100%;");

        var startDrag = function (point, target, kind) {
            //point是拉伸点，target是被拉伸的目标，其高度及位置会发生改变
            //此处的target与上面拖拽的target是同一目标，故其params.left,params.top可以共用，也必须共用
            //初始化宽高
            params.width = getCss(target, "width");
            params.height = getCss(target, "height");
            //初始化坐标
            if (getCss(target, "left") !== "auto") {
                params.left = getCss(target, "left");
            }
            if (getCss(target, "top") !== "auto") {
                params.top = getCss(target, "top");
            }
            //target是移动对象
            point.onmousedown = function (event) {
                console.log("meld 进入");
                params.kind = kind;
                params.flag = true;
                let clickFlag = true;
                if (!event) {
                    event = window.event;
                }
                var e = event;
                params.currentX = e.clientX;
                params.currentY = e.clientY;
                //防止IE文字选中，有助于拖拽平滑
                point.onselectstart = function () {
                    return false;
                }

                document.onmousemove = function (event) {
                    var e = event ? event : window.event;
                    if (params.flag) {
                        var nowX = e.clientX, nowY = e.clientY;
                        var disX = nowX - params.currentX, disY = nowY - params.currentY;
                        if (params.kind === "n") {
                            //上拉伸
                            //高度增加或减小，位置上下移动
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                        } else if (params.kind === "w") {//左拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                        } else if (params.kind === "e") {//右拉伸
                            target.style.width = parseInt(params.width) + disX + "px";
                        } else if (params.kind === "s") {//下拉伸
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else if (params.kind === "nw") {//左上拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                        } else if (params.kind === "ne") {//右上拉伸
                            target.style.top = parseInt(params.top) + disY + "px";
                            target.style.height = parseInt(params.height) - disY + "px";
                            //右
                            target.style.width = parseInt(params.width) + disX + "px";
                        } else if (params.kind === "sw") {//左下拉伸
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.width = parseInt(params.width) - disX + "px";
                            //下
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else if (params.kind === "se") {//右下拉伸
                            target.style.width = parseInt(params.width) + disX + "px";
                            target.style.height = parseInt(params.height) + disY + "px";
                        } else {//移动
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.top = parseInt(params.top) + disY + "px";
                        }
                    }

                    document.onmouseup = function () {
                        params.flag = false;
                        if (clickFlag) {
                            if (getCss(target, "left") !== "auto") {
                                params.left = getCss(target, "left");
                            }
                            if (getCss(target, "top") !== "auto") {
                                params.top = getCss(target, "top");
                            }
                            params.width = getCss(target, "width");
                            params.height = getCss(target, "height");

                            //给隐藏文本框赋值
                            posX = parseInt(target.style.left);
                            posY = parseInt(target.style.top);
                            cropW = parseInt(target.style.width);
                            cropH = parseInt(target.style.height);
                            if (posX < 0) {
                                posX = 0;
                            }
                            if (posY < 0) {
                                posY = 0;
                            }
                            if ((posX + cropW) > iCurWidth) {
                                cropW = iCurWidth - posX;
                            }
                            if ((posY + cropH) > iCurHeight) {
                                cropH = iCurHeight - posY;
                            }
                            //赋值
                            ID("cropPosX").value = posX;
                            ID("cropPosY").value = posY;
                            ID("cropImageWidth").value = parseInt(ID("zxxCropBox").style.width);
                            ID("cropImageHeight").value = parseInt(ID("zxxCropBox").style.height);

                            clickFlag = false;
                        }
                    };

                }
            };


            document.getElementById("rotateCenter").onclick = function (ev) {
                var oldY = null;
                var isdown = true;
                oldY = ev.clientY;
                $("html").mousemove(function (e) {
                    if (isdown) {
                        $("#zxxCropBox").css("transform", "rotate(" + (e.clientY - oldY) + "deg)");
                    }
                });
                $("html").mouseup(function (e) {
                    isdown = false;
                    oldY = null;
                });
            }

        };

        //绑定拖拽
        startDrag(ID("zxxDragBg"), ID("zxxCropBox"), "drag");
        //绑定拉伸
        startDrag(ID("dragLeftTop"), ID("zxxCropBox"), "nw");
        startDrag(ID("dragLeftBot"), ID("zxxCropBox"), "sw");
        startDrag(ID("dragRightTop"), ID("zxxCropBox"), "ne");
        startDrag(ID("dragRightBot"), ID("zxxCropBox"), "se");
        startDrag(ID("dragTopCenter"), ID("zxxCropBox"), "n");
        startDrag(ID("dragBotCenter"), ID("zxxCropBox"), "s");
        startDrag(ID("dragRightCenter"), ID("zxxCropBox"), "e");
        startDrag(ID("dragLeftCenter"), ID("zxxCropBox"), "w");

        //图片不能被选中，目的在于使拖拽顺滑
        ID("myCanvas").onselectstart = function () {
            return false;
        };
        img.onselectstart = function () {
            return false;
        };

    }

    function meldEnd() {
        //旋转度数
        var rotateDegree = ID("zxxCropBox").style.transform;
        rotateDegree = rotateDegree.substring(7, rotateDegree.indexOf('d'));

        var zxxCropBox = ID("zxxCropBox");
        //放大倍数
        var orignWidth = 80;
        var orignHeight = 80;
        var curWidth = parseInt(zxxCropBox.style.width);
        var curHeight = parseInt(zxxCropBox.style.height);

        var scaleWidthRate = curWidth / orignWidth;
        var scaleHeightRate = curHeight / orignHeight;

        //当前位置
        var posX = zxxCropBox.offsetLeft;
        var posY = zxxCropBox.offsetTop;//zxxCropBox.parentNode.offsetTop;
        //中心位置
        var centerX = ID("rotateCenter").offsetLeft + posX;
        var centerY = ID("rotateCenter").offsetTop + posY;

        var newImg = new Image();
        newImg.src = meldImg.src;

        newImg.onload = function () {
            /*   lctx.save();
               lctx.translate(centerX, centerY);
               lctx.rotate(rotateDegree / 180 * Math.PI);

               lctx.drawImage(newImg, -ID("rotateCenter").offsetLeft, -ID("rotateCenter").offsetTop, newImg.width * scaleWidthRate, newImg.height * scaleHeightRate);
               lctx.restore();*/
            /* var imageData = lctx.getImageData(0, 0, lcanvas.width, lcanvas.height);
             var data = imageData.data;
             for (var i = 0; i < imageData.width * imageData.height * 4; i += 4) {
                 if (data[i] >= 250 && data[i + 1] >= 250 && data[i + 2] >= 250) {
                     data[i + 3] = 0;
                 }
             }

             lctx.putImageData(imageData, 0, 0);*/
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotateDegree / 180 * Math.PI);
            console.log("合并画");
            ctx.drawImage(newImg, -ID("rotateCenter").offsetLeft, -ID("rotateCenter").offsetTop, newImg.width * scaleWidthRate, newImg.height * scaleHeightRate);
            ctx.restore();
            //ctx.drawImage(lcanvas, myImage.width / 2, myImage.height / 2, newImg.width, newImg.height);
            //ID("meldCanvas").style.display = "none";
            //img.src = myImage.toDataURL("image/png");
            img.src = getNewImgSrc(myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2, img.width, img.height);//myImage.toDataURL("image/png");
            img.height = img.height;
            img.width = img.width;

            /*img.onload = function () {
                orignHeight = img.height;
                orignWidth = img.width;
                AutoResizeImage(800, 600, img);
                console.log("合并加载画");
                ctx.drawImage(img, myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2);
            }*/

            var meldContainer = ID("meldContainer");
            meldContainer.parentNode.removeChild(meldContainer);
        }
    }

    document.getElementById("textBtn").onclick = function () {
        if (!text) {
            text = true;
            textEnd();
            $("#textBtn").removeClass("icon complete-icon");
            $("#textBtn").addClass("icon text-icon");
            $("#textText").html("文字");
            cancelBtnDisabled();
            return;
        }
        text = false;

        $("#textBtn").removeClass("icon text-icon");
        $("#textBtn").addClass("icon complete-icon");
        $("#textText").html("完成");

        console.log("text....");
        curOperation = "text";
        btnDisabled();
        var oRelDiv = document.createElement("div");
        oRelDiv.style.position = "absolute";
        oRelDiv.style.width = 800 + "px";
        oRelDiv.style.height = 600 + "px";
        oRelDiv.style.top = "0px";
        oRelDiv.style.zIndex = 2;
        oRelDiv.id = "textContainer";

        myImage.parentNode.insertBefore(oRelDiv, myImage);

        //初始化坐标与剪裁高宽
        var cropW = 150, cropH = 30;
        //var posX = (iCurWidth - cropW) / 2, posY = (iCurHeight - cropH) / 2;
        var posX = (myImage.offsetLeft + myImage.width / 2 - cropW / 2),
            posY = myImage.offsetTop + myImage.height / 2 - cropH / 2;
        var sInnerHtml =
            '<div id="zxxCropBox" style="height:' + cropH + 'px; width:' + cropW + 'px; position:absolute; left:' + posX + 'px; top:' + posY + 'px; border:1px solid black;">' +
            '<div id="zxxDragBg" style="height:100%; background:white; opacity:0.3; filter:alpha(opacity=30); cursor:move;z-index: 2">' +
            '<input id="textInput" style="height: 100%;width: 100%;z-index: 3"></div>' +
            '</div>' +
            '<input type="hidden" id="cropPosX" value="' + posX + '" />' +
            '<input type="hidden" id="cropPosY" value="' + posY + '" />' +
            '<input type="hidden" id="cropImageWidth" value="' + cropW + '" />' +
            '<input type="hidden" id="cropImageHeight" value="' + cropH + '" />';

        oRelDiv.innerHTML = sInnerHtml;

        var startDrag = function (point, target, kind) {
            var clickFlag = false;
            //point是拉伸点，target是被拉伸的目标，其高度及位置会发生改变
            //此处的target与上面拖拽的target是同一目标，故其params.left,params.top可以共用，也必须共用
            //初始化宽高
            params.width = getCss(target, "width");
            params.height = getCss(target, "height");
            //初始化坐标
            if (getCss(target, "left") !== "auto") {
                params.left = getCss(target, "left");
            }
            if (getCss(target, "top") !== "auto") {
                params.top = getCss(target, "top");
            }
            //target是移动对象
            point.onmousedown = function (event) {
                clickFlag = true;
                console.log("text 进入");
                params.kind = kind;
                params.flag = true;
                if (!event) {
                    event = window.event;
                }
                var e = event;
                params.currentX = e.clientX;
                params.currentY = e.clientY;
                //防止IE文字选中，有助于拖拽平滑
                point.onselectstart = function () {
                    return false;
                }

                document.onmousemove = function (event) {
                    var e = event ? event : window.event;
                    if (params.flag) {
                        var nowX = e.clientX, nowY = e.clientY;
                        var disX = nowX - params.currentX, disY = nowY - params.currentY;
                        target.style.left = parseInt(params.left) + disX + "px";
                        target.style.top = parseInt(params.top) + disY + "px";


                    }


                    document.onmouseup = function () {
                        params.flag = false;
                        if (clickFlag) {
                            clickFlag = false;
                            if (getCss(target, "left") !== "auto") {
                                params.left = getCss(target, "left");
                            }
                            if (getCss(target, "top") !== "auto") {
                                params.top = getCss(target, "top");
                            }
                            params.width = getCss(target, "width");
                            params.height = getCss(target, "height");

                            //给隐藏文本框赋值
                            posX = parseInt(target.style.left);
                            posY = parseInt(target.style.top);
                            cropW = parseInt(target.style.width);
                            cropH = parseInt(target.style.height);
                            if (posX < 0) {
                                posX = 0;
                            }
                            if (posY < 0) {
                                posY = 0;
                            }

                            //赋值
                            ID("cropPosX").value = posX;
                            ID("cropPosY").value = posY;
                            ID("cropImageWidth").value = parseInt(ID("zxxCropBox").style.width);
                            ID("cropImageHeight").value = parseInt(ID("zxxCropBox").style.height);
                        }
                    };

                }
            };


        };

        //绑定拖拽
        startDrag(ID("zxxDragBg"), ID("zxxCropBox"), "drag");

        //图片不能被选中，目的在于使拖拽顺滑
        ID("myCanvas").onselectstart = function () {
            return false;
        };
        img.onselectstart = function () {
            return false;
        };
    }

    function textEnd() {
        var text = ID("textInput").value;
        var posX = ID("zxxCropBox").offsetLeft;
        var posY = ID("zxxCropBox").offsetTop;
        console.log(text, posX, posY);
        ctx.font = "20px Georgia";
        ctx.fillText(text, posX, posY);

        var textContainer = ID("textContainer");
        textContainer.parentNode.removeChild(textContainer);

        img.src = getNewImgSrc(myImage.width / 2 - img.width / 2, myImage.height / 2 - img.height / 2, img.width, img.height);//myImage.toDataURL("image/png");
        img.height = img.height;
        img.width = img.width;
    }

    function btnDisabled() {
        ID("rotateBtn").disabled = true;
        if (meld) ID("meldBtn").disabled = true;
        if (clip) ID("clipBtn").disabled = true;
        if (text) ID("textBtn").disabled = true;
    }

    function cancelBtnDisabled() {
        ID("rotateBtn").disabled = false;
        if (meld) ID("meldBtn").disabled = false;
        if (clip) ID("clipBtn").disabled = false;
        if (text) ID("textBtn").disabled = false;
    }

    document.getElementById("undo").onclick = function () {
        ctx.clearRect(0, 0, myImage.width, myImage.height);
        window.onload();
    }

    document.getElementById("back").onclick = function () {
        window.history.back();
        let editImg = JSON.parse(sessionStorage.editImg);
        editImg.editImgSrc = getNewImgSrc(myImage.width/2-img.width/2,myImage.height/2-img.height/2,img.width,img.height);//myImage.toDataURL("image/png");
        editImg.width = img.width;
        editImg.height = img.height;
        sessionStorage.editImg = JSON.stringify(editImg);
        console.log(sessionStorage.editImg);
        sessionStorage.isEdit = true;
        sessionStorage.href = location.href;
        /*var scaleInput = document.getElementById("scale-range").value;
        ctx.clearRect(0, 0, myImage.width, myImage.height);
        ctx.save();
        ctx.translate(myImage.width / 2 - img.width / 2 * scaleInput, myImage.height / 2 - img.height / 2 * scaleInput);
        ctx.scale(scaleInput, scaleInput);
        ctx.drawImage(img, 0, 0);
        ctx.restore();*/
    }

    $("#tentative").click(function () {
        console.log(img.width, img.height);
    });


    $(".paster-container ul li img").each(function () {
        $(this).click(function () {
            var newImg = new Image();
            newImg.src = $(this).attr("src");
            meldImg.src = $(this).attr("src");

            newImg.onload = function () {
                //因为前面用了原声js，这里用了jquery，杂用所以导致无效
                ID("zxxDragBg").style.backgroundSize = "cover";
                ID("zxxDragBg").style.backgroundImage = "url(" + $(this).attr("src") + ")";

                console.log(ID("zxxCropBox").style.width, newImg.style.width);
            }
            alert("点击中心可旋转");
            //ID("zxxDragBg").style.backgroundImage = "url("+$(this).attr("src")+")";
            console.log($(this).attr("src"), newImg.src);
        });
    });
}
