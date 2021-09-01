const jwt = require('jsonwebtoken');
const mykey = "ttkp"; //secretKey 密钥，服务端验证


const createUserToken = (username, userid) => {

    return new Promise((resolve, reject) => {

        jwt.sign({
            name: "pmtb",
            username: username,
            userid: userid
        }, mykey, {
            algorithm: 'HS256',
            expiresIn: 5 * 60
        }, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);

        });

    })
}



//验证token的方法
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject(new Error("token is required"));
        } else {
            jwt.verify(token, mykey, function (err, payload) {
                if (err) {
                    reject(new Error("解析token失败"));
                }
                resolve(payload);
            });

        }

    })
}


createUserToken("jjcc20", "61274350d025381b48e56b6c").then((tokenstr) => {
    console.log("encode token",tokenstr);
    verifyToken(tokenstr).then((payload) => {

        console.log("解析token成功", payload);

    }).catch((err) => {
        console.log("********verifyToken 错误************", err);

    })
})


// let tokenstr=`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicG10YiIsInVzZXJuYW1lIjoiampjYzIwIiwidXNlcmlkIjoiNjEyNzQzNTBkMDI1MzgxYjQ4ZTU2YjZjIiwiaWF0IjoxNjI5OTc4ODU3LCJleHAiOjE2Mjk5NzkxNTd9.sIzUxk2wgHX_Vgo5PH6xko0gWB1G0IwVFyExiL_Xjj0`;

//     verifyToken(tokenstr).then((payload) => {

//         console.log("解析token成功", payload);

//     }).catch((err) => {
//         console.log("********verifyToken 错误************", err);

//     })