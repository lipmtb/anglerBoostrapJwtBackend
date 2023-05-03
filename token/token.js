const jwt = require('jsonwebtoken');
const mykey = "jjccfdsdsgdosgjdsdsgsgggsgddddddddddgsmgksjgkslgjsiogjsgljgljhohjdh"; //secretKey 密钥，服务端验证


const createUserToken = (username, userid) => {

    return new Promise((resolve, reject) => {

        jwt.sign({
            name: "pmtb",
            username: username,
            userid: userid
        }, mykey, {
            algorithm: 'HS256',
            expiresIn: 24 * 60 * 60
        }, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);

        });

    })
}



//验证token的方法,过期也会失败?!
const verifyTokenMyTest = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject(new Error("token is required"));
        } else {
            jwt.verify(token.split(" ")[1], mykey, function (err, payload) {
                if (err) {
                    reject(new Error("解析token失败"));
                }
                resolve(payload);
            });

        }

    })
}

module.exports = {
    createUserToken,
    verifyTokenMyTest,
    mykey
}

