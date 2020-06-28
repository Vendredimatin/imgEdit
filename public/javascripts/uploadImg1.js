var imgSrc = []; //图片路径
var imgFile = []; //文件流
var imgName = []; //图片名字

window.onload = function () {
    let account = getValue();
    if (!sessionStorage.imgCount) sessionStorage.imgCount = 0;

    if (location.href != sessionStorage.href) {

        if (sessionStorage.isEdit) {
            imgSrc = JSON.parse(sessionStorage.imgSrc);
            imgName = JSON.parse(sessionStorage.imgName);

            let editImg = JSON.parse(sessionStorage.editImg);
            imgSrc[editImg.editImgIndex] = editImg.editImgSrc;
            sessionStorage.isEdit = false;
            addNewContent("#imgBox");
        }
    }else {
        sessionStorage.imgCount = 0;
        sessionStorage.removeItem("imgSrc");
        sessionStorage.removeItem("imgName");
        sessionStorage.removeItem("isEdit");
    }

    sessionStorage.href = location.href;

    $("#btn").click(function () {
        upload(account);
    });
};

$("#selectImage").click(function () {
    if (sessionStorage.imgCount == 5){
        alert("最多上传五张图片");
        return;
    }

    $(this).parent().append("<input type=\"file\" title=\"请选择图片\" id=\"file1\" name=\"logo\"\n" +
        "                   accept=\"image/png,image/jpg,image/gif,image/JPEG\"/>");

    var id = "file1";
    console.log(id);
    var oInput = '#' + id;
    var imgBox = '#' + 'imgBox';
    $(oInput).click();
    $(oInput).on('change', function () {
        var fileImg = $(oInput)[0];
        var fileList = fileImg.files;
        for (var i = 0; i < fileList.length; i++) {
            var imgSrcI = getObjectURL(fileList[i]);
            imgName.push(fileList[i].name);
            imgSrc.push(imgSrcI);
            imgFile.push(fileList[i]);
        }
        sessionStorage.imgCount++;
        addNewContent(imgBox);
        $(this).remove();
    });


});

function upload(account) {
    console.log("进入upload");
    var data = [];
    var name = [];
    for (let i = 0; i < sessionStorage.imgCount; i++) {
        name.push(imgName[i]);
        data.push(getBase64Image(document.getElementById("img"+i)));
    }
    $.ajax({
        url: "/upload",
        type: "post",
        data: {
            "editImgSrcs": data,
            "imgNames": name,
            "account":account
        },
        dataType: "json",
        xhr: function () {
            myXhr = $.ajaxSettings.xhr();
            //获取ajaxSettings中的xhr对象，为它的upload属性绑定progress事件的处理函数
            if (myXhr.upload) {
                //绑定progress事件的回调函数
                myXhr.upload.addEventListener('progress', uploadProgress, false);
            }
            //xhr对象返回给jQuery使用
            return myXhr;
        },
        success: function (res) {
            window.location.href = "../views/check.html?account="+encodeURI(account);
            console.log(res);
        },
        error: function (err) {
            window.location.href = "../views/check.html?account="+encodeURI(account);
            console.log(err);
        }
    });
}

function uploadProgress(evt) {
    $(".progress").css('display', 'block');
    if (evt.lengthComputable) {
        //evt.loaded：文件上传的大小   evt.total：文件总的大小
        var percentComplete = Math.round((evt.loaded) * 100 / evt.total);
        //加载进度条，同时显示信息
        $(".progress-value").html(percentComplete + '%');
        $("#progressBar").css("width", percentComplete + "%");
        $("#percent").html(percentComplete + '%');
        $("#progressNumber").css("width", "" + percentComplete + "px");

        if (percentComplete === 100) {
            alert("upload success");
        }
    }
}

//图片展示
function addNewContent(obj) {
    $(obj).html("");
    for (var a = 0; a < imgSrc.length; a++) {
        var oldBox = $(obj).html();
        var id = "img" + a;
        $(obj).html(oldBox + '<div class="imgContainer"><img  id=' + id + ' title=' + imgName[a] + ' alt=' + imgName[a] + ' src=' + imgSrc[a] + ' onclick="imgDisplay(this)" index = ' + a + '><p onclick="removeImg(' + a + ')" class="imgDelete">删除</p></div>');

    }

}

//删除
function removeImg(removeImgIndex) {
    imgName.splice(removeImgIndex,1);
    imgSrc.splice(removeImgIndex,1);
    sessionStorage.imgCount--;
    addNewContent("#imgBox");
}

//图片灯箱
let EditImg = function (editImgSrc, editImgIndex) {
    this.editImgSrc = editImgSrc;
    this.editImgIndex = editImgIndex;
}

function imgDisplay(obj) {
    let src = $(obj).attr("src");
    let editImg = new EditImg(src,($(obj).attr("index")));
    var imgHtml = '<div style="width: 100%;height: 100vh;overflow: auto;background: rgba(0,0,0,0.5);text-align: center;position: fixed;top: 0;left: 0;z-index: 1000;">' +
        '<img src=' + src + ' style="margin-top: 100px;width: 70%;margin-bottom: 100px;"/><p style="font-size: 50px;position: fixed;top: 30px;right: 30px;color: white;cursor: pointer;" onclick="closePicture(this)">×</p>' +
        '<button class="editImgBtn" onclick="editPicture('+ JSON.stringify(editImg).replace(/\"/g,"'") +')"></button></div>';
    $('body').append(imgHtml);
}


//关闭
function closePicture(obj) {
    $(obj).parent("div").remove();
}

function editPicture(editImg) {
    window.location.href = "editImg.html";
    sessionStorage.imgSrc = JSON.stringify(imgSrc);
    sessionStorage.imgName = JSON.stringify(imgName);
    sessionStorage.editImg = JSON.stringify(editImg);
}


//图片预览路径
function getObjectURL(file) {
    var url = null;
    if (window.createObjectURL != undefined) { // basic
        url = window.createObjectURL(file);
    } else if (window.URL != undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    } else if (window.webkitURL != undefined) { // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    }
    return url;
}

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL;
}

function getValue() {
    var loc = location.href;
    var n1 = loc.length;//地址的总长度
    var n2 = loc.indexOf("=");//取得=号的位置
    var account = decodeURI(loc.substr(n2+1, n1-n2));//从=号后面的内容
    return account;
}

