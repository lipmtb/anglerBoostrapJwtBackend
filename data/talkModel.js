
const mongoose = require("mongoose");

//talk帖子
const talkEssayModel = mongoose.model("talkEssay", new mongoose.Schema({
    anglerId: String, //发布者Id
    anglerName: String, //发布者名字
    title: String,
    content: String,
    imgArr: Array,
    publishTime: Date,
    userInfo:Object
}), "talkEssay");

const collectTalkModel = mongoose.model("collectTalk", new mongoose.Schema({
    anglerId: String, //收藏者Id
    collectTalkId: String //收藏的talkId
}), "collectTalk");

const commentTalkModel = mongoose.model("commentTalk", new mongoose.Schema({
    anglerName: String, //评论者姓名
    commentTalkId: String,
    commentText: String,
    commentTime: Date,
    userInfo:Object
}), "commentTalk");


module.exports={
    talkEssayModel,
    collectTalkModel,
    commentTalkModel
}