chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log(msg);//送られたメッセージをキャッチ
    sendResponse('How R U?');//sendResponseでmsgを送ったスクリプト側にレスを返せる
});

