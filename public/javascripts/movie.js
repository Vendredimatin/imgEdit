window.onload = function () {
    let account = getValue();
    let totalPage;
    console.log(account);
    $.ajax({
        url: "/index",
        type: "post",
        success: function (data) {
            account = data[data.length - 1];
            data.splice(data.length - 1, 1);
            totalPage = data[data.length - 1];
            data.splice(data.length - 1, 1);
            initPager(totalPage);
            console.log(account);
            appendMovie(data);
        },
        error: function (data) {
            console.log("fail");
        }
    });

    $(".navbar li a").click(function () {
        if ($(this).text() === '个人') {
            window.location.href = '../views/check.html?' + "account=" + encodeURI(account);
        }else{
            window.location.href = "../views/movie.html?"+"account="+encodeURI(account);
        }
    });

    //得到指定标签的图片
    $(".tags li a").click(function () {
        let lis = $(this).parent().siblings();
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].classList.contains('active')) {
                lis[i].classList.remove('active');
                break;
            }
        }
        $(this).parent().addClass('active');
        search();
    });

    //以指定方式排序
    $(".sort-control").click(function () {
        $(".sort-control.sort-radio-checked").removeClass("sort-control sort-radio-checked").addClass("sort-control sort-radio");
        $(this).removeClass("sort-control sort-radio").addClass("sort-control sort-radio-checked");
        search();
    });

    $(".movie-list").on('click', '.movie-item', function () {
        let movieID = $(this).next().children("i").attr("data-val");
        $.ajax({
            url: "/addPopularity?movieID=" + movieID + "",
            type: "get",
            success: function (data) {
                console.log("添加流行度成功");
            },
            error: function (data) {
                console.log("fail");
            }
        });
    });

    $(".list-pager").on('click', 'li a', function () {
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
        //得到排序方式
        let sortedMode = getSortedMode();

        $.ajax({
            url: "/page?getPage=" + page + "&labels=" + chosenLabels + "&sortedMode=" + sortedMode,
            type: "post",
            success: function (data) {
                appendMovie(data);
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

function search() {
    //得到标签
    let chosenLabels = chosenLabelsForSearch();
    //得到排序方式
    let sortedMode = getSortedMode();

    $.ajax({
        url: "/search?labels=" + chosenLabels + "&sortedMode=" + sortedMode + "",
        type: "post",
        success: function (data) {
            let totalPage = data[data.length - 1];
            data.splice(data.length - 1, 1);
            console.log(data.length);
            initPager(totalPage);
            if (data.length != 0)
                appendMovie(data);
            else{
                let movieList = $('.movie-list');
                movieList.empty();
            }

        },
        error: function (data) {
            console.log("fail");
        }
    });
}


function appendMovie(data) {
    let movieList = $('.movie-list');
    movieList.empty();
    for (let i = 0; i < data.length; i++) {
        let labels = data[i].labels.replace(",", "/");
        let integer = data[i].rating.toString().substr(0, 1);
        let fraction = data[i].rating.toString().substr(2, 1);
        if (fraction == "")
            fraction = 0;
        let html = '<dd>\n' +
            '                    <div class="movie-item">\n' +
            '                        <div class="movie-poster">\n' +
            '                            <img class="poster-default" src="' + data[i].src + '" />\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                    <div class="channel-detail movie-item-title" title="' + data[i].name + '">\n' +
            '                        <i data-val="' + data[i].id + '">' + data[i].name + '</i>\n' +
            '                    </div>\n' +
            '<div class="channel-detail channel-label-detail"><i>类型:' + labels + '</i></div>' +
            '<div class="channel-detail channel-label-detail"><i>年份:' + data[i].releaseTime + '</i></div>' +
            '<div class="channel-detail channel-label-detail"><i>访问量:' + data[i].popularity + '</i></div>' +
            '<div class="channel-detail channel-detail-orange"><i class="integer">' + integer + '.' + '</i><i class="fraction">' + fraction + '</i></div>' +
            '</dd>';

        movieList.append(html);
    }


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

function getSortedMode() {
    let sortedMode = $(".sort-control.sort-radio-checked").next().text();
    if (sortedMode === "按时间排序")
        sortedMode = 'releaseTime';
    else if (sortedMode === "按热门排序") {
        sortedMode = 'popularity';
    } else {
        sortedMode = 'rating';
    }
    return sortedMode;
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