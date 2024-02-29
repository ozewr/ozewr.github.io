
function redirectToOtherPage(targetURL) {
    let url = targetURL;
    localStorage.setItem("globalVariable", targetURL);
    window.location.href = "html_tmplate/html_all.html";

}