const express = require("express");
var bodyParser = require("body-parser");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");


router.post("/canvasUpload",(req,res)=>{
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        console.log("上传的文件", fields, files);
        let filesource=files.imgfile[0];
        let newPath=path.resolve(__dirname,"../public/images/test",(Math.random()+"").substr(2,6)+filesource.originalFilename+".png");
        fs.createReadStream(filesource.path).pipe(fs.createWriteStream(newPath));

        res.send({
            errCode:0,
            errMsg:"上传中。。。"
        })
    })
    
});

router.post("/downloadLinuxFile",bodyParser.json(),(req,res)=>{
  const filePath=req.body?.downloadPath;
  console.log("filePathfilePath",filePath);
  const pathAbs=path.resolve(__dirname,filePath);
  const isExists=fs.existsSync(pathAbs);
  console.log("isExistsisExists",pathAbs,isExists);
  if (!isExists) {
    res.writeHead(404);
    res.end();
    return;
  }
  const stat = fs.statSync(pathAbs);
  const fileSize = stat.size;
  const fileName = path.basename(pathAbs);
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename=${fileName}`,
    'Content-Length': fileSize
  });

  // 创建可读流
  const readStream = fs.createReadStream(pathAbs);

  // 将流数据管道到响应中
  readStream.pipe(res);
    
});

module.exports = router;