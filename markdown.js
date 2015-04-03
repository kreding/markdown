/**
 * 编译markdown为html
 * @return {[type]} [description]
 */
var _ = require("./bower_components/underscore-min/underscore-min.js")
var katex = require("./bower_components/katex-build/katex.min.js")
var marked = require("./bower_components/marked-min/marked.min.js")

require("./bower_components/jquery-ui-min/jquery-ui.min.js")
require("./bower_components/jquery-ui-layout-min/jquery.layout.min.js")
require("./bower_components/jquery.cookie-min/jquery.cookie.js")
require("./bower_components/ace-min-noconflict/ace.js")
require("./bower_components/ace-min-noconflict/ext-static_highlight.js")
require("./bower_components/ace-min-noconflict/ext-modelist.js")
require("./bower_components/ace-min-noconflict/keybinding-vim.js")
require("./bower_components/remodal-min/jquery.remodal.min.js")
require("./bower_components/mermaid-min/mermaid.full.min.js")

$.extend({
	markdowToHtml: compileMarkdown
});

/**
 * @param  {[type]}   url       markdown文件的地址
 * @param  {[type]}   container 承载编译后得html的容器
 * @param  {Function} callback  异步获取markdown文件后的回调函数，params:
 *                              params:
 *                              - originData : 原始markdown文本
 *                              - compailedData : 编译成html之后的文本
 */
function compileMarkdown(url, container, callback){
	var mermaid_config = {
		htmlLabels: false // fix mermaid flowchart IE issue
	};
	mermaid.ganttConfig = { // Configuration for Gantt diagrams
		numberSectionStyles:4,
		axisFormatter: [
				["%I:%M", function (d) { // Within a day
						return d.getHours();
				}],
				["w. %U", function (d) { // Monday a week
						return d.getDay() == 1;
				}],
				["%a %d", function (d) { // Day within a week (not monday)
						return d.getDay() && d.getDate() != 1;
				}],
				["%b %d", function (d) { // within a month
						return d.getDate() != 1;
				}],
				["%m-%y", function (d) { // Month
						return d.getMonth();
				}]
		]
	};
		// 设置marked
	var renderer = new marked.Renderer();
	renderer.listitem = function(text) {
		if(!/^\[[ x]\]\s/.test(text)) {
			return marked.Renderer.prototype.listitem(text);
		}
		// 任务列表
		var checkbox = $('<input type="checkbox" disabled/>');
		if(/^\[x\]\s/.test(text)) { // 完成的任务列表
			checkbox.attr('checked', true);
		}
		return $(marked.Renderer.prototype.listitem(text.substring(3))).addClass('task-list-item').prepend(checkbox)[0].outerHTML;
	}
	var mermaidError;
	mermaid.parseError = function(err, hash){
		mermaidError = err;
	};
	renderer.code = function(code, language) {
		code = code.trim();
		var firstLine = code.split(/\n/)[0].trim();
		if(language === 'math') { // 数学公式
			var tex = '';
			code.split(/\n\n/).forEach(function(line){ // 连续两个换行，则开始下一个公式
				line = line.trim();
				if(line.length > 0) {
					try {
						tex += katex.renderToString(line, { displayMode: true });
					} catch(err) {
						tex += '<pre>' + err + '</pre>';
					}
				}
			});
			return tex;
		} else if(firstLine === 'gantt' || firstLine === 'sequenceDiagram' || firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/)) { // mermaid
			if(firstLine === 'sequenceDiagram') {
				code += '\n'; // 如果末尾没有空行，则语法错误
			}
			if(mermaid.parse(code)) {
				return '<div class="mermaid">' + code + '</div>';
			} else {
				return '<pre>' + mermaidError + '</pre>';
			}
		} else {
			return marked.Renderer.prototype.code.apply(this, arguments);
		}
	}
	marked.setOptions({
		renderer: renderer,
		gfm: true,
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: false,
		smartLists: true,
		smartypants: true
	});
		
	var modelist = ace.require('ace/ext/modelist').modesByName;
	var highlight = ace.require('ace/ext/static_highlight');
	$.get(url, function(data) { // load sample text
		var compailedData = marked(data);
		$(container).css('overflow-y', 'auto').append(compailedData);

		$('code').each(function(){ // code highlight
			var language = ($(this).attr('class') || 'lang-c_cpp').substring(5).toLowerCase();
			if(modelist[language] == undefined) {
				language = 'c_cpp';
			}
			highlight($(this)[0], {
					mode: 'ace/mode/' + language,
					theme: 'ace/theme/github',
					startLineNumber: 1,
					showGutter: false,
					trim: true,
			}, function (highlighted) {});
		});

		$('img[src^="emoji/"]').each(function() { // 转换emoji路径
				$(this).attr('src', 'bower_components/emoji-icons/' + $(this).attr('src').substring(6) + '.png');
		});

		mermaid.init();

		$('line[y2="2000"]').each(function(){ // a temp workaround for mermaid bug: https://github.com/knsv/mermaid/issues/142
			$(this).attr('y2', $(this).closest('svg').attr('height') - 10);
		});

		callback && callback.call(this, data, compailedData);
	});
}