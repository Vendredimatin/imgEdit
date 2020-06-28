window.onload = function () {
    let account = getValue();
    initReleaseUI(account);

    $(".navbar li a").click(function () {
        if ($(this).text() === "首页"){
            window.location.href = "../views/movie.html?"+"account="+encodeURI(account);
        } else if ($(this).text() === "个人"){
            window.location.href = '../views/check.html?'+"account="+encodeURI(account);
        }
    });

    $(".own-nav ul li a").click(function () {
        if ($(this).text() === "未发布") {
            $(".released-movies-penal").css("display", "none");
            $(".unreleased-movies-penal").css("display", "block");
            initUnreleaseUI(account);
        }else if ($(this).text() === '上传'){
            window.location.href = "uploadImg.html?account="+encodeURI(account);
        } else {
            $(".released-movies-penal").css("display", "block");
            $(".unreleased-movies-penal").css("display", "none");
            initReleaseUI(account);
        }
    });

    //添加标签
    $(".unreleased-movies-penal .movie-list").on('click','.channel-action span',function () {
        $('.labels').css("display", 'block');
        let id = $(this).parent().parent().next().children("i").attr("data-val");
        $(".chosen-label-list").empty();

        $("#release-button").click(function () {
            $('.labels').css("display", "none");
            let spans = $('.tag-item').children("span");
            console.log(spans);
            let labels = [];
            for (let i = 0; i < spans.length; i++) {
                labels.push(spans[i].innerText.substr(0,spans[i].innerText.length));
            }
            console.log(labels);

            $.ajax({
                url:"/releaseImage?id="+id+"&labels="+labels+"",
                type:"get",
                success:function (data) {
                    console.log("success");
                },
                error:function (data) {
                    console.log("fail");
                }
            });
        });
    });

    //用作筛选特定标签的元素
    $(".released-movies-penal .tags li a").click(function (event) {
        let lis = $(this).parent().siblings();
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].classList.contains('active')) {
                lis[i].classList.remove('active');
                break;
            }
        }
        $(this).parent().addClass('active');

        initReleaseUI(account);
    });

    //用于为发布电影选择特定标签
    $(".labels .tags li a").click(function (event) {
        if($('.chosen-label-list').children().length == 5){
            alert("最多添加五个标签！");
            return;
        }
        let labelName = event.target.innerText;
        let html = "<div class=\"tag-item\">\n" +
            "                    <span>"+labelName+"</span>\n" +
            "                    <div class=\"deleteChosenLabel\"></div>\n" +
            "                </div>"
        $('.chosen-label-list').append(html);
    });

    $('.self-define-label button:first').click(function () {
        $(".self-define-label-input-container").css("display", "inline-block");
    });

    //自定义标签输入
    $(".self-define-label-input-container input").keydown(function (event) {
        if (event.which === 13) {
            if($('.chosen-label-list').children().length == 5){
                alert("最多添加五个标签！");
                return;
            }
            let selfLabel = $(this).val();
            let html = "<div class=\"tag-item\">\n" +
                "                    <span>"+selfLabel+"</span>\n" +
                "                    <div class=\"deleteChosenLabel\"></div>\n" +
                "                </div>"
            $('.chosen-label-list').append(html);
            $(this).val("");
        }
    });

    //清空自定义标签输入
    $(".self-define-label-input-container button").click(function () {
        if ($(this).text() === "清空")
            $(".self-define-label-input-container input").val("");
        else if ($(this).text() === "删除")
            $(".self-define-label-input-container").css("display","none");
    });

    //删除已选择的标签
    $(".chosen-label-list").on('click','.deleteChosenLabel',function () {
       $(this).parent().remove();
    });

    //发布翻页
    $(".released-movies-penal .list-pager").on('click', 'li a', function () {
        let page = $(this).text();

        let lis = $(this).parent().siblings();
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].classList.contains('active')) {
                lis[i].classList.remove('active');
                break;
            }
        }
        $(this).parent().addClass('active');

        $(".page_" + page).addClass('active');
        let chosenLabels = chosenLabelsForSearch();

        $.ajax({
            url: "/releasedPage?getPage=" + page + "&account=" + account +"&labels=" + chosenLabels + "",
            type: "post",
            success: function (data) {
                data.splice(data.length - 1, 1);
                if (data.length != 0)
                    appendReleasedMovie(data);
            },
            error: function (data) {
                console.log("fail");
            }
        });
    });

    $(".unreleased-movies-penal .list-pager").on('click', 'li a', function () {
        let page = $(this).text();

        let lis = $(this).parent().siblings();
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].classList.contains('active')) {
                lis[i].classList.remove('active');
                break;
            }
        }
        $(this).parent().addClass('active');

        $(".page_" + page).addClass('active');

        $.ajax({
            url: "/unreleasedPage?getPage=" + page + "&account=" + account +"",
            type: "post",
            success: function (data) {
                data.splice(data.length - 1, 1);
                if (data.length != 0)
                    appendUnreleasedMovie(data);
            },
            error: function (data) {
                console.log("fail");
            }
        });
    });

    $(".movie_header .user-info").mouseover(function () {
        $(".user-menu").css("display","block");
        $(".movie_header .user-info").css("border","1px solid #adadad");
    });

    $(".movie_header .user-info").mouseout(function () {
        $(".user-menu").css("display","none");
        $(".movie_header .user-info").css("border","");
    });

    $(".user-menu li a").click(function () {
        if ( $(this).text() == "查看天气"){
            let key = "d62c704429803fef7d5f2ab1284199f3";
            $.ajax({
                url:"/getCode?account="+account+"",
                type:"get",
                success:function (data) {
                    let adcode = data;
                    console.log(adcode);
                    $.ajax({
                        url:"https://restapi.amap.com/v3/weather/weatherInfo?city="+adcode+"&key="+ key,
                        type:"get",
                        success:function (data) {
                            let obj = data["lives"][0];
                            let html = "<div class=\"weather\">\n" +
                                "    <p style=\"    font-size: 50px;position: fixed;top: 0px;right: 0px;color: #111;cursor: pointer;margin-top: -15px;\" onclick=\"closeWeather()\">×</p>\n" +
                                "    <h2> 你所在的省份：" + obj['province'] +"</h2>\n" +
                                "    <h2> 你所在的城市："+ obj['city'] +"</h2>\n" +
                                "    <h2> 天气情况："+ obj['weather']+"</h2>\n" +
                                "    <h2> 当前温度："+ obj['temperature'] +"</h2>\n" +
                                "    <h2> 风向："+ obj['winddirection'] +"</h2>\n" +
                                "    <h2> 风力等级：" + obj['windpower'] + "</h2>\n" +
                                "</div>";
                            document.body
                            $(document.body).append(html);
                        },
                        error:function (data) {
                            console.log("fail");
                        }
                    });
                },
                error:function () {
                    console.log("fail");
                }
            });
        }else if ($(this).text() == "退出") {

            $.ajax({
                url:"/logout",
                type:"get",
                success:function (data) {
                    console.log("success");
                    location.href ='../views/login.html';
                },
                error:function (data) {
                    console.log("fail");
                }
            });
        }

    });
};


function appendReleasedMovie(data) {
    let movieList = $('.released-movies-penal .movie-list');
    movieList.empty();
    for (let i = 0; i < data.length; i++) {
        let labels = data[i].labels.replace(",","/");
        let integer = data[i].rating.toString().substr(0,1);
        let fraction = data[i].rating.toString().substr(2,1);
        if (fraction == "")
            fraction = 0;
        let html = '<dd>\n' +
            '                    <div class="movie-item">\n' +
            '                        <div class="movie-poster">\n' +
            '                            <img class="poster-default" src="' + data[i].src + '" />\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                    <div class="channel-detail movie-item-title" title="'+ data[i].name + '">\n' +
            '                        <i data-val="'+data[i].id +'">'+ data[i].name + '</i>\n' +
            '                    </div>\n' +
            '<div class="channel-detail channel-label-detail"><i>类型:' + labels +'</i></div>' +
            '<div class="channel-detail channel-label-detail"><i>年份:' + data[i].releaseTime + '</i></div>' +
            '<div class="channel-detail channel-label-detail"><i>访问量:' + data[i].popularity + '</i></div>' +
            '<div class="channel-detail channel-detail-orange"><i class="integer">'+integer+'.'+'</i><i class="fraction">'+ fraction+'</i></div>' +
            '</dd>';


        movieList.append(html);
    }
}

function initReleaseUI(account) {
    let labels = chosenLabelsForSearch();
    $.ajax({
        url: "/personalReleasedMovies?account=" + account + "&labels=" + labels +"",
        type: "post",
        success: function (data) {
            let totalPage = data[data.length - 1];
            data.splice(data.length - 1, 1);
            initPager(totalPage);
            if (data.length != 0)
                appendReleasedMovie(data);
            else{
                let movieList = $('.released-movies-penal .movie-list');
                movieList.empty();
            }
        },
        error: function (data) {
            console.log("fail");
        }
    });
}

function initUnreleaseUI(account) {
    $.ajax({
        url: "/personalUnreleasedMovies?account=" + account + "",
        type: "post",
        success: function (data) {
            let totalPage = data[data.length - 1];
            data.splice(data.length - 1, 1);
            initPager(totalPage);
            if (data.length != 0){
                appendUnreleasedMovie(data);
            }else{
                let movieList = $('.unreleased-movies-penal .movie-list');
                movieList.empty();
            }
        },
        error: function (data) {
            console.log("fail");
        }
    });


}

function appendUnreleasedMovie(data) {
    let movieList = $('.unreleased-movies-penal .movie-list');
    movieList.empty();
    for (let i = 0; i < data.length; i++) {
        let integer = data[i].rating.toString().substr(0,1);
        let fraction = data[i].rating.toString().substr(2,1);
        if (fraction == "")
            fraction = 0;
        let html = '<dd>\n' +
            '                    <div class="movie-item">\n' +
            '                        <div class="movie-poster">\n' +
            '                            <img class="poster-default" src="' + data[i].src + '" />\n' +
            '                        </div>\n' +
            '<div class="channel-action channel-action-addLabels">\n' +
            '                                <span>添加标签</span>\n' +
            '                            </div>' +
            '                    </div>\n' +
            '                    <div class="channel-detail movie-item-title" title="' + data[i].name + '">\n' +
            '                        <i data-val="' + data[i].id + '">' + data[i].name + '</i>\n' +
            '                    </div>\n' +
            '<div class="channel-detail channel-detail-orange"><i class="integer">' + integer+'.' + '</i><i class="fraction">' + fraction + '</i></div>' +
            '</dd>';

        movieList.append(html);
    }
}

function closeLabels() {
    $(".labels").css("display","none");
}

function chosenLabelsForSearch() {
    let tagsLine = $(".tags-lines").children();
    let labels = [];
    for (let i = 0; i < tagsLine.length; i++) {
        let lis = tagsLine[i].children[1].children;
        for (let j = 0; j < lis.length; j++) {
            if (lis[j].classList.contains("active")) {
                labels.push(lis[j].firstElementChild.text);
                break;
            }
        }
    }

    for (let i = 0; i < labels.length; i++) {
        if (labels[i] == "全部") {
            labels.splice(i, 1)
            i--;
        }
    }

    console.log(labels);
    return labels;
}

function initPager(page) {
    $(".list-pager").empty();
    let html = "<li class=\"active\">\n" +
        "                    <a class=\"page_" + 1 + "\" href=\"javascript:void(0);\" style=\"cursor: default\">" + 1 + "</a>\n" +
        "                </li>";
    $(".list-pager").append(html);
    for (let i = 2; i <= page; i++) {
        html = "<li>\n" +
            "                    <a class=\"page_" + i + "\" href=\"javascript:void(0);\">" + i + "</a>\n" +
            "                </li>";
        $(".list-pager").append(html);
    }
}

function getValue() {
    var loc = location.href;
    var n1 = loc.length;//地址的总长度
    var n2 = loc.indexOf("=");//取得=号的位置
    var account = decodeURI(loc.substr(n2+1, n1-n2));//从=号后面的内容
    return account;
}

function closeWeather() {
    $(".weather").remove();
}