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
    let list_counter = 0;
    let file_counter = 0;

    function start() {
        let lis = Array.from(document.getElementsByTagName('li')).filter(item => item.getAttribute('node-type') === 'sharelist-item');
        const selected = lis.filter(item => item.getAttribute('class') === 'on');
        const tags = selected.length === 0 ? lis : selected;
        //定义最上级目录
        let top_tag = {};
        top_tag.id = 233;
        top_tag.pId = 0;
        top_tag.name = '目录清单'
        let data_list = [top_tag];
        alert('全部目录导出时间可能过长,建议选中单个导出!');
        list_counter = 0;
        file_counter = 0;
        tags.forEach(item => {
            const gid = item.getAttribute('data-gid');
            const to_uk = item.getAttribute('data-to');
            const from_uk = item.getAttribute('data-frm');
            const msg_id = item.getAttribute('data-id');
            const fs_id = item.getAttribute('data-fid');
            if (msg_id === null) {
                const error_msg = '导出失败,只支持在最上级目录导出！';
                alert(error_msg);
                throw Error(error_msg);
            }
            let params = {
                'page': 1,
                'num': 100,
                'msg_id': msg_id,
                'from_uk': from_uk,
                'fs_id': fs_id,
            }
            if (to_uk === null) {
                params.gid = gid;
                params.type = 2;
            } else {
                params.to_uk = to_uk;
                params.type = 1;
            }
            const top_tag_name = $(item).find('span[class="global-ellipsis sharelist-item-title-name"]').find('a').html();
            //生成UUID
            const s_t_pid = uuid();
            let select_top_tag = {};
            select_top_tag.id = s_t_pid;
            select_top_tag.pId = 233;
            select_top_tag.name = top_tag_name;
            const result = get_child_tags([select_top_tag], params, s_t_pid);
            data_list.push.apply(data_list, result);
        });
        console.log(`执行完毕 共读取${list_counter}个子目录 ${file_counter}个文件.`);
        const data = JSON.stringify(data_list);
        const blob = new Blob([to_html(data)], { type: "text/plain;charset=utf-8" });
        saveAs(blob, '目录清单-' + dateFormat('yyyyMMddHHmmSS', new Date()) + '.html');
    }

    //递归获取下级目录
    function get_child_tags(empty, params, pId) {
        const infos = all_infos(params, []);
        let pNode = empty.filter(x => x.id === pId)[0];
        pNode.name = pNode.name + ` [子文件/夹:${infos.length}]`;
        infos.forEach(item => {
            const node_id = uuid();
            let node = {};
            node.id = node_id;
            node.pId = pId;
            node.name = item.file_name;
            empty.push(node);
            if (item.is_dir === 1) {
                list_counter++;
                console.log(`正在读取第${list_counter}个子目录.`);
                params.fs_id = item.fs_id;
                get_child_tags(empty, params, node_id);
            } else {
                file_counter++;
                empty.filter(x => x.id === node_id)[0].name = item.file_name + ` [${covert_size(item.file_size)}]`;
            }
        });
        return empty;
    }

    //分页获取所有数据
    function all_infos(params, infos) {
        let json = get(lower_url, params);
        const datas = parse_data(json);
        infos.push.apply(infos, datas);
        if (datas.length === params.num) {
            params.page++;
            all_infos(params, infos);
        }
        params.page = 1;
        return infos;
    }

    //解析结果
    function parse_data(json) {
        let infos = [];
        const records = json.records;
        records.forEach(item => {
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
                alert('运行出错(网络请求失败) 请尝试重新导出');
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
        let temp = document.createElement("html");
        temp.innerHTML = text;
        return temp.innerText || temp.textContent;
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

    //生成唯一UUID
    function uuid() {
        let str = '0123456789abcdef'
        let arr = []
        for (let i = 0; i < 36; i++) {
            arr.push(str.substr(Math.floor(Math.random() * 0x10), 1))
        }
        arr[14] = 4;
        arr[19] = str.substr(arr[19] & 0x3 | 0x8, 1)
        arr[8] = arr[13] = arr[18] = arr[23] = '-'
        return arr.join('')
    }

    //格式化时间
    function dateFormat(fmt, date) {
        const opt = {
            "y+": date.getFullYear().toString(),
            "M+": (date.getMonth() + 1).toString(),
            "d+": date.getDate().toString(),
            "H+": date.getHours().toString(),
            "m+": date.getMinutes().toString(),
            "S+": date.getSeconds().toString()
        }
        for (let k in opt) {
            let ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length === 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
            }
        }
        return fmt;
    }

    //添加导出按钮
    function addButton() {
        const $dropdownbutton = $('<a class="list-filter" href="javascript:void(0);" onclick="start()" node-type="btn_export" title="在文件库根目录，选择要导出的文件夹，点击按钮，清单生成后会提示保存文件。\n如果文件夹内部子文件夹很多，需要等待较长时间。" style="display: inline;">导出目录信息</a>');
        $('.sharelist-view-toggle').append($dropdownbutton);
        $dropdownbutton.click(start);
    }

    addButton();

})();
