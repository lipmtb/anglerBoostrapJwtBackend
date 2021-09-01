const mongoose = require("mongoose");
//技巧类型
const tipClassModel = mongoose.model("tipClassify", new mongoose.Schema({
    className: String,
    essayCount: Number,
    iconClass: String
  }), "tipClassify");
  
  //技巧帖子
  const tipEssayModel = mongoose.model("tipEssays", new mongoose.Schema({
    anglerId: String, //发布者Id
    anglerName: String, //发布者名字
    tipType: String,
    title: String,
    content: String,
    imgArr: Array,
    anglerHasCollect: Boolean,
    publishTime: Date,
    userInfo:Object
  }), "tipEssays");
  
  
  //评论技巧帖子
  const commentTipModel=mongoose.model("commmentTip",new mongoose.Schema({
    anglerName: String, //评论者姓名
    commentTipId: String,
    commentText: String,
    commentTime: Date,
    userInfo:Object
  }),"commentTip");
  
  //技巧帖子收藏
  const collectTipModel = mongoose.model("collectTip", new mongoose.Schema({
    anglerId: String, //收藏者Id
    collectTipId: String
  }), "collectTip");


  module.exports={
    tipClassModel,
    tipEssayModel,
    commentTipModel,
    collectTipModel
  }