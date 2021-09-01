const express = require("express");

const router = express.Router();
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");

const {
    talkEssayModel,
    collectTalkModel
} = require("../data/talkModel.js");


const {
    tipEssayModel,
    collectTipModel
} = require("../data/tipModel.js");



const {
    userModel,
    userCareModel
} = require("../data/userModel.js");


const mapCollection = {
    'talk': collectTalkModel,
    'tip': collectTipModel
}
const mapEssay = {
    "talk": talkEssayModel,
    "tip": tipEssayModel
}

const mapEssayId = {
    "talk": "collectTalkId",
    "tip": "collectTipId"
}

//获取我的收藏
router.get("/mycollect", (req, res) => {
    let anglerId = req.query.anglerId;
    let collectType = req.query.type;
    let page = parseInt(req.query.page);
    mapCollection[collectType].find({
        anglerId: anglerId
    }).skip(page * 4).limit(4).exec((err, data) => {
        if (err) {
            console.log("获取收藏的" + collectType + "失败");
            throw err;
        }

        let prosAll = [];
        for (let collect of data) {
            let pros = new Promise((resolve) => {
                mapEssay[collectType].findById(collect[mapEssayId[collectType]]).then((da) => {
                    console.log(da);
                    resolve(da);
                })
            })

            prosAll.push(pros);

        }
        Promise.all(prosAll).then((essaylists) => {
            console.log("essaylists res", essaylists);
            res.send(essaylists);
        })

    })
})

//获取用户头像信息
router.get("/avatar", (req, res) => {
    let anglerId = req.query.anglerId;
    userModel.findById(anglerId).then((da) => {
        res.send(da);
    }).catch((err) => {
        res.send({
            errMsg: 0
        })
    })
})


//更新头像信息
router.post("/changeProfile", (req, res) => {
    let form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {
        console.log("用户更改头像,上传的fields：", fields);
        console.log("用户更改头像,上传的图片文件：", files);
        deleteOldAvatar(fields.anglerId[0]).then(() => {
            let fileLists = files.talkImgs;
            let prosAll = [];
            if (fileLists) {
                for (let fileobj of fileLists) {
                    if (fileobj.size == 0) {
                        continue;
                    }
                    console.log("正在读取文件:", fileobj.originalFilename);
                    let fileTempNewName = String(Date.now()).substr(6) + fileobj.originalFilename;
                    let newPath = path.join(__dirname, "../public/images/avatar", fileTempNewName);
                    console.log("newPath", newPath);
                    let ws = fs.createWriteStream(newPath);
                    let rs = fs.createReadStream(fileobj.path);
                    rs.pipe(ws);
                    let pros = new Promise((resolve) => {
                        ws.on("close", function () {
                            resolve(fileTempNewName);
                        }).on("error", (err) => {
                            console.log("上传头像出错");
                            res.send({
                                errMsg: 0
                            });
                            throw err;
                        })
                    })
                    prosAll.push(pros);
                }

            }

            Promise.all(prosAll).then((resarr) => {
                console.log("成功上传了：" + resarr);
                return resarr;
            }).then((filearr) => {
                let anglerId = fields.anglerId[0];
                let radX = parseFloat(fields.radX[0]);
                let radY = parseFloat(fields.radY[0]);
                userModel.updateOne({
                    _id: anglerId
                }, {
                    avatarRadX: radX,
                    avatarRadY: radY,
                    avatarUrl: filearr[0]
                }, function (err, docs) {
                    if (err) {
                        res.send({
                            errMsg: 1
                        })
                        throw err;
                    } else {

                        res.send(docs);
                        console.log("Updated Docs:", docs);
                    }
                })
            })


        })

    })
})

//更新头像前删除旧的头像
function deleteOldAvatar(anglerId) {

    return new Promise((resolve) => {
        userModel.findById(anglerId).exec((err, user) => {
            if (err) {
                console.log("获取删除的用户失败");
                throw err;
            }
            let avatarUrl = user.avatarUrl;
            if (avatarUrl) {
                let deletePath = path.join(__dirname, "../public/images/avatar", avatarUrl);
                fs.unlink(deletePath, (errch) => {
                    resolve(true);
                    if (errch) {
                        console.log("删除失败");
                        throw errch;
                    }
                    console.log("删除成功");
                })
            } else {
                resolve(true);
            }

        })
    })

}


//谁关注谁
router.get("/careUser", (req, res) => {
    let fromId = req.query.fromUserId;
    let toId = req.query.toUserId;

    let newCare = new userCareModel();
    newCare.fromUserId = fromId;
    newCare.toUserId = toId;
    newCare.careTime = new Date();

    newCare.save((err, data) => {
        if (err) {
            res.send({
                errMsg: 1
            });
            throw err;
        }
        res.send(data);
    })
})


//取消关注
router.get("/cancelCareUser", (req, res) => {
    let fromId = req.query.fromUserId;
    let toId = req.query.toUserId;

    userCareModel.find({
        fromUserId: fromId,
        toUserId: toId
    }).exec((err, data) => {
        if (data.length > 0) {
            data[0].remove((err, data) => {
                if (err) {
                    throw err;
                }
                res.send({
                    errMsg: 1
                });
            })
        }
    })
})


//谁是否关注过谁
router.get("/hasCareUser", (req, res) => {
    let fromId = req.query.fromUserId;
    let toId = req.query.toUserId;
    userCareModel.find({
        fromUserId: fromId,
        toUserId: toId
    }).exec((err, datalists) => {
        if (err) {
            res.send({
                errMsg: 1
            });

            throw err;
        }
        if (datalists.length > 0) {
            res.send({
                careState: 1
            })
        } else {
            res.send({
                careState: 0
            })
        }


    })

})


//获取关注数和粉丝数
router.get('/careNum', (req, res) => {
    let anglerId = req.query.anglerId;

    userCareModel.countDocuments({
        fromUserId: anglerId
    }).then((num) => {

        userCareModel.countDocuments({
            toUserId: anglerId
        }).then((fanNum) => {
            console.log("获取关注数和粉丝数成功");
            res.send({
                careCount: num,
                fanCount: fanNum
            })
        })

    })
})

//获取我的关注
//http://127.0.0.1/profile/mycare?anglerId=60a3c2f18636712bdc8ab25d&skipNum=0
router.get("/mycare", (req, res) => {
    let anglerId = req.query.anglerId;
    let skip = parseInt(req.query.skipNum);

    userCareModel.aggregate([{
        $match: {
            fromUserId: anglerId
        }
    }, {
        $project: {
            fromUserId: '$fromUserId',
            toUserId: {
                "$toObjectId": "$toUserId"
            },
            careTime:'$careTime'
        }
    }, {
        $lookup: {
            from: 'user',
            localField: 'toUserId',
            foreignField: '_id',
            as: 'careArr'
        }
    }, {
        $sort:{
            careTime:-1
        }
    },{
        $skip: skip,
    }, {
        $limit: 4
    }]).then((lists) => {
        let reslists = [];
        for (let careItem of lists) {
            reslists.push(careItem.careArr[0])
        }
        res.send(reslists);
    })
})


//获取我的粉丝
router.get("/myfan", (req, res) => {
    let anglerId = req.query.anglerId;
    let skip = parseInt(req.query.skipNum);

    userCareModel.aggregate([{
        $match: {
            toUserId: anglerId
        }
    }, {
        $project: {
            toUserId: '$toUserId',
            fromUserId: {
                "$toObjectId": "$fromUserId"
            },
            careTime:"$careTime"
        }
    }, {
        $lookup: {
            from: 'user',
            localField: 'fromUserId',
            foreignField: '_id',
            as: 'careArr'
        }
    },{
        $sort:{
            careTime:-1
        }
    } ,{
        $skip: skip,
    }, {
        $limit: 4
    }]).then((lists) => {
        let reslists = [];
        for (let careItem of lists) {
            reslists.push(careItem.careArr[0])
        }
        res.send(reslists);
    })
})

module.exports = router;