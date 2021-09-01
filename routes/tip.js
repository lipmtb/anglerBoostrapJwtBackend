let express = require('express');
let router = express.Router();
const mongoose = require("mongoose");
const multiparty = require("multiparty");
var bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const {
  tipClassModel,
  tipEssayModel,
  commentTipModel,
  collectTipModel
} = require("../data/tipModel.js");

const {
  userModel
} = require("../data/userModel");
//获取技巧类型列表
router.get("/tipClass", (req, res) => {
  tipClassModel.find({}).sort({
    essayCount: -1
  }).then((tipdata) => {
    // console.log(tipdata)：

    res.send(tipdata);
  }).catch((err) => {
    res.send([]);
    console.log("获取技巧类型失败", err);
  })
})

//根据className获取某个技巧类型的帖子列表
router.get("/getTipByClassName", (req, res) => {
  let tName = req.query.tipType;
  let skipNum = req.query.skipNum;
  skipNum = parseInt(skipNum);
  // console.log("skip",skipNum,'tname',tName);
  tipEssayModel.find({
    tipType: tName
  }).sort({
    _id: 1
  }).skip(skipNum).limit(4).then(tipdata => {
    res.send(tipdata);
    // console.log("根据类型className获取列表页:",tipdata);
  }).catch((err) => {
    res.send({
      errMsg: 1
    });
    console.log("获取某个技巧类型列表失败", err);
  })

})


//获取所有技巧类型的帖子列表(技巧类型和对应的几篇帖子)
/**
 * [{
 *  className:'钓杆',
 * essayCount:,
 * tipLists:[...]
 * }]
 */
router.get('/tipClassSomeEssays', (req, res) => {

  tipClassModel.aggregate([{
    $lookup: {
      from: 'tipEssays',
      localField: 'className',
      foreignField: 'tipType',
      as: 'tipLists'
    }
  }, {
    $sort: {
      _id: 1
    }
  }]).then((tipClassDatas) => {
    res.send(tipClassDatas);
  })

})



//用户发布tip
router.post("/addTipEssay", function (req, res) {

  let form = new multiparty.Form();

  form.parse(req, function (err, fields, files) {
    console.log("用户发布技巧帖子,上传的fields：", fields);
    console.log("用户发布技巧帖子,上传的图片文件：", files);
    let fileLists = files.tipImgs;
    let prosAll = [];
    if (fileLists && fileLists.length) {
      for (let fileobj of fileLists) {
        if (fileobj.size == 0) {
          continue;
        }
        console.log("正在读取文件:", fileobj.originalFilename);
        let fileTempNewName = String(Date.now()).substr(6) + fileobj.originalFilename;
        let newPath = path.join(__dirname, "../public/images/tip", fileTempNewName);
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
      console.log("成功上传了：" + resarr, typeof (resarr));
      return resarr;
    }).then((filearr) => {
      let newTipEssay = new tipEssayModel();

      newTipEssay.anglerId = fields.anglerId[0];
      newTipEssay.anglerName = fields.anglerName[0];
      newTipEssay.tipType = fields.tipType[0];
      newTipEssay.title = fields.tipTitle[0];
      newTipEssay.content = fields.tipContent[0];
      newTipEssay.imgArr = filearr;
      newTipEssay.publishTime = new Date();
      newTipEssay.save((err, data) => {
        if (err) {
          console.log("发布技巧帖子失败");
          res.send({
            errMsg: 0
          })
          throw err;
        }
        updateClassCount(data);
        console.log("发布技巧帖子成功66666");
        res.send({
          errMsg: 1,
          data: data
        })

      })
    })

  });


})

//获取某个技巧帖子的详情
router.get("/tipEssayDetail", function (req, res) {
  let tipId = req.query.tipId;
  tipEssayModel.findById(tipId).exec((err, tipdata) => {
    if (err) {
      res.send({
        errMsg: 0
      })
      throw err;
    }
    let pros = new Promise((resolve) => {
      userModel.findById(tipdata.anglerId).exec((er, info) => {
        tipdata.userInfo = info;
        resolve(info);
      })

    })

    pros.then(() => {
      res.send({
        talkData: tipdata,
        errMsg: 1
      });
    })
  })
})

//用户评论技巧帖子
router.post("/commentTip", bodyParser.json(), function (req, res) {

  let commentAnglerName = req.body.anglerName;
  let commentTipId = req.body.commentTipId;
  let commentText = req.body.commentText;

  let newComment = new commentTipModel();
  newComment.anglerName = commentAnglerName
  newComment.commentTipId = commentTipId;
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

//获取技巧帖子评论
router.get("/commentList", function (req, res) {
  let tipId = req.query.tipId;
  let skipCount = parseInt(req.query.skipNum);
  commentTipModel.find({
    commentTipId: tipId
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


//上传tip之后更新某种技巧类型的帖子数
function updateClassCount(da) {
  tipClassModel.find({
    className: da.tipType
  }).then((tipdata) => {
    let tipClassInstance = new tipClassModel();
    tipClassInstance = tipdata[0];
    tipClassInstance.essayCount = tipdata[0].essayCount + 1;
    tipClassInstance.save((err) => {
      if (err) {
        console.log("更新技巧类型帖子数失败");
        throw err;
      }
      console.log("更新技巧类型帖子数成功");
    });
  }).catch((err) => {
    console.log("查找技巧类型帖子失败", err);
  })
}





//用户收藏技巧帖子
router.post("/collectTip", bodyParser.json(), function (req, res) {

  let collectAnglerId = req.body.anglerId;
  let collectTipId = req.body.tipId;
  let collect = new collectTipModel();
  collect.anglerId = collectAnglerId;
  collect.collectTipId = collectTipId;
  collect.save((err, data) => {
    if (err) {
      console.log("收藏失败");
      res.send({
        errMsg: 0
      })
      throw err;
    }
    res.send({
      errMsg: 1,
      collectId: data._id
    })
  })


})


//用户取消收藏
router.post("/cancelCollect", bodyParser.json(), function (req, res) {
  let collectAnglerId = req.body.anglerId;
  let collectTipId = req.body.tipId;

  collectTipModel.find({
    anglerId: collectAnglerId,
    collectTipId: collectTipId
  }).exec((err, collectres) => {
    collectres[0].remove((err) => {
      if (err) {
        res.send({
          collectErr: 1
        })
        throw err;
      }
      res.send({
        collectErr: 0
      })
    })
  })

})


//是否收藏过帖子
router.get('/hasCollectTip', function (req, res) {
  let anglerId = req.query.anglerId;
  let collectTipId = req.query.tipId;
  collectTipModel.find({
    anglerId: anglerId,
    collectTipId: collectTipId
  }).exec((err, lists) => {
    if (err) {
      res.send({
        errMsg: 0
      })
      throw err;
    }
    if (lists.length > 0) {
      res.send({
        errMsg: 1,
        collectId: lists[0]._id
      })
    } else {
      res.send({
        errMsg: 1,
        collectId: ""
      })
    }
  })
})

//获取用户收藏的技巧
router.get("/anglerHasCollect", function (req, res) {
  // if (!req.session.anglerId) {
  //   res.send({
  //     errMsg: 1
  //   })
  //   return;
  // }

  let anglerId = req.session.anglerId;
  collectTipModel.find({
    anglerId: anglerId
  }).exec((err, datalists) => {
    if (err) {
      throw err;
    }
    let prosArr = [];
    for (let collItem of datalists) {
      let cId = collItem.collectTipId;
      let pse = new Promise((resolve) => {
        tipEssayModel.findById(cId).exec((err, data) => {
          resolve(data);
        })
      });
      prosArr.push(pse);

    }

    Promise.all(prosArr).then((resarr) => {
      res.send(resarr);
    })
  })
})






//搜索技巧
router.get("/searchTipByKey", (req, res) => {
  let keywords = req.query.keystr;
  tipEssayModel.find({
    $or: [{
      anglerName: new RegExp(keywords, 'i')
    }, {
      title: {
        "$regex": keywords,
        "$options": 'i'
      }
    }, {
      content: {
        "$regex": keywords,
        "$options": 'i'
      }
    }]
  }).exec((err, datalists) => {
    if (err) {
      res.send({
        errMsg: 1
      })
      throw err;

    }

    res.send(datalists);
  })
})



//获取用户发布过的技巧帖子
router.get("/getHasSendTip", (req, res) => {
  let uid = req.query.anglerId;
  let skip = parseInt(req.query.skipNum);

  tipEssayModel.aggregate([{
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
      tipTpye: '$tipType',
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

      if (userInfo.avatarUrl) {
        data.avatarUrl = userInfo.avatarUrl;
        data.avatarRadX = userInfo.avatarRadX;
        data.avatarRadY = userInfo.avatarRadY;

      }
    }

    res.send(da);
  })
})
module.exports = router;