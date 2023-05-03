const bodyParser = require("body-parser");
let express = require('express');
let router = express.Router();
const mongoose = require("mongoose");

// var http = require("http").Server(app);
// var sio = require("socket.io")(http, {
//     cors: true
// });
// http.listen(80, function () {
//     console.log("express 服务启动");
// })

const {
    commModel,
    msgModel,
    userModel
} = require("../data/userModel");

//聊天消息存储
router.post("/communicate", bodyParser.json(), function (req, res) {
    const {
        sio
    } = require("../app");
    let fromId = req.body.fromUserId;
    let toId = req.body.toUserId;
    let commentText = req.body.commentText;
    let fobjId = mongoose.Types.ObjectId(fromId);
    let tobjId = mongoose.Types.ObjectId(toId);
    commModel.find({
        $or: [{
            fromUserId: fobjId,
            toUserId: tobjId
        }, {
            fromUserId: tobjId,
            toUserId: fobjId
        }]
    }).exec((err, data) => {
        if (err) {
            throw err;
        }
        let pros = new Promise((resolve) => {
            //如果没有聊天记录
            if (data.length == 0) {
                let newCouple = new commModel();
                newCouple.fromUserId = fobjId;
                newCouple.toUserId = tobjId;
                let commentItem = {
                    commentUserId: fobjId,
                    commentTime: new Date(),
                    commentText: commentText
                }
                newCouple.lists = [];
                newCouple.lists.push(commentItem);
                newCouple.save((err, saveRes) => {
                    if (err) {
                        throw err;
                    }
                    sio.emit(fromId, commentText);
                    sio.emit(fromId + toId, commentText);
                    res.send({
                        errnum: 1
                    });
                    resolve(saveRes._id);
                    console.log("保存新cp 成功", saveRes);
                })
            } else {
                let commentItemNew = {
                    commentUserId: fobjId,
                    commentTime: new Date(),
                    commentText: commentText
                }
                data[0].lists.push(commentItemNew);
                data[0].save((nerr, newDa) => {
                    if (nerr) {
                        throw nerr;
                    }
                    sio.emit(fromId, commentText);
                    sio.emit(fromId + toId, commentText);
                    res.send({
                        errnum: 1
                    });
                    resolve(newDa._id);
                    console.log("添加新的聊天成功", newDa);
                })
            }
        })

        pros.then((cId) => {
            console.log("聊天彼此id", cId);
            msgModel.find({
                userId: tobjId,
                commId: mongoose.Types.ObjectId(cId)
            }).exec((err, da) => {
                if (err) {
                    throw err;
                }
                if (da.length > 0) {
                    da[0].messageCount = da[0].messageCount + 1;
                    da[0].save((errup, updateDa) => {
                        if (errup) {
                            throw errup;
                        }
                        console.log("更新消息数", da[0].userId, updateDa.messageCount);
                    })
                } else {
                    let newMsg = new msgModel();
                    newMsg.userId = tobjId;
                    newMsg.commId = mongoose.Types.ObjectId(cId);
                    newMsg.messageCount = 1;
                    newMsg.messageType = "comm";
                    newMsg.save((errnew, danew) => {
                        if (errnew) {
                            throw errnew;
                        }
                        console.log("新的消息for:", danew.userId);
                    });
                }
            })

        })



    })


})



//获取聊天记录
router.get("/commhistory", function (req, res) {
    let fromId = req.query.fromUserId;
    let toId = req.query.toUserId;

    let fobjId = mongoose.Types.ObjectId(fromId);
    let tobjId = mongoose.Types.ObjectId(toId);

    commModel.find({
        $or: [{
            fromUserId: fobjId,
            toUserId: tobjId
        }, {
            fromUserId: tobjId,
            toUserId: fobjId
        }]
    }).then((da) => {
        if (da.length > 0) {

            res.send(da[0].lists);
        } else {
            res.send([]);
        }
    }).catch((err) => {
        throw err;
    })
})


//获取我的消息
router.get("/getmsg", function (req, res) {
    let anglerId = req.query.anglerId;
    let skip = parseInt(req.query.skip);
    let objId = mongoose.Types.ObjectId(anglerId);
    msgModel.find({
        userId: objId
    }).sort({
        messageCount: -1,
        userId: 1
    }).skip(skip).limit(4).exec((err, msglists) => {
        if (err) {
            throw err;
        }
        res.send(msglists);
    })
})


//获取一个对话消息
router.get("/messageDetail", function (req, res) {
    let commId = req.query.commId;
    commModel.findById(commId).exec((err, comm) => {
        if (err) {
            throw err;
        }
        let fromUserPro = new Promise((resolve) => {
            userModel.findById(comm.fromUserId).exec((err, user) => {
                resolve(user.userName);
            })
        })

        let toUserPro = new Promise((resolve) => {
            userModel.findById(comm.toUserId).exec((err, user) => {
                resolve(user.userName);
            })
        })
        Promise.all([fromUserPro, toUserPro]).then((arr) => {
            comm.fromUserName = arr[0];
            comm.toUserName = arr[1];
            res.send(comm);
        })

    })
})

//更新会话消息数
router.get("/updateComm", function (req, res) {
    let commId = req.query.sid;
    msgModel.findById(commId).exec((err, msg) => {
        if (err) {
            throw err;
        }
        msg.messageCount = 0;
        msg.save((err2, message) => {
            if (err) {
                res.send({
                    errMsg: 0
                })
                throw err2;
            }
            res.send({
                errMsg: 1,
                message:message
            })
        });

    })
})

//获取所有消息总数
router.get("/allMsgCount",function(req,res){
    let anglerId=req.query.anglerId;
    let objId = mongoose.Types.ObjectId(anglerId);
    msgModel.find({
        userId: objId
    }).sort({
        messageCount:-1
    }).exec((err,lists)=>{
        if(err){
            res.send({
                count:0
            });
            throw err;
        }

        let sum=lists.reduce((prev,cur,idx)=>{
            return cur.messageCount+prev;
        },0);
        res.send({
            count:sum
        });

    })

})

module.exports = router;