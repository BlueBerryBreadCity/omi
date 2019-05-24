webpackJsonp([28],{64:function(t,e){t.exports="## Tree\n\nMany things can be represented in a tree structure, such as directories, organizational hierarchies, taxonomy, and so on. The tree component is a way of representing the hierarchical relationship between these things. You can also expand, collapse, and select tree nodes in the tree.\n\n## Usage\n\n```html\n<m-tree id='myTree' checkbox node=\"{\n\ttitle: 'p-0',\n\tid: 1,\n\ticon: 'account_balance_wallet',\n\tchildren: [\n\t\t{\n\t\t\ttitle: 'p-1',\n\t\t\tid: 2,\n\t\t\ticon: 'assignment_ind',\n\t\t\tchildren: [\n\t\t\t\t{ title: 'p-2', id: 3, icon: 'chrome_reader_mode', checked: true },\n\t\t\t\t{ title: 'p-2.5', id: 13, icon: 'chrome_reader_mode' }\n\t\t\t]\n\t\t},\n\t\t{\n\t\t\ttitle: 'p-4',\n\t\t\tid: 4,\n\t\t\ticon: 'extension',\n\n\t\t\tchildren: [\n\t\t\t\t{\n\t\t\t\t\ttitle: 'p-5', id: 5, selected: true, icon: 'dashboard', checked: true,\n\t\t\t\t\tdisabled: true\n\t\t\t\t},\n\t\t\t\t{ title: '\u9879\u76ee\u516d', id: 6, icon: 'favorite' },\n\t\t\t\t{ title: '\u9879\u76ee7', id: 7 }\n\t\t\t]\n\t\t},\n\t\t{\n\t\t\ttitle: 'p-11',\n\t\t\tid: 14,\n\t\t\ticon: 'group_work',\n\t\t\tchildren: [\n\t\t\t\t{\n\t\t\t\t\ttitle: 'p-12', id: 12, icon: 'fingerprint', checked: true\n\t\t\t\t}\n\t\t\t]\n\t\t}\n\t]\n}\">\n</m-tree>\n```\n\n## Javascript\n\n```js\nvar myTree = document.querySelector('#myTree')\nvar nodeData = myTree.props.node\n\nmyTree.addEventListener('check', (evt) => {\n\tconst node = getNodeById(evt.detail.id, nodeData)\n\tif (!node.children) {\n\t\tnode.checked = evt.detail.checked\n\t} else {\n\t\tcheckAll(node, evt.detail.state !== 'checked')\n\t}\n\tmyTree.setAttribute('node', nodeData)\n})\n\n\nmyTree.addEventListener('toggle', (evt) => {\n\tconst node = getNodeById(evt.detail.id, nodeData)\n\tnode.close = !node.close\n\tmyTree.setAttribute('node', nodeData)\n})\n\nmyTree.addEventListener('nodeclick', (evt) => {\n\tconst pre = getNodeById(evt.detail.pre, nodeData)\n\tpre.selected = false\n\tconst node = getNodeById(evt.detail.id, nodeData)\n\tnode.selected = true\n\tmyTree.setAttribute('node', nodeData)\n})\n\n\nfunction checkAll(node, checked) {\n\tnode.children && node.children.forEach(child => {\n\t\tchild.checked = checked\n\t\tcheckAll(child, checked)\n\t})\n}\n\nfunction getNodeById(id, node) {\n\tif (node.id === id) return node\n\tif (node.children) {\n\t\tfor (let i = 0, len = node.children.length; i < len; i++) {\n\t\t\tlet child = node.children[i]\n\t\t\tlet target = getNodeById(id, child)\n\t\t\tif (target) {\n\t\t\t\treturn target\n\t\t\t}\n\t\t}\n\t}\n}\n```\n\n## API\n\n### Props\n\n```jsx\n{\n\tnode: obj,\n\tcheckbox: boolean\n}\n```\n\n### Event\n\n```jsx\n{\n\ttoggle: function, \n\tnodeclick: function,\n\tcheck: function\n}\n```\n"}});
//# sourceMappingURL=28.45ee0c8d.chunk.js.map