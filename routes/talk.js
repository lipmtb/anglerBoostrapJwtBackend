let express = require('express');
let router = express.Router();

const multiparty = require("multiparty");
var bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const {
    talkEssayModel,
    collectTalkModel,
    commentTalkModel
} = require("../data/talkModel.js");

const {
    userModel
} = require("../data/userModel");


//用户发布钓友圈
router.post("/addTalk", function (req, res) {
    console.log("钓友圈发布者：", req.session.angler);
    console.log("钓友圈发布者ID", req.session.anglerId);
    if (!req.session.anglerId) {
        console.log("发布者信息不存在");
        res.send({
            errMsg: 0,
            loginErr: 1
        })
        return;
    }
    let form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {
        console.log("用户发布技巧帖子,上传的fields：", fields);
        console.log("用户发布技巧帖子,上传的图片文件：", files);

        let fileLists = files.talkImgs;
        let prosAll = [];
        if (fileLists) {
            for (let fileobj of fileLists) {
                if (fileobj.size == 0) {
                    continue;
                }
                console.log("正在读取文件:", fileobj.originalFilename);
                let fileTempNewName = String(Date.now()).substr(6) + fileobj.originalFilename;
                let newPath = path.join(__dirname, "../public/images/talk", fileTempNewName);
                console.log("newPath", newPath);
                let ws = fs.createWriteStream(newPath);
                let rs = fs.createReadStream(fileobj.path);
                rs.pipe(ws);
                let pros = new Promise((resolve) => {
                    ws.on("close", function () {
                        resolve(fileTempNewName);
                    }).on("error", (err) => {
                        console.log("上传图片出错");
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
            let newTalkEssay = new talkEssayModel();
            newTalkEssay.anglerId = req.session.anglerId;
            newTalkEssay.anglerName = req.session.angler;
            newTalkEssay.title = fields.talkTitle[0];
            newTalkEssay.content = fields.talkContent[0];
            newTalkEssay.imgArr = filearr;
            newTalkEssay.publishTime = new Date();
            newTalkEssay.save((err, data) => {
                if (err) {
                    console.log("发布钓友圈帖子失败");
                    res.send({
                        errMsg: 0
                    })
                    throw err;
                }
                console.log("发布钓友圈帖子成功66666");
                res.send({
                    errMsg: 1,
                    data: data
                })

            })
        })

    });


})



//获取talk帖子详情
router.get("/talkDetail", function (req, res) {
    console.log(req.query);
    let talkId = req.query.talkId;
    if (!talkId) {
        res.send({
            errMsg: 0
        });
        console.log("没有talkId");
        return;
    }


    talkEssayModel.findById(talkId).exec((err, data) => {
        if (err) {
            res.send({
                errMsg: 0
            })
            throw err;
        }
        let pros = new Promise((resolve) => {
            userModel.findById(data.anglerId).exec((er, info) => {
                data.userInfo = info;
                resolve(info);
            })

        })
    
        pros.then(() => {
            console.log("talk detail with userinfo", data);
            res.send({
                talkData: data,
                errMsg: 1
            });
        })

    })
})


//收藏帖子req.userinfo  req.query.talkId
router.get("/collectTalk", function (req, res) {

    let talkId = req.query.talkId;
    let userid=req.userinfo.userid;
    let collecting = new collectTalkModel();
    collecting.anglerId =userid ;
    collecting.collectTalkId = talkId;

    collecting.save((err, data) => {
        if (err) {
            res.send({
                errCode: 1,
                errMsg:"收藏失败"
            })
            throw err;
        }
        res.send({
            errCode: 0,
            errMsg:"收藏成功",
            collectId: data._id
        })
        console.log(userid+"收藏成功"+data._id);
    })
})

//取消收藏 req.query.collectId
router.get("/cancelCollectTalk", function (req, res) {

    
    let collectId = req.query.collectId;

    collectTalkModel.findById(collectId).exec((err, collecting) => {
        if (err) {
            res.send({
                errCode:1,
                errMsg: "取消收藏失败"
            })
            throw err;
        }
        collecting.remove((errc, data) => {
            if (errc) {
                res.send({
                    errCode:1,
                    errMsg: "取消收藏失败"
                })
                throw errc;
            }
            res.send({
                errCode:0,
                errMsg:"取消收藏成功"
            })
        })
    })


})



//是否收藏过帖子
router.get('/hasCollectTalk', function (req, res) {
    // let anglerId = req.query.anglerId;
    let userinfo=req.userinfo;
    let anglerId = userinfo.userid;
    let collectTalkId = req.query.talkId;
    collectTalkModel.find({
        anglerId: anglerId,
        collectTalkId: collectTalkId
    }).exec((err, lists) => {
        if (err) {
            res.send({
                errCode: 1
            })
            throw err;
        }
        if (lists.length > 0) {
            res.send({
                errCode: 0,
                collectId: lists[0]._id
            })
        } else {
            res.send({
                errCode: 0,
                collectId: ""
            })
        }
    })
})

//评论帖子
router.post("/commentTalk", bodyParser.json(), function (req, res) {

    let commentAnglerName = req.body.anglerName;
    let commentTalkId = req.body.commentTalkId;
    let commentText = req.body.commentText;

    let newComment = new commentTalkModel();
    newComment.anglerName = commentAnglerName
    newComment.commentTalkId = commentTalkId;
    newComment.commentText = commentText;
    newComment.commentTime = new Date();
    newComment.save((err, da) => {
        if (err) {
            res.send({
                errMsg: 0
            })
            throw err;
        }

        res.send({
            errMsg: 1,
            commentItem: da
        })
    })

})



//获取帖子评论
router.get("/commentList", function (req, res) {
    let talkId = req.query.talkId;
    let skipCount = parseInt(req.query.skipNum);
    console.log("获取评论:", skipCount, typeof (req.query.skipNum));
    commentTalkModel.find({
        commentTalkId: talkId
    }).sort({
        commentTime: -1
    }).skip(skipCount).limit(5).exec((err, commentlists) => {
        if (err) {
            res.send({
                errMsg: 0

            })
            throw err;
        }
        let prosAll=[];
        for (let commItem of commentlists) {
            let pros = new Promise((resolve) => {
                userModel.find({
                    userName:commItem.anglerName  
                }).exec((err,user)=>{
                    if(user.length>0){
                        commItem.userInfo=user[0];
                    }
                    resolve(user);
                })
            })
            prosAll.push(pros);
        }
        Promise.all(prosAll).then(()=>{
            res.send({
                errMsg: 1,
                commentLists: commentlists
            })
        })

        
    })
})


//获取轮播的图片

router.get("/runTalkImg", (req, res) => {
    let prosAll = [];
    commentTalkModel.aggregate([{
        "$group": {
            "_id": "$commentTalkId",
            "count": {
                "$sum": 1
            }
        }
    }, {
        $sort: {
            count: -1
        }
    }]).then((commentRes) => {
        console.log("分组返回", commentRes);
        for (let it of commentRes) {
            let pros = new Promise((resolve) => {
                talkEssayModel.findById(it._id).exec((err, data) => {
                    if (err) {

                        throw err;
                    }
                    resolve(data)
                })
            })
            prosAll.push(pros);
        }
        Promise.all(prosAll).then((datalists) => {
            res.send(datalists);
        })


    })


})



//获热门的帖子（评论数）
router.get("/hotTalk", (req, res) => {
 
    let skipTalk = req.query.skip;
    console.log("跳过skip:",skipTalk);
    let limitTalk = req.query.limit || 4;
    skipTalk = parseInt(skipTalk);
    limitTalk = parseInt(limitTalk);
    let prosAll = [];
    commentTalkModel.aggregate([{
        "$group": {
            "_id": "$commentTalkId",
            "count": {
                "$sum": 1
            }
        }
    }, {
        $sort: {
            count: -1,
            _id: 1
        }
    }, {
        $skip: skipTalk
    }, {
        $limit: limitTalk
    }]).then((commentRes) => {
        console.log("热门talk分组返回", commentRes);
        for (let it of commentRes) {
            let pros = new Promise((resolve) => {
                talkEssayModel.findById(it._id).exec((err, data) => {
                    if (err) {

                        throw err;
                    }
                    resolve(data)
                })
            })
            prosAll.push(pros);
        }
        Promise.all(prosAll).then((datalists) => {
            res.send(datalists);
        })


    })


})

//获取最新的帖子
router.get("/newTalk", (req, res) => {
    let skipTalk = req.query.skip;
    let limitTalk = req.query.limit || 4;
    skipTalk = parseInt(skipTalk);
    limitTalk = parseInt(limitTalk);
    talkEssayModel.find({}).sort({
        publishTime: -1,
        _id:1
    }).skip(skipTalk).limit(limitTalk).exec((err, newlists) => {
        if (err) {

            throw err;
        }
        res.send(newlists);
    })
})


//获取用户发布过的钓友圈帖子
router.get("/getHasSendTalk", (req, res) => {
    let uid = req.query.anglerId;
    let skip = parseInt(req.query.skipNum);

    talkEssayModel.aggregate([{
        $match: {
            anglerId: uid
        }
    }, {
        $project: {
            anglerId: {
                $toObjectId: '$anglerId'
            },
            anglerName: '$anglerName', //发布者名字
            title: "$title",
            content: '$content',
            imgArr: "$imgArr",
            publishTime: '$publishTime'
        }
    }, {
        $lookup: {
            from: "user",
            localField: 'anglerId',
            foreignField: '_id',
            as: 'userInfo'
        }
    }, {
        $sort: {
            publishTime: -1,
            _id: 1
        }
    }, {
        $skip: skip
    }, {
        $limit: 4
    }]).then((da) => {

        for (let data of da) {
            let userInfo = data.userInfo[0];
            console.log("钓友圈帖子", data._id);
            if (userInfo.avatarUrl) {
                data.avatarUrl = userInfo.avatarUrl;
                data.avatarRadX = userInfo.avatarRadX;
                data.avatarRadY = userInfo.avatarRadY;

            }
        }

        res.send(da);
    })
})

//测试json数据post
router.post("/httpJsonPost",bodyParser.json(),(req,res)=>{
    console.log("服务端接收到",req.body);
    res.send({
        errmsg:'你好'
    })
})


//测试http.request服务端post提交
router.post("/httpImgPost", function (req, res) {
  
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        console.log("test post上传的fields：", fields);
        console.log("test post上传的图片文件：", files);
        res.send({
            errmsg:'正在上传文件'
        })
       

    

    });


})

module.exports = router;