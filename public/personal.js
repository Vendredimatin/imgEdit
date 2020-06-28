const mysql = require('mysql');
const path = require('path');
const fs = require('fs');
const async = require('async');

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'web',
    port: '3306'
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



async function checkReleasedImage(res, account,labels) {
    let path = __dirname + '/upload';
    let images = [];
    let totalPages = 0;
    console.time("waterfall");
    async.waterfall([
        function (done) {
            getTotalPages(done,account,1,labels);
        },
        function (pages, done) {
           totalPages = pages;
           console.log(totalPages);
           getContentedImageInfo(done,account,1,labels);
        },
        function (images,done) {
            getImgSrc(done,images);
        },
        function (images,done) {
            images.push(totalPages);
            res.send(images);
        }

    ]);
}

async function checkUnreleaseImage(res,account) {
    let totalPage = 0;
    async.waterfall([
        function (done) {
            getTotalPages(done,account,0);
        },
        function (pages,done) {
            totalPage = pages;
            console.log(totalPage);
            getContentedImageInfo(done,account,0,undefined,1);
        },
        function (images,done) {
            getImgSrc(done,images);
        },
        function (images,done) {
            images.push(totalPage);
            res.send(images);
        }
    ]);
}

async function releaseImage(id,labels) {
    let updateSQL = "update image SET isRelease= '" + 1  + "', labels ='" + labels + "' where id = '" + id + "'";
    connection.query(updateSQL,function (err,rs) {
        if(err){
            throw err;
        }else {
            console.log(rs);
        }
    });
}

async function releasedPage(res,account,labels,page) {
    let path = __dirname + '/upload';
    let images = [];
    let totalPages = 0;
    console.time("waterfall");
    async.waterfall([
        function (done) {
            getTotalPages(done,account,1,labels);
        },
        function (pages, done) {
            totalPages = pages;
            console.log(totalPages);
            getContentedImageInfo(done,account,1,labels,page);
        },
        function (images,done) {
            getImgSrc(done,images);
        },
        function (images,done) {
            images.push(totalPages);
            res.send(images);
        }

    ]);
}

async function unreleasedPage(res,account,page) {
    let path = __dirname + '/upload';
    let images = [];
    let totalPages = 0;
    console.time("waterfall");
    async.waterfall([
        function (done) {
            getTotalPages(done,account,0);
        },
        function (pages, done) {
            totalPages = pages;
            console.log(totalPages);
            getContentedImageInfo(done,account,0,undefined,page);
        },
        function (images,done) {
            if (page == 3)
                console.log("debug");
            getImgSrc(done,images);
        },
        function (images,done) {
            images.push(totalPages);
            res.send(images);
        }

    ]);
}

function getTotalPages(done,account,isRelease,labels) {
    let limit = 12;
    let selectSQL = "select count(*) from image where isRelease = " + isRelease + " and account = '" + account+"'";
    if (labels){
        let labelList = labels.split(',');
        for (let i = 0; i < labelList.length; i++) {
            selectSQL += " and labels like '" + "%" + labelList[i] + "%" + "'";
        }
    }

    console.log(selectSQL);
    connection.query(selectSQL,function (err,rs) {
        if (err) throw err;
        let results = JSON.stringify(rs);
        results = JSON.parse(results)[0];
        console.log("getTotalPages...",results);
        let totalNum = results['count(*)'];
        let totalPage = parseInt(totalNum/limit);
        if (totalNum%limit != 0)
            totalPage++;

        console.log(totalPage);
        done(null,totalPage);
    });
}

function getContentedImageInfo(done,account,isRelease,labels,page) {
    let limit = 12;
    let selectSQL = "select * from image where isRelease = " + isRelease + " and account = '" + account+"'";
    if (labels){
        let labelList = labels.split(',');
        for (let i = 0; i < labelList.length; i++) {
            selectSQL += " and labels like '" + "%" + labelList[i] + "%" + "'";
        }
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

        //console.log(images);
        done(null, images);
    });
}

function getImgSrc(done,images) {
    let path = __dirname + '/upload';
    let imageLength = images.length;

    if (imageLength == 0)
        done(null,images);

    console.log("getImgSrc.....");
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
                    console.log(images);
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

exports.checkReleaseImage = checkReleasedImage;
exports.checkUnreleaseImage = checkUnreleaseImage;
exports.releaseImage = releaseImage;
exports.releasedPage = releasedPage;
exports.unreleasedPage = unreleasedPage;