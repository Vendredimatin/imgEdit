const mysql = require('mysql');
const fs = require('fs');
const async = require('async');

var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '123456',
    database : 'web',
    port:'3306'
});
connection.connect();

let Img = function (id,account,name,rating,labels,src) {
    this.id = id;
    this.account = account;
    this.name = name;
    this.rating = rating;
    this.src = src;
    this.labels = labels;
};

async function init(res,loginAccount) {
    let path = __dirname + '/upload';
    let images = [];
    let totalPage = 0;
    let limit = 12;
    async.waterfall([
        function (done) {
            let sql = "select * from image where isRelease = 1";
            console.log(sql);
            connection.query(sql,function (err,rs) {
                if (err) throw err;
                let results = JSON.stringify(rs);
                results = JSON.parse(results);
                let totalNum = results.length;
                totalPage = parseInt(totalNum/limit);
                if (totalNum%limit != 0)
                    totalPage++;

                done(null,totalPage);
             });
         },
        function (totalPage,done) {
            let selectSQL = "select * from image where isRelease ='"+ 1 + "' limit " + limit +"";
            console.log(selectSQL);
            connection.query(selectSQL,function (err,rs) {
                if (err)
                    throw err;
                let results = JSON.stringify(rs);
                results = JSON.parse(results);
                let images = [];
                for (let i = 0; i < results.length; i++) {
                    let image = new Img();
                    image.id = results[i].id;
                    image.account = results[i].account;
                    image.name = results[i].name;
                    image.rating = results[i].rating;
                    image.labels = results[i].labels;
                    image.releaseTime = results[i].releaseTime;
                    image.popularity = results[i].popularity;
                    images.push(image);
                }
                done(null,images);
            });
        },
        function (images,done) {
            getImgSrc(images,done);
        },
        function (images,done) {
            images.push(totalPage);
            images.push(loginAccount);
            res.send(images);
        }
    ]);

}

function getTotalPages(done,labels) {
    let limit = 12;
    let selectSQL;

    if (!labels || labels.length == 0)
        selectSQL = "select count(*) from image where isRelease ='" + 1 + "'"
    else{
        let labelList = labels.split(',');
        selectSQL = "select count(*) from image where isRelease ='" + 1 + "'";
        for (let i = 0; i < labelList.length; i++) {
            selectSQL += " and labels like '" + "%" + labelList[i] + "%" + "'";
        }
    }

    console.log(selectSQL);
    connection.query(selectSQL,function (err,rs) {
        if (err) throw err;
        let results = JSON.stringify(rs);
        results = JSON.parse(results)[0];
        let totalNum = results["count(*)"];
        console.log("totalNum.......",totalNum);
        let totalPage = parseInt(totalNum/limit);
        if (totalNum%limit != 0)
            totalPage++;

        console.log(totalPage);
        done(null,totalPage);
    });


}

function getContentedImageInfo(done,labels,page,sortedMode) {
    let limit = 12;
    let selectSQL;

    if (!labels || labels.length == 0)
         selectSQL = "select * from image where isRelease ='" + 1 + "' ORDER BY " + sortedMode + " DESC";
    else{
        let labelList = labels.split(',');
        selectSQL = "select * from image where isRelease ='" + 1 + "'";
        for (let i = 0; i < labelList.length; i++) {
            selectSQL += " and labels like '" + "%" + labelList[i] + "%" + "'";
        }
        selectSQL += " ORDER BY " + sortedMode + " DESC";
    }

    if (!page){
        page = 1;
    }
    page = parseInt(page);
    let start = (page-1)*limit;
    selectSQL += " limit " + start + ',' + limit;
    console.log(selectSQL);

    connection.query(selectSQL, function (err, rs) {
        if (err) throw err;
        console.log("查询");
        let results = JSON.stringify(rs);
        results = JSON.parse(results);
        let images = [];
        for (let i = 0; i < results.length; i++) {
            let image = new Img();
            image.id = results[i].id;
            image.account = results[i].account;
            image.name = results[i].name;
            image.rating = results[i].rating;
            image.labels = results[i].labels;
            image.releaseTime = results[i].releaseTime;
            image.popularity = results[i].popularity;
            images.push(image);
        }

        console.log(images);
        done(null, images);
    });
}

function getImgSrc(images,done) {
    let path = __dirname + '/upload';
    let imageLength = images.length;

    if (imageLength == 0)
        done(null,images);

    let files = fs.readdirSync(path);
    for (const account of files){
        let names = fs.readdirSync(path+'/'+account);
        for (const name of names){
            let nameWithoutPostfix = name.slice(0,name.indexOf('.'));
            let index = isExist(account,nameWithoutPostfix);
            if (index > -1) {
                let data = fs.readFileSync(path + '/' + account + '/' + name, 'base64');
                images[index].src = 'data:image/png;base64,' + data;
                imageLength--;
                if (imageLength === 0) {
                    done(null,images);
                    imageLength = -1;
                    return;
                }
            }
        }
    }

    function isExist(account,name){
        for (let i = 0; i < images.length; i++) {
            if (images[i].name === name && images[i].account === account)
                return i;
        }

        return -1;
    }
}

async function search(res,labels,sortedMode){
    let totalPage = 0;
    async.waterfall([
        function (done) {
            getTotalPages(done,labels);
        },
        function (pages,done) {
            totalPage = pages;
            getContentedImageInfo(done,labels,1,sortedMode);
        },
        function (images,done) {
            getImgSrc(images,done);
        },
        function (images,done) {
            images.push(totalPage);
            res.send(images);
        }
    ]);
}

async function addPopularity(res,movieID) {
    async.waterfall([
        function (done) {
            connection.query("select popularity from image where id ='"+ movieID + "'",function (err,rs) {
                let results = JSON.stringify(rs);
                results = JSON.parse(results)[0];
                let popularity = results["popularity"];
                done(null,popularity);
            });
        },
        function (popularity,done) {
            popularity++;
            connection.query("update image set popularity='" + popularity +"'where id ='" + movieID +"'",function (err,rs) {
                res.send(toString(popularity));
            })
        }
    ]);
}

async function page(res,labels,page,sortedMode){
    async.waterfall([
        function (done) {
            getContentedImageInfo(done,labels,page,sortedMode);
        },
        function (images,done) {
            getImgSrc(images,done);
        },
        function (images,done) {
            res.send(images);
        }
    ]);
}

exports.init = init;
exports.search = search;
exports.addPopularity = addPopularity;
exports.page = page;