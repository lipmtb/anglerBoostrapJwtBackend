const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
//用户
const userModel = mongoose.model("user", new mongoose.Schema({
    userName: String,
    userPsw: String,
    phoneNum:String,
    avatarUrl:String,
    avatarRadX:Number,
    avatarRadY:Number
}), "user");

//互相关注
const userCareModel=mongoose.model("favUser",new mongoose.Schema({
    fromUserId:String, //谁发起的关注
    toUserId:String, //关注的人
    careTime:Date  //关注的时间
}))

//用户聊天
const commModel=mongoose.model("comm",new mongoose.Schema({
    fromUserId:ObjectId, //发起聊天的人
    toUserId:ObjectId, //聊天对象
    lists:[{
        commentUserId:ObjectId,
        commentTime:Date,
        commentText:String
    }]
}),"comm")


//消息
const msgModel=mongoose.model("message",new mongoose.Schema({
    userId:ObjectId,//接收消息的用户
    commId:ObjectId,//消息来源的commModel._id
    messageCount:Number,
    messageType:String
   
}),"message")


module.exports={
    userModel,
    userCareModel,
    commModel,
    msgModel

}