const express = require("express");

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
    
})



module.exports = router;