const express = require("express");
const router = express.Router();
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");

const {
    talkEssayModel,
    commentTalkModel,
    collectTalkModel
} = require("../data/talkModel");
const {
    tipEssayModel,
    commentTipModel,
    collectTipModel
} = require("../data/tipModel");

const {
    userModel
} = require("../data/userModel");

//获取某页钓友圈
router.get("/allTalk", function (req, res) {
    let page = parseInt(req.query.page);
    talkEssayModel.aggregate([{
        $sort: {
            publishTime: -1
        }
    }, {
        $project: {
            anglerId: {
                $toObjectId: '$anglerId'
            },
            anglerName: '$anglerName', //发布者名字
            title: "$title",
            content: "$content",
            imgArr: "$imgArr",
            publishTime: {
                $dateToString: {
                    format: '%Y-%m-%d %H:%M:%S',
                    date: '$publishTime'
                }
            }
        }
    }, {
        $lookup: {
            from: 'user',
            localField: 'anglerId',
            foreignField: '_id',
            as: 'userInfoArr'
        }
    }, {
        $skip: page * 4
    }, {
        $limit: 4
    }, {
        $addFields: {
            userInfo: {
                $arrayElemAt: ['$userInfoArr', 0]
            }
        }
    }]).then((lists) => {

        res.send(lists);
    })

})


// 获取某页技巧
router.get("/allTip", function (req, res) {
    let page = parseInt(req.query.page);
    tipEssayModel.aggregate([{
        $sort: {
            publishTime: -1
        }
    }, {
        $project: {
            anglerId: {
                $toObjectId: '$anglerId'
            },
            anglerName: '$anglerName', //发布者名字
            title: "$title",
            content: "$content",
            tipType: '$tipType',
            imgArr: "$imgArr",
            publishTime: {
                $dateToString: {
                    format: '%Y-%m-%d %H:%M:%S',
                    date: '$publishTime'
                }
            }
        }
    }, {
        $lookup: {
            from: 'user',
            localField: 'anglerId',
            foreignField: '_id',
            as: 'userInfoArr'
        }
    }, {
        $skip: page * 4
    }, {
        $limit: 4
    }, {
        $addFields: {
            userInfo: {
                $arrayElemAt: ['$userInfoArr', 0]
            }
        }
    }]).then((lists) => {

        res.send(lists);
    })

})



//删除一条钓友圈帖子
router.delete("/deleteTalk", function (req, res) {
    let tId = req.query.talkId;

    talkEssayModel.findById(tId).exec((err, da) => {
        let deleteImgPros = deleteReferenceImg(da, "talk");
        let deleteComment = deleteRefComment(tId, "talk");
        let deleteCollect=deleteReferenceCollect(tId,'talk');
        Promise.all([deleteImgPros, deleteComment,deleteCollect]).then(() => {
            talkEssayModel.deleteOne({
                _id: mongoose.Types.ObjectId(tId)
            }).then((da) => {
                console.log("删除成功", da);

                res.send({
                    errMsg: 0,
                    status: 'deletesuccess'
                })
            }).catch((err) => {
                console.log("删除失败", err);

                res.send({
                    errMsg: 1,
                    status: 'deletefail'
                })
            })
        })
    })

})


//删除一条技巧帖子
router.delete("/deleteTip", function (req, res) {
    let tId = req.query.tipId;

    tipEssayModel.findById(tId).exec((err, da) => {
        let deleteImgPros = deleteReferenceImg(da, "tip");
        let deleteComment = deleteRefComment(tId, "tip");
        let deleteCollect=deleteReferenceCollect(tId,'tip');
        Promise.all([deleteImgPros, deleteComment,deleteCollect]).then(() => {
            tipEssayModel.deleteOne({
                _id: mongoose.Types.ObjectId(tId)
            }).then((da) => {
                console.log("删除成功", da);

                res.send({
                    errMsg: 0,
                    status: 'deletesuccess'
                })
            }).catch((err) => {
                console.log("删除失败", err);

                res.send({
                    errMsg: 1,
                    status: 'deletefail'
                })
            })
        })
    })

})




//删除相关评论
function deleteRefComment(tid, type) {
    if (type == 'talk') {
        return commentTalkModel.deleteMany({
            commentTalkId: tid
        }).then((deRes) => {
            console.log("删除talk:", tid, "的评论", deRes);
        })
    } else {
        return commentTipModel.deleteMany({
            commentTipId: tid
        }).then((deRes) => {
            console.log("删除tip:", tid, "的评论", deRes);
        })
    }
}



//删除帖子相关的图片
function deleteReferenceImg(essayData, type) {

    let prosAll = [];

    for (let imgItem of essayData.imgArr) {
        let delPros = new Promise((resolve) => {
            let deletePath = path.join(__dirname, "../public/images/" + type, imgItem);
            fs.unlink(deletePath, (errch) => {
                if (errch) {
                    console.log("删除失败");
                    throw errch;
                }
                resolve(true);
                console.log("删除成功", deletePath);
            })
        })
        prosAll.push(delPros);
    }
    return Promise.all(prosAll);
}


//删除帖子相关的收藏
function deleteReferenceCollect(tid,type){
    if (type == 'talk') {
        return collectTalkModel.deleteMany({
            collectTalkId: tid
        }).then((deRes) => {
            console.log("删除talk:", tid, "的收藏", deRes);
        })
    } else {
        return commentTipModel.deleteMany({
            collectTipId: tid
        }).then((deRes) => {
            console.log("删除tip:", tid, "的收藏", deRes);
        })
    }
}


//获取所有用户列表
router.get("/allUserLists", function (req, res) {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    if (!limit) {
        limit = 5;
    }
    userModel.aggregate([{
        $addFields: {
            userId: {
                $toString: '$_id'
            }
        }
    }, {
        $lookup: {
            from: 'talkEssay',
            localField: 'userId',
            foreignField: 'anglerId',
            as: 'sendTalkArr'
        }
    }, {
        $lookup: {
            from: 'tipEssays',
            localField: 'userId',
            foreignField: 'anglerId',
            as: 'sendTipArr'
        }
    }, {
        $project: {
            userId: '$userId',
            userName: '$userName',
            avatarUrl: '$avatarUrl',
            avatarRadX: '$avatarRadX',
            avatarRadY: '$avatarRadY',
            talkEssayCount: {
                $size: '$sendTalkArr'
            },
            tipEssayCount: {
                $size: '$sendTipArr'
            }
        }
    }, {
        $sort: {
            userName: 1
        }
    }, {
        $skip: page * 5
    }, {
        $limit: limit
    }]).then((lists) => {
        res.send(lists);
    })
})

//获取近6个月用户发布的帖子数
router.get("/allSendForMonth", function (req, res) {
    //talkEssayModel tipEssayModel
    let curDate=new Date();
    curDate.setDate(1);
    curDate.setHours(0);
    curDate.setMinutes(0);
    curDate.setSeconds(0);

    let talkProsAll=[];
    for (let i = 6; i > 0; i--) {
        let pros = talkEssayModel.countDocuments({
            publishTime: {
                $gt: curDate-i*30*24*60*60*1000,
                $lt: curDate-(i-1)*30*24*60*60*1000,
            }
        })
        talkProsAll.push(pros);
    }
    let talkAllPros=Promise.all(talkProsAll).then((talkArr)=>{
        console.log("过去6个月talk数量",talkArr);
       return talkArr;
    })


    let tipAllPros=[];
    for (let i = 6; i > 0; i--) {
        let pros = tipEssayModel.countDocuments({
            publishTime: {
                $gt: curDate-i*30*24*60*60*1000,
                $lt: curDate-(i-1)*30*24*60*60*1000,
            }
        })
        tipAllPros.push(pros);
    }
    let tipAllPromiseAll=Promise.all(tipAllPros).then((tipArr)=>{
        console.log("过去6个月tip数量",tipArr);
        return tipArr;
    })


    Promise.all([talkAllPros,tipAllPromiseAll]).then((allArr)=>{
        res.send({
            talkCountArr:allArr[0],
            tipCountArr:allArr[1],
            xArr:getXdataArr()
        })
    })

})

//获取过去6个月数组
function getXdataArr() {
    let xArr = [];
    let date = new Date();
    let curmonth = date.getMonth();
    for (let i = 6; i > 0; i--) {
        let tmp = curmonth - i + 1;
        if (tmp <= 0) {
            tmp = 12 + tmp;
        }
        xArr.push(tmp+"月");
    }

    return xArr;

}

//获取用户总数
router.get("/userTotal", function (req, res) {
    userModel.countDocuments().then((count) => {
        console.log("总用户数");
        res.send({
            total: count
        })
    })
})
module.exports = router;