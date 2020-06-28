var fs = require('fs');
const mysql=require('mysql');
const async = require('async');

/**
 * 配置MySql
 */
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '123456',
    database : 'web',
    port:'3306'
});
connection.connect();

async function upload(req,res) {
    console.log(req.body.editImgSrcs);
    console.log(req.body.imgNames);
    console.log(__dirname);

    async.series([
        function (callback) {
            fs.exists(__dirname+"/upload/" + req.body.account,function (exists) {
                console.log("目录是否存在？",exists);
                if (!exists){
                    fs.mkdir(__dirname+"/upload/"+ req.body.account,function (err) {
                        if (err) throw err;
                        callback(null,'one');
                    })
                }else
                    callback(null,'one');
            });
        },function (callback) {
            let path = __dirname+"/upload/"+ req.body.account +"/";
            for (let i = 0; i < req.body.imgNames.length; i++) {
                var base64Data = req.body.editImgSrcs[i];
                let imgName = req.body.imgNames[i];
                base64Data = base64Data.replace(/^data:image\/png;base64,/, "");

                var  image ={account:req.body.account,name:imgName.slice(0,imgName.indexOf('.'))};
                connection.query('insert into image set ?',image,function (err,rs) {
                    if (err) throw  err;
                });


                fs.writeFileSync(path + imgName, base64Data, 'base64', function (err) {
                    if (err)
                        throw err;
                    console.log("OK");
                });

            }
            res.send("ok");
        }
    ]);




}

exports.upload = upload;