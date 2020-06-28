const express = require('express');
const app = express();
const mysql = require('mysql');
let cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
var session = require('express-session');

const index = require('./index');
const personal = require('./personal');
const uploadImg = require('./uploadImg');
const utils = require('./utils');
let xlsx = require('node-xlsx');
const async = require('async');

var https = require('https');

/**
 * 配置MySql
 */
let connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'web',
    port: '3306'
});
connection.connect();


//jquery等文件找不到的解决办法
app.use(express.static(__dirname));
app.use(cookieParser('secret'));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 30 * 60 * 1000, httpOnly: true},
}));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


//根据项目的路径导入生成的证书文件
var privateKey = fs.readFileSync(path.join(__dirname, './certificate/private.pem'), 'utf8');
var certificate = fs.readFileSync(path.join(__dirname, './certificate/file.crt'), 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);

//可以分别设置http、https的访问端口号
var SSLPORT = 7744;

httpsServer.listen(SSLPORT, function () {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});

app.get('/login.html', function (req, res) {
    if (req.session.sign) {
        res.sendfile(__dirname + "/" + "views/movie.html");
    } else {
        res.sendfile(__dirname + "/" + "views/login.html");
    }
    /*if (req.cookies[encryptedKey]) {
        console.log("come..name",latestAccounts);
        for (let account in latestAccounts) {
            const accoutMatch = bcrypt.compareSync(account,req.cookies[encryptedKey]);
            console.log(accoutMatch);
            if (accoutMatch) {
                console.log("你已登陆过！",account);
                res.sendfile(__dirname + "/" + "views/movie.html");
            }
        }
        console.log("过期.....");
        res.sendfile(__dirname + "/" + "views/login.html");

    } else {
        console.log("come..login");
        res.sendfile(__dirname + "/" + "views/login.html");
    }*/
});


app.get('/uploadImg.html', function (req, res) {
    res.sendfile(__dirname + "/" + "views/uploadImg.html");
});

app.get('/editImg.html', function (req, res) {
    res.sendfile(__dirname + "/" + "views/editImg.html");
});

/**
 * 实现登录验证功能
 */

app.get('/login', function (req, res) {
    let account = req.query.account;
    let pwd = req.query.password;
    let isChecked = req.query.isChecked;
    isChecked = eval(isChecked.toLowerCase());
    console.log(account);
    let selectSQL = "select * from user where account = '" + account + "'";//' and password = '" + pwd + "'";
    connection.query(selectSQL, function (err, rs) {
        if (err) throw  err;

        let results = JSON.stringify(rs);
        results = JSON.parse(results);
        let dataBasePwd = results[0].password;

        if (rs.length == 0) {
            res.send("error");
        } else {
            const pwdMatch = bcrypt.compareSync(pwd, dataBasePwd);
            if (pwdMatch) {
                if (isChecked) {
                    /* encryptedKey = encrypt("account");
                     let encrypted = encrypt(account);
                     latestAccounts.push(account);
                     res.cookie(encryptedKey, encrypted, {maxAge: 30*60 * 1000, httpOnly: true});
               */
                    req.session.sign = true;
                    req.session.account = account;
                }
                res.send("ok");
                //res.sendfile(__dirname + "/" + "views/movie.html");
            } else
                res.send("error");
        }
    })
});

app.get('/logout', function (req, res) {
    //销毁
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.sendFile(__dirname + "/" + "views/login.html");
        }
    })
});

app.get('/movie', function (req, res) {
    res.sendFile(__dirname + "/" + "views/movie.html");
});

/**
 * 实现注册功能
 */
app.get('/register', function (req, res) {
    let account = req.query.account;
    let password = req.query.password;
    let phone = req.query.phone;
    let location = req.query.location;

    location = location.slice(0,location.lastIndexOf(","));
    let county = location.slice(location.lastIndexOf(",")+1,location.length);
    location = location.slice(0,location.lastIndexOf(","));
    let city = location.slice(location.lastIndexOf(",")+1,location.length);

    //生成salt的迭代次数
    const saltRounds = 12;
    //随机生成salt
    const salt = bcrypt.genSaltSync(saltRounds);
    //获得hash
    var hash = bcrypt.hashSync(password, salt);
    password = hash;

    let sheets = xlsx.parse('E:\\大三第一学期\\面向web的计算\\Homework\\six\\public\\resource\\AMap_adcode_citycode.xls');
    async.waterfall([
        function (done) {
            let code;
            let flag = false;
            sheets.forEach(function (sheet) {
                for (let rowID in sheet['data']) {
                    if (sheet['data'][rowID][0] === city)
                        flag = true;
                    if (sheet['data'][rowID][0] === county && flag) {
                        code = sheet['data'][rowID][1];
                        console.log(code);
                        done(null, code);
                    }
                }
            });
        },
        function (adcode,done) {
            console.log(',',adcode);
            let user = {account: account, password: password, phone: phone, adcode:adcode};
            console.log(account, password);
            connection.query('insert into user set ?', user, function (err, rs) {
                if (err) throw  err;
                console.log('ok');
                res.sendfile(__dirname + "/" + "views/login.html");
            })
        }
    ]);


});

app.get('/getCode',function (req,res) {
    let account = req.query.account;
    let sql = "select * from user where account='"+account+"'";
    connection.query(sql, function (err, rs) {
        if (err) throw err;
        let results = JSON.stringify(rs);
        results = JSON.parse(results)[0];

        console.log(results);
        res.send(results.adcode);
    });
})

//忘记密码
app.get('/forgetPassword', function (req, res) {
    let account = req.query.account;
    let password = req.query.password;
    let phone = req.query.phone;
    //生成salt的迭代次数
    const saltRounds = 12;
    //随机生成salt
    const salt = bcrypt.genSaltSync(saltRounds);
    //获得hash
    var hash = bcrypt.hashSync(password, salt);
    password = hash;

    let updateSQL = "update user set password ='" + password + "' where account = '" + account + "' and phone = '" + phone + "'";
    connection.query(updateSQL, function (err, rs) {
        if (err) throw  err;
        console.log('ok');
        res.sendfile(__dirname + "/" + "views/login.html");
    })
});


app.get('/isRepeated', function (req, res) {
    let account = req.query.account;
    let selectSQL = "select * from user";
    connection.query(selectSQL, function (err, rs) {
        if (err) throw err;
        let results = JSON.stringify(rs);
        results = JSON.parse(results);

        let info = "OK";
        for (let i = 0; i < results.length; i++) {
            if (account == results[i].account)
                info = "error";
        }

        res.send(info);
    });
});

app.post('/index', (req, res) => {
    let account = req.session.account;
    index.init(res, account);
});

app.post('/personalReleasedMovies', (req, res) => {
    personal.checkReleaseImage(res, req.query.account, req.query.labels);
});

app.post('/personalUnreleasedMovies', (req, res) => {
    personal.checkUnreleaseImage(res, req.query.account);
});

app.get('/releaseImage', function (req, res) {
    console.log(req.query.labels);
    personal.releaseImage(req.query.id, req.query.labels);
});

app.post('/search', (req, res) => {
    index.search(res, req.query.labels, req.query.sortedMode);
});

app.post('/upload', (req, res) => {
    uploadImg.upload(req, res);
});

app.get('/addPopularity', (req, res) => {
    index.addPopularity(res, req.query.movieID);
});

app.post('/page', (req, res) => {
    let page = req.query.getPage;
    let labels = req.query.labels;
    console.log(page);
    index.page(res, labels, page, req.query.sortedMode);
});

app.post('/releasedPage', (req, res) => {
    console.log("releasedPage................");
    let page = req.query.getPage;
    let account = req.query.account;
    let labels = req.query.labels;
    console.log(account, labels, page);
    personal.releasedPage(res, account, labels, page);
});

app.post('/unreleasedPage', (req, res) => {
    console.log("unreleasedPage................");
    let page = req.query.getPage;
    let account = req.query.account;
    console.log(account, page);
    personal.unreleasedPage(res, account, page);
});

function encrypt(clearText) {
    //生成salt的迭代次数
    const saltRounds = 12;
    //随机生成salt
    const salt = bcrypt.genSaltSync(saltRounds);
    //获得hash
    var hash = bcrypt.hashSync(clearText, salt);
    return hash;
}

function getAdcode(location) {
    console.log(location);

    console.log(city,county);
    let adcode = utils.getAdcode(city,county);
    console.log(adcode);
    return adcode;
}
