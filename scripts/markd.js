//hljs.initHighlightingOnLoad();
document.title = "Pages";
var globalVariable = localStorage.getItem("globalVariable");
let path = globalVariable;
console.log(path)
var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                // 成功读取文件后，将内容传递给 marked 函数处理成 HTML
                var markdownText = xhr.responseText;
                var htmlContent = marked(markdownText);
                // 将 HTML 插入到页面中
                document.getElementById('markdownContent').innerHTML = htmlContent;
            }
        };
xhr.send();

