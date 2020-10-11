// ==UserScript==
// @name         百度网盘分享文件库列表导出
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Lusttime
// @match        https://pan.baidu.com/mbox/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.1.1/jquery.min.js
// ==/UserScript==

(function () {
    'use strict';

    const lower_url = 'https://pan.baidu.com/mbox/msg/shareinfo';

    function start() {
        let lis = Array.from(document.getElementsByTagName('li')).filter(item => item.getAttribute('node-type') === 'sharelist-item');
        const selected = lis.filter(item => item.getAttribute('class') === 'on');
        const tags = selected.length === 0 ? lis : selected;
        //定义最上级目录
        let top_tag = {};
        top_tag.id = 233;
        top_tag.pId = 0;
        top_tag.name = 'allFiles'
        let data_list = [top_tag];
        alert('全部目录导出时间可能过长,建议选中单个导出..');
        alert('请耐心等待不要关闭当前页面');
        tags.forEach(function (item) {
            const gid = item.getAttribute('data-gid');
            const from_uk = item.getAttribute('data-frm');
            const msg_id = item.getAttribute('data-id');
            const fs_id = item.getAttribute('data-fid');
            if (gid === null) {
                const error_msg = '目前只支持在最上级目录导出！';
                alert(error_msg);
                throw Error(error_msg);
            }
            let params = {
                'gid': gid,
                'msg_id': msg_id,
                'from_uk': from_uk,
                'fs_id': fs_id,
                'type': 2
            }
            const top_tag_name = $(item).find('span[class="global-ellipsis sharelist-item-title-name"]').find('a').html();
            let select_top_tag = {};
            select_top_tag.id = fs_id;
            select_top_tag.pId = 233;
            select_top_tag.name = top_tag_name;
            const result = get_child_tags([select_top_tag], params, fs_id);
            data_list = data_list.concat(result);
        });
        const data = JSON.stringify(data_list);
        const blob = new Blob([to_html(data)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, 'menu.html');
    }

    //递归获取下级目录
    function get_child_tags(empty, params, pId) {
        const json = get(lower_url, params);
        const infos = parseData(json);
        infos.forEach(function (item) {
            let node = {};
            node.id = item.fs_id;
            node.pId = pId;
            node.name = item.file_name;
            empty.push(node);
            if (item.is_dir === 1) {
                params.fs_id = item.fs_id;
                get_child_tags(empty, params, item.fs_id);
            } else {
                empty.filter(x => x.id === item.fs_id)[0].name = item.file_name + '[' + covert_size(item.file_size) + ']';
            }
        });
        return empty;
    }

    //解析结果
    function parseData(json) {
        let infos = [];
        const records = json.records;
        records.forEach(function (item) {
            let info = {};
            info.is_dir = item.isdir;
            info.file_name = item.server_filename;
            info.file_size = item.size;
            info.fs_id = item.fs_id;
            info.full_path = item.path;
            infos.push(info);
        });
        return infos;
    }

    //构建GET请求
    function get(url, params) {
        let result = {}
        $.ajax({
            type: 'GET',
            url: url,
            data: params,
            dataType: 'json',
            async: false,
            success: function (res) {
                if (res.errno === 0) {
                    result = res;
                }
            },
            error: function (error) {
                alert('error:' + error);
            }
        });
        return result;
    }

    //转换为Html
    function to_html(data) {
        let html_str = "&lt;head&gt;\n" +
            "    &lt;meta charset=&quot;UTF-8&quot;&gt;\n" +
            "    &lt;title&gt;&lt;/title&gt;\n" +
            "    &lt;link rel=&quot;stylesheet&quot; type=&quot;text/css&quot; href=&quot;http://cdn.bootcss.com/zTree.v3/3.5.33/css/zTreeStyle/zTreeStyle.min.css&quot;/&gt;\n" +
            "    &lt;script src=&quot;http://cdn.bootcss.com/jquery/3.2.1/jquery.min.js&quot; type=&quot;text/javascript&quot; charset=&quot;utf-8&quot;&gt;&lt;/script&gt;\n" +
            "    &lt;script src=&quot;http://cdn.bootcss.com/zTree.v3/3.5.33/js/jquery.ztree.all.min.js&quot; type=&quot;text/javascript&quot; charset=&quot;utf-8&quot;&gt;&lt;/script&gt;\n" +
            "&lt;/head&gt;\n" +
            "&lt;body&gt;\n" +
            "\t&lt;div&gt;\n" +
            "\t    &lt;input id=&quot;keyword&quot; type=&quot;text&quot; placeholder=&quot;搜索关键字&quot;&gt;\n" +
            "        &lt;button id=&quot;search-bt&quot;&gt;搜索&lt;/button&gt;\n" +
            "\t&lt;/div&gt;\n" +
            "\n" +
            "\t&lt;div class=&quot;content&quot; style=&quot;width:250px; height:362px;&quot;&gt;\n" +
            "\t    &lt;ul id=&quot;treeA&quot; class=&quot;ztree&quot;&gt;&lt;/ul&gt;\n" +
            "\t&lt;/div&gt;\n" +
            "&lt;/body&gt;\n" +
            "&lt;script&gt;\n" +
            "\n" +
            "    $(function () {\n" +
            "        init();\n" +
            "    });\n" +
            "\n" +
            "    function init() {\n" +
            "        var zNodes = [{data}];\n" +
            "\n" +
            "        var setting = {\n" +
            "            check: {\n" +
            "                enable: true\n" +
            "            },\n" +
            "            data: {\n" +
            "                simpleData: {\n" +
            "                    enable: true\n" +
            "                }\n" +
            "            },\n" +
            "        };\n" +
            "\n" +
            "        zTreeObj = $.fn.zTree.init($(&quot;#treeA&quot;), setting, zNodes);\n" +
            "        $(&quot;#search-bt&quot;).click(searchNodes);\n" +
            "    };\n" +
            "\n" +
            "    //用按钮查询节点\n" +
            "    function searchNodes() {\n" +
            "        var treeObj = $.fn.zTree.getZTreeObj(&quot;treeA&quot;);\n" +
            "        var keywords = $(&quot;#keyword&quot;).val();\n" +
            "        var nodes = treeObj.getNodesByParamFuzzy(&quot;name&quot;, keywords, null);\n" +
            "        if (nodes.length &gt; 0) {\n" +
            "            for (let i = 0; i &lt; nodes.length ; i++) {\n" +
            "            \tlet node = nodes[i];\n" +
            "                treeObj.selectNode(node);\n" +
            "                node.checked = true;\n" +
            "                treeObj.updateNode(node);\n" +
            "            }\n" +
            "        }\n" +
            "    }\n" +
            "    \n" +
            "&lt;/script&gt;";
        html_str = html_str.replace("[{data}]", data);
        return html_decode(html_str);
    }

    //Html反转义
    function html_decode(text) {
        var temp = document.createElement("html");
        temp.innerHTML = text;
        var output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    }

    //转换显示文件大小
    function covert_size(s) {
        if (s < 1024) {
            return s + " Byte";
        } else if (s > 1024 && s < 1048576) {
            return Math.round(s / 1024 * 100) / 100.00 + " KB";
        } else if (s > 1048576 && s < 1073741824) {
            return Math.round(s / (1048576) * 100) / 100.00 + " MB";
        } else {
            return Math.round(s / (1073741824) * 100) / 100.00 + " GB";
        }
    }

    //添加导出按钮
    function addButton() {
        const $dropdownbutton = $('<a class="list-filter" href="javascript:void(0);" onclick="start()" node-type="btn_export" title="在文件库根目录，选择要导出的文件夹，点击按钮，清单生成后会提示保存文件。\n如果文件夹内部子文件夹很多，需要等待较长时间。" style="display: inline;">导出目录信息</a>');
        $('.sharelist-view-toggle').append($dropdownbutton);
        $dropdownbutton.click(start);
    }

    addButton();

})();