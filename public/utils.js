// let xlsx = require('node-xlsx');
// const async = require('async');
// const mysql = require('mysql');
//
// var connection = mysql.createConnection({
//     host     : '127.0.0.1',
//     user     : 'root',
//     password : '123456',
//     database : 'web',
//     port:'3306'
// });
// connection.connect();
// let select
// connection.query('insert into image set ?',image,function (err,rs) {
//     if (err) throw  err;
//     console.log("ok");
// });

//let sheets = xlsx.parse('d:/豆瓣top250.xls');

/*let sql = "DELETE FROM IMAGE where id > 48";
connection.query(sql,function (err, result) {
    if(err){
        console.log('[DELETE ERROR] - ',err.message);
        return;
    }
    console.log('-------------DELETE--------------');
});

connection.end();*/
/*sheets.forEach(function (sheet) {

    for (let rowID in sheet['data']) {
        if (rowID<30)
            continue;
        if (rowID>60)
            break;
        if (rowID != 0){
            let name = sheet['data'][rowID][0];
            let director = sheet['data'][rowID][2];
            let stars = sheet['data'][rowID][3];
            let labels = sheet['data'][rowID][4];
            let year = sheet['data'][rowID][5];
            let rating = sheet['data'][rowID][6];
            var  image ={account:"lsy",name:name,labels:labels,releaseTime:year,leadActor:stars,director:director,rating:rating,isRelease:0};
            connection.query('insert into image set ?',image,function (err,rs) {
                if (err) throw  err;
                console.log("ok");
            });
        }
    }
});*/

async function getAdcode(city,county){
    let sheets = xlsx.parse('E:\\大三第一学期\\面向web的计算\\Homework\\six\\public\\resource\\AMap_adcode_citycode.xls');
    async.waterfall([
        function (done) {
            let code;
            for (let rowID in sheet['data']) {
                if (sheet['data'][rowID][0] === city) {
                    code = sheet['data'][rowID][2];
                    done(code,null);
                }
            }
        },
        function (code,done) {
            for (let rowID in sheet['data']) {
                if (code == sheet['data'][rowID][2] && sheet['data'][rowID][0] === county){
                    let citycode = sheet['data'][rowID][2];
                    console.log(citycode);

                }
            }
        }
    ]);

}

exports.getAdcode = getAdcode;