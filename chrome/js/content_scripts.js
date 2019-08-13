function genPosNegReviewsURL(url) {
    let split_url = url.split('/');
    let domain = split_url[2];
    let product = split_url[5];
    return [
        `https://${domain}/product-reviews/${product}/` +
        `?ie=UTF8&filterByStar=positive&reviewerType=all_reviews&pageNumber=1`,
        `https://${domain}/product-reviews/${product}/` +
        `?ie=UTF8&filterByStar=critical&reviewerType=all_reviews&pageNumber=1`
    ]
}

chrome.runtime.onMessage.addListener(function (msg) {
    console.log(location);
    console.log(genPosNegReviewsURL(location.href));
});


