

var ip = '54.93.181.197';

var idMe;
var name = 'Gilles Wittenberg';

var url = 'http://' + ip + ':7474/db/data/transaction/commit';
// @TODO: Fix for when user has no children yet
var query = "MATCH (user:User {name: '" + name + "'})-->(children) return user, ID(user), children, ID(children)";
var params = {limit: 10};
var json = {
  statements: [
    {
      statement: query,
      parameters: params
    }
  ]
};

lib.request(url, json).then(renderAll);

function renderAll (json) {

  idMe = json.results[0].data[0].row[1];

  renderH1(json.results[0]);
  renderRows(json.results[0]);
}

var h1 = document.getElementsByTagName('h1')[0];
function renderH1 (json) {
  h1.innerHTML = json.data[0].row[0].name;
}

function renderRows (json) {
  var rows = json.data;
  rows.forEach(function (row) {
    renderRow(row.row[3], row.row[2].text);
  });
}

var ul = document.getElementsByTagName('ul')[0];
function renderRow (id, text) {
  var item = new Item(id, text);
  ul.appendChild(item.elem);
}


// add
var form = document.getElementsByTagName('form')[0];
var input = document.getElementsByTagName('input')[0];
form.addEventListener('submit', function (event) {

  event.preventDefault();

  var text = input.value;
  var query = "MATCH (user: User {name: '" + name + "'}) CREATE (node:Text {text: '" + text + "'})<-[r:Child]-(user) RETURN node, ID(node)";
  var json = {
    statements: [
      {
        statement: query,
      }
    ]
  };
  lib.request(url, json).then(function (response) {

    // clear input
    input.value = '';

    // add row
    var row = response.results[0].data[0].row;
    renderRow(row[1], row[0].text);
  });
});
