

//var url = 'http://54.93.181.197:7676/';
var url = 'http://localhost:7676/';

// components
var Items = {};

// model
Items.Model = function (data) {

  data = data || {};
  this.id = m.prop(data.id);
  this.parentId = m.prop(data.parentId);
  this.parent = m.prop(data.parent);
  this.children = m.prop([]);
  this.isRoot = m.prop(data.isRoot);
  if (data.children) {
    data.children.forEach(function (data) {
      data.parent = this;
      data.parentId = this.id();
      this.children().push(new Items.Model(data));
    }.bind(this));
  }
  this.name = m.prop(data.name);
  this.text = m.prop(data.text);
  this.vm = new Items.ViewModel(this);
};
Items.Model.prototype.del = function () {

  this.parent().removeChild(this.id());

  return m.request({
    method: 'DELETE',
    url: url + 'nodes/' + this.id()
  });
};
Items.Model.prototype.save = function () {

  var method, data = {};

  if (!this.id()) {
    method = 'POST';
    data.parentId = this.parentId();
  } else {
    method = 'PUT';
  }
  data.text = this.text;

  return m.request({
    method: method,
    url: url + 'nodes/',
    data: data
  }).then(function (response) {
    console.log(response);
  });
};
Items.Model.prototype.createChild = function (text) {
  var child = new Items.Model({
    parent: this,
    parentId: this.id(),
    text: text
  });

  this.children().push(child);

  return child.save();
};
Items.Model.prototype.removeChild = function (id) {
  this.children().forEach(function (child, index) {
    if (child.id() === id) {
      this.children().splice(index, 1);
    }
  }.bind(this));
};

// controller
Items.Controller = function () {

  m.request({
    method: 'GET',
    url: url + 'nodes'
  }).then(function (response) {
    response.isRoot = true;
    this.Root = new Items.Model(response);
  }.bind(this));
};

// views
Items.View = {};
Items.View.Root = function (ctrl) {
  return [
    m('div', {className: 'wrapper'}, [
      m('h1', ctrl.Root.name()),
      Items.View.Children(ctrl.Root)
    ])
  ];
};
Items.View.Children = function (model) {
  return  m('ul', [
    model.children().map(Items.View.Item),
    m('li', Items.View.Form(model))
  ]);
};
Items.View.Item = function (model) {
  return m('li', [
    m('span', model.text()),
    m('button.delete', {onclick: model.del.bind(model)}, 'X'),
    Items.View.Children(model)
  ]);
};
Items.View.Form = function (model) {
  return m('form', {onsubmit: model.vm.add.bind(model.vm)}, [
    m('input[type=text]', {onchange: m.withAttr('value', model.vm.val), value: model.vm.val()}),
    m('input[type=submit]', {value: '+'})
  ]);
};

// view model
Items.ViewModel = function (model) {
  this.val = m.prop('');
  this.showChildren = m.prop(false);
  this.model = m.prop(model);
};
Items.ViewModel.prototype.add = function (event) {
  event.preventDefault();
  if (this.val() !== '') {
    this.model().createChild(this.val());
    this.val('');
  }
};
Items.ViewModel.prototype.toggle = function (event) {
  this.showChildren(!this.showChildren());
};

// mount
m.mount(document.body, {controller: Items.Controller, view: Items.View.Root});

