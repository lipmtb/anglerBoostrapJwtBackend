const bodyParser = require("body-parser");
let express = require('express');
let router = express.Router();
const axios = require("axios");
// const { Configuration, OpenAIApi } = require("openai");
// const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
const OPENAI_URL_TURN = "https://api.openai.com/v1/completions";

// openaiapi
router.post("/gptai", bodyParser.json(), (req, res) => {
    const content = req.body.content;
    const apiKey = req.body.apiKey || "";
    if (!apiKey) {
        res.send({
            errCode: 1,
            message: "请输入apiKey"
        })
        return;
    }
    const requestConfig = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
    };
    axios.post(OPENAI_URL, {
        "model": "gpt-3.5-turbo",
        "messages": [{ "role": "user", "content": content }]
    }, requestConfig).then(response => {
        console.log("chatgpt响应成功:", JSON.stringify(response.data.choices));
        const responseBuffer = JSON.stringify({
            errCode: 0,
            choices: response.data.choices,
            message: "成功"
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', Buffer.byteLength(responseBuffer, 'utf8'));
        res.write(responseBuffer);
        res.end();
    }).catch(error => {
        console.error("请求失败", error);
        res.send({
            choices: null,
            errCode: 1,
            message: "失败"
        })
    });
})


// openaiapi
router.post("/longTurnAi", bodyParser.json(), (req, res) => {
    const content = req.body.content;
    console.log("用户请求：", content);
    const apiKey = req.body.apiKey || "";
    if (!apiKey) {
        res.send({
            errCode: 1,
            message: "请输入apiKey"
        })
        return;
    }
    const requestConfig = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
    };
    // const configuration = new Configuration({
    //     apiKey: apiKey
    // });
    // const openai = new OpenAIApi(configuration);
    // openai.createCompletion({
    //     "model": "text-davinci-003",
    //     "prompt": content,
    //     "temperature": 1,
    //     "max_tokens": 512,
    //     "top_p": 1,
    //     "frequency_penalty": 0,
    //     "presence_penalty": 0.2,
    //     "stop": ["Human:", "AI:"],
    // }).then(response => {
    //     console.log("longTurnAi响应:", JSON.stringify(response.data.choices));
    //     const responseBuffer = JSON.stringify({
    //         errCode: 0,
    //         choices: response.data.choices,
    //         message: "成功"
    //     });
    //     res.setHeader('Content-Type', 'application/json');
    //     res.setHeader('Content-Length', Buffer.byteLength(responseBuffer, 'utf8'));
    //     res.write(responseBuffer);
    //     res.end();
    // }).catch(error => {
    //     console.error("请求失败", error);
    //     res.status(500).send({
    //         choices: null,
    //         errCode: 1,
    //         message: "请求失败"
    //     })
    // });
    axios.post(OPENAI_URL_TURN, {
        "model": "text-davinci-003",
        "prompt": content,
        "temperature": 1,
        "max_tokens": 256,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0.2,
        "stop": [" Human:", " AI:"],
    }, requestConfig).then(response => {
        console.log("longTurnAi响应:", JSON.stringify(response.data.choices));
        const responseBuffer = JSON.stringify({
            errCode: 0,
            choices: response.data.choices,
            message: "成功"
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', Buffer.byteLength(responseBuffer, 'utf8'));
        res.write(responseBuffer);
        res.end();
    }).catch(error => {
        console.error("请求失败", error);
        res.status(500).send({
            choices: null,
            errCode: 1,
            message: "请求失败"
        })
    });
})

module.exports = router;