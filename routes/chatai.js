const bodyParser = require("body-parser");
let express = require("express");
const https = require("https");
let router = express.Router();
const axios = require("axios");
const fs = require("fs");
const multiparty = require("multiparty");
const Replicate = require("replicate");
const { REPLICATE_API_TOKEN } = require("../config");
// const { Configuration, OpenAIApi } = require("openai");
// const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
const OPENAI_URL_TURN = "https://api.openai.com/v1/completions";

/**
 * @type {Replicate}
 */
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// openaiapi
router.post("/gptai", bodyParser.json(), (req, res) => {
  const content = req.body.content;
  const apiKey = req.body.apiKey || "";
  if (!apiKey) {
    res.send({
      errCode: 1,
      message: "请输入apiKey",
    });
    return;
  }
  const requestConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
  };
  axios
    .post(
      OPENAI_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: content }],
      },
      requestConfig
    )
    .then((response) => {
      console.log("chatgpt响应成功:", JSON.stringify(response.data.choices));
      const responseBuffer = JSON.stringify({
        errCode: 0,
        choices: response.data.choices,
        message: "成功",
      });
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Length",
        Buffer.byteLength(responseBuffer, "utf8")
      );
      res.write(responseBuffer);
      res.end();
    })
    .catch((error) => {
      console.error("请求失败", error);
      res.send({
        choices: null,
        errCode: 1,
        message: "失败",
      });
    });
});

// openaiapi
router.post("/longTurnAi", bodyParser.json(), (req, res) => {
  const content = req.body.content;
  console.log("用户请求：", content);
  const apiKey = req.body.apiKey || "";
  if (!apiKey) {
    res.send({
      errCode: 1,
      message: "请输入apiKey",
    });
    return;
  }
  const requestConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
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
  axios
    .post(
      OPENAI_URL_TURN,
      {
        model: "text-davinci-003",
        prompt: content,
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.2,
        stop: [" Human:", " AI:"],
      },
      requestConfig
    )
    .then((response) => {
      console.log("longTurnAi响应:", JSON.stringify(response.data.choices));
      const responseBuffer = JSON.stringify({
        errCode: 0,
        choices: response.data.choices,
        message: "成功",
      });
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Length",
        Buffer.byteLength(responseBuffer, "utf8")
      );
      res.write(responseBuffer);
      res.end();
    })
    .catch((error) => {
      console.error("请求失败", error);
      res.status(500).send({
        choices: null,
        errCode: 1,
        message: "请求失败",
      });
    });
});

const randomImg = () => {
  return `${Math.floor(Math.random() * 10 ** 6)}.png`;
};
const getOutputFileName = (name) => {
  return name.match(/https?[\s\S]+\/(\w+\.(png|jpg|jpeg))/)?.[1] || randomImg();
};

/** ai 绘画返回图片可下载 */
router.post("/replicateAi", bodyParser.json(), async (req, res) => {
  console.log("req", req.body);
  const model =
    "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478";
  //   const model2 =
  //     "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
  const output = await replicate.run(model, {
    input: {
      prompt: req.body.prompt ?? "",
    },
  });
  console.log("fileGetResponsefileGetResponse", output);
  if (output && output.length) {
    const tempFileName = getOutputFileName(output[0]);
    https.get(output[0], (fileGetResponse) => {
      // 设置响应头
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=${tempFileName}`,
      });

      fileGetResponse.pipe(res);
    });
    return;
  }
  res.send({
    code: "0",
    message: "fail",
    data: null,
  });
});

// 语音转文字接口
router.post("/speechToText", (req, res) => {
  try {
    const form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
      console.log("speechListspeechListspeechList", err, fields, files);
      if (!files.speechList[0]) {
        res.send({
          errorCode: "1",
          message: "音频为空",
        });
        return;
      }
      const filePath = files?.speechList?.[0]?.path;
      const fileBuffer = fs.readFileSync(filePath);
      const output = await replicate.run(
        "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
        {
          input: {
            audio: fileBuffer,
          },
        }
      );

      res.send({
        errorCode: "0",
        message: "success",
        transcription: output?.transcription,
      });
    });
  } catch (error) {
    res.send({
      errorCode: "1",
      message: error?.message || error,
    });
  }
});

module.exports = router;
