//reactWithTs新增附件上传接口
const express = require("express");
var bodyParser = require("body-parser");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");
const {
    uploadModal
} = require("../data/userModel");



//附件放入对应的类型
const placeToConfig = (hasUploadLists) => {
    const accessoryConfig = [{
        configTypeId: "idcard",
        configTypeName: "身份证",
        accessoryFileLists: [],
        canPrev: 1,
        canDownload: 1
    }, {
        configTypeId: "licence",
        configTypeName: "营业执照",
        accessoryFileLists: [],
        canPrev: 1,
        canDownload: 1
    }, {
        configTypeId: "other",
        configTypeName: "其他",
        accessoryFileLists: [],
        canPrev: 0,
        canDownload: 1
    }]
    for (let item of hasUploadLists) {
        accessoryConfig.forEach((config) => {
            if (config.configTypeId === item.accessoryType) {

                config.accessoryFileLists.push(item);
            }
        })
    }
    return accessoryConfig;
}
//附件类型配置信息
router.post("/getAllAccessoryConfigLists", bodyParser.json(), (req, res) => {
    if (req.userinfo) {
        const userid = req.body.userConfig.userId;

        //用户上传过的附件
        uploadModal.find({
            userId: userid
        }).exec((err, userlists) => {

            if (err) {
                return res.send({
                    errCode: 1,
                    errMsg: "获取附件配置失败",
                    configLists: []
                })
            }
            if (userlists && userlists.length > 0) {
                const hasUploadLists = userlists[0].accessoryInfoLists;
                const accessoryConfig = placeToConfig(hasUploadLists);
                return res.send({
                    errCode: 0,
                    errMsg: "获取附件类型配置信息成功",
                    configLists: accessoryConfig
                })
            } else {
                const accessoryConfig = placeToConfig([]);
                return res.send({
                    errCode: 0,
                    errMsg: "获取附件类型配置信息成功",
                    configLists: accessoryConfig
                })
            }

        })



    } else {
        res.send({
            errCode: 1,
            errMsg: "获取附件配置失败",
            configLists: []
        })
    }


})

//附件上传
router.post("/uploadfiles", (req, res) => {
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        console.log("上传的文件", fields, files);
        const userid = fields.userid[0];
        const accessoryType = fields.accessoryType[0];
        if (!userid) {
            return res.send({
                errCode: 1,
                errMsg: "上传失败。。。",
                upload: {
                    uploadstate: 20
                }
            })
        }
        let filesource = files.imgfile[0];
        const accessoryId = userid + (Math.random() + "").substr(2, 6);
        let newPath = path.resolve(__dirname, "../public/images/upload", accessoryId + filesource.originalFilename);
        fs.createReadStream(filesource.path).pipe(fs.createWriteStream(newPath));

        uploadModal.find({
            userId: userid
        }).exec((err, datalists) => {

            if (datalists.length > 0) {
                const oldAccessoryLists = datalists[0].accessoryInfoLists;
                oldAccessoryLists.push({
                    accessoryId: accessoryId, //附件唯一标识
                    accessoryUrl: "images/upload/" + accessoryId + filesource.originalFilename, //附件路径
                    accessoryType: accessoryType || "other", //附件类型
                    userId: userid, //附件所属人
                    createDate: new Date()
                })
                uploadModal.updateOne({
                    userId: userid
                }, {
                    accessoryInfoLists: oldAccessoryLists
                }, (err, docs) => {
                    if (err) {
                        return res.send({
                            errCode: 1,
                            errMsg: "更新上传失败。。。",
                            upload: {
                                uploadstate: 20
                            }
                        })
                    }
                    console.log("更新成功", docs);
                    res.send({
                        errCode: 0,
                        errMsg: "更新上传成功。。。",
                        upload: {
                            uploadstate: 100
                        }
                    })
                })
            } else {
                const uploadObj = new uploadModal({
                    userId: userid,
                    accessoryInfoLists: [{
                        accessoryId: accessoryId, //附件唯一标识
                        accessoryUrl: "images/upload/" + accessoryId + filesource.originalFilename, //附件路径
                        accessoryType: accessoryType || "other", //附件类型
                        userId: userid, //附件所属人
                        createDate: new Date()
                    }]
                });
                uploadObj.save((err, data) => {
                    if (err) {
                        res.send({
                            errCode: 1,
                            errMsg: "新上传附件存储失败",
                            upload: {
                                uploadstate: 50,
                                data: data
                            }
                        })
                        throw err;
                    }


                    res.send({
                        errCode: 0,
                        errMsg: "新上传成功。。。",
                        upload: {
                            uploadstate: 100
                        }
                    })
                })
            }
        })



    })
})


//删除某个附件
router.post("/deleteFileById", bodyParser.json(), (req, res) => {
    if (!req.userinfo) {
        return res.send({
            errCode: 1,
            errMsg: "删除附件失败,用户未登录"
        })
    }
    const file_id = req.body.file_id;
    const userId = req.body.userConfig.userId;
    uploadModal.find({
        userId: userId
    }).exec((err, datalists) => {
        if (err) {
            return res.send({
                errCode: 1,
                errMsg: "删除附件失败"
            })
        }
        if (datalists && datalists.length > 0) {
            let accessoryDelPath = "";
            const accessoryLists = datalists[0].accessoryInfoLists;
            const newLists = accessoryLists.filter((accessory) => {

                if (accessory._id.toString() === file_id) {
                    accessoryDelPath = accessory.accessoryUrl;
                }
                return accessory._id.toString() !== file_id;
            })
            uploadModal.updateOne({
                userId: userId
            }, {
                accessoryInfoLists: newLists
            }).exec((err, docs) => {
                if (!err) {
                    console.log("删除附件成功并更新成功", accessoryLists.length, newLists.length, docs);
                    deleteReferenceImg(accessoryDelPath);
                    res.send({
                        errCode: 0,
                        errMsg: "删除附件成功"
                    })
                } else {
                    res.send({
                        errCode: 1,
                        errMsg: "删除附件失败"
                    })
                }
            })
        } else {
            res.send({
                errCode: 1,
                errMsg: "datalistsnull删除附件失败"
            })
        }
    })
})
//删除文件
function deleteReferenceImg(accessoryUrl) {
    if (!accessoryUrl) {
        return;
    }
    return new Promise((resolve) => {
        let deletePath = path.join(__dirname, "../public", accessoryUrl);
        fs.unlink(deletePath, (errch) => {
            if (errch) {
                console.log("删除失败");
                throw errch;
            }
            resolve(true);
            console.log("删除成功", deletePath);
        })
    })


}

//下载测试
router.get("/downloadimg", (req, res) => {
    const fileurl = req.query.filepath;
    const abspath = path.resolve(__dirname, "../public", fileurl);
    const rs = fs.createReadStream(abspath);
    const bufferArr = [];
    rs.on("data", (buff) => {
        bufferArr.push(buff)
    })

    rs.on("end", () => {
        res.set({
            "Content-Type": "application/octet-stream"
        });
        res.send(Buffer.concat(bufferArr));
    })
    // res.download(abspath);
    // res.sendFile(abspath);
})

module.exports = router;