let express = require('express');
let router = express.Router();
let bodyParser = require("body-parser");

console.log("*********express router路由：login.js*********");
const {
    userModel
} = require("../data/userModel.js");
let {
    createUserToken
} = require('../token/token.js')



//注册
router.post("/regist", bodyParser.json(), function (req, res) {
    console.log("正在注册");
    let username = req.body.username;
    let password = req.body.userpassword;
    let phoneNum = req.body.phoneNum;
    console.log("用户名：", username);
    console.log("密码：", password);
    console.log("手机号", phoneNum);
    let prosDup = null;
    if (username) {
        prosDup = new Promise((resolve) => {
            userModel.find({
                userName: username
            }).exec((err, data) => {
                if (data.length > 0) {
                    console.log("注册错误,用户名重复");
                    resolve(6);
                    res.send({
                        errMsg: "注册失败，用户名已被使用",
                        errCode: 1
                    });
                    return;

                }
                resolve(1);
            })
        })
    }
    prosDup.then((nummsg) => {
        if (nummsg == 1) {
            let newAngler = new userModel();
            newAngler.userName = username;
            newAngler.userPsw = password;
            newAngler.phoneNum = phoneNum;
            newAngler.save((err, data) => {
                if (err) {
                    console.log("注册错误");
                    res.send({
                        errMsg: "注册失败",
                        errCode: 1
                    })
                    throw err;
                }
                console.log("注册成功");

                createUserToken(username, data._id).then((jwttokenstr) => {
                    res.send({
                        errMsg: "注册成功",
                        errCode: 0,
                        userInfo:{
                            userName:username,
                            userId:data._id
                        },
                        jjccToken: jwttokenstr
                    });
                }).catch((errtoken)=>{
                    console.log("token生成失败",errtoken);
                    res.send({
                        errMsg: "token生成失败",
                        errCode: 1
                    })
                });

            })
        }
    })



})


//登录
router.post("/login", bodyParser.json(), (req, res) => {
    let username = req.body.username;
    let password = req.body.userpassword;
    console.log("登录中检查密码用户名", username, password);
    userModel.find({
        userName: username,
        userPsw: password
    }).exec((err, data) => {
        // console.log("数据库返回：", data);
        if (data.length === 0) { //登录失败
            res.send({
                errMsg: "用户名或者密码错误",
                errCode: 1
            });
        } else { //登录成功
            createUserToken(username, data[0]._id+"").then((jwttokenstr) => {
                res.send({
                    errMsg: "登录成功",
                    errCode: 0,
                    userInfo:{
                        userName:username,
                        userId:data[0]._id
                    },
                    jjccToken: jwttokenstr
                });
            }).catch((errtoken)=>{
                console.log("token生成失败",errtoken);
                res.send({
                    errMsg: "token生成失败",
                    errCode: 1
                })
            });
        }
    })
})



//处理ajax 首页的判断是否登录
router.get("/isLogin", function (req, res) {
    
    res.send({
        errCode:0,
        errMsg:"已登录"
    })


})

//退出登录
router.get("/login/logout", function (req, res) {
    console.log("用户点击退出登录");
    req.session.destroy();
    res.send({
        state: 1,
        errmsg: 'user logout'
    })

})

//测试post
router.post("/login/testpost", bodyParser.urlencoded({
    extended: false
}), (req, res) => {
    let sess = req.session;
    let username = req.body.username;
    let password = req.body.password;
    console.log("testpost登录中检查密码用户名", sess, username, password);
    res.send("<h1>你好" + username + "</h1>");
})




module.exports = router;