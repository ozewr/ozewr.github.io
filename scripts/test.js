var global_var;
function redirectToOtherPage(targetURL) {
    let url = targetURL;
    console.log(url)
    window.location.href = "html_tmplate/html_all.html";
    global_var = "now change "
    console.log(url)
}