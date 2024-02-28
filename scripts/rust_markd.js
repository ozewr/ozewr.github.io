//hljs.initHighlightingOnLoad();
document.title = "Pages";
console.log(global_var)
var xhr = new XMLHttpRequest();
        xhr.open('GET', '/note/ErrorHanding_for_rust.md', true);
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

