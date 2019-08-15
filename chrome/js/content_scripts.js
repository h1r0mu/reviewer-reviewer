function genPosNegReviewUrls(productPageUrl) {
    let domain = productPageUrl.split('/')[2];
    let product = productPageUrl.match(/([A-Z]|[0-9]){10}/)[0];

    return {
        'pos': `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=positive&reviewerType=all_reviews&pageNumber=1`,
        'neg': `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=critical&reviewerType=all_reviews&pageNumber=1`
    }
}

function getDocument(reviewUrl) {
    return axios.get(reviewUrl)
        .then(response => {
            let parser = new DOMParser();
            return parser.parseFromString(response.data, "text/html");
        })
        .catch(error => {
            console.log(error);
        })
}

function findUserUrls(reviewDocument) {
    let users = reviewDocument.getElementsByClassName("a-profile");
    return Object.values(users).map(user => user.href);
}

function findUserReviewUrls(userUrl) {
    return new Promise((resolve, reject) => {
        let iframe = document.createElement("iframe");
        iframe.src = userUrl;
        iframe.hidden = true;
        iframe.onload = () => {
            let userReviews = iframe
                .contentDocument
                .getElementsByClassName('a-link-normal profile-at-review-link a-text-normal');
            resolve(Object.values(userReviews).map(userReview => userReview.href));
            document.body.removeChild(iframe);
        };
        document.body.appendChild(iframe);
    })
}

function findUsersReviewUrls(userUrls) {
    let usersReviewUrls = {};
    for (let url of userUrls) {
        findUserReviewUrls(url)
            .then(reviewUrls => {
                usersReviewUrls[url] = {'urls': reviewUrls};
                });
        break;
    }
    return usersReviewUrls
}

let reviewUrls = genPosNegReviewUrls(location.href)
for (let reviewUrl of Object.values(reviewUrls)) {
    getDocument(reviewUrl)
        .then(findUserUrls)
        .then(findUsersReviewUrls)
        .then(usersReviewUrls => console.log(usersReviewUrls));
}
