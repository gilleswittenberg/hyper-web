
function Item (id, text, children) {

  this.id = id;

  // elem li
  this.elem = document.createElement('li');
  var span = document.createElement('span');
  span.appendChild(document.createTextNode(text));
  this.elem.appendChild(span);

  // elem button
  var button = document.createElement('button');
  button.appendChild(document.createTextNode('X'));
  button.classList.add('delete');
  button.addEventListener('click', this.onClick.bind(this));
  this.elem.appendChild(button);

  // elem ul
  this.childrenUl = document.createElement('ul');
  this.elem.appendChild(this.childrenUl);

  // elem form
  var form = document.createElement('form');
  this.input = document.createElement('input');
  this.input.setAttribute('type', 'text');
  var inputSubmit = document.createElement('input');
  inputSubmit.setAttribute('type', 'submit');
  inputSubmit.setAttribute('value', '+');
  form.appendChild(this.input);
  form.appendChild(inputSubmit);
  form.addEventListener('submit', this.onSubmit.bind(this));
  this.elem.appendChild(form);

  this.getChildren();
}

Item.prototype.getChildren = function () {

  var query = "MATCH (n)-->(children) WHERE ID(n) = " + this.id + " RETURN ID(children), children";
  var json = { statements: [ {statement: query} ] };
  lib.request(url, json).then(function (response) {
    if (response.results[0].data.length > 0) {
      response.results[0].data.forEach(function (row) {
        this.addChild(row.row[0], row.row[1].text);
      }.bind(this));
    }
  }.bind(this));
};

Item.prototype.onClick = function (event) {
  this.del();
};

Item.prototype.onSubmit = function (event) {
  event.preventDefault();
  this.add(this.input.value);
  // @TODO: Wait for success
  this.input.value = "";
};

Item.prototype.add = function (text) {

  var query = "MATCH (n) WHERE ID(n) = " + this.id + " ";
  query +=    "CREATE (node:Text {text: '" + text + "'})<-[r:Child]-(n) RETURN node, ID(node)";

  var json = {
    statements: [
      {
        statement: query,
      }
    ]
  };
  lib.request(url, json).then(function (response) {
    var id = response.results[0].data[0].row[1];
    var text = response.results[0].data[0].row[0].text;
    this.addChild(id, text);
  }.bind(this));
};

Item.prototype.removeElem = function () {
  this.elem.remove();
};

Item.prototype.del = function () {
  var query = "MATCH (n) where ID(n) = " + this.id + " ";
  query +=    "OPTIONAL MATCH (n)-[r]-() ";
  query +=    "DELETE n, r";
  var json = {
    statements: [
      {
        statement: query,
      }
    ]
  };
  lib.request(url, json).then(this.removeElem.bind(this));
};

Item.prototype.addChild = function (id, text) {
  var item = new Item(id, text);
  this.childrenUl.appendChild(item.elem);
};
